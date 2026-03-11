import { db } from '../lib/db/client';
import { events, registrations } from '../lib/db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  const evts = await db.select().from(events);
  console.log('=== EVENTS ===');
  evts.forEach(r => console.log(JSON.stringify({ id: r.id, name: r.name, status: r.status, airtableRecordId: r.airtableRecordId })));

  const regs = await db.select({ syncStatus: registrations.syncStatus, count: sql`count(*)` }).from(registrations).groupBy(registrations.syncStatus);
  console.log('=== REGISTRATION SYNC STATUS COUNTS ===');
  regs.forEach(r => console.log(JSON.stringify(r)));

  process.exit(0);
}

main();

