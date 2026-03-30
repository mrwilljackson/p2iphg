"use server";

/**
 * Server Actions for Database Operations
 *
 * These functions run on the server-side only and can be called from client components.
 * They provide a secure way to interact with the database without exposing credentials.
 */


import { db } from './db/client';
import { events, registrations, volunteers, organisations, organisationContacts } from './db/schema';
import { eq, and, or, isNull, sql, inArray } from 'drizzle-orm';
import { DatabaseService } from './db-service';
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
import type { ParticipantCounts } from './participant-counting';

/**
 * Get the current active event
 */
export async function getCurrentEvent(): Promise<Event | null> {
  return await DatabaseService.getCurrentEvent();
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  return await DatabaseService.getAllEvents();
}

/**
 * Create a new event
 * Defaults to 'planned' status if not specified
 */
export async function createEvent(eventData: {
  name: string;
  date: string;
  location?: string;
  description?: string;
  status?: 'planned' | 'active' | 'completed';
  airtableRecordId?: string;
}): Promise<Event> {
  return await DatabaseService.createEvent(eventData);
}

/**
 * Set an event as the current active event
 * Sets the specified event to 'active' and all others to 'completed'
 */
export async function setCurrentEvent(eventId: string): Promise<Event> {
  return await DatabaseService.setCurrentEvent(eventId);
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  return await DatabaseService.getEventById(id);
}

/**
 * Get organizations for a specific event
 */
export async function getOrganizations(eventId: string): Promise<Organization[]> {
  return await DatabaseService.getOrganizations(eventId);
}

/**
 * Get volunteer emails for a specific event
 */
export async function getVolunteerEmails(eventId: string): Promise<string[]> {
  return await DatabaseService.getVolunteerEmails(eventId);
}

/**
 * Get volunteer by email for a specific event
 */
export async function getVolunteerByEmail(email: string, eventId: string): Promise<Volunteer | null> {
  return await DatabaseService.getVolunteerByEmail(email, eventId);
}

/**
 * Create a new registration
 */
