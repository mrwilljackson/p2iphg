# Event Archive — Design Spec

**Date:** 2026-05-11
**Branch:** `feature/archive`
**Status:** Awaiting user review

## 1. Background

The CRM has an existing `event_summaries` table populated by the "Generate Summary" flow on `/admin/p2i/manage-events`. That flow:

- Computes a small set of aggregate counts for a completed event.
- Sets `events.status = 'archived'`.
- **Leaves personally-identifying data intact** on `registrations`, `organisation_contacts`, and `volunteers`.

The original plan was to layer a separate "anonymise" sprint on top: a button on archived events that nulls PII columns. During brainstorming we reframed: `event_summaries` *is* the archive — there's no need for both. The cleaner model is a single atomic action that builds a richer archive and **purges source PII in the same transaction**.

This spec defines that reworked archive.

## 2. Scope

### In scope

- Rename `event_summaries` → `event_archive`. Extend it with the new headline counts the client cares about (companies, impairment split, source-purged-at timestamp). Drop fields we no longer need (`org_breakdown` JSON, `admin_notes`).
- New child table `event_archive_org_lines` — one row per (event, organisation) pairing — to support per-organisation history queries across events.
- New atomic server action `archiveEvent(eventId, sequenceNumber)` replacing today's `generateEventSummary`. In one transaction it: snapshots the archive header + child lines, **deletes** all rows for the event from `registrations`, `organisation_contacts`, and `volunteers`, and sets `events.status = 'archived'`.
- UI updates on `/admin/p2i/manage-events`: rename the "Generate Summary" action to "Archive event", drop the Notes textarea, replace the existing "View Summary" dialog with a "View Archive" dialog that surfaces the new fields. Strengthen the confirmation copy to make the irreversible PII deletion explicit.
- Code rename across `schema.ts`, `db-service.ts`, `actions.ts`, `types.ts`, and consuming UI files (`EventSummary*` → `EventArchive*`).

### Out of scope (explicit)

- **Frequent-flyer table.** A separate, opt-in PII store for repeat volunteers / organisation contacts who consent to P2I retaining their identity across events. This is a future sprint; it does not affect this design because the archive itself contains no individual PII. A later sprint can add a nullable `frequent_flyer_id` FK to `volunteers` and `organisation_contacts` without touching the archive schema.
- **CSV export of an archive.** Both Airtable record IDs are preserved on each org line to support a future CSV export feature; the export itself is a follow-up sprint.
- **Re-personalisation / undo of an archive.** Purge is final by design.
- **Pre-archive purge.** No way to wipe PII while the event is still `completed` (only `archived`).
- **Auto-archive on a schedule.** Archive is admin-triggered.

## 3. Schema changes

### 3.1 Rename and extend `event_summaries` → `event_archive`

Resulting columns (∆ = changed from existing):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | unchanged |
| `event_id` | `uuid NOT NULL UNIQUE FK → events.id` | unchanged |
| `event_name` | `text NOT NULL` | unchanged |
| `event_date` | `text NOT NULL` | unchanged |
| `event_location` | `text` | unchanged |
| `event_description` | `text` | unchanged |
| `event_airtable_record_id` | `text` | unchanged |
| `event_sequence_number` | `integer NOT NULL` | unchanged |
| `participant_count` | `integer NOT NULL DEFAULT 0` | **∆ semantics**: total people attending as participants (open-group registrants + closed-group members from `groupSize` + leaders who participated). Today's column counts only `role='Participant'` registration rows; that needs widening. See §6. |
| `volunteer_count` | `integer NOT NULL DEFAULT 0` | unchanged semantics: helpers attending the event |
| `group_count` | `integer NOT NULL DEFAULT 0` | unchanged: count of distinct group-leader registrations |
| `total_headcount` | `integer NOT NULL DEFAULT 0` | unchanged: `participant_count + volunteer_count` (group-leader count is not additive once participating leaders are folded into `participant_count`) |
| `companies_count` | `integer NOT NULL DEFAULT 0` | **∆ NEW**: distinct organisations attending |
| `impaired_participant_count` | `integer NOT NULL DEFAULT 0` | **∆ NEW** |
| `non_impaired_participant_count` | `integer NOT NULL DEFAULT 0` | **∆ NEW** |
| `photo_consent_count` | `integer NOT NULL DEFAULT 0` | unchanged |
| `feedback_consent_count` | `integer NOT NULL DEFAULT 0` | unchanged |
| `next_event_consent_count` | `integer NOT NULL DEFAULT 0` | unchanged |
| `source_purged_at` | `timestamp NOT NULL` | **∆ NEW**: set in the same transaction as row creation. Equal to `created_at` for atomic flow but distinguished semantically. |
| `created_at` | `timestamp DEFAULT now()` | unchanged |

