/**
 * Clear Database Script
 *
 * Removes all data from the Neon PostgreSQL database while keeping the table structure intact.
 * This script is useful for resetting the database to a clean state without losing the schema.
 *
 * Usage:
 *   npm run db:clear
 *
 * WARNING: This will DELETE all existing data in the database!
 * The database structure (tables, columns, constraints) will remain intact.
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
const { events, organizations, volunteers, registrations } = schema;

async function clearDatabase() {
  console.log('🗑️  Starting database clear...');
  console.log('');

  try {
    // Delete data in correct order (respecting foreign key constraints)
    // Child tables first, then parent tables
    
    console.log('Deleting registrations...');
    const deletedRegistrations = await db.delete(registrations);
    console.log('✅ Registrations deleted');

    console.log('Deleting volunteers...');
    const deletedVolunteers = await db.delete(volunteers);
    console.log('✅ Volunteers deleted');

    console.log('Deleting organizations...');
    const deletedOrganizations = await db.delete(organizations);
    console.log('✅ Organizations deleted');

    console.log('Deleting events...');
    const deletedEvents = await db.delete(events);
    console.log('✅ Events deleted');

    console.log('');
    console.log('🎉 Database cleared successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  - All data has been removed');
    console.log('  - Table structure remains intact');
    console.log('  - Database is ready for new data');
    console.log('');
    console.log('Note: PostgreSQL UUID primary keys do not auto-increment,');
    console.log('so there are no sequences to reset.');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

// Run the clear function
clearDatabase()
  .then(() => {
    console.log('✅ Clear script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Clear script failed:', error);
    process.exit(1);
  });

