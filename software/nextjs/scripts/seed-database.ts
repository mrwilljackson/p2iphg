/**
 * Database Seed Script
 *
 * Populates the Neon PostgreSQL database with mock data from mock-data-service.ts
 * This script is used for testing and development purposes.
 *
 * Usage:
 *   npm run db:seed
 *
 * WARNING: This will DELETE all existing data in the database before seeding!
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../lib/db/schema';
import { Event, Organization, Volunteer } from '../lib/types';

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Destructure schema tables
const { events, organizations, volunteers } = schema;

// Import mock data arrays
const MOCK_EVENTS: Event[] = [
  {
    id: 'evt_001',
    name: 'Leicester Tigers 2026',
    date: '2026-03-15',
    location: 'Leicester Sports Arena',
    description: 'PowerHouseGames event at Leicester Sports Arena',
    status: 'completed',
    airtableRecordId: 'recLEICESTER2026',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'evt_002',
    name: 'Manchester 2026',
    date: '2026-06-20',
    location: 'Manchester Arena',
    description: 'PowerHouseGames event at Manchester Arena',
    status: 'active',
    airtableRecordId: 'recMANCHESTER2026',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
];

const MOCK_ORGANIZATIONS: Organization[] = [
  // Leicester Event Organizations
  {
    id: 'org_lei_000',
    eventId: 'evt_001',
    name: 'Family Group',
    groupType: 'Family',
    imageUrl: '/logos/family-group.png',
    contactFirstName: undefined,
    contactLastName: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    notes: 'For individual families attending together',
    airtableRecordId: 'recLEI_ORG000',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_001',
    eventId: 'evt_001',
    name: 'Next PLC',
    groupType: 'Corporate',
    imageUrl: '/logos/next-plc.png',
    contactFirstName: 'Rachel',
    contactLastName: 'Thompson',
    contactEmail: 'rachel.thompson@next.co.uk',
    contactPhone: '+44 116 284 5000',
    notes: 'Corporate sponsor and participant',
    airtableRecordId: 'recLEI_ORG001',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_002',
    eventId: 'evt_001',
    name: 'Leicester Tigers',
    groupType: 'Sporting',
    imageUrl: '/logos/leicester-tigers.png',
    contactFirstName: 'Tom',
    contactLastName: 'Harrison',
    contactEmail: 'tom.harrison@leicestertigers.com',
    contactPhone: '+44 116 217 1880',
    notes: 'Rugby club community engagement',
    airtableRecordId: 'recLEI_ORG002',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_003',
    eventId: 'evt_001',
    name: 'De Montfort University',
    groupType: 'Educational',
    imageUrl: '/logos/dmu.png',
    contactFirstName: 'Dr. Sarah',
    contactLastName: 'Mitchell',
    contactEmail: 'sarah.mitchell@dmu.ac.uk',
    contactPhone: '+44 116 250 6070',
    notes: 'University sports science department',
    airtableRecordId: 'recLEI_ORG003',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_004',
    eventId: 'evt_001',
    name: 'Glenfield SEN School',
    groupType: 'Disability',
    imageUrl: '/logos/glenfield-sen.png',
    contactFirstName: 'Helen',
    contactLastName: 'Davies',
    contactEmail: 'helen.davies@glenfield-sen.sch.uk',
    contactPhone: '+44 116 287 6555',
    notes: 'Special educational needs school',
    airtableRecordId: 'recLEI_ORG004',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  // Manchester Event Organizations
  {
    id: 'org_man_000',
    eventId: 'evt_002',
    name: 'Family Group',
    groupType: 'Family',
    imageUrl: '/logos/family-group.png',
    contactFirstName: undefined,
    contactLastName: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    notes: 'For individual families attending together',
    airtableRecordId: 'recMAN_ORG000',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_001',
    eventId: 'evt_002',
    name: 'Deloitte',
    groupType: 'Corporate',
    imageUrl: '/logos/deloitte.png',
    contactFirstName: 'Amanda',
    contactLastName: 'Roberts',
    contactEmail: 'amanda.roberts@deloitte.co.uk',
    contactPhone: '+44 161 455 8787',
    notes: 'Corporate sponsor and participant',
    airtableRecordId: 'recMAN_ORG001',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_002',
    eventId: 'evt_002',
    name: 'Siemens',
    groupType: 'Corporate',
    imageUrl: '/logos/siemens.png',
    contactFirstName: 'Mark',
    contactLastName: 'Anderson',
    contactEmail: 'mark.anderson@siemens.com',
    contactPhone: '+44 161 446 6400',
    notes: 'Engineering company community program',
    airtableRecordId: 'recMAN_ORG002',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_003',
    eventId: 'evt_002',
    name: 'Sale Sharks',
    groupType: 'Sporting',
    imageUrl: '/logos/sale-sharks.png',
    contactFirstName: 'Chris',
    contactLastName: 'Murphy',
    contactEmail: 'chris.murphy@salesharks.com',
    contactPhone: '+44 161 286 8888',
    notes: 'Rugby club community engagement',
    airtableRecordId: 'recMAN_ORG003',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_004',
    eventId: 'evt_002',
    name: 'University of Manchester',
    groupType: 'Educational',
    imageUrl: '/logos/uni-manchester.png',
    contactFirstName: 'Prof. Lisa',
    contactLastName: 'Chen',
    contactEmail: 'lisa.chen@manchester.ac.uk',
    contactPhone: '+44 161 306 6000',
    notes: 'University sports and health department',
    airtableRecordId: 'recMAN_ORG004',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_005',
    eventId: 'evt_002',
    name: 'Hazel Grove Special School',
    groupType: 'Disability',
    imageUrl: '/logos/hazel-grove.png',
    contactFirstName: 'Karen',
    contactLastName: 'Williams',
    contactEmail: 'karen.williams@hazelgrove-sen.sch.uk',
    contactPhone: '+44 161 483 3622',
    notes: 'Special educational needs school',
    airtableRecordId: 'recMAN_ORG005',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
];

const MOCK_VOLUNTEERS: Volunteer[] = [
  // Leicester Event Volunteers
  {
    id: 'vol_lei_001',
    eventId: 'evt_001',
    email: 'sarah.jones@leicester.ac.uk',
    firstName: 'Sarah',
    lastName: 'Jones',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
    airtableRecordId: 'recLEI_VOL001',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vol_lei_002',
    eventId: 'evt_001',
    email: 'mike.patel@tigers.com',
    firstName: 'Mike',
    lastName: 'Patel',
    photoConsent: false,
    feedbackConsent: true,
    nextEventConsent: false,
    airtableRecordId: 'recLEI_VOL002',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vol_lei_003',
    eventId: 'evt_001',
    email: 'emma.wilson@dmu.ac.uk',
    firstName: 'Emma',
    lastName: 'Wilson',
    photoConsent: true,
    feedbackConsent: false,
    nextEventConsent: true,
    airtableRecordId: 'recLEI_VOL003',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  // Manchester Event Volunteers
  {
    id: 'vol_man_001',
    eventId: 'evt_002',
    email: 'james.brown@manchester.ac.uk',
    firstName: 'James',
    lastName: 'Brown',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
    airtableRecordId: 'recMAN_VOL001',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'vol_man_002',
    eventId: 'evt_002',
    email: 'lucy.taylor@mufc.com',
    firstName: 'Lucy',
    lastName: 'Taylor',
    photoConsent: false,
    feedbackConsent: false,
    nextEventConsent: true,
    airtableRecordId: 'recMAN_VOL002',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'vol_man_003',
    eventId: 'evt_002',
    email: 'david.khan@mcfc.com',
    firstName: 'David',
    lastName: 'Khan',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: false,
    airtableRecordId: 'recMAN_VOL003',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
];

/**
 * Main seed function
 */
