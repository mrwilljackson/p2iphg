/**
 * Database Schema
 * 
 * Defines the database tables for:
 * - Events (cached from Airtable)
 * - Organizations (cached from Airtable)
 * - Registrations (collected during event, synced to Airtable after)
 */

import { pgTable, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Events Table
 * Stores event data fetched from Airtable before the event
 */
export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  airtableRecordId: text('airtable_record_id'),
  name: text('name').notNull(),
  date: text('date').notNull(),
  location: text('location'),
  description: text('description'),
  status: text('status').notNull(), // 'active' | 'completed' | 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
});

/**
 * Organizations Table
 * Stores organization data fetched from Airtable before the event
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  airtableRecordId: text('airtable_record_id'),
  name: text('name').notNull(),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
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
  organizationName: text('organization_name'), // For custom organizations not in the list
  impairment: text('impairment'),
  role: text('role').notNull(), // 'Attendee' | 'Volunteer' | 'Teacher / Coordinator'
  photoConsent: boolean('photo_consent').notNull(),
  marketingConsent: boolean('marketing_consent').notNull(),
  groupSize: text('group_size'), // Number of participants (Teacher/Coordinator only)
  senStudents: text('sen_students'), // Number of SEN students (Teacher/Coordinator only)
  createdAt: timestamp('created_at').defaultNow(),
  syncedToAirtable: boolean('synced_to_airtable').default(false),
  airtableRecordId: text('airtable_record_id'),
});

// Export types for TypeScript
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

