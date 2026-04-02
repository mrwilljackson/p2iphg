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
import { events, organisations, organisationContacts, volunteers, registrations, eventSummaries } from './db/schema';
import { eq, ne, and, ilike, sql, inArray } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
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
   * Get all organizations for a specific event
   * Reads from the `organisations` (UK) table, joined with `organisation_contacts`
   * Matches event via airtable_event_id ↔ events.airtable_record_id
   */
  static async getOrganizations(eventId?: string): Promise<Organization[]> {
    try {
      // Look up the event's airtable_record_id so we can match organisations
      let eventAirtableId: string | null = null;
      let eventUuid: string | undefined = eventId;
      if (eventId) {
        const evt = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        eventAirtableId = evt[0]?.airtableRecordId ?? null;
      }

      // Query organisations (UK table) with optional contact details
      const result = await db
        .select({
          org: organisations,
          contact: organisationContacts,
        })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          eq(organisations.airtableRecordId, organisationContacts.organisationId)
        );

      // Filter by event via the contact's airtableEventId (orgs don't have direct event links)
      let filtered = result;
      if (eventAirtableId) {
        const byEvent = result.filter(r => r.contact?.airtableEventId === eventAirtableId);
        if (byEvent.length > 0) {
          filtered = byEvent;
        }
      }

      // Always append system orgs (groupType = 'Individual') regardless of event
      const systemOrgs = await db
        .select({ org: organisations, contact: organisationContacts })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          eq(organisations.airtableRecordId, organisationContacts.organisationId)
        )
        .where(eq(organisations.groupType, 'Individual'));

      // Avoid duplicates if Individual org somehow appears in filtered already
      const filteredIds = new Set(filtered.map(r => r.org.id));
      const toAppend = systemOrgs.filter(r => !filteredIds.has(r.org.id));

      return [...filtered, ...toAppend].map(r =>
        mapOrganisationToOrganization(r.org, r.contact, eventUuid)
      );
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   * Queries the UK organisations table with joined contact details.
   * Pass eventId to scope the contact join to the correct event (recommended),
   * otherwise an arbitrary contact row may be returned if the org spans multiple events.
   */
  static async getOrganizationById(id: string, eventId?: string): Promise<Organization | null> {
    try {
      let eventAirtableId: string | null = null;
      if (eventId) {
        const [evt] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
        eventAirtableId = evt?.airtableRecordId ?? null;
      }

      const contactJoinCondition = eventAirtableId
        ? and(
            eq(organisations.airtableRecordId, organisationContacts.organisationId),
            eq(organisationContacts.airtableEventId, eventAirtableId)
          )
        : eq(organisations.airtableRecordId, organisationContacts.organisationId);

      const result = await db
        .select({
          org: organisations,
          contact: organisationContacts,
        })
        .from(organisations)
        .leftJoin(organisationContacts, contactJoinCondition)
        .where(eq(organisations.id, id))
        .limit(1);

      if (result[0]) {
        return mapOrganisationToOrganization(result[0].org, result[0].contact);
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
      // 1. Get the event's airtable record ID
      const [evt] = await db.select({ airtableRecordId: events.airtableRecordId })
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
      if (!evt?.airtableRecordId) return [];

      // 2. Get all closed-group orgs for this event (scoped via contact's airtableEventId)
      const closedOrgs = await db.select({
        id: organisations.id,
        airtableRecordId: organisations.airtableRecordId,
      })
        .from(organisations)
        .innerJoin(
          organisationContacts,
          and(
            eq(organisationContacts.organisationId, organisations.airtableRecordId),
            eq(organisationContacts.airtableEventId, evt.airtableRecordId),
            eq(organisationContacts.openGroup, false),
          )
        );

      if (closedOrgs.length === 0) return [];

      // 3. Deduplicate org IDs (multiple contacts per org produce multiple rows)
      const uniqueOrgs = [...new Map(closedOrgs.map(o => [o.id, o.airtableRecordId])).entries()]
        .map(([id, airtableRecordId]) => ({ id, airtableRecordId }));

      // 4. For each org, count total contacts and registered contacts
      const fullyRegisteredIds: string[] = [];

      for (const org of uniqueOrgs) {
        if (!org.airtableRecordId) continue;

        // Count total contacts for this org + event
        const [{ count: totalContacts }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(organisationContacts)
          .where(
            and(
              eq(organisationContacts.organisationId, org.airtableRecordId),
              eq(organisationContacts.airtableEventId, evt.airtableRecordId),
            )
          );

        // Get emails of all contacts
        const contactEmails = await db
          .select({ email: organisationContacts.contactEmail })
          .from(organisationContacts)
          .where(
            and(
              eq(organisationContacts.organisationId, org.airtableRecordId),
              eq(organisationContacts.airtableEventId, evt.airtableRecordId),
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
    // 1. Get the event's airtable record ID
    const [evt] = await db.select({ airtableRecordId: events.airtableRecordId })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if (!evt?.airtableRecordId) return [];

    // 2. Get the org's airtable record ID
    const [org] = await db.select({ airtableRecordId: organisations.airtableRecordId })
      .from(organisations)
      .where(eq(organisations.id, orgId))
      .limit(1);
    if (!org?.airtableRecordId) return [];

    // 3. Fetch all contacts for this org + event
    const contacts = await db.select()
      .from(organisationContacts)
      .where(
        and(
          eq(organisationContacts.organisationId, org.airtableRecordId),
          eq(organisationContacts.airtableEventId, evt.airtableRecordId),
        )
      );
    if (contacts.length === 0) return [];

    // 4. Fetch emails of Group registrations already submitted for this event + org
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

    // 5. Map to OrgContactOption
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
        // Look up the org's airtable record ID for matching against contacts
        const [org] = await db.select({ airtableRecordId: organisations.airtableRecordId })
          .from(organisations)
          .where(eq(organisations.id, data.organizationId))
          .limit(1);

        if (org?.airtableRecordId) {
          // Look up the event's airtable record ID
          const [evt] = await db.select({ airtableRecordId: events.airtableRecordId })
            .from(events)
            .where(eq(events.id, data.eventId))
            .limit(1);

          if (evt?.airtableRecordId) {
            const [matchingContact] = await db.select({
              id: organisationContacts.id,
              expectedGroupSize: organisationContacts.expectedGroupSize,
            })
              .from(organisationContacts)
              .where(
                and(
                  eq(organisationContacts.organisationId, org.airtableRecordId),
                  eq(organisationContacts.airtableEventId, evt.airtableRecordId),
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
   * Create a new organization (for admin use)
   * Creates a record in the UK organisations table + organisation_contacts for contact details
   */
  static async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Organization> {
    try {
      // Look up event's airtable_record_id for linking
      const evt = data.eventId
        ? await db.select().from(events).where(eq(events.id, data.eventId)).limit(1)
        : [];
      const eventAirtableId = evt[0]?.airtableRecordId ?? null;

      // Generate a local record ID for linking org ↔ contacts (no Airtable ID yet)
      const localRecordId = data.airtableRecordId || `local-${randomUUID()}`;

      const [newOrg] = await db.insert(organisations).values({
        name: data.name,
        groupType: data.groupType || 'Other',
        imageUrl: data.imageUrl || null,
        airtableRecordId: localRecordId,
        airtableEventId: eventAirtableId,
      }).returning();

      // Create contact record — openGroup lives here (per event), not on the org
      const [newContact] = await db.insert(organisationContacts).values({
        organisationId: localRecordId,
        airtableEventId: eventAirtableId,
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

      // Get event's airtable_record_id for linking to UK table's airtable_event_id
      const evt = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      const eventAirtableId = evt[0]?.airtableRecordId ?? null;

      // Check if this family group already exists in the UK organisations table
      const existing = await db
        .select({ org: organisations, contact: organisationContacts })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          eq(organisations.airtableRecordId, organisationContacts.organisationId)
        )
        .where(
          and(
            eq(organisations.name, familyGroupName),
            eventAirtableId ? eq(organisations.airtableEventId, eventAirtableId) : undefined,
          )
        );

      // Match by contact email to deduplicate
      const matchByEmail = existing.find(r => r.contact?.contactEmail === contactEmail);
      if (matchByEmail) {
        return mapOrganisationToOrganization(matchByEmail.org, matchByEmail.contact, eventId);
      }

      // Create new family group in UK organisations table
      // Use a local-{uuid} as airtable_record_id to link org ↔ contacts
      const localRecordId = `local-${randomUUID()}`;

      const [newOrg] = await db.insert(organisations).values({
        name: familyGroupName,
        groupType: 'Family',
        imageUrl: null,
        airtableRecordId: localRecordId,
        airtableEventId: eventAirtableId,
      }).returning();

      // Create contact record — openGroup lives here (per event), not on the org
      // Family groups are closed (not visible in participant dropdown)
      const [newContact] = await db.insert(organisationContacts).values({
        organisationId: localRecordId,
        airtableEventId: eventAirtableId,
        openGroup: false,
        contactFirstName: contactFirstName,
        contactLastName: contactLastName,
        contactEmail: contactEmail,
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

      const oldAirtableRecordId = current.airtableRecordId;
      const newAirtableRecordId = data.airtableRecordId ?? oldAirtableRecordId;

      const { contactFirstName, contactLastName, contactEmail, contactPhone, notes, airtableRecordId, openGroup, ...orgFields } = data;
      await db
        .update(organisations)
        .set({ ...orgFields, airtableRecordId: newAirtableRecordId, modifiedAt: new Date() })
        .where(eq(organisations.id, id));

      if (oldAirtableRecordId) {
        await db
          .update(organisationContacts)
          .set({
            organisationId: newAirtableRecordId,
            // openGroup lives on the contact row (per event), not on the org
            ...(openGroup !== undefined ? { openGroup } : {}),
            contactFirstName: contactFirstName ?? undefined,
            contactLastName: contactLastName ?? undefined,
            contactEmail: contactEmail ?? undefined,
            contactPhone: contactPhone ?? undefined,
            notes: notes ?? undefined,
            modifiedAt: new Date(),
          })
          .where(eq(organisationContacts.organisationId, oldAirtableRecordId));
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

      const [org] = await db
        .select({ airtableRecordId: organisations.airtableRecordId })
        .from(organisations)
        .where(eq(organisations.id, id))
        .limit(1);

      if (!org) throw new Error(`Organisation not found: ${id}`);

      if (org.airtableRecordId) {
        await db
          .delete(organisationContacts)
          .where(eq(organisationContacts.organisationId, org.airtableRecordId));
      }

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
    const oldAirtableRecordId = current.airtableRecordId;
    const newAirtableRecordId = data.airtableRecordId ?? oldAirtableRecordId;
    const { airtableRecordId, ...orgFields } = data;
    const [row] = await db
      .update(organisations)
      .set({ ...orgFields, airtableRecordId: newAirtableRecordId, modifiedAt: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    if (oldAirtableRecordId && newAirtableRecordId !== oldAirtableRecordId) {
      await db
        .update(organisationContacts)
        .set({ organisationId: newAirtableRecordId })
        .where(eq(organisationContacts.organisationId, oldAirtableRecordId));
    }
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
    const [org] = await db
      .select({ airtableRecordId: organisations.airtableRecordId })
      .from(organisations)
      .where(eq(organisations.id, id))
      .limit(1);
    if (!org) throw new Error(`Organisation not found: ${id}`);
    if (org.airtableRecordId) {
      const [contactCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(organisationContacts)
        .where(eq(organisationContacts.organisationId, org.airtableRecordId));
      if ((contactCount?.count ?? 0) > 0) {
        throw new Error('Cannot delete: this organisation has group leaders. Delete them first.');
      }
    }
    await db.delete(organisations).where(eq(organisations.id, id));
  }

  // ---------------------------------------------------------------------------
  // Group leader CRUD (organisation_contacts table only — joined with org for display)
  // ---------------------------------------------------------------------------

  static async getGroupLeaders(eventId: string): Promise<GroupLeader[]> {
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event?.airtableRecordId) return [];
    const rows = await db
      .select({ org: organisations, contact: organisationContacts })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.airtableRecordId))
      .where(eq(organisationContacts.airtableEventId, event.airtableRecordId));
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
    const [event] = await db.select().from(events).where(eq(events.id, data.eventId)).limit(1);
    const eventAirtableId = event?.airtableRecordId ?? null;
    const [org] = await db.select().from(organisations).where(eq(organisations.id, data.orgId)).limit(1);
    if (!org) throw new Error(`Organisation not found: ${data.orgId}`);
    const [contact] = await db.insert(organisationContacts).values({
      organisationId: org.airtableRecordId,
      airtableEventId: eventAirtableId,
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
    let orgAirtableId: string | null | undefined;
    if (orgId) {
      const [org] = await db.select().from(organisations).where(eq(organisations.id, orgId)).limit(1);
      if (!org) throw new Error(`Organisation not found: ${orgId}`);
      orgAirtableId = org.airtableRecordId;
    }
    await db
      .update(organisationContacts)
      .set({
        ...(orgAirtableId !== undefined ? { organisationId: orgAirtableId } : {}),
        ...(openGroup !== undefined ? { openGroup } : {}),
        ...(expectedGroupSize !== undefined ? { expectedGroupSize: expectedGroupSize != null ? String(expectedGroupSize) : null } : {}),
        ...contactFields,
        modifiedAt: new Date(),
      })
      .where(eq(organisationContacts.id, id));
    const [result] = await db
      .select({ org: organisations, contact: organisationContacts })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.airtableRecordId))
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

      // Get pre-registered organisations via organisation_contacts (which has the event link)
      // Organisations don't have a direct event link — the link is through contacts
      const evt = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
      const eventAirtableId = evt[0]?.airtableRecordId ?? null;

      // Query organisation_contacts for this event, joined to organisations for name/groupType
      const contactsForEvent = eventAirtableId
        ? await db
            .select({
              orgId: organisations.id,
              orgName: organisations.name,
              orgGroupType: organisations.groupType,
              openGroup: organisationContacts.openGroup,
              contactExpectedGroupSize: organisationContacts.expectedGroupSize,
            })
            .from(organisationContacts)
            .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.airtableRecordId))
            .where(eq(organisationContacts.airtableEventId, eventAirtableId))
        : [];

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
   * Compute summary counts for an event without writing to the DB.
   * Uses open/closed group logic: closed groups count groupSize + leader;
   * open groups count leader only if participating.
   */
  private static async computeSummaryData(
    eventId: string,
    event: { id: string; airtableRecordId?: string },
  ): Promise<EventSummaryPreview> {
    // Fetch all registrations for this event
    const regs = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId));

    const groupRegs = regs.filter(r => r.role === 'Group');
    const participantRegs = regs.filter(r => r.role === 'Participant');

    // Build openGroup lookup: organisations.id (UUID) → isOpen (boolean)
    const openGroupMap = new Map<string, boolean>();
    const orgUuids = [...new Set(
      groupRegs.map(r => r.organizationId).filter((id): id is string => id != null)
    )];

    if (orgUuids.length > 0 && event.airtableRecordId) {
      const orgRows = await db
        .select({ orgId: organisations.id, openGroup: organisationContacts.openGroup })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          and(
            eq(organisationContacts.organisationId, organisations.airtableRecordId),
            eq(organisationContacts.airtableEventId, event.airtableRecordId),
          ),
        )
        .where(inArray(organisations.id, orgUuids));

      for (const row of orgRows) {
        openGroupMap.set(row.orgId, row.openGroup !== false);
      }
    }

    // Role counts
    const volunteerCount = regs.filter(r => r.role === 'Volunteer').length;
    const groupCount = groupRegs.length;

    // Participant count: individual registrations + closed group members (groupSize)
    let participantCount = participantRegs.length;
    for (const reg of groupRegs) {
      const isOpen = reg.organizationId
        ? (openGroupMap.get(reg.organizationId) ?? true)
        : true;
      if (!isOpen) {
        participantCount += reg.groupSize ?? 0;
      }
    }

    // Headcount: participants + group leaders who are participating
    const participatingLeaderCount = groupRegs.filter(r => r.groupLeaderParticipating === true).length;
    const totalHeadcount = participantCount + participatingLeaderCount;

    // Consent counts (across all roles)
    const photoConsentCount = regs.filter(r => r.photoConsent === true).length;
    const feedbackConsentCount = regs.filter(r => r.feedbackConsent === true).length;
    const nextEventConsentCount = regs.filter(r => r.nextEventConsent === true).length;

    // Build org name lookup from organizationId → org name via the organisations table
    const allOrgUuids = [...new Set(
      regs.map(r => r.organizationId).filter((id): id is string => id != null)
    )];
    const orgNameMap = new Map<string, string>();
    if (allOrgUuids.length > 0) {
      const orgNameRows = await db
        .select({ id: organisations.id, name: organisations.name })
        .from(organisations)
        .where(inArray(organisations.id, allOrgUuids));
      for (const row of orgNameRows) {
        const name = row.name?.toLowerCase() === 'individual' ? 'Individual Participants' : (row.name ?? 'Unknown organisation');
        orgNameMap.set(row.id, name);
      }
    }

    // Org breakdown using joined org names, with open/closed headcount rules
    const orgHeadcountMap = new Map<string, number>();

    for (const reg of participantRegs) {
      const orgName = (reg.organizationId ? orgNameMap.get(reg.organizationId) : null)
        ?? reg.organisationName ?? 'No organisation';
      orgHeadcountMap.set(orgName, (orgHeadcountMap.get(orgName) ?? 0) + 1);
    }

    for (const reg of groupRegs) {
      const orgName = (reg.organizationId ? orgNameMap.get(reg.organizationId) : null)
        ?? reg.organisationName ?? 'No organisation';
      const isOpen = reg.organizationId
        ? (openGroupMap.get(reg.organizationId) ?? true)
        : true;
      let contribution = 0;
      if (!isOpen) {
        contribution += reg.groupSize ?? 0;
        if (reg.groupLeaderParticipating === true) contribution += 1;
      } else {
        if (reg.groupLeaderParticipating === true) contribution += 1;
      }
      if (contribution > 0) {
        orgHeadcountMap.set(orgName, (orgHeadcountMap.get(orgName) ?? 0) + contribution);
      }
    }

    const orgBreakdown = [...orgHeadcountMap.entries()]
      .map(([orgName, headcount]) => ({ orgName, headcount }))
      .sort((a, b) => b.headcount - a.headcount);

    return {
      participantCount,
      volunteerCount,
      groupCount,
      participatingLeaderCount,
      totalHeadcount,
      photoConsentCount,
      feedbackConsentCount,
      nextEventConsentCount,
      orgBreakdown,
    };
  }

  /**
   * Compute and return event summary counts without writing anything to the DB.
   * Used by the modal to show a preview before the admin confirms.
   * Throws if the event is not found or not status='completed'.
   */
  static async previewEventSummary(eventId: string): Promise<EventSummaryPreview> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status})`);
    }
    return DatabaseService.computeSummaryData(eventId, {
      id: event.id,
      airtableRecordId: event.airtableRecordId ?? undefined,
    });
  }

  /**
   * Generate and persist an event summary, then set the event status to 'archived'.
   *
   * Atomicity note: Neon HTTP client has no transaction support. Steps run sequentially:
   * 1. Insert summary row
   * 2. Update event status to 'archived'
   * If step 2 fails, the summary row exists but the event remains 'completed'.
   * This is the preferred failure mode — it is recoverable by retrying.
   *
   * Throws if the event is not found or not status='completed'.
   */
  static async generateEventSummary(
    eventId: string,
    eventSequenceNumber: number,
    adminNotes: string | null,
  ): Promise<EventSummary> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status})`);
    }

    const preview = await DatabaseService.computeSummaryData(eventId, {
      id: event.id,
      airtableRecordId: event.airtableRecordId ?? undefined,
    });

    // Step 1: Insert summary row
    const inserted = await db
      .insert(eventSummaries)
      .values({
        eventId,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location ?? null,
        eventDescription: event.description ?? null,
        eventAirtableRecordId: event.airtableRecordId ?? null,
        participantCount: preview.participantCount,
        volunteerCount: preview.volunteerCount,
        groupCount: preview.groupCount,
        totalHeadcount: preview.totalHeadcount,
        photoConsentCount: preview.photoConsentCount,
        feedbackConsentCount: preview.feedbackConsentCount,
        nextEventConsentCount: preview.nextEventConsentCount,
        orgBreakdown: JSON.stringify(preview.orgBreakdown),
        eventSequenceNumber,
        adminNotes: adminNotes ?? null,
      })
      .onConflictDoUpdate({
        target: eventSummaries.eventId,
        set: {
          eventName: event.name,
          eventDate: event.date,
          eventLocation: event.location ?? null,
          eventDescription: event.description ?? null,
          eventAirtableRecordId: event.airtableRecordId ?? null,
          participantCount: preview.participantCount,
          volunteerCount: preview.volunteerCount,
          groupCount: preview.groupCount,
          totalHeadcount: preview.totalHeadcount,
          photoConsentCount: preview.photoConsentCount,
          feedbackConsentCount: preview.feedbackConsentCount,
          nextEventConsentCount: preview.nextEventConsentCount,
          orgBreakdown: JSON.stringify(preview.orgBreakdown),
          eventSequenceNumber,
          adminNotes: adminNotes ?? null,
          createdAt: new Date(),
        },
      })
      .returning();

    const row = inserted[0];
    if (!row) throw new Error('Failed to save event summary');

    // Step 2: Archive the event
    await db
      .update(events)
      .set({ status: 'archived' })
      .where(eq(events.id, eventId));

    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      eventDate: row.eventDate,
      eventLocation: row.eventLocation,
      eventDescription: row.eventDescription,
      eventAirtableRecordId: row.eventAirtableRecordId,
      participantCount: row.participantCount,
      volunteerCount: row.volunteerCount,
      groupCount: row.groupCount,
      participatingLeaderCount: preview.participatingLeaderCount,
      totalHeadcount: row.totalHeadcount,
      photoConsentCount: row.photoConsentCount,
      feedbackConsentCount: row.feedbackConsentCount,
      nextEventConsentCount: row.nextEventConsentCount,
      orgBreakdown: JSON.parse(row.orgBreakdown) as { orgName: string; headcount: number }[],
      eventSequenceNumber: row.eventSequenceNumber,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
  /**
   * Get the stored event summary for an archived event.
   */
  static async getEventSummary(eventId: string) {
    const [row] = await db
      .select()
      .from(eventSummaries)
      .where(eq(eventSummaries.eventId, eventId))
      .limit(1);

    if (!row) return null;

    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      eventDate: row.eventDate,
      eventLocation: row.eventLocation,
      eventDescription: row.eventDescription,
      participantCount: row.participantCount,
      volunteerCount: row.volunteerCount,
      groupCount: row.groupCount,
      totalHeadcount: row.totalHeadcount,
      photoConsentCount: row.photoConsentCount,
      feedbackConsentCount: row.feedbackConsentCount,
      nextEventConsentCount: row.nextEventConsentCount,
      orgBreakdown: JSON.parse(row.orgBreakdown) as { orgName: string; headcount: number }[],
      eventSequenceNumber: row.eventSequenceNumber,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt?.toISOString() ?? null,
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
    airtableEventId: row.airtableEventId ?? undefined,
    createdAt: row.createdAt?.toISOString(),
    modifiedAt: row.modifiedAt?.toISOString(),
  };
}

function mapGroupLeader(org: OrganisationRow, contact: OrganisationContactRow): GroupLeader {
  return {
    id: contact.id,
    orgId: org.id,
    organisationAirtableId: contact.organisationId ?? '',
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
    airtableEventId: contact.airtableEventId ?? undefined,
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

