import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log(`DATABASE_URL host: ${new URL(process.env.DATABASE_URL!).host}\n`);

  const queries: { label: string; q: string }[] = [
    { label: 'organisation_contacts total', q: 'SELECT COUNT(*)::int AS n FROM organisation_contacts' },
    { label: 'organisation_contacts with uuid_id', q: 'SELECT COUNT(*)::int AS n FROM organisation_contacts WHERE uuid_id IS NOT NULL' },
    { label: 'organisation_contacts with organisation_uuid', q: 'SELECT COUNT(*)::int AS n FROM organisation_contacts WHERE organisation_uuid IS NOT NULL' },
    { label: 'organisation_contacts with airtable_event_id', q: 'SELECT COUNT(*)::int AS n FROM organisation_contacts WHERE airtable_event_id IS NOT NULL' },
    { label: 'organisations total', q: 'SELECT COUNT(*)::int AS n FROM organisations' },
    { label: 'organisations with event_id', q: 'SELECT COUNT(*)::int AS n FROM organisations WHERE event_id IS NOT NULL' },
    { label: 'registrations total', q: 'SELECT COUNT(*)::int AS n FROM registrations' },
    { label: 'registrations with NULL organization_id', q: 'SELECT COUNT(*)::int AS n FROM registrations WHERE organization_id IS NULL' },
    {
      label: 'registrations orphan organization_id',
      q: 'SELECT COUNT(*)::int AS n FROM registrations r WHERE r.organization_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM organisations o WHERE o.id = r.organization_id)',
    },
    {
      label: 'oc rows where airtable_event_id maps to an existing event',
      q: `SELECT COUNT(*)::int AS n FROM organisation_contacts oc WHERE oc.airtable_event_id IS NOT NULL AND EXISTS (SELECT 1 FROM events e WHERE e.airtable_record_id = oc.airtable_event_id)`,
    },
    {
      label: 'oc rows where organisation_id maps to an existing org via airtable_record_id',
      q: `SELECT COUNT(*)::int AS n FROM organisation_contacts oc WHERE oc.organisation_id IS NOT NULL AND EXISTS (SELECT 1 FROM organisations o WHERE o.airtable_record_id = oc.organisation_id)`,
    },
    {
      label: 'oc.organisation_uuid mismatches the org via airtable_record_id',
      q: `SELECT COUNT(*)::int AS n FROM organisation_contacts oc JOIN organisations o ON o.airtable_record_id = oc.organisation_id WHERE oc.organisation_uuid IS NOT NULL AND oc.organisation_uuid <> o.id`,
    },
  ];

  for (const { label, q } of queries) {
    const rows = (await sql.query(q)) as Array<{ n: number }>;
    const n = rows[0]?.n ?? '?';
    console.log(`${label}: ${n}`);
  }
}

main().catch((e) => {
  console.error('Failed:', e);
  process.exit(1);
});
