/**
 * Database Schema
 *
 * Defines the database tables for:
 * - Events (cached from Airtable)
 * - Organizations (event-specific, cached from Airtable)
 * - Volunteers (event-specific, pre-registered volunteers)
 * - Registrations (collected during event, synced to Airtable after)
 *
 * Version: 3.0
 * Date: 2026-02-18
 * Based on: DATA_MODELS.md V2.0, types.ts V5
 */

import { pgTable, text, boolean, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

/**
 * Events Table
 * Stores event data fetched from Airtable before the event
 *
 * Status values:
 * - 'planned': Future events that are not yet active
 * - 'active': The current active event (only one at a time)
 * - 'completed': Past events that have finished
 * - 'archived': Events whose participant/organisation data has been cleared
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: text('date').notNull(), // ISO 8601 date string
  location: text('location'),
  description: text('description'),
  status: text('status').notNull(), // 'planned' | 'active' | 'completed' | 'archived'
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
});


/**
 * Volunteers Table
 * Stores pre-registered volunteer data
 * Volunteers are event-specific
 */
export const volunteers = pgTable('volunteers', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  email: text('email').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  photoConsent: boolean('photo_consent').notNull().default(true),
  feedbackConsent: boolean('feedback_consent').notNull().default(false),
  nextEventConsent: boolean('next_event_consent').notNull().default(false),
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
});

/**
 * Registrations Table
 * Stores registration data collected during the event
 * Will be synced to Airtable after the event
 */
export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  attendeeName: text('attendee_name').notNull(),
  attendeeSurname: text('attendee_surname').notNull(),
  email: text('email'),
  organizationId: uuid('organization_id').references(() => organisations.id, { onDelete: 'restrict' }),
  impairment: text('impairment'),
  role: text('role').notNull(), // 'Participant' | 'Volunteer' | 'Group'
  photoConsent: boolean('photo_consent').notNull(),
  feedbackConsent: boolean('feedback_consent'),
  nextEventConsent: boolean('next_event_consent'),
  groupSize: integer('group_size'),
  impairedParticipants: integer('impaired_participants'),
  nonImpairedParticipants: integer('non_impaired_participants'),
  groupLeaderParticipating: boolean('group_leader_participating'),
  organisationName: text('organisation_name'),
  syncStatus: text('sync_status'), // 'pending' | 'synced' | 'failed'
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
});

/**
 * Organisations Table (UK spelling)
 * Stores organisation data imported from Airtable.
 * Organisations are GLOBAL records reused across events. Per-event scoping
 * (which org participates in which event, with what leader) lives on
 * organisation_contacts.eventId — never on this table.
 */
export const organisations = pgTable('organisations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  groupType: text('group_type'),
  imageUrl: text('image_url'),
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at'),
  modifiedAt: timestamp('modified_at'),
});

/**
 * Organisation Contacts Table
 * One row = one organisation's participation in one event. Holds the
 * group leader's contact details, open/closed flag, expected group size,
 * and consent preferences for that pairing.
 */
export const organisationContacts = pgTable('organisation_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organisationId: uuid('organisation_id').notNull().references(() => organisations.id, { onDelete: 'restrict' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  // open_group: whether this group is visible to individual Participants at this event.
  // Stored here (not on organisations) so the same org can be open at one event and closed at another.
  openGroup: boolean('open_group').notNull().default(true),
  // Consent preferences stored per group leader so they persist across events
  photoConsent: boolean('photo_consent').notNull().default(true),
  feedbackConsent: boolean('feedback_consent').notNull().default(false),
  nextEventConsent: boolean('next_event_consent').notNull().default(false),
  contactFirstName: text('contact_first_name'),
  contactLastName: text('contact_last_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  expectedGroupSize: text('expected_group_size'),
  notes: text('notes'),
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at'),
  modifiedAt: timestamp('modified_at'),
});

/**
 * Event Archive Table
 *
 * Canonical post-event record. Created when an admin archives a completed
 * event — at which point the matching rows in registrations,
 * organisation_contacts, and volunteers for that event are HARD-DELETED in
 * the same operation. No personal identifying information is ever stored
 * on this table; aggregate counts only.
 *
 * source_purged_at records the timestamp at which the source PII rows were
 * deleted as part of the archive operation. For atomic-flow archives this
 * equals created_at; preserved as a distinct column so a future migration
 * could distinguish "summary made" from "source data deleted".
 */
export const eventArchive = pgTable('event_archive', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().unique().references(() => events.id),
  eventName: text('event_name').notNull(),
  eventDate: text('event_date').notNull(),
  eventLocation: text('event_location'),
  eventDescription: text('event_description'),
  eventAirtableRecordId: text('event_airtable_record_id'),

  participantCount: integer('participant_count').notNull().default(0),
  volunteerCount: integer('volunteer_count').notNull().default(0),
  groupCount: integer('group_count').notNull().default(0),
  totalHeadcount: integer('total_headcount').notNull().default(0),
  companiesCount: integer('companies_count').notNull().default(0),

  impairedParticipantCount: integer('impaired_participant_count').notNull().default(0),
  nonImpairedParticipantCount: integer('non_impaired_participant_count').notNull().default(0),

  photoConsentCount: integer('photo_consent_count').notNull().default(0),
  feedbackConsentCount: integer('feedback_consent_count').notNull().default(0),
  nextEventConsentCount: integer('next_event_consent_count').notNull().default(0),

  eventSequenceNumber: integer('event_sequence_number').notNull(),

  sourcePurgedAt: timestamp('source_purged_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Event Archive Org Lines Table
 *
 * One row per (archive, organisation). Supports per-organisation history
 * queries across multiple events. Organisation IDs survive the archive
 * (organisations is a global, long-lived table); the Airtable IDs are
 * snapshotted at archive time because the source contact row is deleted.
 */
export const eventArchiveOrgLines = pgTable('event_archive_org_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  archiveId: uuid('archive_id')
    .notNull()
    .references(() => eventArchive.id, { onDelete: 'cascade' }),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'restrict' }),

  orgNameSnapshot: text('org_name_snapshot').notNull(),
  orgAirtableRecordId: text('org_airtable_record_id'),
  contactAirtableRecordId: text('contact_airtable_record_id'),

  actualHeadcount: integer('actual_headcount').notNull().default(0),
  impairedCount: integer('impaired_count').notNull().default(0),
  nonImpairedCount: integer('non_impaired_count').notNull().default(0),

  createdAt: timestamp('created_at').defaultNow(),
});

export type EventArchiveRow = typeof eventArchive.$inferSelect;
export type NewEventArchiveRow = typeof eventArchive.$inferInsert;

export type EventArchiveOrgLineRow = typeof eventArchiveOrgLines.$inferSelect;
export type NewEventArchiveOrgLineRow = typeof eventArchiveOrgLines.$inferInsert;

// Export types for TypeScript
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type OrganisationRow = typeof organisations.$inferSelect;
export type OrganisationContactRow = typeof organisationContacts.$inferSelect;

export type Volunteer = typeof volunteers.$inferSelect;
export type NewVolunteer = typeof volunteers.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

