import { db } from '../lib/db/client.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('🚀 Running migration: Add groupType enum field\n');

  try {
    // Step 1: Add new groupType column with default 'Other'
    console.log('Step 1: Adding group_type column...');
    await db.execute(sql`
      ALTER TABLE "organizations" ADD COLUMN "group_type" text DEFAULT 'Other'
    `);
    console.log('✅ Column added\n');

    // Step 2: Migrate existing data
    console.log('Step 2: Migrating existing data...');
    await db.execute(sql`
      UPDATE "organizations"
      SET "group_type" = CASE
        WHEN "is_disability_group" = true THEN 'Disability'
        WHEN "is_corporate_group" = true THEN 'Corporate'
        WHEN "name" ILIKE '%family group%' THEN 'Family'
        ELSE 'Other'
      END
    `);
    console.log('✅ Data migrated\n');

    // Step 3: Drop old boolean columns
    console.log('Step 3: Dropping old boolean columns...');
    await db.execute(sql`
      ALTER TABLE "organizations" DROP COLUMN "is_disability_group"
    `);
    await db.execute(sql`
      ALTER TABLE "organizations" DROP COLUMN "is_corporate_group"
    `);
    console.log('✅ Old columns dropped\n');

    // Step 4: Add check constraint for valid enum values
    console.log('Step 4: Adding check constraint...');
    await db.execute(sql`
      ALTER TABLE "organizations" ADD CONSTRAINT "organizations_group_type_check"
      CHECK ("group_type" IN ('Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'))
    `);
    console.log('✅ Constraint added\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Verifying migration...\n');

    // Verify the migration worked
    const orgs = await db.execute(sql`
      SELECT name, group_type
      FROM organizations
      ORDER BY name
      LIMIT 10
    `);

    console.log('Sample organizations with new groupType field:');
    console.table(orgs.rows);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

