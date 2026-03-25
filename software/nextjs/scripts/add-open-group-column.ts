/**
 * Migration: Add open_group column to organisations table
 *
 * Adds the openGroup boolean field (default true) to the organisations table.
 * All existing records default to true (open).
 *
 * Usage:
 *   npx tsx scripts/add-open-group-column.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Adding open_group column to organisations table...');

  await sql`
    ALTER TABLE organisations
    ADD COLUMN IF NOT EXISTS open_group boolean NOT NULL DEFAULT true
  `;

  console.log('Done. All existing organisations default to open_group = true.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
