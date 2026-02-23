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
import { events, organizations, volunteers, registrations } from './db/schema';
import { eq, and, ilike, or, isNotNull } from 'drizzle-orm';
import { Event, Organization, Volunteer, Registration } from './types';
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
   * Get all organizations for a specific event
   * If no eventId provided, returns all organizations
   */
  static async getOrganizations(eventId?: string): Promise<Organization[]> {
    try {
      const query = eventId
        ? db.select().from(organizations).where(eq(organizations.eventId, eventId))
        : db.select().from(organizations);
      
      const result = await query;
      return result.map(mapOrganizationFromDb);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const result = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, id))
        .limit(1);
      
      return result[0] ? mapOrganizationFromDb(result[0]) : null;
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
      // First, set all events to 'completed'
      await db
        .update(events)
        .set({
          status: 'completed',
          modifiedAt: new Date()
        });

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
   * Search organizations by name for a specific event
   * Case-insensitive search
   */
  static async searchOrganizations(query: string, eventId?: string): Promise<Organization[]> {
    try {
      const conditions = [];
      
      if (query) {
        conditions.push(ilike(organizations.name, `%${query}%`));
      }
      
      if (eventId) {
        conditions.push(eq(organizations.eventId, eventId));
      }

      const dbQuery = conditions.length > 0
        ? db.select().from(organizations).where(and(...conditions))
        : db.select().from(organizations);
      
      const result = await dbQuery;
      return result.map(mapOrganizationFromDb);
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
      return result.map(v => v.email);
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
   * Returns basic fields for list view including organization name
   */
  static async getAllRegistrations(eventId: string): Promise<Registration[]> {
    try {
      const result = await db
        .select({
          registration: registrations,
          organizationName: organizations.name,
        })
        .from(registrations)
        .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
        .where(eq(registrations.eventId, eventId))
        .orderBy(registrations.createdAt);

      return result.map(row => ({
        ...mapRegistrationFromDb(row.registration),
        organizationName: row.organizationName || undefined,
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
          organizationName: organizations.name,
        })
        .from(registrations)
        .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.organizationId, organizationId)
          )
        )
        .orderBy(registrations.attendeeName, registrations.attendeeSurname);

      return result.map(row => ({
        ...mapRegistrationFromDb(row.registration),
        organizationName: row.organizationName || undefined,
      }));
    } catch (error) {
      console.error('Error fetching registrations by organization:', error);
      throw error;
    }
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
          organizationName: organizations.name,
        })
        .from(registrations)
        .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
        .where(eq(registrations.id, id))
        .limit(1);

      if (result.length === 0) return null;

      return {
        ...mapRegistrationFromDb(result[0].registration),
        organizationName: result[0].organizationName || undefined,
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
      const result = await db.insert(registrations).values({
        eventId: data.eventId,
        attendeeName: data.attendeeName,
        attendeeSurname: data.attendeeSurname,
        email: data.email || null,
        organizationId: data.organizationId || null,
        impairment: data.impairment || null,
        role: data.role,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent ?? null,
        nextEventConsent: data.nextEventConsent ?? null,
        groupSize: data.groupSize ?? null,
        disabledStudents: data.disabledStudents ?? null,
        senStudents: data.senStudents ?? null,
        groupLeaderParticipating: data.groupLeaderParticipating ?? null,
        checkinTime: data.checkinTime ? new Date(data.checkinTime) : null,
        checkoutTime: data.checkoutTime ? new Date(data.checkoutTime) : null,
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
   */
  static async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Organization> {
    try {
      const result = await db.insert(organizations).values({
        eventId: data.eventId,
        name: data.name,
        groupType: data.groupType || 'Other',
        imageUrl: data.imageUrl || null,
        contactFirstName: data.contactFirstName || null,
        contactLastName: data.contactLastName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
        airtableRecordId: data.airtableRecordId || null,
      }).returning();

      return mapOrganizationFromDb(result[0]);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  /**
   * Find or create a family group organization
   * Family groups are unique by: name + eventId + contactEmail
   *
   * @param eventId - The event ID
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

      // Check if this family group already exists for this event with this contact email
      const existing = await db
        .select()
        .from(organizations)
        .where(
          and(
            eq(organizations.eventId, eventId),
            eq(organizations.name, familyGroupName),
            eq(organizations.contactEmail, contactEmail)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return mapOrganizationFromDb(existing[0]);
      }

      // Create new family group organization
      const result = await db.insert(organizations).values({
        eventId: eventId,
        name: familyGroupName,
        groupType: 'Family',
        imageUrl: null,
        contactFirstName: contactFirstName,
        contactLastName: contactLastName,
        contactEmail: contactEmail,
        contactPhone: null,
        notes: 'Auto-created family group',
        airtableRecordId: null,
      }).returning();

      return mapOrganizationFromDb(result[0]);
    } catch (error) {
      console.error('Error finding or creating family group:', error);
      throw error;
    }
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
      // Get all registrations with organization details
      const allRegistrations = await db
        .select({
          id: registrations.id,
          role: registrations.role,
          groupSize: registrations.groupSize,
          disabledStudents: registrations.disabledStudents,
          senStudents: registrations.senStudents,
          groupLeaderParticipating: registrations.groupLeaderParticipating,
          organizationId: registrations.organizationId,
          organizationName: organizations.name,
          groupType: organizations.groupType,
          organizationAirtableRecordId: organizations.airtableRecordId,
        })
        .from(registrations)
        .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
        .where(eq(registrations.eventId, eventId));

      // Get all pre-registered organizations for this event (to count expected groups)
      // Only organizations with airtable_record_id are pre-registered (expected)
      // Organizations without airtable_record_id are walk-ins/on-the-day signups
      const allOrgs = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          groupType: organizations.groupType,
        })
        .from(organizations)
        .where(
          and(
            eq(organizations.eventId, eventId),
            // Only count organizations with airtable_record_id (pre-registered)
            isNotNull(organizations.airtableRecordId)
          )
        );

      // Convert to format expected by counting logic
      const registrationsForCounting: RegistrationForCounting[] = allRegistrations.map(r => ({
        id: r.id,
        role: r.role as 'Participant' | 'Volunteer' | 'Group',
        groupSize: r.groupSize,
        disabledStudents: r.disabledStudents,
        senStudents: r.senStudents,
        groupLeaderParticipating: r.groupLeaderParticipating,
        organizationId: r.organizationId,
        organizationName: r.organizationName,
        groupType: r.groupType as any,
        organizationAirtableRecordId: r.organizationAirtableRecordId,
      }));

      const organizationsForCounting = allOrgs.map(org => ({
        id: org.id,
        name: org.name,
        groupType: org.groupType as any,
      }));

      // Use the business logic module to calculate counts
      return calculateParticipantCounts(registrationsForCounting, organizationsForCounting);
    } catch (error) {
      console.error('Error fetching registration counts:', error);
      throw error;
    }
  }
}

/**
 * Mapper Functions
 * Convert database snake_case fields to TypeScript camelCase
 */

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

function mapOrganizationFromDb(dbOrg: any): Organization {
  return {
    id: dbOrg.id,
    eventId: dbOrg.eventId,
    name: dbOrg.name,
    groupType: dbOrg.groupType,
    expectedGroupSize: dbOrg.expectedGroupSize,
    imageUrl: dbOrg.imageUrl,
    contactFirstName: dbOrg.contactFirstName,
    contactLastName: dbOrg.contactLastName,
    contactEmail: dbOrg.contactEmail,
    contactPhone: dbOrg.contactPhone,
    notes: dbOrg.notes,
    airtableRecordId: dbOrg.airtableRecordId,
    createdAt: dbOrg.createdAt?.toISOString(),
    modifiedAt: dbOrg.modifiedAt?.toISOString(),
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
    disabledStudents: dbReg.disabledStudents,
    senStudents: dbReg.senStudents,
    groupLeaderParticipating: dbReg.groupLeaderParticipating,
    checkinTime: dbReg.checkinTime?.toISOString(),
    checkoutTime: dbReg.checkoutTime?.toISOString(),
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

