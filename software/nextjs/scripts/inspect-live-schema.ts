import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('DATABASE_URL host:', new URL(process.env.DATABASE_URL!).host);

  for (const table of ['registrations', 'organisations', 'organisation_contacts', 'events', 'volunteers']) {
    const cols = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position;
    `;
    console.log(`\n${table} columns:`);
    for (const c of cols as any[]) console.log(` - ${c.column_name} (${c.data_type})`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
