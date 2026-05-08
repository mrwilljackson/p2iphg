-- Phase 3 of schema-uuid-fk-fix sprint.
-- After backfill (Phase 2), every row has both event_id and
-- organisation_uuid populated and there are no mismatches against the
-- existing text-ref columns. This phase enforces those guarantees at the
-- database level.
--
-- 1. Add FK on organisation_uuid (was added as a plain uuid column in a
--    prior aborted attempt). ON DELETE RESTRICT because organisations
--    are global records reused across events and orphaning a contact
--    silently would mask a bug.
-- 2. Mark both new FK columns NOT NULL.

ALTER TABLE organisation_contacts
  ADD CONSTRAINT organisation_contacts_organisation_uuid_fkey
  FOREIGN KEY (organisation_uuid)
  REFERENCES organisations(id)
  ON DELETE RESTRICT;

ALTER TABLE organisation_contacts
  ALTER COLUMN event_id SET NOT NULL;

ALTER TABLE organisation_contacts
  ALTER COLUMN organisation_uuid SET NOT NULL;
