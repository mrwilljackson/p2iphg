import { db } from '../lib/db/client';
import { registrations } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  // Reset all failed registrations to pending
  const result = await db.update(registrations).set({ syncStatus: 'pending' }).where(eq(registrations.syncStatus, 'failed'));
  console.log('Reset result:', result.rowCount, 'rows updated to pending');

  // Mark the test record (Louise Harvy) as synced since we already pushed it
  await db.update(registrations).set({ syncStatus: 'synced', airtableRecordId: 'rec9pyY7BgMcUMUSd' }).where(eq(registrations.id, 'd4fe19eb-15c9-420a-b587-7d30863249f0'));
  console.log('Marked test record as synced');

  process.exit(0);
}

main();