export async function createRegistration(data: Omit<Registration, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Registration> {
  return await DatabaseService.createRegistration(data);
}

/**
 * Create a new organization (admin only)
 */
export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Organization> {
  return await DatabaseService.createOrganization(data);
}

/**
 * Create a new volunteer (admin only)
 */
export async function createVolunteer(data: Omit<Volunteer, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Volunteer> {
  return await DatabaseService.createVolunteer(data);
}

/**
 * Find or create a family group organization
 * Used when a Group leader selects "Family Group" and enters their surname
 */
export async function findOrCreateFamilyGroup(
  eventId: string,
  surname: string,
  contactEmail: string,
  contactFirstName: string,
  contactLastName: string
): Promise<Organization> {
  return await DatabaseService.findOrCreateFamilyGroup(
    eventId,
    surname,
    contactEmail,
    contactFirstName,
    contactLastName
  );
}

/**
 * Get all registrations for a specific event
 */
export async function getAllRegistrations(eventId: string): Promise<Registration[]> {
  return await DatabaseService.getAllRegistrations(eventId);
}

/**
 * Get a single registration by ID
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  return await DatabaseService.getRegistrationById(id);
}

export async function getRegistrationsByOrganization(eventId: string, organizationId: string): Promise<Registration[]> {
  return await DatabaseService.getRegistrationsByOrganization(eventId, organizationId);
}

/**
 * Get contacts for an organisation at a specific event, with registration status.
 * Used to populate group.contactPicker in the registration form.
 */
export async function getOrgContactsForEvent(
  eventId: string,
  orgId: string,
): Promise<OrgContactOption[]> {
  return await DatabaseService.getOrgContactsForEvent(eventId, orgId);
}

/**
 * Get existing group leader registrations for an organization at an event.
 * Used by the form to detect when another leader has already registered
 * and inform the second leader about existing participant counts.
 */
export async function getExistingGroupLeaders(eventId: string, organizationId: string): Promise<{
  hasExistingLeaders: boolean;
  leaders: { name: string; groupSize: number }[];
  totalParticipantsRegistered: number;
}> {
  const registrations = await DatabaseService.getRegistrationsByOrganization(eventId, organizationId);
  const groupRegs = registrations.filter(r => r.role === 'Group');
  const totalParticipants = groupRegs.reduce((sum, r) => sum + (r.groupSize || 0), 0);

  return {
    hasExistingLeaders: groupRegs.length > 0,
    leaders: groupRegs.map(r => ({
      name: `${r.attendeeName} ${r.attendeeSurname}`,
      groupSize: r.groupSize || 0,
    })),
    totalParticipantsRegistered: totalParticipants,
  };
}

export async function getOrganizationById(id: string, eventId?: string): Promise<Organization | null> {
  return await DatabaseService.getOrganizationById(id, eventId);
}

/**
 * Get all volunteers for a specific event
 */
export async function getAllVolunteers(eventId: string): Promise<Volunteer[]> {
  return await DatabaseService.getAllVolunteers(eventId);
}

export async function getVolunteerRegistrationEmails(eventId: string): Promise<string[]> {
  return await DatabaseService.getVolunteerRegistrationEmails(eventId);
}

export async function getFullyRegisteredOrgIds(eventId: string): Promise<string[]> {
  return await DatabaseService.getFullyRegisteredOrgIds(eventId);
}

/**
 * Get registration counts by role for a specific event
 * Returns detailed counts including group breakdowns and participant totals
 *
 * Business logic is handled by the participant-counting module.
 * See lib/participant-counting.ts for detailed counting rules.
 */
export async function getRegistrationCountsByRole(eventId: string): Promise<ParticipantCounts> {
  return await DatabaseService.getRegistrationCountsByRole(eventId);
}

/**
 * Mark an event as completed
 * Used when an event's date has passed and the admin wants to finalise it
 */
export async function markEventCompleted(eventId: string): Promise<Event> {
  return await DatabaseService.markEventCompleted(eventId);
}

/**
 * Get counts of all records associated with an event.
 * Used by the "Clear Event Data" dialog to show what will be removed.
 */
export interface EventDataCounts {
  registrations: number;
  volunteers: number;
  organisations: number;
  organisationContacts: number;
  unsyncedRegistrations: number;
}

export async function getEventDataCounts(eventId: string): Promise<EventDataCounts> {
  // Get the event's airtable_record_id for org/contact lookups
  const evt = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!evt[0]) throw new Error(`Event not found: ${eventId}`);

  const eventAirtableId = evt[0].airtableRecordId;

  // Count registrations for this event
  const regCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(eq(registrations.eventId, eventId));
  const regCount = regCountResult[0]?.count ?? 0;

  // Count unsynced registrations (pending, failed, or null)
  const unsyncedResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      sql`${registrations.eventId} = ${eventId} AND (${registrations.syncStatus} IN ('pending', 'failed') OR ${registrations.syncStatus} IS NULL)`
    );
  const unsyncedCount = unsyncedResult[0]?.count ?? 0;

  // Count volunteers for this event
  const volCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(volunteers)
    .where(eq(volunteers.eventId, eventId));
  const volCount = volCountResult[0]?.count ?? 0;

  // Count organisations and contacts linked via organisation_contacts.airtable_event_id
  // Note: organisations.airtable_event_id is NOT populated — the event link is only
  // on organisation_contacts. So we find orgs by joining through contacts.
  let orgCount = 0;
  let contactCount = 0;
  if (eventAirtableId) {
    const contactResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organisationContacts)
      .where(eq(organisationContacts.airtableEventId, eventAirtableId));
    contactCount = contactResult[0]?.count ?? 0;

    // Count distinct organisations referenced by contacts for this event
    const orgResult = await db
      .select({ count: sql<number>`count(DISTINCT ${organisations.id})::int` })
      .from(organisations)
      .innerJoin(
        organisationContacts,
        eq(organisationContacts.organisationId, organisations.airtableRecordId)
      )
      .where(eq(organisationContacts.airtableEventId, eventAirtableId));
    orgCount = orgResult[0]?.count ?? 0;
  }

  return {
    registrations: regCount,
    volunteers: volCount,
    organisations: orgCount,
    organisationContacts: contactCount,
    unsyncedRegistrations: unsyncedCount,
  };
}


