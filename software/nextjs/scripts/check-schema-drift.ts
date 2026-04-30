/**
 * Schema drift check — compares lib/db/schema.ts against the live
 * Postgres `information_schema.columns` and reports any divergence.
 *
 * Usage:
 *   npx tsx scripts/check-schema-drift.ts
 *
 * Exit codes:
 *   0 — schema.ts matches live DB exactly (per-table, per-column)
 *   1 — drift detected, or DATABASE_URL missing / connection failed
 *
 * Designed to be safe to wire into a predeploy step or CI job: it is
 * read-only and performs no schema or data writes.
 *
 * What it checks:
 *   - For each table exported from lib/db/schema.ts, every column
 *     declared in schema.ts exists on the live DB with a compatible
 *     SQL type.
 *   - Any column on the live table that is NOT declared in schema.ts
 *     is reported as an "extra".
 *   - Type comparison is performed on a normalised SQL type string
 *     (e.g. `timestamp without time zone` ↔ `timestamp`,
 *     `character varying` ↔ `varchar`).
 *
 * What it does NOT check (intentional):
 *   - Constraints (PK, FK, unique, not null) — drizzle-kit handles
 *     these well enough; the column-level mismatch is the failure
 *     mode that bit us in the 28 April incident.
 *   - Default values.
 *   - Indexes.
 *   - Tables that exist in the live DB but are not exported from
 *     schema.ts.
 */
import { neon } from '@neondatabase/serverless';
import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

import * as schema from '../lib/db/schema';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

type LiveColumn = { column_name: string; data_type: string };

function normaliseSqlType(t: string): string {
  return t
    .toLowerCase()
    .replace(/^timestamp(\s+without\s+time\s+zone)?$/, 'timestamp')
    .replace(/^timestamp\s+with\s+time\s+zone$/, 'timestamptz')
    .replace(/^character\s+varying.*$/, 'varchar')
    .replace(/^character\s*\(.*\)$/, 'char')
    .replace(/^double\s+precision$/, 'double precision')
    .trim();
}

async function main() {
  const tables = Object.entries(schema)
    .filter((entry): entry is [string, PgTable] =>
      entry[1] !== null &&
      typeof entry[1] === 'object' &&
      Symbol.for('drizzle:IsDrizzleTable') in entry[1],
    );

  console.log(`Checking ${tables.length} table(s) from lib/db/schema.ts against ${new URL(process.env.DATABASE_URL!).host}\n`);

  const issues: string[] = [];

  for (const [exportName, table] of tables) {
    const config = getTableConfig(table);
    const expected = new Map<string, string>();
    for (const col of config.columns) {
      expected.set(col.name, normaliseSqlType(col.getSQLType()));
    }

    const live = (await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${config.name}
      ORDER BY ordinal_position;
    `) as LiveColumn[];
    const liveMap = new Map<string, string>();
    for (const c of live) liveMap.set(c.column_name, normaliseSqlType(c.data_type));

    if (live.length === 0) {
      issues.push(`[${config.name}] table missing from live DB (export: ${exportName})`);
      console.log(`✗ ${config.name} (export ${exportName}): MISSING from live DB`);
      continue;
    }

    const tableIssues: string[] = [];

    for (const [name, expectedType] of expected) {
      const liveType = liveMap.get(name);
      if (liveType === undefined) {
        tableIssues.push(`  - column "${name}" declared in schema.ts but missing from live DB`);
      } else if (liveType !== expectedType) {
        tableIssues.push(`  - column "${name}" type mismatch: schema.ts="${expectedType}" live="${liveType}"`);
      }
    }

    for (const name of liveMap.keys()) {
      if (!expected.has(name)) {
        tableIssues.push(`  - column "${name}" present on live DB but not declared in schema.ts`);
      }
    }

    if (tableIssues.length === 0) {
      console.log(`✓ ${config.name} (${expected.size} columns)`);
    } else {
      console.log(`✗ ${config.name}`);
      for (const t of tableIssues) console.log(t);
      issues.push(...tableIssues.map(t => `[${config.name}]${t}`));
    }
  }

  console.log();
  if (issues.length === 0) {
    console.log('Schema drift check: PASS — schema.ts matches live DB.');
    process.exit(0);
  } else {
    console.log(`Schema drift check: FAIL — ${issues.length} issue(s) detected.`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Drift check failed:', e);
  process.exit(1);
});
