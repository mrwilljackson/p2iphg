/**
 * Database Service
 * 
 * Provides data access layer for the Neon PostgreSQL database.
 * Mirrors the MockDataService API for easy migration.
 * 
 * This service handles:
 * - Event queries (active event, all events)
 * - Organization queries (by event, by ID, search)
 * - Volunteer queries (by email, by event)
 * - Registration creation
 * 
 * Version: 1.0
 * Date: 2026-02-18
 */

import { db } from './db/client';
import { events, organisations, organisationContacts, volunteers, registrations, eventArchive, eventArchiveOrgLines } from './db/schema';
import { eq, ne, and, ilike, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventArchivePreview, EventArchiveView, EventArchiveOrgLine } from './types';
import type { OrganisationRow, OrganisationContactRow } from './db/schema';
import { calculateParticipantCounts, type RegistrationForCounting, type ParticipantCounts } from './participant-counting';

/**
 * Database Service Class
 * Provides async methods for querying and mutating data
 */
export class DatabaseService {
  /**
   * Get the current active event
   * Returns the first event with status 'active'
   */
  static async getCurrentEvent(): Promise<Event | null> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.status, 'active'))
        .limit(1);
      
      return result[0] ? mapEventFromDb(result[0]) : null;
    } catch (error) {
      console.error('Error fetching current event:', error);
      throw error;
    }
  }

  /**
   * Get all events
   */
  static async getAllEvents(): Promise<Event[]> {
    try {
      const result = await db.select().from(events);
      return result.map(mapEventFromDb);
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  }

  /**
   * Create a new event
   * Note: Caller should specify status. If not provided, defaults to 'planned'.
   * Status values:
   * - 'planned': Future events that are not yet active (default for new events)
   * - 'active': The current active event (only one at a time)
   * - 'completed': Past events that have finished
   */
  static async createEvent(eventData: {
    name: string;
    date: string; // ISO 8601 date string
    location?: string;
    description?: string;
    status?: 'planned' | 'active' | 'completed';
    airtableRecordId?: string;
  }): Promise<Event> {
    try {
      const id = randomUUID();
      const airtableRecordId = eventData.airtableRecordId || id;

      const result = await db
        .insert(events)
        .values({
          id,
          name: eventData.name,
          date: eventData.date,
          location: eventData.location,
          description: eventData.description,
          status: eventData.status || 'planned',
          airtableRecordId,
        })
        .returning();

      return mapEventFromDb(result[0]);
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Get all organizations participating in a specific event.
   * An org "participates" when an organisation_contacts row exists linking
   * it to the event. The Individual system org is always included.
   */
  static async getOrganizations(eventId?: string): Promise<Organization[]> {
    try {
      type Row = { org: OrganisationRow; contact: OrganisationContactRow | null };

      const scoped: Row[] = eventId
        ? await db
            .select({ org: organisations, contact: organisationContacts })
            .from(organisationContacts)
            .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
            .where(eq(organisationContacts.eventId, eventId))
        : await db
            .select({ org: organisations, contact: organisationContacts })
            .from(organisations)
            .leftJoin(organisationContacts, eq(organisationContacts.organisationId, organisations.id));

      // Always append system orgs (groupType = 'Individual') regardless of event
      const systemOrgs = await db
        .select({ org: organisations })
        .from(organisations)
        .where(eq(organisations.groupType, 'Individual'));

      const scopedIds = new Set(scoped.map(r => r.org.id));
      const toAppend: Row[] = systemOrgs
        .filter(s => !scopedIds.has(s.org.id))
        .map(s => ({ org: s.org, contact: null }));

      return [...scoped, ...toAppend].map(r =>
        mapOrganisationToOrganization(r.org, r.contact, eventId)
      );
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID with optional event-scoped contact details.
   * Pass eventId to scope the contact join to the correct event — otherwise
   * an arbitrary contact row may be returned for orgs that span multiple events.
   */
  static async getOrganizationById(id: string, eventId?: string): Promise<Organization | null> {
    try {
      const contactJoinCondition = eventId
        ? and(
            eq(organisationContacts.organisationId, organisations.id),
            eq(organisationContacts.eventId, eventId),
          )
        : eq(organisationContacts.organisationId, organisations.id);

      const result = await db
        .select({ org: organisations, contact: organisationContacts })
        .from(organisations)
        .leftJoin(organisationContacts, contactJoinCondition)
        .where(eq(organisations.id, id))
        .limit(1);

      if (result[0]) {
        return mapOrganisationToOrganization(result[0].org, result[0].contact, eventId);
      }

      return null;
    } catch (error) {
      console.error('Error fetching organization by ID:', error);
      throw error;
    }
  }

  /**
   * Set an event as the current active event
   * Sets the specified event to 'active' and all others to 'completed'
   * Business rule: Only one event can be active at a time
   */
  static async setCurrentEvent(eventId: string): Promise<Event> {
    try {
      // Deactivate the currently active event (if any)
      await db
        .update(events)
        .set({
          status: 'completed',
          modifiedAt: new Date()
        })
        .where(eq(events.status, 'active'));

      // Then set the specified event to 'active'
      const result = await db
        .update(events)
        .set({
          status: 'active',
          modifiedAt: new Date()
        })
        .where(eq(events.id, eventId))
        .returning();

      if (!result[0]) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      return mapEventFromDb(result[0]);
    } catch (error) {
      console.error('Error setting current event:', error);
      throw error;
    }
  }

  /**
   * Mark a single event as completed
   * Used when an event's date has passed and the admin wants to finalise it
   */
  static async markEventCompleted(eventId: string): Promise<Event> {
    try {
      const result = await db
        .update(events)
        .set({
          status: 'completed',
          modifiedAt: new Date()
        })
        .where(eq(events.id, eventId))
        .returning();

      if (!result[0]) {
        throw new Error(`Event with ID ${eventId} not found`);
      }

      return mapEventFromDb(result[0]);
    } catch (error) {
      console.error('Error marking event as completed:', error);
      throw error;
    }
  }

  /**
   * Get event by ID
   */
  static async getEventById(id: string): Promise<Event | null> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1);

      return result[0] ? mapEventFromDb(result[0]) : null;
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      throw error;
    }
  }

  /**
   * Update an event's details.
   * If airtableRecordId is changed, organisations linked via the old ID will
   * lose their event association — only change it if you know what you're doing.
   */
  static async updateEvent(id: string, data: {
    name?: string;
    date?: string;
    location?: string;
    description?: string;
    airtableRecordId?: string;
  }): Promise<Event> {
    try {
      const result = await db
        .update(events)
        .set({
          ...data,
          modifiedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();

      if (!result[0]) throw new Error(`Event not found: ${id}`);
      return mapEventFromDb(result[0]);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  /**
   * Delete an event.
   * Throws if the event has any registrations or volunteers to prevent accidental data loss.
   */
  static async deleteEvent(id: string): Promise<void> {
    try {
      const [regCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(registrations)
        .where(eq(registrations.eventId, id));

      const [volCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(volunteers)
        .where(eq(volunteers.eventId, id));

      if ((regCount?.count ?? 0) > 0 || (volCount?.count ?? 0) > 0) {
        throw new Error(
          'Cannot delete an event that has registrations or volunteers. Clear event data first.'
        );
      }

      await db.delete(events).where(eq(events.id, id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  /**
   * Search organizations by name for a specific event
   * Case-insensitive search — queries UK organisations table
   */
  static async searchOrganizations(query: string, eventId?: string): Promise<Organization[]> {
    try {
      // Get all orgs for the event, then filter by name client-side
      // (simpler than building dynamic conditions across joined tables)
      const allOrgs = await this.getOrganizations(eventId);

      if (!query) return allOrgs;

      const lowerQuery = query.toLowerCase();
      return allOrgs.filter(org => org.name.toLowerCase().includes(lowerQuery));
    } catch (error) {
      console.error('Error searching organizations:', error);
      throw error;
    }
  }

  /**
   * Check if an email address belongs to a registered volunteer for a specific event
   */
  static async isRegisteredVolunteer(email: string, eventId?: string): Promise<boolean> {
    try {
      const conditions = [ilike(volunteers.email, email)];

      if (eventId) {
        conditions.push(eq(volunteers.eventId, eventId));
      }

      const result = await db
        .select()
        .from(volunteers)
        .where(and(...conditions))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error('Error checking volunteer registration:', error);
      throw error;
    }
  }

  /**
   * Get all registered volunteer emails for a specific event
   */
  static async getVolunteerEmails(eventId?: string): Promise<string[]> {
    try {
      const query = eventId
        ? db.select({ email: volunteers.email }).from(volunteers).where(eq(volunteers.eventId, eventId))
        : db.select({ email: volunteers.email }).from(volunteers);

      const result = await query;
      return result.map(v => v.email).filter(email => email !== '');
    } catch (error) {
      console.error('Error fetching volunteer emails:', error);
      throw error;
    }
  }

  /**
   * Get volunteer details by email for a specific event
   */
  static async getVolunteerByEmail(email: string, eventId?: string): Promise<Volunteer | null> {
    try {
      const conditions = [ilike(volunteers.email, email)];

      if (eventId) {
        conditions.push(eq(volunteers.eventId, eventId));
      }

      const result = await db
        .select()
        .from(volunteers)
        .where(and(...conditions))
        .limit(1);

      return result[0] ? mapVolunteerFromDb(result[0]) : null;
    } catch (error) {
      console.error('Error fetching volunteer by email:', error);
      throw error;
    }
  }

  /**
   * Get all registered volunteers for a specific event
   */
  static async getAllVolunteers(eventId?: string): Promise<Volunteer[]> {
    try {
      const query = eventId
        ? db.select().from(volunteers).where(eq(volunteers.eventId, eventId))
        : db.select().from(volunteers);

      const result = await query;
      return result.map(mapVolunteerFromDb);
    } catch (error) {
      console.error('Error fetching all volunteers:', error);
      throw error;
    }
  }

  /**
   * Get all registrations for a specific event
   * Returns basic fields for list view including organization name from UK organisations table
   */
  static async getAllRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const result = await db
        .select({
          registration: registrations,
          orgName: organisations.name,
        })
        .from(registrations)
        .leftJoin(organisations, eq(registrations.organizationId, organisations.id))
        .where(eq(registrations.eventId, eventId))
        .orderBy(registrations.createdAt);

      return result.map(row => ({
        ...mapRegistrationFromDb(row.registration),
        organizationName: row.orgName || undefined,
      }));
    } catch (error) {
      console.error('Error fetching all registrations:', error);
      throw error;
    }
  }

  /**
   * Get all registrations for a specific organization at a specific event
   * Returns all fields including organization name
   */
  static async getRegistrationsByOrganization(eventId: string, organizationId: string): Promise<Registration[]> {
    try {
      const result = await db
        .select({
          registration: registrations,
          orgName: organisations.name,
        })
        .from(registrations)
        .leftJoin(organisations, eq(registrations.organizationId, organisations.id))
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.organizationId, organizationId)
          )
        )
        .orderBy(registrations.attendeeName, registrations.attendeeSurname);

      return result.map(row => ({
        ...mapRegistrationFromDb(row.registration),
        organizationName: row.orgName || undefined,
      }));
    } catch (error) {
      console.error('Error fetching registrations by organization:', error);
      throw error;
    }
  }

  /**
   * Get emails of all Volunteer-role registrations for an event.
   * Used to filter already-registered volunteers from the name picker.
   */
  static async getVolunteerRegistrationEmails(eventId: string): Promise<string[]> {
    try {
      const result = await db
        .select({ email: registrations.email })
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.role, 'Volunteer')
          )
        );

      return result
        .map(row => row.email)
        .filter((email): email is string => email !== null);
    } catch (error) {
      console.error('Error fetching volunteer registration emails:', error);
      throw error;
    }
  }

  /**
   * Get local org IDs of closed-group organisations where every pre-registered
   * contact has already submitted a Group-role registration (matched by email).
   * Used to hide fully-registered orgs from the Group leader dropdown.
   */
  static async getFullyRegisteredOrgIds(eventId: string): Promise<string[]> {
    try {

      // 1. Get all closed-group orgs for this event
      const closedOrgs = await db.select({ id: organisations.id })
        .from(organisations)
        .innerJoin(
          organisationContacts,
          and(
            eq(organisationContacts.organisationId, organisations.id),
            eq(organisationContacts.eventId, eventId),
            eq(organisationContacts.openGroup, false),
          )
        );

      if (closedOrgs.length === 0) return [];

      // 2. Deduplicate org IDs (multiple contacts per org produce multiple rows)
      const uniqueOrgs = [...new Set(closedOrgs.map(o => o.id))].map(id => ({ id }));

      // 3. For each org, count total contacts and registered contacts
      const fullyRegisteredIds: string[] = [];

      for (const org of uniqueOrgs) {
        // Count total contacts for this org + event
        const [{ count: totalContacts }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(organisationContacts)
          .where(
            and(
              eq(organisationContacts.organisationId, org.id),
              eq(organisationContacts.eventId, eventId),
            )
          );

        // Get emails of all contacts
        const contactEmails = await db
          .select({ email: organisationContacts.contactEmail })
          .from(organisationContacts)
          .where(
            and(
              eq(organisationContacts.organisationId, org.id),
              eq(organisationContacts.eventId, eventId),
            )
          );
        const emails = contactEmails
          .map(c => c.email?.toLowerCase())
          .filter((e): e is string => e != null);

        if (emails.length === 0) continue;

        // Count Group registrations for this org whose email matches a contact
        const groupRegs = await db
          .select({ email: registrations.email })
          .from(registrations)
          .where(
            and(
              eq(registrations.eventId, eventId),
              eq(registrations.organizationId, org.id),
              eq(registrations.role, 'Group'),
            )
          );
        const registeredEmails = new Set(
          groupRegs.map(r => r.email?.toLowerCase()).filter((e): e is string => e != null)
        );

        const allRegistered = emails.every(email => registeredEmails.has(email));
        if (allRegistered && Number(totalContacts) > 0) {
          fullyRegisteredIds.push(org.id);
        }
      }

      return fullyRegisteredIds;
    } catch (error) {
      console.error('Error fetching fully registered org IDs:', error);
      throw error;
    }
  }

  /**
   * Get all contacts for an organisation at a specific event, with registration status.
   * Used to populate group.contactPicker in the Group leader registration form.
   *
   * @param eventId  - The event UUID (local)
   * @param orgId    - The organisation UUID (local, organisations.id)
   */
  static async getOrgContactsForEvent(
    eventId: string,
    orgId: string,
  ): Promise<OrgContactOption[]> {
    const contacts = await db.select()
      .from(organisationContacts)
      .where(
        and(
          eq(organisationContacts.organisationId, orgId),
          eq(organisationContacts.eventId, eventId),
        )
      );
    if (contacts.length === 0) return [];

    // Fetch emails of Group registrations already submitted for this event + org
    const existingRegs = await db
      .select({ email: registrations.email })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.organizationId, orgId),
          eq(registrations.role, 'Group'),
        )
      );
    const registeredEmails = new Set(
      existingRegs.map(r => r.email).filter((e): e is string => e != null)
    );

    return contacts.map(c => ({
      contactId: c.id,
      firstName: c.contactFirstName ?? '',
      lastName: c.contactLastName ?? '',
      email: c.contactEmail ?? null,
      photoConsent: c.photoConsent,
      feedbackConsent: c.feedbackConsent,
      nextEventConsent: c.nextEventConsent,
      alreadyRegistered: c.contactEmail != null && registeredEmails.has(c.contactEmail),
    }));
  }

  /**
   * Get a single registration by ID
   * Returns all fields for detail view including organization name
   */
  static async getRegistrationById(id: string): Promise<Registration | null> {
    try {
      const result = await db
        .select({
          registration: registrations,
          orgName: organisations.name,
        })
        .from(registrations)
        .leftJoin(organisations, eq(registrations.organizationId, organisations.id))
        .where(eq(registrations.id, id))
        .limit(1);

      if (result.length === 0) return null;

      return {
        ...mapRegistrationFromDb(result[0].registration),
        organizationName: result[0].orgName || undefined,
      };
    } catch (error) {
      console.error('Error fetching registration by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new registration
   * Sets syncStatus to 'pending' by default
   */
  static async createRegistration(data: Omit<Registration, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Registration> {
    try {
      // Look up organisation name from organisationId if not already provided
      let resolvedOrgName: string | null = data.organisationName || null;
      if (!resolvedOrgName && data.organizationId) {
        const org = await db.select({ name: organisations.name })
          .from(organisations)
          .where(eq(organisations.id, data.organizationId))
          .limit(1);
        resolvedOrgName = org[0]?.name || null;
      }

      // If a Participant's email matches a pre-registered group leader (organisation_contacts)
      // for their org, store the registration as a Group leader instead
      let resolvedRole = data.role;
      if (data.role === 'Participant' && data.email && data.organizationId) {
        const [matchingContact] = await db.select({
          id: organisationContacts.id,
          expectedGroupSize: organisationContacts.expectedGroupSize,
        })
          .from(organisationContacts)
          .where(
            and(
              eq(organisationContacts.organisationId, data.organizationId),
              eq(organisationContacts.eventId, data.eventId),
              sql`lower(${organisationContacts.contactEmail}) = lower(${data.email})`,
            )
          )
          .limit(1);

        if (matchingContact) {
          resolvedRole = 'Group';
          const groupSize = matchingContact.expectedGroupSize
            ? parseInt(matchingContact.expectedGroupSize, 10)
            : null;
          data = { ...data, groupLeaderParticipating: true, groupSize: groupSize ?? data.groupSize };
        }
      }

      const result = await db.insert(registrations).values({
        eventId: data.eventId,
        attendeeName: data.attendeeName,
        attendeeSurname: data.attendeeSurname,
        email: data.email || null,
        organizationId: data.organizationId || null,
        impairment: data.impairment || null,
        role: resolvedRole,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent ?? null,
        nextEventConsent: data.nextEventConsent ?? null,
        groupSize: data.groupSize ?? null,
        impairedParticipants: data.impairedParticipants ?? null,
        nonImpairedParticipants: data.nonImpairedParticipants ?? null,
        groupLeaderParticipating: data.groupLeaderParticipating ?? null,
        organisationName: resolvedOrgName,
        syncStatus: 'pending',
        airtableRecordId: null,
      }).returning();

      return mapRegistrationFromDb(result[0]);
    } catch (error) {
      console.error('Error creating registration:', error);
      throw error;
    }
  }

  /**
   * Create a new organization (for admin use).
   * Creates a row in organisations + an organisation_contacts row scoped to the event.
   */
  static async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Organization> {
    try {
      if (!data.eventId) {
        throw new Error('eventId is required to create an organisation contact');
      }

      const [newOrg] = await db.insert(organisations).values({
        name: data.name,
        groupType: data.groupType || 'Other',
        imageUrl: data.imageUrl || null,
        airtableRecordId: data.airtableRecordId || `local-${randomUUID()}`,
      }).returning();

      const [newContact] = await db.insert(organisationContacts).values({
        organisationId: newOrg.id,
        eventId: data.eventId,
        openGroup: data.openGroup ?? true,
        contactFirstName: data.contactFirstName || null,
        contactLastName: data.contactLastName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
      }).returning();

      return mapOrganisationToOrganization(newOrg, newContact, data.eventId);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Find or create a family group organization in the UK organisations table
   * Family groups are unique by: name + event + contactEmail
   *
   * @param eventId - The event UUID
   * @param surname - The family surname (e.g., "Smith")
   * @param contactEmail - The group leader's email
   * @param contactFirstName - The group leader's first name
   * @param contactLastName - The group leader's last name (should match surname)
   * @returns The existing or newly created family group organization
   */
  static async findOrCreateFamilyGroup(
    eventId: string,
    surname: string,
    contactEmail: string,
    contactFirstName: string,
    contactLastName: string
  ): Promise<Organization> {
    try {
      const familyGroupName = `${surname} Family Group`;

      // Check if this family group already exists for this event (matched by contact email)
      const existing = await db
        .select({ org: organisations, contact: organisationContacts })
        .from(organisationContacts)
        .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
        .where(
          and(
            eq(organisations.name, familyGroupName),
            eq(organisationContacts.eventId, eventId),
          )
        );

      const matchByEmail = existing.find(r => r.contact?.contactEmail === contactEmail);
      if (matchByEmail) {
        return mapOrganisationToOrganization(matchByEmail.org, matchByEmail.contact, eventId);
      }

      const [newOrg] = await db.insert(organisations).values({
        name: familyGroupName,
        groupType: 'Family',
        imageUrl: null,
        airtableRecordId: `local-${randomUUID()}`,
      }).returning();

      // Family groups are closed (not visible in participant dropdown)
      const [newContact] = await db.insert(organisationContacts).values({
        organisationId: newOrg.id,
        eventId,
        openGroup: false,
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone: null,
        notes: 'Auto-created family group',
      }).returning();

      return mapOrganisationToOrganization(newOrg, newContact, eventId);
    } catch (error) {
      console.error('Error finding or creating family group:', error);
      throw error;
    }
  }

  /**
   * Update an organisation and its associated contact record.
   * Handles the two-table write (best-effort — Neon HTTP doesn't support transactions).
   */
  static async updateOrganization(id: string, data: {
    name?: string;
    groupType?: string;
    openGroup?: boolean;
    airtableRecordId?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<Organization> {
    try {
      const [current] = await db
        .select()
        .from(organisations)
        .where(eq(organisations.id, id))
        .limit(1);

      if (!current) throw new Error(`Organisation not found: ${id}`);

      const { contactFirstName, contactLastName, contactEmail, contactPhone, notes, airtableRecordId, openGroup, ...orgFields } = data;
      await db
        .update(organisations)
        .set({
          ...orgFields,
          ...(airtableRecordId !== undefined ? { airtableRecordId } : {}),
          modifiedAt: new Date(),
        })
        .where(eq(organisations.id, id));

      // Propagate per-contact fields to all contact rows for this org (across events)
      const hasContactUpdates =
        openGroup !== undefined ||
        contactFirstName !== undefined ||
        contactLastName !== undefined ||
        contactEmail !== undefined ||
        contactPhone !== undefined ||
        notes !== undefined;

      if (hasContactUpdates) {
        await db
          .update(organisationContacts)
          .set({
            ...(openGroup !== undefined ? { openGroup } : {}),
            ...(contactFirstName !== undefined ? { contactFirstName } : {}),
            ...(contactLastName !== undefined ? { contactLastName } : {}),
            ...(contactEmail !== undefined ? { contactEmail } : {}),
            ...(contactPhone !== undefined ? { contactPhone } : {}),
            ...(notes !== undefined ? { notes } : {}),
            modifiedAt: new Date(),
          })
          .where(eq(organisationContacts.organisationId, id));
      }

      const updated = await this.getOrganizationById(id);
      if (!updated) throw new Error(`Organisation not found after update: ${id}`);
      return updated;
    } catch (error) {
      console.error('Error updating organisation:', error);
      throw error;
    }
  }

  /**
   * Delete an organisation and its contact record.
   * Blocked if any registrations reference this organisation.
   */
  static async deleteOrganization(id: string): Promise<void> {
    try {
      const [regCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(registrations)
        .where(eq(registrations.organizationId, id));

      if ((regCount?.count ?? 0) > 0) {
        throw new Error('Cannot delete an organisation that has registrations.');
      }

      await db
        .delete(organisationContacts)
        .where(eq(organisationContacts.organisationId, id));

      await db.delete(organisations).where(eq(organisations.id, id));
    } catch (error) {
      console.error('Error deleting organisation:', error);
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Org record CRUD (organisations table only — no contact join)
  // ---------------------------------------------------------------------------

  static async getOrgRecords(): Promise<OrgRecord[]> {
    const rows = await db.select().from(organisations).where(ne(organisations.groupType, 'Family'));
    return rows
      .map(mapOrgRecord)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async createOrgRecord(data: {
    name: string;
    groupType: string;
    airtableRecordId?: string;
  }): Promise<OrgRecord> {
    const localRecordId = data.airtableRecordId || `local-${randomUUID()}`;
    const [row] = await db.insert(organisations).values({
      name: data.name,
      groupType: data.groupType,
      airtableRecordId: localRecordId,
    }).returning();
    return mapOrgRecord(row);
  }

  static async updateOrgRecord(id: string, data: {
    name?: string;
    groupType?: string;
    airtableRecordId?: string;
  }): Promise<OrgRecord> {
    const [current] = await db.select().from(organisations).where(eq(organisations.id, id)).limit(1);
    if (!current) throw new Error(`Organisation not found: ${id}`);
    const [row] = await db
      .update(organisations)
      .set({ ...data, modifiedAt: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    return mapOrgRecord(row);
  }

  static async deleteOrgRecord(id: string): Promise<void> {
    const [regCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(eq(registrations.organizationId, id));
    if ((regCount?.count ?? 0) > 0) {
      throw new Error('Cannot delete an organisation that has registrations.');
    }
    const [contactCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organisationContacts)
      .where(eq(organisationContacts.organisationId, id));
    if ((contactCount?.count ?? 0) > 0) {
      throw new Error('Cannot delete: this organisation has group leaders. Delete them first.');
    }
    await db.delete(organisations).where(eq(organisations.id, id));
  }

  // ---------------------------------------------------------------------------
  // Group leader CRUD (organisation_contacts table only — joined with org for display)
  // ---------------------------------------------------------------------------

  static async getGroupLeaders(eventId: string): Promise<GroupLeader[]> {
    const rows = await db
      .select({ org: organisations, contact: organisationContacts })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
      .where(eq(organisationContacts.eventId, eventId));
    return rows
      .map(r => mapGroupLeader(r.org, r.contact))
      .sort((a, b) => a.orgName.localeCompare(b.orgName));
  }

  static async createGroupLeader(data: {
    orgId: string;
    eventId: string;
    openGroup: boolean;
    expectedGroupSize?: number;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
    airtableRecordId?: string;
  }): Promise<GroupLeader> {
    const [org] = await db.select().from(organisations).where(eq(organisations.id, data.orgId)).limit(1);
    if (!org) throw new Error(`Organisation not found: ${data.orgId}`);
    const [contact] = await db.insert(organisationContacts).values({
      organisationId: org.id,
      eventId: data.eventId,
      openGroup: data.openGroup,
      expectedGroupSize: data.expectedGroupSize != null ? String(data.expectedGroupSize) : null,
      contactFirstName: data.contactFirstName || null,
      contactLastName: data.contactLastName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      notes: data.notes || null,
      photoConsent: data.photoConsent ?? true,
      feedbackConsent: data.feedbackConsent ?? false,
      nextEventConsent: data.nextEventConsent ?? false,
      airtableRecordId: data.airtableRecordId || null,
    }).returning();
    return mapGroupLeader(org, contact);
  }

  static async updateGroupLeader(id: string, data: {
    orgId?: string;
    openGroup?: boolean;
    expectedGroupSize?: number | null;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
    airtableRecordId?: string;
  }): Promise<GroupLeader> {
    const { orgId, openGroup, expectedGroupSize, ...contactFields } = data;
    if (orgId) {
      const [org] = await db.select({ id: organisations.id }).from(organisations).where(eq(organisations.id, orgId)).limit(1);
      if (!org) throw new Error(`Organisation not found: ${orgId}`);
    }
    await db
      .update(organisationContacts)
      .set({
        ...(orgId !== undefined ? { organisationId: orgId } : {}),
        ...(openGroup !== undefined ? { openGroup } : {}),
        ...(expectedGroupSize !== undefined ? { expectedGroupSize: expectedGroupSize != null ? String(expectedGroupSize) : null } : {}),
        ...contactFields,
        modifiedAt: new Date(),
      })
      .where(eq(organisationContacts.id, id));
    const [result] = await db
      .select({ org: organisations, contact: organisationContacts })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
      .where(eq(organisationContacts.id, id));
    if (!result) throw new Error(`Group leader not found after update: ${id}`);
    return mapGroupLeader(result.org, result.contact);
  }

  static async deleteGroupLeader(id: string): Promise<void> {
    await db.delete(organisationContacts).where(eq(organisationContacts.id, id));
  }

  static async updateGroupLeaderConsents(contactId: string, data: {
    contactEmail?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
  }): Promise<void> {
    const updates: Record<string, unknown> = { modifiedAt: new Date() };
    if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail;
    if (data.photoConsent !== undefined) updates.photoConsent = data.photoConsent;
    if (data.feedbackConsent !== undefined) updates.feedbackConsent = data.feedbackConsent;
    if (data.nextEventConsent !== undefined) updates.nextEventConsent = data.nextEventConsent;
    await db.update(organisationContacts).set(updates).where(eq(organisationContacts.id, contactId));
  }

  static async updateVolunteer(id: string, data: {
    eventId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
    airtableRecordId?: string;
  }): Promise<Volunteer> {
    const updates: Record<string, unknown> = { modifiedAt: new Date() };
    if (data.eventId !== undefined) updates.eventId = data.eventId;
    if (data.email !== undefined) updates.email = data.email;
    if (data.firstName !== undefined) updates.firstName = data.firstName;
    if (data.lastName !== undefined) updates.lastName = data.lastName;
    if (data.photoConsent !== undefined) updates.photoConsent = data.photoConsent;
    if (data.feedbackConsent !== undefined) updates.feedbackConsent = data.feedbackConsent;
    if (data.nextEventConsent !== undefined) updates.nextEventConsent = data.nextEventConsent;
    if (data.airtableRecordId !== undefined) updates.airtableRecordId = data.airtableRecordId || null;

    const result = await db.update(volunteers).set(updates).where(eq(volunteers.id, id)).returning();
    if (!result[0]) throw new Error(`Volunteer not found: ${id}`);
    return mapVolunteerFromDb(result[0]);
  }

  static async deleteVolunteer(id: string): Promise<void> {
    // Block if this volunteer has a matching registration for the same event
    const vol = await db.select().from(volunteers).where(eq(volunteers.id, id)).limit(1);
    if (!vol[0]) throw new Error(`Volunteer not found: ${id}`);

    const linked = await db.select({ id: registrations.id })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, vol[0].eventId),
          eq(registrations.email, vol[0].email)
        )
      )
      .limit(1);
    if (linked.length > 0) {
      throw new Error('Cannot delete: this helper has already registered for the event.');
    }

    await db.delete(volunteers).where(eq(volunteers.id, id));
  }

  /**
   * Create a new volunteer (for admin use)
   */
  static async createVolunteer(data: Omit<Volunteer, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Volunteer> {
    try {
      const result = await db.insert(volunteers).values({
        eventId: data.eventId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent,
        nextEventConsent: data.nextEventConsent,
        airtableRecordId: data.airtableRecordId || null,
      }).returning();

      return mapVolunteerFromDb(result[0]);
    } catch (error) {
      console.error('Error creating volunteer:', error);
      throw error;
    }
  }

  /**
   * Get registration counts by role for a specific event
   * Returns detailed counts including group breakdowns and participant totals
   *
   * Business Logic is now handled by the participant-counting module.
   * See lib/participant-counting.ts for detailed counting rules.
   */
  static async getRegistrationCountsByRole(eventId: string): Promise<ParticipantCounts> {
    try {
      // Get all registrations with organization details from the UK organisations table
      const allRegistrations = await db
        .select({
          id: registrations.id,
          role: registrations.role,
          groupSize: registrations.groupSize,
          impairedParticipants: registrations.impairedParticipants,
          nonImpairedParticipants: registrations.nonImpairedParticipants,
          groupLeaderParticipating: registrations.groupLeaderParticipating,
          organizationId: registrations.organizationId,
          orgName: organisations.name,
          orgGroupType: organisations.groupType,
          orgAirtableRecordId: organisations.airtableRecordId,
        })
        .from(registrations)
        .leftJoin(organisations, eq(registrations.organizationId, organisations.id))
        .where(eq(registrations.eventId, eventId));

      // Pre-registered organisations for this event (one row per contact)
      const contactsForEvent = await db
        .select({
          orgId: organisations.id,
          orgName: organisations.name,
          orgGroupType: organisations.groupType,
          openGroup: organisationContacts.openGroup,
          contactExpectedGroupSize: organisationContacts.expectedGroupSize,
        })
        .from(organisationContacts)
        .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
        .where(eq(organisationContacts.eventId, eventId));

      // Aggregate expectedGroupSize per organisation (multiple contacts may exist per org)
      const orgMap = new Map<string, { id: string; name: string; groupType: string | null; openGroup: boolean | null; expectedGroupSize: number }>();
      for (const row of contactsForEvent) {
        if (!row.orgId) continue;
        const existing = orgMap.get(row.orgId);
        const contactSize = row.contactExpectedGroupSize ? parseInt(row.contactExpectedGroupSize, 10) || 0 : 0;
        if (existing) {
          existing.expectedGroupSize += contactSize;
        } else {
          orgMap.set(row.orgId, {
            id: row.orgId,
            name: row.orgName || '',
            groupType: row.orgGroupType,
            openGroup: row.openGroup,
            expectedGroupSize: contactSize,
          });
        }
      }
      const allOrgs = Array.from(orgMap.values());

      // Build a lookup from org UUID → openGroup for use when mapping registrations
      const orgOpenGroupMap = new Map<string, boolean>();
      for (const org of allOrgs) {
        if (org.openGroup !== null) {
          orgOpenGroupMap.set(org.id, org.openGroup);
        }
      }

      // Convert to format expected by counting logic
      const registrationsForCounting: RegistrationForCounting[] = allRegistrations.map(r => ({
        id: r.id,
        role: r.role as 'Participant' | 'Volunteer' | 'Group',
        groupSize: r.groupSize,
        impairedParticipants: r.impairedParticipants,
        nonImpairedParticipants: r.nonImpairedParticipants,
        groupLeaderParticipating: r.groupLeaderParticipating,
        organizationId: r.organizationId,
        organizationName: r.orgName,
        groupType: r.orgGroupType as any,
        openGroup: r.organizationId ? (orgOpenGroupMap.get(r.organizationId) ?? null) : null,
        organizationAirtableRecordId: r.orgAirtableRecordId,
      }));

      const organizationsForCounting = allOrgs.map(org => ({
        id: org.id,
        name: org.name,
        groupType: org.groupType as any,
        openGroup: org.openGroup,
        expectedGroupSize: org.expectedGroupSize > 0 ? org.expectedGroupSize : null,
      }));

      // Use the business logic module to calculate counts
      return calculateParticipantCounts(registrationsForCounting, organizationsForCounting);
    } catch (error) {
      console.error('Error fetching registration counts:', error);
      throw error;
    }
  }

  /**
   * Compute the data that will end up in event_archive + event_archive_org_lines
   * for the given event, without writing anything to the DB.
   *
   * Throws if the event is not found or not status='completed'.
   *
   * Counting semantics (see spec §6 and EVENT_ARCHIVE_SAMPLE.md):
   * - participantCount  = Participant registrations
   *                       + closed-group members via groupSize
   *                       + leaders with groupLeaderParticipating=true
   * - totalHeadcount    = participantCount + volunteerCount
   * - companiesCount    = distinct orgs participating (via organisation_contacts)
   * - Org-line headcount per org applies the same rule:
   *     open-group  -> count Participant registrations for that org
   *                    + 1 if any leader participated
   *     closed-group -> sum of groupSize across the org's Group registrations
   *                     + count of those with groupLeaderParticipating=true
   */
  private static async computeArchiveData(eventId: string): Promise<{
    event: {
      id: string;
      name: string;
      date: string;
      location: string | null;
      description: string | null;
      airtableRecordId: string | null;
    };
    preview: EventArchivePreview;
  }> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status}). Only completed events can be archived.`);
    }

    // 1. All registrations for this event.
    const regs = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId));

    // 2. All organisation_contacts rows for this event, joined to the org row.
    //    Contains the per-event open/closed flag and the contact's airtable ID.
    const contactRows = await db
      .select({
        contact: organisationContacts,
        org: organisations,
      })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
      .where(eq(organisationContacts.eventId, eventId));

    // Build a lookup orgId -> openGroup. Falls back to true (open) if no contact.
    const openGroupByOrgId = new Map<string, boolean>();
    for (const row of contactRows) {
      openGroupByOrgId.set(row.org.id, row.contact.openGroup);
    }

    const participantRegs = regs.filter(r => r.role === 'Participant');
    const groupRegs = regs.filter(r => r.role === 'Group');
    const volunteerRegs = regs.filter(r => r.role === 'Volunteer');

    const volunteerCount = volunteerRegs.length;
    const groupCount = groupRegs.length;

    // 3. Participant headcount + impairment split, in lock-step.
    //    Every person added to participantCount is also classified as either
    //    impaired or non-impaired so the two stay reconciled.
    let participantCount = participantRegs.length;
    let impairedParticipantCount = 0;
    let nonImpairedParticipantCount = 0;

    for (const p of participantRegs) {
      if (p.impairment && p.impairment.trim() !== '') {
        impairedParticipantCount += 1;
      } else {
        nonImpairedParticipantCount += 1;
      }
    }

    for (const g of groupRegs) {
      // Falls back to open (true) if this org has no organisation_contacts row
      // for the event. In practice this should never happen — the registration
      // form only allows selecting orgs that appear in organisation_contacts —
      // but if it does, the org's registrations will be counted in the
      // top-level participantCount as open-group members and will NOT produce
      // an org line in the archive (the per-org loop below skips them).
      const isOpen = g.organizationId
        ? (openGroupByOrgId.get(g.organizationId) ?? true)
        : true;

      if (!isOpen) {
        participantCount += g.groupSize ?? 0;
        impairedParticipantCount += g.impairedParticipants ?? 0;
        nonImpairedParticipantCount += g.nonImpairedParticipants ?? 0;
      }

      // Participating leaders count as non-impaired by default (the leader's
      // own impairment isn't tracked on the Group registration row).
      if (g.groupLeaderParticipating === true) {
        participantCount += 1;
        nonImpairedParticipantCount += 1;
      }
    }

    const totalHeadcount = participantCount + volunteerCount;

    // 4. Consent counts across ALL registrations for the event (any role).
    const photoConsentCount = regs.filter(r => r.photoConsent === true).length;
    const feedbackConsentCount = regs.filter(r => r.feedbackConsent === true).length;
    const nextEventConsentCount = regs.filter(r => r.nextEventConsent === true).length;

    // Sanity check: impairment split must equal participantCount.
    // A mismatch means a closed-group registration had groupSize ≠
    // impaired + non-impaired. The registration form warns about this
    // but does not block submission, so it can reach the archive.
    // We log and proceed — the operator can investigate via logs.
    if (impairedParticipantCount + nonImpairedParticipantCount !== participantCount) {
      console.warn(
        `[computeArchiveData] eventId=${eventId}: impairment split ` +
        `(${impairedParticipantCount} + ${nonImpairedParticipantCount}) ` +
        `does not equal participantCount (${participantCount}).`
      );
    }

    // 5. Companies count = distinct orgs that appear in contactRows for this event.
    const companiesCount = new Set(contactRows.map(r => r.org.id)).size;

    // 6. Per-org lines. One line per organisation_contact row (= one per org
    //    in this event because each org has at most one contact per event,
    //    enforced indirectly by current import logic).
    //    For each org line compute: actual_headcount, impaired_count,
    //    non_impaired_count.
    const orgLines: EventArchivePreview['orgLines'] = [];

    for (const row of contactRows) {
      const orgId = row.org.id;
      const isOpen = row.contact.openGroup !== false;

      // Find the Group registration(s) for this org (usually one).
      const orgGroupRegs = groupRegs.filter(g => g.organizationId === orgId);
      // Find the Participant registrations for this org.
      const orgParticipantRegs = participantRegs.filter(p => p.organizationId === orgId);

      let actual = 0;
      let impaired = 0;
      let nonImpaired = 0;

      if (isOpen) {
        actual = orgParticipantRegs.length;
        for (const p of orgParticipantRegs) {
          if (p.impairment && p.impairment.trim() !== '') impaired += 1;
          else nonImpaired += 1;
        }
        for (const g of orgGroupRegs) {
          if (g.groupLeaderParticipating === true) {
            actual += 1;
            nonImpaired += 1;
          }
        }
      } else {
        for (const g of orgGroupRegs) {
          actual += g.groupSize ?? 0;
          impaired += g.impairedParticipants ?? 0;
          nonImpaired += g.nonImpairedParticipants ?? 0;
          if (g.groupLeaderParticipating === true) {
            actual += 1;
            nonImpaired += 1;
          }
        }
      }

      orgLines.push({
        organisationId: orgId,
        orgNameSnapshot: row.org.name ?? 'Unknown organisation',
        orgAirtableRecordId: row.org.airtableRecordId ?? null,
        contactAirtableRecordId: row.contact.airtableRecordId ?? null,
        actualHeadcount: actual,
        impairedCount: impaired,
        nonImpairedCount: nonImpaired,
      });
    }

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location ?? null,
        description: event.description ?? null,
        airtableRecordId: event.airtableRecordId ?? null,
      },
      preview: {
        participantCount,
        volunteerCount,
        groupCount,
        totalHeadcount,
        companiesCount,
        impairedParticipantCount,
        nonImpairedParticipantCount,
        photoConsentCount,
        feedbackConsentCount,
        nextEventConsentCount,
        orgLines,
      },
    };
  }

  /**
   * Compute archive counts without writing anything. Used by the Archive
   * Event dialog to render the preview before the admin commits.
   */
  static async previewEventArchive(eventId: string): Promise<EventArchivePreview> {
    const { preview } = await DatabaseService.computeArchiveData(eventId);
    return preview;
  }

  /**
   * Atomically archive a completed event:
   *   1. Insert event_archive + event_archive_org_lines.
   *   2. Delete registrations / organisation_contacts / volunteers for the event.
   *   3. Update events.status = 'archived'.
   *
   * Uses Drizzle's db.transaction() which on neon-http batches all statements
   * into a single HTTP request — atomic from the DB's perspective.
   *
   * If the precondition fails (event missing, not completed, or already
   * archived) it throws BEFORE any write.
   *
   * If db.transaction() throws at runtime ("not supported on this driver"
   * or similar), the fallback is to run the same sequence outside a
   * transaction: do the INSERTs first, then the DELETEs, then the status
   * UPDATE. The worst-case partial-failure mode is a created archive with
   * source rows still present; an admin can manually retry by deleting the
   * orphan archive row and re-running.
   *
   * Race condition note: the "already archived" pre-check is not atomic
   * with the transaction (neon-http batches don't support reads). If two
   * archive requests race, the UNIQUE constraint on event_archive.event_id
   * is the backstop; the losing request will receive a raw constraint
   * error rather than the friendly "already archived" message.
   */
  static async archiveEvent(
    eventId: string,
    eventSequenceNumber: number,
  ): Promise<string> {
    if (!Number.isInteger(eventSequenceNumber) || eventSequenceNumber <= 0) {
      throw new Error(`eventSequenceNumber must be a positive integer, got: ${eventSequenceNumber}`);
    }

    // Precondition: refuse if an archive already exists for this event.
    const [existing] = await db
      .select({ id: eventArchive.id })
      .from(eventArchive)
      .where(eq(eventArchive.eventId, eventId))
      .limit(1);
    if (existing) {
      throw new Error(`Event is already archived (event_archive.id = ${existing.id}).`);
    }

    // Compute everything we need to write. Throws if event isn't 'completed'.
    const { event, preview } = await DatabaseService.computeArchiveData(eventId);

    const archiveId = randomUUID();
    const now = new Date();

    const headerRow: typeof eventArchive.$inferInsert = {
      id: archiveId,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventLocation: event.location,
      eventDescription: event.description,
      eventAirtableRecordId: event.airtableRecordId,
      eventSequenceNumber,
      participantCount: preview.participantCount,
      volunteerCount: preview.volunteerCount,
      groupCount: preview.groupCount,
      totalHeadcount: preview.totalHeadcount,
      companiesCount: preview.companiesCount,
      impairedParticipantCount: preview.impairedParticipantCount,
      nonImpairedParticipantCount: preview.nonImpairedParticipantCount,
      photoConsentCount: preview.photoConsentCount,
      feedbackConsentCount: preview.feedbackConsentCount,
      nextEventConsentCount: preview.nextEventConsentCount,
      sourcePurgedAt: now,
    };

    const lineRows: (typeof eventArchiveOrgLines.$inferInsert)[] = preview.orgLines.map(line => ({
      archiveId,
      organisationId: line.organisationId,
      orgNameSnapshot: line.orgNameSnapshot,
      orgAirtableRecordId: line.orgAirtableRecordId,
      contactAirtableRecordId: line.contactAirtableRecordId,
      actualHeadcount: line.actualHeadcount,
      impairedCount: line.impairedCount,
      nonImpairedCount: line.nonImpairedCount,
    }));

    await db.transaction(async (tx) => {
      await tx.insert(eventArchive).values(headerRow);
      if (lineRows.length > 0) {
        await tx.insert(eventArchiveOrgLines).values(lineRows);
      }
      await tx.delete(registrations).where(eq(registrations.eventId, eventId));
      await tx.delete(organisationContacts).where(eq(organisationContacts.eventId, eventId));
      await tx.delete(volunteers).where(eq(volunteers.eventId, eventId));
      await tx.update(events)
        .set({ status: 'archived', modifiedAt: now })
        .where(eq(events.id, eventId));
    });

    return archiveId;
  }

  /**
   * Load a saved archive (header + lines) for an archived event.
   * Returns null if no archive exists.
   */
  static async getEventArchive(eventId: string): Promise<EventArchiveView | null> {
    const [header] = await db
      .select()
      .from(eventArchive)
      .where(eq(eventArchive.eventId, eventId))
      .limit(1);

    if (!header) return null;

    const lines = await db
      .select()
      .from(eventArchiveOrgLines)
      .where(eq(eventArchiveOrgLines.archiveId, header.id))
      .orderBy(eventArchiveOrgLines.orgNameSnapshot);

    const orgLines: EventArchiveOrgLine[] = lines.map(l => ({
      id: l.id,
      archiveId: l.archiveId,
      organisationId: l.organisationId,
      orgNameSnapshot: l.orgNameSnapshot,
      orgAirtableRecordId: l.orgAirtableRecordId,
      contactAirtableRecordId: l.contactAirtableRecordId,
      actualHeadcount: l.actualHeadcount,
      impairedCount: l.impairedCount,
      nonImpairedCount: l.nonImpairedCount,
      createdAt: l.createdAt!.toISOString(),
    }));

    return {
      id: header.id,
      eventId: header.eventId,
      eventName: header.eventName,
      eventDate: header.eventDate,
      eventLocation: header.eventLocation,
      eventDescription: header.eventDescription,
      eventAirtableRecordId: header.eventAirtableRecordId,
      eventSequenceNumber: header.eventSequenceNumber,
      participantCount: header.participantCount,
      volunteerCount: header.volunteerCount,
      groupCount: header.groupCount,
      totalHeadcount: header.totalHeadcount,
      companiesCount: header.companiesCount,
      impairedParticipantCount: header.impairedParticipantCount,
      nonImpairedParticipantCount: header.nonImpairedParticipantCount,
      photoConsentCount: header.photoConsentCount,
      feedbackConsentCount: header.feedbackConsentCount,
      nextEventConsentCount: header.nextEventConsentCount,
      sourcePurgedAt: header.sourcePurgedAt.toISOString(),
      createdAt: header.createdAt!.toISOString(),
      orgLines,
    };
  }
}

/**
 * Mapper Functions
 * Convert database snake_case fields to TypeScript camelCase
 */

function mapOrgRecord(row: OrganisationRow): OrgRecord {
  return {
    id: row.id,
    name: row.name ?? '',
    groupType: row.groupType ?? 'Other',
    airtableRecordId: row.airtableRecordId ?? undefined,
    createdAt: row.createdAt?.toISOString(),
    modifiedAt: row.modifiedAt?.toISOString(),
  };
}

function mapGroupLeader(org: OrganisationRow, contact: OrganisationContactRow): GroupLeader {
  return {
    id: contact.id,
    orgId: org.id,
    eventId: contact.eventId,
    orgName: org.name ?? '',
    openGroup: contact.openGroup,
    groupType: org.groupType ?? 'Other',
    expectedGroupSize: contact.expectedGroupSize ? parseInt(contact.expectedGroupSize, 10) : undefined,
    contactFirstName: contact.contactFirstName ?? undefined,
    contactLastName: contact.contactLastName ?? undefined,
    contactEmail: contact.contactEmail ?? undefined,
    contactPhone: contact.contactPhone ?? undefined,
    notes: contact.notes ?? undefined,
    photoConsent: contact.photoConsent,
    feedbackConsent: contact.feedbackConsent,
    nextEventConsent: contact.nextEventConsent,
    airtableRecordId: contact.airtableRecordId ?? undefined,
  };
}

function mapEventFromDb(dbEvent: any): Event {
  return {
    id: dbEvent.id,
    name: dbEvent.name,
    date: dbEvent.date,
    location: dbEvent.location,
    description: dbEvent.description,
    status: dbEvent.status,
    airtableRecordId: dbEvent.airtableRecordId,
    createdAt: dbEvent.createdAt?.toISOString(),
    modifiedAt: dbEvent.modifiedAt?.toISOString(),
  };
}

/**
 * Map from UK organisations + organisation_contacts tables to the Organization type
 * Contact details come from the joined organisation_contacts row
 */
function mapOrganisationToOrganization(
  org: any,
  contact: any,
  eventId?: string
): Organization {
  return {
    id: org.id,
    eventId: eventId || '', // UK table links via airtable_event_id, not a UUID event_id
    name: org.name || '',
    groupType: org.groupType || 'Other',
    // open_group lives on organisation_contacts (per event), not on the org itself.
    // Falls back to true if no contact record exists for this event.
    openGroup: contact?.openGroup ?? true,
    expectedGroupSize: contact?.expectedGroupSize ? parseInt(contact.expectedGroupSize, 10) : undefined,
    imageUrl: org.imageUrl || null,
    contactId: contact?.id || null,
    contactFirstName: contact?.contactFirstName || null,
    contactLastName: contact?.contactLastName || null,
    contactEmail: contact?.contactEmail || null,
    contactPhone: contact?.contactPhone || null,
    photoConsent: contact?.photoConsent ?? true,
    feedbackConsent: contact?.feedbackConsent ?? false,
    nextEventConsent: contact?.nextEventConsent ?? false,
    notes: contact?.notes || null,
    airtableRecordId: org.airtableRecordId || null,
    createdAt: org.createdAt?.toISOString(),
    modifiedAt: org.modifiedAt?.toISOString(),
  };
}

function mapVolunteerFromDb(dbVol: any): Volunteer {
  return {
    id: dbVol.id,
    eventId: dbVol.eventId,
    email: dbVol.email,
    firstName: dbVol.firstName,
    lastName: dbVol.lastName,
    photoConsent: dbVol.photoConsent,
    feedbackConsent: dbVol.feedbackConsent,
    nextEventConsent: dbVol.nextEventConsent,
    airtableRecordId: dbVol.airtableRecordId,
    createdAt: dbVol.createdAt?.toISOString(),
    modifiedAt: dbVol.modifiedAt?.toISOString(),
  };
}

function mapRegistrationFromDb(dbReg: any): Registration {
  return {
    id: dbReg.id,
    eventId: dbReg.eventId,
    attendeeName: dbReg.attendeeName,
    attendeeSurname: dbReg.attendeeSurname,
    email: dbReg.email,
    organizationId: dbReg.organizationId,
    impairment: dbReg.impairment,
    role: dbReg.role,
    photoConsent: dbReg.photoConsent,
    feedbackConsent: dbReg.feedbackConsent,
    nextEventConsent: dbReg.nextEventConsent,
    groupSize: dbReg.groupSize,
    impairedParticipants: dbReg.impairedParticipants,
    nonImpairedParticipants: dbReg.nonImpairedParticipants,
    groupLeaderParticipating: dbReg.groupLeaderParticipating,
    organisationName: dbReg.organisationName || undefined,
    syncStatus: dbReg.syncStatus,
    airtableRecordId: dbReg.airtableRecordId,
    createdAt: dbReg.createdAt?.toISOString(),
    modifiedAt: dbReg.modifiedAt?.toISOString(),
  };
}

/**
 * Helper Functions
 * Re-export from helpers.ts for backward compatibility
 */

export { organizationsToOptions, eventsToOptions } from './helpers';