/**
 * Clear all participant and organisation data for an event.
 * Deletes in FK-safe order, then sets the event status to 'archived'.
 *
 * Deletion order:
 * 1. Registrations (FK → events.id via eventId)
 * 2. Volunteers (FK → events.id via eventId)
 * 3. Organisation contacts (linked via airtableEventId)
 * 4. Organisations (found via contacts join, no direct event FK)
 * 5. Update event status → 'archived'
 *
 * @param eventId - UUID of the event to clear
 * @param force - If true, allows clearing even with unsynced registrations
 */
export interface ClearEventResult {
  success: boolean;
  deleted: {
    registrations: number;
    volunteers: number;
    organisationContacts: number;
    organisations: number;
  };
  error?: string;
}

export async function clearEventData(eventId: string, force: boolean = false): Promise<ClearEventResult> {
  // Validate event exists
  const evt = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!evt[0]) {
    return { success: false, deleted: { registrations: 0, volunteers: 0, organisationContacts: 0, organisations: 0 }, error: 'Event not found' };
  }

  const eventAirtableId = evt[0].airtableRecordId;

  // Safety check: block if unsynced registrations exist and force is not set
  if (!force) {
    const unsyncedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(registrations)
      .where(
        sql`${registrations.eventId} = ${eventId} AND (${registrations.syncStatus} IN ('pending', 'failed') OR ${registrations.syncStatus} IS NULL)`
      );
    const unsyncedCount = unsyncedResult[0]?.count ?? 0;
    if (unsyncedCount > 0) {
      return {
        success: false,
        deleted: { registrations: 0, volunteers: 0, organisationContacts: 0, organisations: 0 },
        error: `Cannot clear: ${unsyncedCount} unsynced registration(s). Sync first or use force clear.`,
      };
    }
  }

  // 1. Delete registrations for this event
  const regResult = await db.delete(registrations).where(eq(registrations.eventId, eventId)).returning({ id: registrations.id });

  // 2. Delete volunteers for this event
  const volResult = await db.delete(volunteers).where(eq(volunteers.eventId, eventId)).returning({ id: volunteers.id });

  // 3 & 4. Delete organisation contacts and organisations linked via contacts
  let contactDeleteCount = 0;
  let orgDeleteCount = 0;

  if (eventAirtableId) {
    // Find the organisation IDs (Neon UUIDs) linked through contacts for this event
    const linkedOrgs = await db
      .select({ orgId: organisations.id })
      .from(organisations)
      .innerJoin(
        organisationContacts,
        eq(organisationContacts.organisationId, organisations.airtableRecordId)
      )
      .where(eq(organisationContacts.airtableEventId, eventAirtableId));

    const orgIds = [...new Set(linkedOrgs.map(r => r.orgId))];

    // 3. Delete organisation contacts for this event
    const contactResult = await db.delete(organisationContacts)
      .where(eq(organisationContacts.airtableEventId, eventAirtableId))
      .returning({ id: organisationContacts.id });
    contactDeleteCount = contactResult.length;

    // 4. Delete the organisations themselves
    if (orgIds.length > 0) {
      const orgResult = await db.delete(organisations)
        .where(inArray(organisations.id, orgIds))
        .returning({ id: organisations.id });
      orgDeleteCount = orgResult.length;
    }
  }

  // 5. Set event status to 'archived'
  await db.update(events)
    .set({ status: 'archived', modifiedAt: new Date() })
    .where(eq(events.id, eventId));

  return {
    success: true,
    deleted: {
      registrations: regResult.length,
      volunteers: volResult.length,
      organisationContacts: contactDeleteCount,
      organisations: orgDeleteCount,
    },
  };
}

