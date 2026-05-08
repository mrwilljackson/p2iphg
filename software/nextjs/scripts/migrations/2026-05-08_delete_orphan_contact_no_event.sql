-- Pre-cleanup for schema-uuid-fk-fix sprint.
-- Removes a single organisation_contacts row with no airtable_event_id
-- (id=40, "PEM"/"Pemone Penonesurname"). It was created via the manual
-- contact-picker flow during dev/testing and has no event association.
-- Phase 3 will enforce NOT NULL on the new event_id column, so this row
-- must go before then.
DELETE FROM organisation_contacts WHERE id = 40 AND airtable_event_id IS NULL;