async function seedDatabase() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Step 1: Clear existing data (in reverse order of dependencies)
    console.log('🗑️  Clearing existing data...');
    await db.delete(volunteers);
    await db.delete(organizations);
    await db.delete(events);
    console.log('✅ Existing data cleared\n');

    // Step 2: Insert Events
    console.log('📅 Inserting events...');
    const insertedEvents: Record<string, string> = {}; // Map old ID to new UUID
    for (const event of MOCK_EVENTS) {
      const result = await db.insert(events).values({
        name: event.name,
        date: event.date,
        location: event.location || null,
        description: event.description || null,
        status: event.status,
        airtableRecordId: event.airtableRecordId || null,
        createdAt: event.createdAt ? new Date(event.createdAt) : new Date(),
        modifiedAt: event.modifiedAt ? new Date(event.modifiedAt) : new Date(),
      }).returning({ id: events.id });
      insertedEvents[event.id] = result[0].id;
      console.log(`  ✓ ${event.name} (${event.status})`);
    }
    console.log(`✅ Inserted ${MOCK_EVENTS.length} events\n`);

    // Step 3: Insert Organizations
    console.log('🏢 Inserting organizations...');
    for (const org of MOCK_ORGANIZATIONS) {
      const newEventId = insertedEvents[org.eventId];
      await db.insert(organizations).values({
        eventId: newEventId,
        name: org.name,
        groupType: org.groupType || null,
        imageUrl: org.imageUrl || null,
        contactFirstName: org.contactFirstName || null,
        contactLastName: org.contactLastName || null,
        contactEmail: org.contactEmail || null,
        contactPhone: org.contactPhone || null,
        notes: org.notes || null,
        airtableRecordId: org.airtableRecordId || null,
        createdAt: org.createdAt ? new Date(org.createdAt) : new Date(),
        modifiedAt: org.modifiedAt ? new Date(org.modifiedAt) : new Date(),
      });
      const eventName = MOCK_EVENTS.find(e => e.id === org.eventId)?.name || org.eventId;
      console.log(`  ✓ ${org.name} (${eventName})`);
    }
    console.log(`✅ Inserted ${MOCK_ORGANIZATIONS.length} organizations\n`);

    // Step 4: Insert Volunteers
    console.log('👥 Inserting volunteers...');
    for (const vol of MOCK_VOLUNTEERS) {
      const newEventId = insertedEvents[vol.eventId];
      await db.insert(volunteers).values({
        eventId: newEventId,
        email: vol.email,
        firstName: vol.firstName,
        lastName: vol.lastName,
        photoConsent: vol.photoConsent,
        feedbackConsent: vol.feedbackConsent,
        nextEventConsent: vol.nextEventConsent,
        airtableRecordId: vol.airtableRecordId || null,
        createdAt: vol.createdAt ? new Date(vol.createdAt) : new Date(),
        modifiedAt: vol.modifiedAt ? new Date(vol.modifiedAt) : new Date(),
      });
      const eventName = MOCK_EVENTS.find(e => e.id === vol.eventId)?.name || vol.eventId;
      console.log(`  ✓ ${vol.firstName} ${vol.lastName} (${eventName})`);
    }
    console.log(`✅ Inserted ${MOCK_VOLUNTEERS.length} volunteers\n`);

    // Summary
    console.log('🎉 Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  • ${MOCK_EVENTS.length} events`);
    console.log(`  • ${MOCK_ORGANIZATIONS.length} organizations`);
    console.log(`  • ${MOCK_VOLUNTEERS.length} volunteers`);
    console.log('\n✅ Your Neon database is now populated with mock data!\n');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
