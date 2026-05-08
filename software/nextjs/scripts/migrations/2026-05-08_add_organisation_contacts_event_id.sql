-- Phase 1 of schema-uuid-fk-fix sprint.
-- Adds event_id (uuid, nullable) to organisation_contacts as a true FK to
-- events(id). Stays nullable here so backfill (Phase 2) can populate it
-- before NOT NULL is enforced (Phase 3).
ALTER TABLE organisation_contacts
  ADD COLUMN event_id uuid REFERENCES events(id) ON DELETE CASCADE;
