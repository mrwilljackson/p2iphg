import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });
const sql = neon(process.env.DATABASE_URL!);

(async () => {
  for (const t of ['events', 'organisations', 'organisation_contacts', 'volunteers', 'registrations', 'event_summaries']) {
    const rows = await sql.query(`SELECT COUNT(*)::int AS n FROM ${t}`) as Array<{ n: number }>;
    console.log(`${t}: ${rows[0].n}`);
  }
})();
