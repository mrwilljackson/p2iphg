/**
 * Seed script: Individual Organisation
 *
 * Inserts a single "Individual" organisation record if one doesn't already exist.
 * This record uses groupType = 'Individual' as a system marker — it is always
 * included in every event's org list regardless of Airtable import.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npm run db:seed-individual
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seedIndividualOrg() {
  console.log('🌱 Seeding Individual org record...');

  const existing = await db
    .select()
    .from(schema.organisations)
    .where(and(
      eq(schema.organisations.groupType, 'Individual'),
      eq(schema.organisations.name, 'Individual'),
    ))
    .limit(1);

  if (existing.length > 0) {
    console.log('✅ Individual org already exists — skipping. ID:', existing[0].id);
    process.exit(0);
  }

  const [inserted] = await db
    .insert(schema.organisations)
    .values({
      name: 'Individual',
      groupType: 'Individual',
    })
    .returning();

  console.log('✅ Individual org created. ID:', inserted.id);
  process.exit(0);
}

seedIndividualOrg().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