Dropped from `event_summaries`:

- `org_breakdown` (text JSON) — replaced by child table.
- `admin_notes` (text) — no longer captured.

### 3.2 New table `event_archive_org_lines`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK` | |
| `archive_id` | `uuid NOT NULL FK → event_archive.id ON DELETE CASCADE` | Lines die with their archive |
| `organisation_id` | `uuid NOT NULL FK → organisations.id ON DELETE RESTRICT` | Joins forward for cross-event org history |
| `org_name_snapshot` | `text NOT NULL` | Frozen at archive time — robust to later org renames |
| `org_airtable_record_id` | `text` | Denormalised from `organisations.airtable_record_id` for CSV ergonomics |
| `contact_airtable_record_id` | `text` | Snapshotted from `organisation_contacts.airtable_record_id` **before** that row is deleted |
| `actual_headcount` | `integer NOT NULL DEFAULT 0` | People from this org attending — derived using `lib/participant-counting.ts` rules |
| `impaired_count` | `integer NOT NULL DEFAULT 0` | |
| `non_impaired_count` | `integer NOT NULL DEFAULT 0` | |
| `created_at` | `timestamp DEFAULT now()` | |

### 3.3 Migration

Drizzle migration (not `db:push`) — the rename must be a proper `ALTER TABLE ... RENAME` to preserve existing rows. Order of operations:

