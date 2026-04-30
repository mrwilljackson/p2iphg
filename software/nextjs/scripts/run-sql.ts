/**
 * One-shot SQL runner.
 *
 * Reads a SQL file path from argv and executes its contents against the
 * configured Neon database. Splits on `;` so multi-statement files work,
 * but does not parse SQL — keep statements simple (one per logical line)
 * and don't embed unescaped semicolons in literals.
 *
 * Usage: npx tsx scripts/run-sql.ts <relative-path-to-sql>
 *
 * Example:
 *   npx tsx scripts/run-sql.ts drizzle/0010_drop_legacy_registrations_columns.sql
 */
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx tsx scripts/run-sql.ts <path-to-sql-file>');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const fullPath = resolve(process.cwd(), filePath);
  const content = readFileSync(fullPath, 'utf8');

  const statements = content
    .split(';')
    .map(s => s.replace(/--.*$/gm, '').trim())
    .filter(s => s.length > 0);

  console.log(`DATABASE_URL host: ${new URL(process.env.DATABASE_URL!).host}`);
  console.log(`Executing ${statements.length} statement(s) from ${filePath}\n`);

  for (const [i, stmt] of statements.entries()) {
    console.log(`[${i + 1}/${statements.length}] ${stmt}`);
    await sql.query(stmt);
    console.log(`  ✓ ok\n`);
  }

  console.log('All statements completed successfully.');
}

main().catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});
