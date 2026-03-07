/**
 * Database Seed Script V2
 *
 * Populates the Neon PostgreSQL database with sample data for testing
 * Updated to work with current schema (groupType, planned/active/completed status, expectedGroupSize)
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

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create database connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// Destructure schema tables
const { events, organisations: organizations, volunteers, registrations } = schema;

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Step 1: Clear existing data
    console.log('🗑️  Clearing existing data...');
    await db.delete(registrations);
    await db.delete(volunteers);
    await db.delete(organizations);
    await db.delete(events);
    console.log('✅ Existing data cleared');

    // Step 2: Insert Events
    console.log('📅 Inserting events...');
    const eventResults = await db.insert(events).values([
      {
        name: 'Leicester Tigers 2025',
        date: '2025-03-15',
        location: 'Leicester Sports Arena',
        description: 'PowerHouseGames event at Leicester Sports Arena',
        status: 'completed',
        airtableRecordId: 'recLEICESTER2025',
      },
      {
        name: 'Manchester Arena 2026',
        date: '2026-06-20',
        location: 'Manchester Arena',
        description: 'PowerHouseGames event at Manchester Arena',
        status: 'active',
        airtableRecordId: 'recMANCHESTER2026',
      },
      {
        name: 'Cambridge University 2026',
        date: '2026-09-15',
        location: 'Cambridge University Sports Centre',
        description: 'PowerHouseGames event at Cambridge University',
        status: 'planned',
        airtableRecordId: 'recCAMBRIDGE2026',
      },
    ]).returning();
    console.log(`✅ Inserted ${eventResults.length} events`);

    const leicesterEvent = eventResults[0];
    const manchesterEvent = eventResults[1];
    const cambridgeEvent = eventResults[2];

    // Step 3: Insert Organizations
    console.log('🏢 Inserting organizations...');
    const orgResults = await db.insert(organizations).values([
      // Leicester Event Organizations (completed event)
      {
        eventId: leicesterEvent.id,
        name: 'Family Group',
        groupType: 'Family',
        contactFirstName: undefined,
        contactLastName: undefined,
        contactEmail: undefined,
        contactPhone: undefined,
        notes: 'For individual families attending together',
        airtableRecordId: 'recLEI_FAM',
      },
      {
        eventId: leicesterEvent.id,
        name: 'Next PLC',
        groupType: 'Corporate',
        contactFirstName: 'Rachel',
        contactLastName: 'Thompson',
        contactEmail: 'rachel.thompson@next.co.uk',
        contactPhone: '+44 116 284 5000',
        notes: 'Corporate sponsor and participant',
        airtableRecordId: 'recLEI_NEXT',
      },
      {
        eventId: leicesterEvent.id,
        name: 'Leicester Tigers',
        groupType: 'Sporting',
        contactFirstName: 'Tom',
        contactLastName: 'Harrison',
        contactEmail: 'tom.harrison@leicestertigers.com',
        contactPhone: '+44 116 319 8888',
        notes: 'Local rugby club',
        airtableRecordId: 'recLEI_TIGERS',
      },
      {
        eventId: leicesterEvent.id,
        name: 'Disability Sports Leicester',
        groupType: 'Disability',
        contactFirstName: 'Sarah',
        contactLastName: 'Williams',
        contactEmail: 'sarah@disabilitysportsleicester.org',
        contactPhone: '+44 116 222 3333',
        notes: 'Disability sports organization',
        airtableRecordId: 'recLEI_DSL',
      },

      // Manchester Event Organizations (active event)
      {
        eventId: manchesterEvent.id,
        name: 'Family Group',
        groupType: 'Family',
        notes: 'For individual families attending together',
        airtableRecordId: 'recMAN_FAM',
      },
      {
        eventId: manchesterEvent.id,
        name: 'Manchester United Foundation',
        groupType: 'Sporting',
        contactFirstName: 'David',
        contactLastName: 'Brown',
        contactEmail: 'david.brown@mufoundation.org',
        contactPhone: '+44 161 868 8000',
        notes: 'Football club foundation',
        airtableRecordId: 'recMAN_MUFC',
      },
      {
        eventId: manchesterEvent.id,
        name: 'Salford City Council',
        groupType: 'Community',
        contactFirstName: 'Emma',
        contactLastName: 'Davies',
        contactEmail: 'emma.davies@salford.gov.uk',
        contactPhone: '+44 161 794 4711',
        notes: 'Local council community program',
        airtableRecordId: 'recMAN_SALFORD',
      },

      // Cambridge Event Organizations (planned event with expectedGroupSize)
      {
        eventId: cambridgeEvent.id,
        name: 'Family Group',
        groupType: 'Family',
        notes: 'For individual families attending together',
        airtableRecordId: 'recCAM_FAM',
      },
      {
        eventId: cambridgeEvent.id,
        name: 'Cambridge University Boat Club',
        groupType: 'Sporting',
        expectedGroupSize: 25,
        contactFirstName: 'James',
        contactLastName: 'Mitchell',
        contactEmail: 'james.mitchell@cubc.org.uk',
        contactPhone: '+44 1223 338400',
        notes: 'University rowing club',
        airtableRecordId: 'recCAM_CUBC',
      },
      {
        eventId: cambridgeEvent.id,
        name: 'Cambridgeshire Disability Sports',
        groupType: 'Disability',
        expectedGroupSize: 15,
        contactFirstName: 'Lucy',
        contactLastName: 'Anderson',
        contactEmail: 'lucy@cambsdisabilitysports.org',
        contactPhone: '+44 1223 456789',
        notes: 'Disability sports organization',
        airtableRecordId: 'recCAM_CDS',
      },
      {
        eventId: cambridgeEvent.id,
        name: 'ARM Holdings',
        groupType: 'Corporate',
        expectedGroupSize: 30,
        contactFirstName: 'Michael',
        contactLastName: 'Chen',
        contactEmail: 'michael.chen@arm.com',
        contactPhone: '+44 1223 400400',
        notes: 'Technology company',
        airtableRecordId: 'recCAM_ARM',
      },
    ]).returning();
    console.log(`✅ Inserted ${orgResults.length} organizations`);

    // Step 4: Insert Volunteers
    console.log('👥 Inserting volunteers...');
    const volResults = await db.insert(volunteers).values([
      // Leicester Event Volunteers
      {
        eventId: leicesterEvent.id,
        email: 'john.smith@volunteer.com',
        firstName: 'John',
        lastName: 'Smith',
        photoConsent: true,
        feedbackConsent: true,
        nextEventConsent: true,
        airtableRecordId: 'recVOL_JOHN',
      },
      {
        eventId: leicesterEvent.id,
        email: 'jane.doe@volunteer.com',
        firstName: 'Jane',
        lastName: 'Doe',
        photoConsent: true,
        feedbackConsent: true,
        nextEventConsent: false,
        airtableRecordId: 'recVOL_JANE',
      },

      // Manchester Event Volunteers
      {
        eventId: manchesterEvent.id,
        email: 'mike.wilson@volunteer.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        photoConsent: true,
        feedbackConsent: true,
        nextEventConsent: true,
        airtableRecordId: 'recVOL_MIKE',
      },
      {
        eventId: manchesterEvent.id,
        email: 'sarah.jones@volunteer.com',
        firstName: 'Sarah',
        lastName: 'Jones',
        photoConsent: false,
        feedbackConsent: true,
        nextEventConsent: true,
        airtableRecordId: 'recVOL_SARAH',
      },

      // Cambridge Event Volunteers
      {
        eventId: cambridgeEvent.id,
        email: 'alex.taylor@volunteer.com',
        firstName: 'Alex',
        lastName: 'Taylor',
        photoConsent: true,
        feedbackConsent: true,
        nextEventConsent: true,
        airtableRecordId: 'recVOL_ALEX',
      },
    ]).returning();
    console.log(`✅ Inserted ${volResults.length} volunteers`);

    console.log('');
    console.log('🎉 Database seeding completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log(`  - ${eventResults.length} events`);
    console.log(`  - ${orgResults.length} organizations`);
    console.log(`  - ${volResults.length} volunteers`);
    console.log('');
    console.log('Events:');
    console.log(`  - Leicester Tigers 2025 (completed)`);
    console.log(`  - Manchester Arena 2026 (active)`);
    console.log(`  - Cambridge University 2026 (planned with expectedGroupSize)`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });

