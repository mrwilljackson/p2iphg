-- Phase 2 of schema-uuid-fk-fix sprint.
-- Populates the new UUID FKs on organisation_contacts from the existing
-- text-keyed Airtable references.
--
-- Pre-state (verified): 36 rows. All rows map cleanly via airtable
-- references. 14 rows already have organisation_uuid (no mismatches),
-- the remaining 22 need backfilling. No row has event_id yet.

UPDATE organisation_contacts AS oc
   SET event_id = e.id
  FROM events AS e
 WHERE oc.airtable_event_id = e.airtable_record_id
   AND oc.event_id IS NULL;

UPDATE organisation_contacts AS oc
   SET organisation_uuid = o.id
  FROM organisations AS o
 WHERE oc.organisation_id = o.airtable_record_id
   AND oc.organisation_uuid IS NULL;
