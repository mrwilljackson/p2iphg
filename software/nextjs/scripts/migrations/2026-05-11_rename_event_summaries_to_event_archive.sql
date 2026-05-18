-- Event archive sprint, 2026-05-11.
-- Rename event_summaries -> event_archive, extend with the new headline
-- count columns, drop the JSON org_breakdown and admin_notes, add a
-- source_purged_at timestamp, and create the child event_archive_org_lines
-- table that holds one row per (archive, organisation).
--
-- Existing event_summaries data (if any) will lose the org_breakdown JSON
-- and the admin_notes free text. After the schema-rebuild sprint (PR #7,
-- 2026-05-08) the dev DB started clean; if any rows are present this
-- migration will fill source_purged_at from created_at as a best-available
-- proxy and the org_breakdown loss is accepted.

BEGIN;

-- 1. Rename the table.
ALTER TABLE event_summaries RENAME TO event_archive;

-- 2. Drop the columns we no longer keep.
ALTER TABLE event_archive DROP COLUMN org_breakdown;
ALTER TABLE event_archive DROP COLUMN admin_notes;

-- 3. Add the new scalar columns. Defaults make the ADD COLUMN safe for any
--    pre-existing rows (which will get 0s and current-timestamp).
ALTER TABLE event_archive
  ADD COLUMN companies_count integer NOT NULL DEFAULT 0,
  ADD COLUMN impaired_participant_count integer NOT NULL DEFAULT 0,
  ADD COLUMN non_impaired_participant_count integer NOT NULL DEFAULT 0;

-- 4. Add source_purged_at. Start nullable so we can backfill pre-existing
--    rows (if any), then enforce NOT NULL.
ALTER TABLE event_archive ADD COLUMN source_purged_at timestamp;

UPDATE event_archive
  SET source_purged_at = created_at
  WHERE source_purged_at IS NULL;

ALTER TABLE event_archive ALTER COLUMN source_purged_at SET NOT NULL;

-- 5. Create the child table.
CREATE TABLE event_archive_org_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  archive_id uuid NOT NULL
    REFERENCES event_archive(id) ON DELETE CASCADE,

  organisation_id uuid NOT NULL
    REFERENCES organisations(id) ON DELETE RESTRICT,

  org_name_snapshot text NOT NULL,
  org_airtable_record_id text,
  contact_airtable_record_id text,

  actual_headcount integer NOT NULL DEFAULT 0,
  impaired_count integer NOT NULL DEFAULT 0,
  non_impaired_count integer NOT NULL DEFAULT 0,

  created_at timestamp DEFAULT now()
);

CREATE INDEX event_archive_org_lines_archive_id_idx
  ON event_archive_org_lines (archive_id);

CREATE INDEX event_archive_org_lines_organisation_id_idx
  ON event_archive_org_lines (organisation_id);

COMMIT;
