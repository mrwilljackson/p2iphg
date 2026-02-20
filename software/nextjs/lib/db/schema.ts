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
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  date: text('date').notNull(), // ISO 8601 date string
  location: text('location'),
  description: text('description'),
  status: text('status').notNull(), // 'active' | 'completed' | 'cancelled'
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
});

/**
 * Organizations Table
 * Stores organization data fetched from Airtable before the event
 * Organizations are event-specific
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id),
  name: text('name').notNull(),
  groupType: text('group_type', {
    enum: ['Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other']
  }).default('Other'),
  imageUrl: text('image_url'),
  contactFirstName: text('contact_first_name'),
  contactLastName: text('contact_last_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  notes: text('notes'),
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
  eventId: uuid('event_id').notNull().references(() => events.id),
  attendeeName: text('attendee_name').notNull(),
  attendeeSurname: text('attendee_surname').notNull(),
  email: text('email'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  impairment: text('impairment'),
  role: text('role').notNull(), // 'Participant' | 'Volunteer' | 'Group'
  photoConsent: boolean('photo_consent').notNull(),
  feedbackConsent: boolean('feedback_consent'),
  nextEventConsent: boolean('next_event_consent'),
  groupSize: integer('group_size'),
  disabledStudents: integer('disabled_students'),
  senStudents: integer('sen_students'),
  groupLeaderParticipating: boolean('group_leader_participating'),
  checkinTime: timestamp('checkin_time'),
  checkoutTime: timestamp('checkout_time'),
  syncStatus: text('sync_status'), // 'pending' | 'synced' | 'failed'
  airtableRecordId: text('airtable_record_id'),
  createdAt: timestamp('created_at').defaultNow(),
  modifiedAt: timestamp('modified_at').defaultNow(),
});

// Export types for TypeScript
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Volunteer = typeof volunteers.$inferSelect;
export type NewVolunteer = typeof volunteers.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