/**
 * Update an organisation and its contact details
 */
export async function updateOrganization(id: string, data: {
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
  return await DatabaseService.updateOrganization(id, data);
}

/**
 * Delete an organisation and its contact (blocked if registrations exist)
 */
export async function deleteOrganization(id: string): Promise<void> {
  return await DatabaseService.deleteOrganization(id);
}

/**
 * Update an event's details
 */
export async function updateEvent(id: string, data: {
  name?: string;
  date?: string;
  location?: string;
  description?: string;
  airtableRecordId?: string;
}): Promise<Event> {
  return await DatabaseService.updateEvent(id, data);
}

/**
 * Delete an event (blocked if registrations or volunteers exist)
 */
export async function deleteEvent(id: string): Promise<void> {
  return await DatabaseService.deleteEvent(id);
}

// ----------------------------------------------------------------------------
// Org record CRUD (organisations table only)
// ----------------------------------------------------------------------------

export async function getOrgRecords(): Promise<OrgRecord[]> {
  return await DatabaseService.getOrgRecords();
}

export async function createOrgRecord(data: {
  name: string;
  groupType: string;
  airtableRecordId?: string;
}): Promise<OrgRecord> {
  return await DatabaseService.createOrgRecord(data);
}

export async function updateOrgRecord(id: string, data: {
  name?: string;
  groupType?: string;
  airtableRecordId?: string;
}): Promise<OrgRecord> {
  return await DatabaseService.updateOrgRecord(id, data);
}

export async function deleteOrgRecord(id: string): Promise<void> {
  return await DatabaseService.deleteOrgRecord(id);
}

// ----------------------------------------------------------------------------
// Group leader CRUD (organisation_contacts table only)
// ----------------------------------------------------------------------------

export async function getGroupLeaders(eventId: string): Promise<GroupLeader[]> {
  return await DatabaseService.getGroupLeaders(eventId);
}

export async function createGroupLeader(data: {
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
  return await DatabaseService.createGroupLeader(data);
}

export async function updateGroupLeader(id: string, data: {
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
  return await DatabaseService.updateGroupLeader(id, data);
}

export async function deleteGroupLeader(id: string): Promise<void> {
  return await DatabaseService.deleteGroupLeader(id);
}

export async function updateGroupLeaderConsents(contactId: string, data: {
  contactEmail?: string;
  photoConsent?: boolean;
  feedbackConsent?: boolean;
  nextEventConsent?: boolean;
}): Promise<void> {
  return await DatabaseService.updateGroupLeaderConsents(contactId, data);
}

// ----------------------------------------------------------------------------
// Helper (Volunteer) CRUD
// ----------------------------------------------------------------------------

export async function updateVolunteer(id: string, data: {
  eventId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  photoConsent?: boolean;
  feedbackConsent?: boolean;
  nextEventConsent?: boolean;
  airtableRecordId?: string;
}): Promise<Volunteer> {
  return await DatabaseService.updateVolunteer(id, data);
}

export async function deleteVolunteer(id: string): Promise<void> {
  return await DatabaseService.deleteVolunteer(id);
}

/**
 * Compute and return event summary counts without writing to DB.
 * Used by the Generate Summary modal to show a preview before the admin confirms.
 */
export async function previewEventSummary(eventId: string): Promise<EventSummaryPreview> {
  return await DatabaseService.previewEventSummary(eventId);
}

/**
 * Generate and persist an event summary, then archive the event.
 */
export async function generateEventSummary(
  eventId: string,
  sequenceNumber: number,
  notes: string | null,
): Promise<EventSummary> {
  return await DatabaseService.generateEventSummary(eventId, sequenceNumber, notes);
}