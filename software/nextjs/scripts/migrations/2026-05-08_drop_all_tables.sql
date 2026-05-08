-- Wipe-and-rebuild for schema-uuid-fk-fix sprint.
-- Drops all six application tables with CASCADE so the next db:push
-- creates them fresh from the corrected schema.ts. Confirmed scope at
-- the time of running: 6 events, 22 organisations, 36 contacts,
-- 25 volunteers, 55 registrations, 0 event_summaries. Snapshot taken
-- before this commit.
DROP TABLE IF EXISTS event_summaries CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS organisation_contacts CASCADE;
DROP TABLE IF EXISTS volunteers CASCADE;
DROP TABLE IF EXISTS organisations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
