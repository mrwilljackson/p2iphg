import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });
const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const tables = ['organisation_contacts', 'organisations', 'registrations'];
  for (const t of tables) {
    console.log(`\n--- ${t} ---`);
    const fks = await sql.query(
      `SELECT
         tc.constraint_name,
         kcu.column_name,
         ccu.table_name AS references_table,
         ccu.column_name AS references_column,
         rc.delete_rule
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
       JOIN information_schema.referential_constraints AS rc
         ON rc.constraint_name = tc.constraint_name
       WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'`,
      [t],
    );
    console.log('FKs:', JSON.stringify(fks, null, 2));

    const nulls = await sql.query(
      `SELECT column_name, is_nullable
         FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position`,
      [t],
    );
    console.log('NULLability:', JSON.stringify(nulls, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