1. `ALTER TABLE event_summaries RENAME TO event_archive`
2. `ALTER TABLE event_archive DROP COLUMN org_breakdown`
3. `ALTER TABLE event_archive DROP COLUMN admin_notes`
4. `ALTER TABLE event_archive ADD COLUMN companies_count integer NOT NULL DEFAULT 0`
5. `ALTER TABLE event_archive ADD COLUMN impaired_participant_count integer NOT NULL DEFAULT 0`
6. `ALTER TABLE event_archive ADD COLUMN non_impaired_participant_count integer NOT NULL DEFAULT 0`
7. `ALTER TABLE event_archive ADD COLUMN source_purged_at timestamp` (nullable initially) — then for any existing rows, populate `source_purged_at = created_at` (best-available proxy), then `ALTER COLUMN source_purged_at SET NOT NULL`. If the dev DB has no existing `event_summaries` rows (which is likely post-PR #7 rebuild), this can be a straight `NOT NULL` add.
8. `CREATE TABLE event_archive_org_lines (...)` with the columns above.

The CI build-time schema drift check (PR #8) must pass after the migration is applied.

## 4. Archive flow

### 4.1 Server action

Replace `generateEventSummary` with `archiveEvent`:

```
archiveEvent(eventId: string, sequenceNumber: number): Promise<string>
  // returns the new archive row's id

  preconditions (checked before transaction):
    1. events row exists and events.status === 'completed'
    2. no existing event_archive row with this eventId
       (unique FK on event_archive.event_id enforces this; check explicitly for a cleaner error)
    3. sequenceNumber is positive integer (validated in caller; see §4.3)

  compute (read queries, before transaction):
    - Aggregate scalars for event_archive row using existing
      lib/participant-counting.ts rules where relevant
    - One pre-built org-line record per organisation_contact for the event,
      joined to its registrations
    - Pre-generate archive_id (uuidv4) so child-line inserts don't depend on
      a RETURNING round-trip

  transaction (single drizzle-orm/neon-http batched transaction):
    1. INSERT INTO event_archive (id = archive_id, ...scalars,
                                  source_purged_at = now())
    2. INSERT INTO event_archive_org_lines (...) VALUES (...), (...), ...
    3. DELETE FROM registrations         WHERE event_id = $eventId
    4. DELETE FROM organisation_contacts WHERE event_id = $eventId
    5. DELETE FROM volunteers            WHERE event_id = $eventId
    6. UPDATE events SET status = 'archived', modified_at = now()
       WHERE id = $eventId

  return archive_id
```

### 4.2 Transaction semantics

The codebase uses `drizzle-orm/neon-http`, whose `.transaction()` batches statements into a single HTTP request — sufficient here because no statement depends on intermediate results (we generate `archive_id` client-side). Implementation must verify the driver wraps the batch in a real SQL transaction so the wipe is atomic with the snapshot. If for any reason this is not safe, fall back to a single CTE-based SQL statement.

### 4.3 Existing preview action

`previewEventSummary` becomes `previewEventArchive`. Same purpose — called by the UI dialog before the admin commits — but now returns the extended set of headline counts AND a preview of the org-line records so the admin can sanity-check the per-org breakdown before pressing "Archive event".

### 4.4 Sequence-number uniqueness

Open question for planning: today's code does not enforce uniqueness on `event_summaries.event_sequence_number`. Decide during planning whether to add a `UNIQUE` constraint to `event_archive.event_sequence_number` (so two events can't claim "Event #43") or to leave the existing freedom in place.

## 5. UI changes

On `/admin/p2i/manage-events`:

- **Completed section actions**: rename the blue "Generate Summary" button to "**Archive event**".
- **Archive dialog (preview before commit)**:
  - Title: "Archive event"
  - Show the extended preview: companies count, impaired / non-impaired split, plus the per-org table.
  - Drop the Notes textarea (no more `admin_notes`).
  - Keep the sequence-number input.
  - Confirmation strip changes from "*Registration data will not be deleted*" (yellow) to "**This permanently deletes all attendee, organisation contact, and helper personal data for this event. Aggregate counts will be preserved in the archive. This action cannot be undone.**" (red).
  - Commit button: "Archive event".
- **Archived section actions**: rename "View Summary" → "**View Archive**". The dialog content matches the layout in `EVENT_ARCHIVE_SAMPLE.md` §"What an admin sees in the CRM".
- The archived-section row already shows the event name + date; consider also surfacing "Source data purged DD/MM/YYYY" inline next to the status badge.

No new pages or routes. No nav changes.

## 6. Counting semantics — to verify and pin down

`event_summaries.participantCount` today appears to count only `registrations` rows where `role = 'Participant'`. For an open group, that's correct. For a **closed group**, individual members never register — only the group leader does — so they would not be counted by that rule. CLAUDE.md confirms the conceptual rule: closed-group attendance is `groupSize + leader_participating ? 1 : 0`.

The archive's `participantCount` (and `totalHeadcount`) need to reflect *actual people attending*, including closed-group members and participating leaders. This may require widening the computation in `previewEventArchive` / `archiveEvent` to fold in closed-group sizing. The reusable logic already lives in `lib/participant-counting.ts`.

The implementation plan must confirm:

- What does today's `event_summaries.participantCount` represent exactly (read the existing `previewEventSummary` implementation)?
- Does it match the worked example in `EVENT_ARCHIVE_SAMPLE.md` (participantCount = 100), or the narrower interpretation (49)?
- If a change is required, are there existing rows in `event_summaries` whose values need to be re-derived or back-filled? (Likely no — the dev DB was rebuilt post-PR #7.)

The semantic answer is "participantCount = total people attending as participants" (matching the worked example). Implementation must enforce that.

## 7. Code rename surface

Mechanical renames (writing-plans will turn this into discrete tasks):

| Old | New |
|---|---|
| `event_summaries` table | `event_archive` |
| `eventSummaries` Drizzle table | `eventArchive` |
| `EventSummaryRow` / `NewEventSummaryRow` types | `EventArchiveRow` / `NewEventArchiveRow` |
| `EventSummaryPreview` type | `EventArchivePreview` |
| `getEventSummary` | `getEventArchive` |
| `previewEventSummary` | `previewEventArchive` |
| `generateEventSummary` | `archiveEvent` (this is more than a rename — semantics change too) |
| UI strings: "Generate Summary", "View Summary", "Event Summary" | "Archive event", "View Archive", "Event Archive" |

New surface:

- `eventArchiveOrgLines` Drizzle table + `EventArchiveOrgLineRow` / `NewEventArchiveOrgLineRow` types
- `DatabaseService` methods to insert lines and to fetch a full archive (header + lines) in one call

## 8. Risks and open questions

1. **`drizzle-orm/neon-http` transaction support** for batched multi-statement transactions — verify before relying on it for the atomic snapshot+wipe. Fallback: write the whole operation as one SQL statement with CTEs.
2. **Current `participant_count` semantics** — read existing code; widen if necessary (§6).
3. **Existing `event_summaries` rows** in dev — likely none after the schema rebuild, but check before the rename. If any exist: (a) populate `source_purged_at` from `created_at` as part of the migration, (b) accept that `org_breakdown` JSON data is dropped (no destination for it; closed-group attendance breakdown for legacy archives is lost), and (c) confirm the corresponding `events` row's `status` and the state of `registrations` / `organisation_contacts` / `volunteers` — legacy archives may still have source PII in those tables.
4. **Documentation drift** — `software/nextjs/documentation/DATA_MODELS.md` and any other doc that names `event_summaries` will need updating.
5. **Sequence number uniqueness** — open decision (§4.4).

## 9. Verification checklist (manual, in dev)

Per CLAUDE.md feature process, the implementation must be manually verified by the user in the browser. The checklist below covers the new behaviour plus the regressions to watch for.

**Setup**: seed the dev DB (`npm run db:seed`), make sure there's at least one `completed` event with multiple organisations (open and closed), some registrations, some volunteers.

1. Navigate to `/admin/p2i/manage-events`. The completed event shows an **Archive event** button (not "Generate Summary").
2. Click **Archive event**. The dialog opens with the new preview shape: companies count, impaired / non-impaired split, per-organisation table, consent totals, sequence number input. No Notes textarea is shown.
3. The red confirmation strip explicitly warns that personal data will be permanently deleted.
4. Enter a sequence number, click **Archive event**.
5. Spinner shows briefly. Dialog closes. The event moves out of the Completed section and into the Archived section.
6. Re-open the archived event — the **View Archive** dialog opens and matches the rendering in `EVENT_ARCHIVE_SAMPLE.md`. "Source data purged" date is visible. Per-organisation lines match what was previewed.
7. In Drizzle Studio (`npm run db:studio`):
   - `event_archive` has one new row with all the new columns populated and `source_purged_at` set to the time of the action.
   - `event_archive_org_lines` has one row per organisation that participated; `org_airtable_record_id` and `contact_airtable_record_id` are populated where the source rows had them.
   - `registrations`, `organisation_contacts`, `volunteers` have **zero** rows for the archived event's `event_id`.
   - The `events` row still exists with `status = 'archived'`.
8. Regression checks:
   - The public `/registration` page still works for the currently active event.
   - Importing events / organisations / volunteers from Airtable on `/admin/p2i/airtable-import` still works.
   - `/admin/event/registrations` for an active event still shows registrations correctly.
   - `/admin/event/report` still loads and shows correct counts for non-archived events.
   - The schema drift check (`npm run build`) passes.

## 10. Documentation updates

After implementation:

- Update `software/nextjs/documentation/DATA_MODELS.md` (rename + new table + dropped columns).
- Update `EVENT_ARCHIVE_SAMPLE.md` if any field names change during implementation.
- Update root `CLAUDE.md` if any architectural rules need to mention the new table.
- Update `MEMORY.md` to retire the planned post-event anonymisation sprint pointer (the work is now subsumed into this design).

## 11. Implementation milestones (outline)

Detailed task breakdown lives in the writing-plans output that will follow this spec. At milestone resolution:

1. **Schema migration & types** — Drizzle migration renaming `event_summaries` → `event_archive`, drop `org_breakdown` / `admin_notes`, add new scalar columns, create `event_archive_org_lines`. Update `lib/db/schema.ts` and exported types. Run `npm run build` (drift check passes). One commit.
2. **DB service layer** — Add `previewEventArchive`, `archiveEvent`, `getEventArchive` to `DatabaseService` (replacing the equivalent `EventSummary` methods). Aggregation logic uses `lib/participant-counting.ts`. Transaction wraps snapshot + lines + three deletes + event status flip. One commit.
3. **Server actions & types** — Rename / replace exports in `lib/actions.ts` and `lib/types.ts` (`EventSummaryPreview` → `EventArchivePreview`, add a richer `EventArchiveView` type for the view dialog). One commit.
4. **Manage-events UI** — Rename actions, rebuild preview dialog (drop Notes, add new fields + per-org table), rebuild view dialog to render the new layout, tighten confirmation copy. One commit.
5. **Documentation refresh** — Update `DATA_MODELS.md`, `CLAUDE.md` (if needed), retire the anonymisation memory entry. One commit.
6. **Manual verification** — Run the §9 checklist in the browser; capture results.
