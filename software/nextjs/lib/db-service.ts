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
import { eq, and, ilike, or } from 'drizzle-orm';
import { Event, Organization, Volunteer, Registration } from './types';

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
   * Business Logic:
   * - Group Leader Participation: If groupLeaderParticipating=false, subtract 1 from group size (leader is in groupSize but doesn't participate)
   * - Corporate Group Deduplication: Individual registrations from corporate groups are excluded to avoid double-counting
   */
  static async getRegistrationCountsByRole(eventId: string): Promise<{
    individualParticipants: number;
    groupParticipants: number;
    totalParticipants: number;
    groups: {
      total: number;
      familyGroups: number;
      disabilityGroups: number;
      corporateGroups: number;
      sportingGroups: number;
      communityGroups: number;
      educationalGroups: number;
      otherGroups: number;
    };
    volunteers: number;
    disabledStudents: number;
    senStudents: number;
    totalRegistrations: number;
  }> {
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
        })
        .from(registrations)
        .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
        .where(eq(registrations.eventId, eventId));

      // Get list of corporate group organization IDs
      const corporateGroupOrgIds = new Set(
        allRegistrations
          .filter(r => r.role === 'Group' && r.groupType === 'Corporate')
          .map(r => r.organizationId)
          .filter(id => id != null)
      );

      // Count individual participants (role = 'Participant')
      // EXCLUDE individuals from corporate groups to avoid double-counting
      const individualParticipants = allRegistrations.filter(r =>
        r.role === 'Participant' &&
        (!r.organizationId || !corporateGroupOrgIds.has(r.organizationId))
      ).length;

      // Count volunteers (role = 'Volunteer')
      const volunteersCount = allRegistrations.filter(r => r.role === 'Volunteer').length;

      // Process group registrations
      const groupRegistrations = allRegistrations.filter(r => r.role === 'Group');

      let groupParticipants = 0;
      let familyGroupsCount = 0;
      let disabilityGroupsCount = 0;
      let corporateGroupsCount = 0;
      let sportingGroupsCount = 0;
      let communityGroupsCount = 0;
      let educationalGroupsCount = 0;
      let otherGroupsCount = 0;
      let totalDisabledStudents = 0;
      let totalSenStudents = 0;

      for (const group of groupRegistrations) {
        // Calculate participants for this group
        let groupCount = group.groupSize || 0;

        // If group leader is NOT participating, subtract 1 (leader is in groupSize but doesn't participate)
        if (group.groupLeaderParticipating === false) {
          groupCount -= 1;
        }

        groupParticipants += groupCount;

        // Add disabled and SEN students to totals
        totalDisabledStudents += group.disabledStudents || 0;
        totalSenStudents += group.senStudents || 0;

        // Categorize group type using groupType field
        switch (group.groupType) {
          case 'Family':
            familyGroupsCount++;
            break;
          case 'Disability':
            disabilityGroupsCount++;
            break;
          case 'Corporate':
            corporateGroupsCount++;
            break;
          case 'Sporting':
            sportingGroupsCount++;
            break;
          case 'Community':
            communityGroupsCount++;
            break;
          case 'Educational':
            educationalGroupsCount++;
            break;
          default:
            otherGroupsCount++;
        }
      }

      const counts = {
        individualParticipants,
        groupParticipants,
        totalParticipants: individualParticipants + groupParticipants,
        groups: {
          total: groupRegistrations.length,
          familyGroups: familyGroupsCount,
          disabilityGroups: disabilityGroupsCount,
          corporateGroups: corporateGroupsCount,
          sportingGroups: sportingGroupsCount,
          communityGroups: communityGroupsCount,
          educationalGroups: educationalGroupsCount,
          otherGroups: otherGroupsCount,
        },
        volunteers: volunteersCount,
        disabledStudents: totalDisabledStudents,
        senStudents: totalSenStudents,
        totalRegistrations: allRegistrations.length,
      };

      return counts;
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

