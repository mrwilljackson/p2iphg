-- Drop legacy columns from the `registrations` table that are not
-- declared in lib/db/schema.ts and are not referenced anywhere in
-- the application code.
--
-- Both columns existed on the live database as orphans — predecessors
-- of the active `organisation_name` column on the same table. They
-- are dead bytes and dropping them resolves the schema-vs-live drift
-- on `registrations` confirmed by scripts/inspect-live-schema.ts.
--
-- Background: documented in
-- software/nextjs/documentation/INCIDENT_2026-04-28_REGISTRATION_FAILURE.md
-- (under "What's still owed").

ALTER TABLE registrations DROP COLUMN IF EXISTS organisation_contact_id;
ALTER TABLE registrations DROP COLUMN IF EXISTS "Organisation";
