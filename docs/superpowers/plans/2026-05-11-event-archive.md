# Event Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing `event_summaries` table and "Generate Summary" flow with a richer `event_archive` table that captures everything needed about a past event, and have archiving atomically hard-delete the event's source PII rows in `registrations`, `organisation_contacts`, and `volunteers`.

**Architecture:** Rename `event_summaries` → `event_archive` (extend with new headline counts, add `source_purged_at`, drop `org_breakdown` JSON and `admin_notes`). Add a child table `event_archive_org_lines` (one row per org per archive) for per-org reporting. Replace `generateEventSummary` with `archiveEvent` — a single server action that snapshots the archive, then deletes source rows for the event, then sets `events.status = 'archived'`.

**Tech Stack:** Next.js 16 App Router · TypeScript · Drizzle ORM · Neon serverless PostgreSQL (HTTP driver) · React Hook Form · Tailwind + Shadcn UI · No automated tests — manual verification via the dev server is the standard.

**Source spec:** `docs/superpowers/specs/2026-05-11-event-archive-design.md`
**Sample output:** `software/nextjs/documentation/EVENT_ARCHIVE_SAMPLE.md`
**Test seed:** `software/nextjs/scripts/archive-seed-event.sql`
**Branch:** `feature/archive`

---

## File map

Files this plan creates or modifies. **All paths are relative to repo root.** Run all `npm` commands from `software/nextjs/`.

| Path | Action | Role |
|---|---|---|
| `software/nextjs/scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql` | CREATE | Manual SQL migration that ALTERs the rename, drops/adds columns on the header, and creates the child table. |
| `software/nextjs/lib/db/schema.ts` | MODIFY | Drizzle table definitions: rename `eventSummaries` → `eventArchive`, drop `orgBreakdown`/`adminNotes`, add new scalars, add new `eventArchiveOrgLines` table. |
| `software/nextjs/lib/types.ts` | MODIFY | Replace `EventSummaryPreview` / `EventSummary` types with `EventArchivePreview` / `EventArchiveView` (new shape). Add `EventArchiveOrgLine` type. |
| `software/nextjs/lib/db-service.ts` | MODIFY | Remove `computeSummaryData` / `previewEventSummary` / `generateEventSummary` / `getEventSummary`. Add `computeArchiveData`, `previewEventArchive`, `archiveEvent`, `getEventArchive`. |
| `software/nextjs/lib/actions.ts` | MODIFY | Remove the old exports; add `previewEventArchive`, `archiveEvent`, `getEventArchive`. |
| `software/nextjs/app/admin/p2i/manage-events/page.tsx` | MODIFY | Rebrand "Generate Summary" → "Archive event"; rebuild the preview/commit dialog (drop Notes, add new fields, per-org table); rebuild "View Summary" → "View Archive" dialog. |
| `software/nextjs/documentation/DATA_MODELS.md` | MODIFY | Document the new tables. |
| `software/nextjs/documentation/EVENT_ARCHIVE_SAMPLE.md` | already present | Reference only; only update if field names change during implementation. |
| `software/nextjs/scripts/archive-seed-event.sql` | already present | Used in the final verification task. |

---

## Pre-flight verification (do this before Task 1)

Open a terminal in `software/nextjs/`. Confirm baseline state:

```bash
git branch --show-current
# Expected: feature/archive

git status
# Expected: clean (no uncommitted changes besides .claude/settings.local.json and NEON backup csv/)

npm run build
# Expected: build succeeds; schema drift check (PR #8) reports zero drift.
```

If `npm run build` fails before any change is made, **stop** and report the failure — do not proceed.

Note: Neon HTTP doesn't support interactive transactions. Drizzle's `db.transaction()` on `neon-http` batches queries into a single HTTP request via `sql.transaction([...])`, which gives atomicity but only because all statements are sent in one trip. The existing `generateEventSummary` (`software/nextjs/lib/db-service.ts:1399-1403`) acknowledges this limit and runs sequentially. **This plan uses Drizzle's `db.transaction()` and trusts the documented batching.** If it errors at runtime, Task 3 has a sequential-fallback note.

---

## Task 1 — Schema rename, extension, and child table

**Files:**
- Create: `software/nextjs/scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql`
- Modify: `software/nextjs/lib/db/schema.ts:137-160` (the `eventSummaries` block + exported types)

### Step 1.1 — Write the SQL migration

- [ ] **Create the migration file** at `software/nextjs/scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql` with exactly this content:

```sql
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
```

### Step 1.2 — Apply the migration to the dev DB

- [ ] **Run the migration** from `software/nextjs/`:

```bash
psql "$DATABASE_URL" -f scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql
```

Expected output: a series of `BEGIN`, `ALTER TABLE`, `CREATE TABLE`, `CREATE INDEX`, `COMMIT` notices, no errors. If `psql` isn't available locally, the existing `scripts/run-sql.ts` helper can be used: `npx tsx scripts/run-sql.ts scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql`.

- [ ] **Verify the DB now reflects the new shape:**

```bash
psql "$DATABASE_URL" -c "\d event_archive"
psql "$DATABASE_URL" -c "\d event_archive_org_lines"
```

Expected: `event_archive` shows the new columns including `source_purged_at NOT NULL` and no `org_breakdown` or `admin_notes`. `event_archive_org_lines` exists with the listed columns + FKs + indexes.

### Step 1.3 — Update `lib/db/schema.ts`

- [ ] **Replace the `eventSummaries` block** in `software/nextjs/lib/db/schema.ts:137-160` with the new `eventArchive` definition and add the new child table. Specifically:

Open `software/nextjs/lib/db/schema.ts`. Find the block:

```ts
/**
 * Event Summaries Table
 * Point-in-time snapshot generated when a P2I admin archives a completed event.
 * Stores computed registration counts plus admin-entered sequence number and notes.
 */
export const eventSummaries = pgTable('event_summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().unique().references(() => events.id),
  eventName: text('event_name').notNull(),
  eventDate: text('event_date').notNull(),
  eventLocation: text('event_location'),
  eventDescription: text('event_description'),
  eventAirtableRecordId: text('event_airtable_record_id'),
  participantCount: integer('participant_count').notNull().default(0),
  volunteerCount: integer('volunteer_count').notNull().default(0),
  groupCount: integer('group_count').notNull().default(0),
  totalHeadcount: integer('total_headcount').notNull().default(0),
  photoConsentCount: integer('photo_consent_count').notNull().default(0),
  feedbackConsentCount: integer('feedback_consent_count').notNull().default(0),
  nextEventConsentCount: integer('next_event_consent_count').notNull().default(0),
  orgBreakdown: text('org_breakdown').notNull().default('[]'),
  eventSequenceNumber: integer('event_sequence_number').notNull(),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type EventSummaryRow = typeof eventSummaries.$inferSelect;
export type NewEventSummaryRow = typeof eventSummaries.$inferInsert;
```

And replace it with:

```ts
/**
 * Event Archive Table
 *
 * Canonical post-event record. Created when an admin archives a completed
 * event — at which point the matching rows in registrations,
 * organisation_contacts, and volunteers for that event are HARD-DELETED in
 * the same operation. No personal identifying information is ever stored
 * on this table; aggregate counts only.
 *
 * source_purged_at records the timestamp at which the source PII rows were
 * deleted as part of the archive operation. For atomic-flow archives this
 * equals created_at; preserved as a distinct column so a future migration
 * could distinguish "summary made" from "source data deleted".
 */
export const eventArchive = pgTable('event_archive', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().unique().references(() => events.id),
  eventName: text('event_name').notNull(),
  eventDate: text('event_date').notNull(),
  eventLocation: text('event_location'),
  eventDescription: text('event_description'),
  eventAirtableRecordId: text('event_airtable_record_id'),

  participantCount: integer('participant_count').notNull().default(0),
  volunteerCount: integer('volunteer_count').notNull().default(0),
  groupCount: integer('group_count').notNull().default(0),
  totalHeadcount: integer('total_headcount').notNull().default(0),
  companiesCount: integer('companies_count').notNull().default(0),

  impairedParticipantCount: integer('impaired_participant_count').notNull().default(0),
  nonImpairedParticipantCount: integer('non_impaired_participant_count').notNull().default(0),

  photoConsentCount: integer('photo_consent_count').notNull().default(0),
  feedbackConsentCount: integer('feedback_consent_count').notNull().default(0),
  nextEventConsentCount: integer('next_event_consent_count').notNull().default(0),

  eventSequenceNumber: integer('event_sequence_number').notNull(),

  sourcePurgedAt: timestamp('source_purged_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Event Archive Org Lines Table
 *
 * One row per (archive, organisation). Supports per-organisation history
 * queries across multiple events. Organisation IDs survive the archive
 * (organisations is a global, long-lived table); the Airtable IDs are
 * snapshotted at archive time because the source contact row is deleted.
 */
export const eventArchiveOrgLines = pgTable('event_archive_org_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  archiveId: uuid('archive_id')
    .notNull()
    .references(() => eventArchive.id, { onDelete: 'cascade' }),
  organisationId: uuid('organisation_id')
    .notNull()
    .references(() => organisations.id, { onDelete: 'restrict' }),

  orgNameSnapshot: text('org_name_snapshot').notNull(),
  orgAirtableRecordId: text('org_airtable_record_id'),
  contactAirtableRecordId: text('contact_airtable_record_id'),

  actualHeadcount: integer('actual_headcount').notNull().default(0),
  impairedCount: integer('impaired_count').notNull().default(0),
  nonImpairedCount: integer('non_impaired_count').notNull().default(0),

  createdAt: timestamp('created_at').defaultNow(),
});

export type EventArchiveRow = typeof eventArchive.$inferSelect;
export type NewEventArchiveRow = typeof eventArchive.$inferInsert;

export type EventArchiveOrgLineRow = typeof eventArchiveOrgLines.$inferSelect;
export type NewEventArchiveOrgLineRow = typeof eventArchiveOrgLines.$inferInsert;
```

### Step 1.4 — Run the schema drift check

- [ ] **Run from `software/nextjs/`:**

```bash
npm run build
```

The build script runs `check-schema-drift.ts` before `next build`. Expected output: drift check reports zero differences, build completes successfully.

If drift is reported, compare the schema.ts text vs `psql "$DATABASE_URL" -c "\d event_archive"` and `\d event_archive_org_lines` — fix whichever side is wrong (usually a typo in schema.ts).

### Step 1.5 — Commit

- [ ] **Stage and commit** from the repo root:

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app

git add \
  software/nextjs/scripts/migrations/2026-05-11_rename_event_summaries_to_event_archive.sql \
  software/nextjs/lib/db/schema.ts

git commit -m "$(cat <<'EOF'
feat(archive): rename event_summaries to event_archive + new child table

- Renames event_summaries -> event_archive
- Drops org_breakdown JSON and admin_notes
- Adds companies_count, impaired/non_impaired_participant_count, source_purged_at
- Adds new event_archive_org_lines child for per-(archive, org) breakdown

Schema-only change. Service / actions / UI follow in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 — Type definitions

**Files:**
- Modify: `software/nextjs/lib/types.ts:271-300` (the EventSummary section).

### Step 2.1 — Replace EventSummary types with EventArchive types

- [ ] **In `software/nextjs/lib/types.ts`,** find the `EventSummaryPreview` and `EventSummary` interfaces at lines 274-300 (or thereabouts — the section heading is `// Event Summary Types`). Replace the entire section with:

```ts
// ============================================================================
// Event Archive Types
// ============================================================================

/**
 * One organisation's contribution to an archived event.
 * Matches the event_archive_org_lines table shape with timestamps as ISO strings.
 */
export interface EventArchiveOrgLine {
  id: string;
  archiveId: string;
  organisationId: string;
  orgNameSnapshot: string;
  orgAirtableRecordId: string | null;
  contactAirtableRecordId: string | null;
  actualHeadcount: number;
  impairedCount: number;
  nonImpairedCount: number;
  createdAt: string | null;
}

/**
 * Read-only preview of computed event-archive counts (returned before saving).
 * Shown in the Archive Event dialog so the admin can sanity-check counts
 * before pressing the irreversible "Archive event" button.
 *
 * Counting semantics — locked in by this design (see spec §6):
 * - participantCount = (Participant-role registrations)
 *     + (closed-group members via groupSize on Group-role registrations)
 *     + (participating group leaders, i.e. groupLeaderParticipating=true)
 *   i.e. every actual person attending in a participant capacity.
 * - totalHeadcount = participantCount + volunteerCount.
 * - companiesCount = distinct organisations that participated.
 */
export interface EventArchivePreview {
  participantCount: number;
  volunteerCount: number;
  groupCount: number;
  totalHeadcount: number;
  companiesCount: number;
  impairedParticipantCount: number;
  nonImpairedParticipantCount: number;
  photoConsentCount: number;
  feedbackConsentCount: number;
  nextEventConsentCount: number;
  orgLines: Omit<EventArchiveOrgLine, 'id' | 'archiveId' | 'createdAt'>[];
}

/**
 * A fully-saved event archive (header + lines) loaded from the DB.
 * Returned by getEventArchive() and rendered by the View Archive dialog.
 */
export interface EventArchiveView {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventAirtableRecordId: string | null;
  eventSequenceNumber: number;

  participantCount: number;
  volunteerCount: number;
  groupCount: number;
  totalHeadcount: number;
  companiesCount: number;
  impairedParticipantCount: number;
  nonImpairedParticipantCount: number;
  photoConsentCount: number;
  feedbackConsentCount: number;
  nextEventConsentCount: number;

  sourcePurgedAt: string;
  createdAt: string | null;

  orgLines: EventArchiveOrgLine[];
}
```

### Step 2.2 — Verify the file still compiles

- [ ] **Run a type check from `software/nextjs/`:**

```bash
npx tsc --noEmit
```

Expected: errors only in files that still reference the old `EventSummaryPreview` / `EventSummary` types (`lib/db-service.ts`, `lib/actions.ts`, `app/admin/p2i/manage-events/page.tsx`). These get fixed in Tasks 3, 4, 5. **Do not fix them in this commit** — they're tracked downstream.

### Step 2.3 — Commit

- [ ] **Commit from repo root:**

```bash
git add software/nextjs/lib/types.ts

git commit -m "$(cat <<'EOF'
feat(archive): replace EventSummary types with EventArchive types

Introduces EventArchivePreview (dialog preview shape), EventArchiveView
(full saved archive), and EventArchiveOrgLine. Removes the old
EventSummaryPreview / EventSummary interfaces — downstream consumers in
db-service / actions / UI will be updated in following commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 — Database service rewrite

**Files:**
- Modify: `software/nextjs/lib/db-service.ts:18` (imports), `:21` (type imports), and `:1252-1530` (the entire EventSummary section).

### Step 3.1 — Update imports

- [ ] **In `software/nextjs/lib/db-service.ts`,** change line 18 from:

```ts
import { events, organisations, organisationContacts, volunteers, registrations, eventSummaries } from './db/schema';
```

to:

```ts
import { events, organisations, organisationContacts, volunteers, registrations, eventArchive, eventArchiveOrgLines } from './db/schema';
```

- [ ] **Change line 21** from:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
```

to:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventArchivePreview, EventArchiveView, EventArchiveOrgLine } from './types';
```

### Step 3.2 — Remove the old EventSummary methods

- [ ] **Delete** the entire block from `software/nextjs/lib/db-service.ts:1252` (start of the comment `/** Compute summary counts...`) through `:1530` (the closing `}` of `getEventSummary`). That removes `computeSummaryData`, `previewEventSummary`, `generateEventSummary`, and `getEventSummary`.

### Step 3.3 — Add the new archive methods

- [ ] **Insert** the following block at the point you just deleted (still inside the `DatabaseService` class, immediately above the final closing `}` of the class). All four methods are shown — paste the entire block:

```ts
  /**
   * Compute the data that will end up in event_archive + event_archive_org_lines
   * for the given event, without writing anything to the DB.
   *
   * Throws if the event is not found or not status='completed'.
   *
   * Counting semantics (see spec §6 and EVENT_ARCHIVE_SAMPLE.md):
   * - participantCount  = Participant registrations
   *                       + closed-group members via groupSize
   *                       + leaders with groupLeaderParticipating=true
   * - totalHeadcount    = participantCount + volunteerCount
   * - companiesCount    = distinct orgs participating (via organisation_contacts)
   * - Org-line headcount per org applies the same rule:
   *     open-group  -> count Participant registrations for that org
   *                    + 1 if any leader participated
   *     closed-group -> sum of groupSize across the org's Group registrations
   *                     + count of those with groupLeaderParticipating=true
   */
  private static async computeArchiveData(eventId: string): Promise<{
    event: {
      id: string;
      name: string;
      date: string;
      location: string | null;
      description: string | null;
      airtableRecordId: string | null;
    };
    preview: EventArchivePreview;
  }> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status}). Only completed events can be archived.`);
    }

    // 1. All registrations for this event.
    const regs = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId));

    // 2. All organisation_contacts rows for this event, joined to the org row.
    //    Contains the per-event open/closed flag and the contact's airtable ID.
    const contactRows = await db
      .select({
        contact: organisationContacts,
        org: organisations,
      })
      .from(organisationContacts)
      .innerJoin(organisations, eq(organisationContacts.organisationId, organisations.id))
      .where(eq(organisationContacts.eventId, eventId));

    // Build a lookup orgId -> openGroup. Falls back to true (open) if no contact.
    const openGroupByOrgId = new Map<string, boolean>();
    for (const row of contactRows) {
      openGroupByOrgId.set(row.org.id, row.contact.openGroup);
    }

    const participantRegs = regs.filter(r => r.role === 'Participant');
    const groupRegs = regs.filter(r => r.role === 'Group');
    const volunteerRegs = regs.filter(r => r.role === 'Volunteer');

    const volunteerCount = volunteerRegs.length;
    const groupCount = groupRegs.length;

    // 3. Participant headcount (rolls in closed-group members and participating leaders).
    let participantCount = participantRegs.length;
    for (const g of groupRegs) {
      const isOpen = g.organizationId
        ? (openGroupByOrgId.get(g.organizationId) ?? true)
        : true;
      if (!isOpen) {
        participantCount += g.groupSize ?? 0;
      }
      if (g.groupLeaderParticipating === true) {
        participantCount += 1;
      }
    }

    const totalHeadcount = participantCount + volunteerCount;

    // 4. Impairment split across the same population that participantCount covers.
    let impairedParticipantCount = 0;
    let nonImpairedParticipantCount = 0;
    for (const p of participantRegs) {
      if (p.impairment && p.impairment.trim() !== '') {
        impairedParticipantCount += 1;
      } else {
        nonImpairedParticipantCount += 1;
      }
    }
    for (const g of groupRegs) {
      const isOpen = g.organizationId
        ? (openGroupByOrgId.get(g.organizationId) ?? true)
        : true;
      if (!isOpen) {
        impairedParticipantCount += g.impairedParticipants ?? 0;
        nonImpairedParticipantCount += g.nonImpairedParticipants ?? 0;
      }
      // Participating leaders count as non-impaired by default (the leader's
      // own impairment isn't tracked on the Group registration row).
      if (g.groupLeaderParticipating === true) {
        nonImpairedParticipantCount += 1;
      }
    }

    // 5. Consent counts across ALL registrations for the event (any role).
    const photoConsentCount = regs.filter(r => r.photoConsent === true).length;
    const feedbackConsentCount = regs.filter(r => r.feedbackConsent === true).length;
    const nextEventConsentCount = regs.filter(r => r.nextEventConsent === true).length;

    // 6. Companies count = distinct orgs that appear in contactRows for this event.
    const companiesCount = new Set(contactRows.map(r => r.org.id)).size;

    // 7. Per-org lines. One line per organisation_contact row (= one per org
    //    in this event because each org has at most one contact per event,
    //    enforced indirectly by current import logic).
    //    For each org line compute: actual_headcount, impaired_count,
    //    non_impaired_count.
    const orgLines: EventArchivePreview['orgLines'] = [];

    for (const row of contactRows) {
      const orgId = row.org.id;
      const isOpen = row.contact.openGroup !== false;

      // Find the Group registration(s) for this org (usually one).
      const orgGroupRegs = groupRegs.filter(g => g.organizationId === orgId);
      // Find the Participant registrations for this org.
      const orgParticipantRegs = participantRegs.filter(p => p.organizationId === orgId);

      let actual = 0;
      let impaired = 0;
      let nonImpaired = 0;

      if (isOpen) {
        actual = orgParticipantRegs.length;
        for (const p of orgParticipantRegs) {
          if (p.impairment && p.impairment.trim() !== '') impaired += 1;
          else nonImpaired += 1;
        }
        for (const g of orgGroupRegs) {
          if (g.groupLeaderParticipating === true) {
            actual += 1;
            nonImpaired += 1;
          }
        }
      } else {
        for (const g of orgGroupRegs) {
          actual += g.groupSize ?? 0;
          impaired += g.impairedParticipants ?? 0;
          nonImpaired += g.nonImpairedParticipants ?? 0;
          if (g.groupLeaderParticipating === true) {
            actual += 1;
            nonImpaired += 1;
          }
        }
      }

      orgLines.push({
        organisationId: orgId,
        orgNameSnapshot: row.org.name ?? 'Unknown organisation',
        orgAirtableRecordId: row.org.airtableRecordId ?? null,
        contactAirtableRecordId: row.contact.airtableRecordId ?? null,
        actualHeadcount: actual,
        impairedCount: impaired,
        nonImpairedCount: nonImpaired,
      });
    }

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        location: event.location ?? null,
        description: event.description ?? null,
        airtableRecordId: event.airtableRecordId ?? null,
      },
      preview: {
        participantCount,
        volunteerCount,
        groupCount,
        totalHeadcount,
        companiesCount,
        impairedParticipantCount,
        nonImpairedParticipantCount,
        photoConsentCount,
        feedbackConsentCount,
        nextEventConsentCount,
        orgLines,
      },
    };
  }

  /**
   * Compute archive counts without writing anything. Used by the Archive
   * Event dialog to render the preview before the admin commits.
   */
  static async previewEventArchive(eventId: string): Promise<EventArchivePreview> {
    const { preview } = await DatabaseService.computeArchiveData(eventId);
    return preview;
  }

  /**
   * Atomically archive a completed event:
   *   1. Insert event_archive + event_archive_org_lines.
   *   2. Delete registrations / organisation_contacts / volunteers for the event.
   *   3. Update events.status = 'archived'.
   *
   * Uses Drizzle's db.transaction() which on neon-http batches all statements
   * into a single HTTP request — atomic from the DB's perspective.
   *
   * If the precondition fails (event missing, not completed, or already
   * archived) it throws BEFORE any write.
   *
   * If db.transaction() throws at runtime ("not supported on this driver"
   * or similar), the fallback is to run the same sequence outside a
   * transaction: do the INSERTs first, then the DELETEs, then the status
   * UPDATE. The worst-case partial-failure mode is a created archive with
   * source rows still present; an admin can manually retry by deleting the
   * orphan archive row and re-running.
   */
  static async archiveEvent(
    eventId: string,
    eventSequenceNumber: number,
  ): Promise<string> {
    if (!Number.isInteger(eventSequenceNumber) || eventSequenceNumber <= 0) {
      throw new Error(`eventSequenceNumber must be a positive integer, got: ${eventSequenceNumber}`);
    }

    // Precondition: refuse if an archive already exists for this event.
    const [existing] = await db
      .select({ id: eventArchive.id })
      .from(eventArchive)
      .where(eq(eventArchive.eventId, eventId))
      .limit(1);
    if (existing) {
      throw new Error(`Event is already archived (event_archive.id = ${existing.id}).`);
    }

    // Compute everything we need to write. Throws if event isn't 'completed'.
    const { event, preview } = await DatabaseService.computeArchiveData(eventId);

    const archiveId = randomUUID();
    const now = new Date();

    const headerRow: typeof eventArchive.$inferInsert = {
      id: archiveId,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventLocation: event.location,
      eventDescription: event.description,
      eventAirtableRecordId: event.airtableRecordId,
      eventSequenceNumber,
      participantCount: preview.participantCount,
      volunteerCount: preview.volunteerCount,
      groupCount: preview.groupCount,
      totalHeadcount: preview.totalHeadcount,
      companiesCount: preview.companiesCount,
      impairedParticipantCount: preview.impairedParticipantCount,
      nonImpairedParticipantCount: preview.nonImpairedParticipantCount,
      photoConsentCount: preview.photoConsentCount,
      feedbackConsentCount: preview.feedbackConsentCount,
      nextEventConsentCount: preview.nextEventConsentCount,
      sourcePurgedAt: now,
    };

    const lineRows: (typeof eventArchiveOrgLines.$inferInsert)[] = preview.orgLines.map(line => ({
      archiveId,
      organisationId: line.organisationId,
      orgNameSnapshot: line.orgNameSnapshot,
      orgAirtableRecordId: line.orgAirtableRecordId,
      contactAirtableRecordId: line.contactAirtableRecordId,
      actualHeadcount: line.actualHeadcount,
      impairedCount: line.impairedCount,
      nonImpairedCount: line.nonImpairedCount,
    }));

    await db.transaction(async (tx) => {
      await tx.insert(eventArchive).values(headerRow);
      if (lineRows.length > 0) {
        await tx.insert(eventArchiveOrgLines).values(lineRows);
      }
      await tx.delete(registrations).where(eq(registrations.eventId, eventId));
      await tx.delete(organisationContacts).where(eq(organisationContacts.eventId, eventId));
      await tx.delete(volunteers).where(eq(volunteers.eventId, eventId));
      await tx.update(events)
        .set({ status: 'archived', modifiedAt: now })
        .where(eq(events.id, eventId));
    });

    return archiveId;
  }

  /**
   * Load a saved archive (header + lines) for an archived event.
   * Returns null if no archive exists.
   */
  static async getEventArchive(eventId: string): Promise<EventArchiveView | null> {
    const [header] = await db
      .select()
      .from(eventArchive)
      .where(eq(eventArchive.eventId, eventId))
      .limit(1);

    if (!header) return null;

    const lines = await db
      .select()
      .from(eventArchiveOrgLines)
      .where(eq(eventArchiveOrgLines.archiveId, header.id))
      .orderBy(eventArchiveOrgLines.orgNameSnapshot);

    const orgLines: EventArchiveOrgLine[] = lines.map(l => ({
      id: l.id,
      archiveId: l.archiveId,
      organisationId: l.organisationId,
      orgNameSnapshot: l.orgNameSnapshot,
      orgAirtableRecordId: l.orgAirtableRecordId,
      contactAirtableRecordId: l.contactAirtableRecordId,
      actualHeadcount: l.actualHeadcount,
      impairedCount: l.impairedCount,
      nonImpairedCount: l.nonImpairedCount,
      createdAt: l.createdAt?.toISOString() ?? null,
    }));

    return {
      id: header.id,
      eventId: header.eventId,
      eventName: header.eventName,
      eventDate: header.eventDate,
      eventLocation: header.eventLocation,
      eventDescription: header.eventDescription,
      eventAirtableRecordId: header.eventAirtableRecordId,
      eventSequenceNumber: header.eventSequenceNumber,
      participantCount: header.participantCount,
      volunteerCount: header.volunteerCount,
      groupCount: header.groupCount,
      totalHeadcount: header.totalHeadcount,
      companiesCount: header.companiesCount,
      impairedParticipantCount: header.impairedParticipantCount,
      nonImpairedParticipantCount: header.nonImpairedParticipantCount,
      photoConsentCount: header.photoConsentCount,
      feedbackConsentCount: header.feedbackConsentCount,
      nextEventConsentCount: header.nextEventConsentCount,
      sourcePurgedAt: header.sourcePurgedAt.toISOString(),
      createdAt: header.createdAt?.toISOString() ?? null,
      orgLines,
    };
  }
```

### Step 3.4 — Verify the type check passes

- [ ] **Run from `software/nextjs/`:**

```bash
npx tsc --noEmit
```

Expected: the type check now produces errors only in `lib/actions.ts` and `app/admin/p2i/manage-events/page.tsx` (which still reference the old API). Fixed in Tasks 4 and 5.

### Step 3.5 — Commit

- [ ] **Commit from repo root:**

```bash
git add software/nextjs/lib/db-service.ts

git commit -m "$(cat <<'EOF'
feat(archive): replace event_summary DB service methods with event_archive

- computeArchiveData: returns header scalars + per-org lines for an event
- previewEventArchive: dialog-time preview wrapper
- archiveEvent: atomic create archive + delete source rows + status flip,
  via db.transaction() (neon-http batches statements in a single HTTP request)
- getEventArchive: load header + lines back

Server action and UI updates follow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4 — Server actions

**Files:**
- Modify: `software/nextjs/lib/actions.ts:15` (type imports), `:196-198` (getEventSummary export), `:496-513` (preview / generate exports).

### Step 4.1 — Update type imports

- [ ] **In `software/nextjs/lib/actions.ts`** change line 15 from:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
```

to:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventArchivePreview, EventArchiveView } from './types';
```

### Step 4.2 — Replace `getEventSummary` with `getEventArchive`

- [ ] **In the same file**, find the existing function around line 196:

```ts
export async function getEventSummary(eventId: string) {
  return await DatabaseService.getEventSummary(eventId);
}
```

Replace with:

```ts
export async function getEventArchive(eventId: string): Promise<EventArchiveView | null> {
  return await DatabaseService.getEventArchive(eventId);
}
```

### Step 4.3 — Replace `previewEventSummary` and `generateEventSummary`

- [ ] **At the bottom of `actions.ts`**, find the existing two exports (around lines 496-513):

```ts
/**
 * Compute and return event summary counts without writing to DB.
 * Used by the Generate Summary modal to show a preview before the admin confirms.
 */
export async function previewEventSummary(eventId: string): Promise<EventSummaryPreview> {
  return await DatabaseService.previewEventSummary(eventId);
}

/**
 * Generate and persist an event summary, then archive the event.
 */
export async function generateEventSummary(
  eventId: string,
  sequenceNumber: number,
  notes: string | null,
): Promise<EventSummary> {
  return await DatabaseService.generateEventSummary(eventId, sequenceNumber, notes);
}
```

Replace with:

```ts
/**
 * Compute and return event-archive counts without writing to DB.
 * Used by the Archive Event modal to show a preview before the admin commits.
 */
export async function previewEventArchive(eventId: string): Promise<EventArchivePreview> {
  return await DatabaseService.previewEventArchive(eventId);
}

/**
 * Archive a completed event. Atomically:
 *  - Creates event_archive + event_archive_org_lines rows
 *  - HARD-DELETES the event's rows from registrations,
 *    organisation_contacts, and volunteers
 *  - Sets events.status = 'archived'
 *
 * Returns the new archive row id. Throws if the event is not 'completed'
 * or already archived.
 */
export async function archiveEvent(
  eventId: string,
  sequenceNumber: number,
): Promise<string> {
  return await DatabaseService.archiveEvent(eventId, sequenceNumber);
}
```

### Step 4.4 — Verify type check

- [ ] **Run from `software/nextjs/`:**

```bash
npx tsc --noEmit
```

Expected: remaining errors live only in `app/admin/p2i/manage-events/page.tsx`. Those get fixed in Task 5.

### Step 4.5 — Commit

- [ ] **Commit:**

```bash
git add software/nextjs/lib/actions.ts

git commit -m "$(cat <<'EOF'
feat(archive): replace event_summary server actions with event_archive actions

- previewEventArchive replaces previewEventSummary
- archiveEvent replaces generateEventSummary (atomic create + purge + status flip)
- getEventArchive replaces getEventSummary, returns header + per-org lines

UI rebrand follows.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 — Manage-events UI rebrand

**Files:**
- Modify: `software/nextjs/app/admin/p2i/manage-events/page.tsx` — multiple regions, see substeps.

This task makes several scoped UI changes to the single page. Each substep ends with a working build; commit at the end.

### Step 5.1 — Update imports and type usage

- [ ] **In `software/nextjs/app/admin/p2i/manage-events/page.tsx`,** change the import at line 12 from:

```ts
import { getAllEvents, setCurrentEvent, updateEvent, deleteEvent, createEvent, previewEventSummary, generateEventSummary, getEventSummary } from "@/lib/actions";
```

to:

```ts
import { getAllEvents, setCurrentEvent, updateEvent, deleteEvent, createEvent, previewEventArchive, archiveEvent, getEventArchive } from "@/lib/actions";
```

- [ ] **Change line 17** from:

```ts
import type { Event, EventSummaryPreview } from "@/lib/types";
```

to:

```ts
import type { Event, EventArchivePreview, EventArchiveView } from "@/lib/types";
```

### Step 5.2 — Update state hooks for the preview/commit dialog

- [ ] **Find** the block of state declarations around lines 40-46:

```tsx
  // Generate Summary dialog state
  const [summaryEventId, setSummaryEventId] = useState<string | null>(null);
  const [summaryEvent, setSummaryEvent] = useState<Event | null>(null);
  const [summaryPreview, setSummaryPreview] = useState<EventSummaryPreview | null>(null);
  const [isSummaryPreviewLoading, setIsSummaryPreviewLoading] = useState(false);
  const [summarySequenceNumber, setSummarySequenceNumber] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
```

Replace with (note: drop `summaryNotes`, rename `summaryPreview` → `archivePreview`, etc.):

```tsx
  // Archive Event dialog state
  const [archiveEventId, setArchiveEventId] = useState<string | null>(null);
  const [archiveEventRow, setArchiveEventRow] = useState<Event | null>(null);
  const [archivePreview, setArchivePreview] = useState<EventArchivePreview | null>(null);
  const [isArchivePreviewLoading, setIsArchivePreviewLoading] = useState(false);
  const [archiveSequenceNumber, setArchiveSequenceNumber] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
```

### Step 5.3 — Update View dialog state shape

- [ ] **Find** the block of state declarations around lines 48-64 (`viewSummaryData` block). Replace with:

```tsx
  // View Archive dialog state
  const [viewArchiveData, setViewArchiveData] = useState<EventArchiveView | null>(null);
  const [isViewArchiveLoading, setIsViewArchiveLoading] = useState(false);
```

(This is a simpler shape: we now store the full `EventArchiveView` directly instead of inline copy.)

### Step 5.4 — Replace `handleOpenSummary`

- [ ] **Find** the `handleOpenSummary` function (around lines 116-133). Replace it with:

```tsx
  const handleOpenArchive = async (event: Event) => {
    setArchiveEventId(event.id);
    setArchiveEventRow(event);
    setArchivePreview(null);
    setArchiveSequenceNumber("");
    setIsArchivePreviewLoading(true);
    try {
      const preview = await previewEventArchive(event.id);
      setArchivePreview(preview);
    } catch (error) {
      console.error("Failed to load archive preview:", error);
      alert("Failed to load event preview. " + (error instanceof Error ? error.message : ""));
      setArchiveEventId(null);
    } finally {
      setIsArchivePreviewLoading(false);
    }
  };
```

### Step 5.5 — Replace `handleArchiveEvent`

- [ ] **Find** the `handleArchiveEvent` function (around lines 135-150). Replace it with:

```tsx
  const handleArchiveEvent = async () => {
    if (!archiveEventId) return;
    const seqNum = parseInt(archiveSequenceNumber, 10);
    if (isNaN(seqNum) || seqNum <= 0) return;
    try {
      setIsArchiving(true);
      await archiveEvent(archiveEventId, seqNum);
      setArchiveEventId(null);
      await loadEvents();
    } catch (error) {
      console.error("Failed to archive event:", error);
      alert("Failed to archive event. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsArchiving(false);
    }
  };
```

### Step 5.6 — Replace `handleViewSummary`

- [ ] **Find** the `handleViewSummary` function (around lines 152-167). Replace it with:

```tsx
  const handleViewArchive = async (eventId: string) => {
    setIsViewArchiveLoading(true);
    try {
      const archive = await getEventArchive(eventId);
      if (archive) {
        setViewArchiveData(archive);
      } else {
        alert("No archive found for this event.");
      }
    } catch (error) {
      console.error("Failed to load event archive:", error);
      alert("Failed to load event archive.");
    } finally {
      setIsViewArchiveLoading(false);
    }
  };
```

### Step 5.7 — Update the Completed-section action button

- [ ] **Find** the button in the Completed section render block (around line 450):

```tsx
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenSummary(event)}>
                                  Generate Summary
                                </Button>
```

Replace with:

```tsx
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenArchive(event)}>
                                  Archive event
                                </Button>
```

### Step 5.8 — Update the Archived-section action button

- [ ] **Find** the button in the Archived section render block (around line 499):

```tsx
                                <Button size="sm" variant="outline" onClick={() => handleViewSummary(event.id)} disabled={isViewSummaryLoading}>
                                  Event Summary
                                </Button>
```

Replace with:

```tsx
                                <Button size="sm" variant="outline" onClick={() => handleViewArchive(event.id)} disabled={isViewArchiveLoading}>
                                  View Archive
                                </Button>
```

### Step 5.9 — Replace the Generate Summary dialog

- [ ] **Find** the entire `<Dialog>` block starting `{/* Generate Summary Dialog */}` (around line 590) and ending at the matching `</Dialog>` (around line 703). Replace the whole block with the following Archive Event dialog. **This is the most important UI change** — the preview must surface every new field and the confirmation copy must make the deletion explicit. Paste exactly:

```tsx
      {/* Archive Event Dialog */}
      <Dialog open={archiveEventId !== null} onOpenChange={(open) => { if (!open) setArchiveEventId(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archive event</DialogTitle>
            <DialogDescription>
              Review the figures below. Pressing &quot;Archive event&quot; will permanently delete all attendee, organisation-contact and helper personal data for this event.
            </DialogDescription>
          </DialogHeader>

          {archiveEventRow && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">{archiveEventRow.name}</p>
              <p className="text-gray-500">
                {new Date(archiveEventRow.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {archiveEventRow.location ? ` — ${archiveEventRow.location}` : ''}
              </p>
            </div>
          )}

          {isArchivePreviewLoading ? (
            <div className="py-8 text-center text-gray-500">Loading preview...</div>
          ) : archivePreview ? (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Headline counts</h4>
                <div className="flex justify-between"><span className="text-gray-600">Companies / organisations</span><span className="font-medium">{archivePreview.companiesCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total headcount</span><span className="font-medium">{archivePreview.totalHeadcount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Participants</span><span>{archivePreview.participantCount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Helpers</span><span>{archivePreview.volunteerCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Participant impairment split</h4>
                <div className="flex justify-between"><span className="text-gray-600">Impaired</span><span className="font-medium">{archivePreview.impairedParticipantCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Non-impaired</span><span className="font-medium">{archivePreview.nonImpairedParticipantCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                <div className="flex justify-between"><span className="text-gray-600">Photo</span><span className="font-medium">{archivePreview.photoConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Feedback</span><span className="font-medium">{archivePreview.feedbackConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Next event</span><span className="font-medium">{archivePreview.nextEventConsentCount}</span></div>
              </div>

              {archivePreview.orgLines.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Per-organisation breakdown</h4>
                  <div className="space-y-2">
                    {archivePreview.orgLines.map((line) => (
                      <div key={line.organisationId} className="border-b last:border-b-0 border-gray-200 pb-2 last:pb-0">
                        <p className="font-medium text-gray-900">{line.orgNameSnapshot}</p>
                        <p className="text-gray-500 text-xs">
                          {line.actualHeadcount} attended &middot; {line.impairedCount} impaired, {line.nonImpairedCount} not
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="seq-number">Event sequence number *</Label>
                <Input
                  id="seq-number"
                  type="number"
                  min="1"
                  value={archiveSequenceNumber}
                  onChange={(e) => setArchiveSequenceNumber(e.target.value)}
                  placeholder="e.g. 43"
                />
              </div>

              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                <strong>This will permanently delete</strong> all attendee, organisation-contact and helper personal data for this event. The aggregate counts above will be preserved in the archive. <strong>This action cannot be undone.</strong>
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setArchiveEventId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleArchiveEvent}
              disabled={!archivePreview || !archiveSequenceNumber.trim() || isNaN(parseInt(archiveSequenceNumber, 10)) || parseInt(archiveSequenceNumber, 10) <= 0 || isArchiving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isArchiving ? "Archiving..." : "Archive event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

### Step 5.10 — Replace the View Summary dialog

- [ ] **Find** the entire `<Dialog>` block starting `{/* View Event Summary Dialog */}` (around line 705) through its matching `</Dialog>` (around line 788). Replace with:

```tsx
      {/* View Archive Dialog */}
      <Dialog open={viewArchiveData !== null} onOpenChange={(open) => { if (!open) setViewArchiveData(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Archive</DialogTitle>
          </DialogHeader>

          {viewArchiveData && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">{viewArchiveData.eventName}</p>
                <p className="text-gray-500">
                  {new Date(viewArchiveData.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {viewArchiveData.eventLocation ? ` — ${viewArchiveData.eventLocation}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Event #{viewArchiveData.eventSequenceNumber} &middot; Source data purged {new Date(viewArchiveData.sourcePurgedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Headline counts</h4>
                <div className="flex justify-between"><span className="text-gray-600">Companies / organisations</span><span className="font-medium">{viewArchiveData.companiesCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total headcount</span><span className="font-medium">{viewArchiveData.totalHeadcount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Participants</span><span>{viewArchiveData.participantCount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Helpers</span><span>{viewArchiveData.volunteerCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Participant impairment split</h4>
                <div className="flex justify-between"><span className="text-gray-600">Impaired</span><span className="font-medium">{viewArchiveData.impairedParticipantCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Non-impaired</span><span className="font-medium">{viewArchiveData.nonImpairedParticipantCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                <div className="flex justify-between"><span className="text-gray-600">Photo</span><span className="font-medium">{viewArchiveData.photoConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Feedback</span><span className="font-medium">{viewArchiveData.feedbackConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Next event</span><span className="font-medium">{viewArchiveData.nextEventConsentCount}</span></div>
              </div>

              {viewArchiveData.orgLines.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Per-organisation breakdown</h4>
                  <div className="space-y-2">
                    {viewArchiveData.orgLines.map((line) => (
                      <div key={line.id} className="border-b last:border-b-0 border-gray-200 pb-2 last:pb-0">
                        <p className="font-medium text-gray-900">{line.orgNameSnapshot}</p>
                        <p className="text-gray-500 text-xs">
                          {line.actualHeadcount} attended &middot; {line.impairedCount} impaired, {line.nonImpairedCount} not
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewArchiveData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
```

### Step 5.11 — Verify build

- [ ] **Run from `software/nextjs/`:**

```bash
npm run build
```

Expected: zero TypeScript errors, drift check passes, Next.js build succeeds. If any error references the old summary symbols, search-and-replace any leftover references in this file. If `Textarea` import is now unused, remove it from line 9 to silence the lint warning (it was used for the dropped Notes textarea).

### Step 5.12 — Commit

- [ ] **Commit from repo root:**

```bash
git add software/nextjs/app/admin/p2i/manage-events/page.tsx

git commit -m "$(cat <<'EOF'
feat(archive): rebrand manage-events UI for event_archive flow

- "Generate Summary" -> "Archive event" (red, irreversible warning copy)
- Drops the Notes textarea
- Preview shows companies count, impaired / non-impaired split, per-org
  breakdown, plus the existing consent / headcount sections
- "View Summary" -> "View Archive" with source-purged date and the new
  per-org lines

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 — Documentation refresh

**Files:**
- Modify: `software/nextjs/documentation/DATA_MODELS.md` — update table references.

### Step 6.1 — Update DATA_MODELS.md

- [ ] **Read the file first to find the right sections:**

```bash
grep -n "event_summaries\|event_summary\|EventSummary" software/nextjs/documentation/DATA_MODELS.md
```

For each occurrence, update to reference `event_archive` and the new `event_archive_org_lines` table. Specifically:
- Any "Event Summaries Table" heading → "Event Archive Table".
- Column list updates: drop `org_breakdown`, `admin_notes`; add `companies_count`, `impaired_participant_count`, `non_impaired_participant_count`, `source_purged_at`.
- Add a new section describing `event_archive_org_lines` (paste from `software/nextjs/lib/db/schema.ts` once Task 1 has landed — same column shape, snake_case names).
- Anywhere the doc describes the "Generate Summary" flow, update to describe the new atomic archive flow: snapshot + delete source rows + status flip.

If the file makes no mention of `event_summaries`, this step is a no-op — skip to Step 6.2.

### Step 6.2 — Confirm CLAUDE.md doesn't need changes

- [ ] **Run:**

```bash
grep -n "event_summaries\|event_summary\|EventSummary\|Generate Summary" CLAUDE.md software/nextjs/CLAUDE.md 2>/dev/null
```

If matches appear, update them to reference the archive. CLAUDE.md currently mentions the deprecated `syncRegistrationsToAirtable()` and the post-event CSV workflow — but should not reference event_summaries by name. If it does, replace as needed.

### Step 6.3 — Commit

- [ ] **Commit any changes:**

```bash
git add software/nextjs/documentation/DATA_MODELS.md CLAUDE.md 2>/dev/null || true

# Only commit if there are staged changes:
if ! git diff --cached --quiet; then
  git commit -m "$(cat <<'EOF'
docs: refresh DATA_MODELS for event_archive rename

Updates the data-models doc to reflect the renamed event_archive table
and the new event_archive_org_lines child. References to the old
"Generate Summary" flow are reframed as the atomic archive flow.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
else
  echo "No documentation changes needed — skipping commit."
fi
```

---

## Task 7 — Manual verification with seed data

This task runs the verification checklist from `docs/superpowers/specs/2026-05-11-event-archive-design.md` §9, using the seed fixture committed earlier (`software/nextjs/scripts/archive-seed-event.sql`).

### Step 7.1 — Reset and seed the dev DB

- [ ] **From `software/nextjs/`:**

```bash
npm run db:clear
psql "$DATABASE_URL" -f scripts/archive-seed-event.sql
```

Expected: clear completes; seed completes; the verification SELECTs in the seed file's footer (uncomment them in psql or paste manually) show the expected row counts:
- 2 events, 7 organisations
- Event A: 6 contacts, 25 volunteers, 49 Participant / 6 Group / 25 Volunteer registrations
- Event B: 2 contacts, 5 volunteers, 7 Participant / 2 Group / 5 Volunteer registrations

### Step 7.2 — Run the dev server

- [ ] **From `software/nextjs/`:**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000.

### Step 7.3 — Walk the checklist

Open http://localhost:3000/admin/p2i/manage-events in the browser. Sign in as the P2I admin if prompted (`sessionStorage.adminAuth = 'p2i'`).

- [ ] **Step 7.3a** — In the Completed section, the Manchester Arena row shows an **Archive event** button (not "Generate Summary"). Click it.
- [ ] **Step 7.3b** — The Archive event dialog opens with the new preview shape:
  - Companies count: **6**
  - Total headcount: **125** (with Participants **100** and Helpers **25** nested below)
  - Impaired: **46**, Non-impaired: **54**
  - Photo consent / Feedback / Next event counts present
  - Per-organisation list shows 6 rows with `<n> attended · <impaired> impaired, <non-impaired> not`
  - Sequence-number input present
  - **No** Notes textarea
  - Red confirmation strip explicitly warns about permanent personal-data deletion
- [ ] **Step 7.3c** — Try clicking "Archive event" with an empty sequence number — the button is disabled.
- [ ] **Step 7.3d** — Enter `43` and click **Archive event**.
- [ ] **Step 7.3e** — Spinner appears briefly. Dialog closes. The Manchester event moves out of Completed into the Archived section.
- [ ] **Step 7.3f** — Click **View Archive** on the now-archived Manchester row. Dialog opens with the layout from `EVENT_ARCHIVE_SAMPLE.md` §"What an admin sees in the CRM" — "Source data purged <today>" visible; counts match the preview from 7.3b; org lines match.

### Step 7.4 — DB-level verification

- [ ] **In Drizzle Studio or psql,** confirm post-archive row counts. Run from `software/nextjs/`:

```bash
psql "$DATABASE_URL" -c "
SELECT 'events' AS what, count(*) AS n FROM events
UNION ALL SELECT 'organisations', count(*) FROM organisations
UNION ALL SELECT 'event_archive', count(*) FROM event_archive
UNION ALL SELECT 'event_archive_org_lines', count(*) FROM event_archive_org_lines
UNION ALL SELECT 'org_contacts EventA', count(*) FROM organisation_contacts WHERE event_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'org_contacts EventB', count(*) FROM organisation_contacts WHERE event_id = 'a0000000-0000-0000-0000-000000000002'
UNION ALL SELECT 'volunteers EventA', count(*) FROM volunteers WHERE event_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'volunteers EventB', count(*) FROM volunteers WHERE event_id = 'a0000000-0000-0000-0000-000000000002'
UNION ALL SELECT 'regs EventA', count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000001'
UNION ALL SELECT 'regs EventB', count(*) FROM registrations WHERE event_id = 'a0000000-0000-0000-0000-000000000002';"
```

Expected results:
- events: **2** (Manchester row kept, status now `archived`)
- organisations: **7** (none deleted; Salford held in place by Event B's contact)
- event_archive: **1**
- event_archive_org_lines: **6**
- org_contacts EventA: **0**, org_contacts EventB: **2**
- volunteers EventA: **0**, volunteers EventB: **5**
- regs EventA: **0**, regs EventB: **14**

If any row count is off, **stop** and investigate before committing — the wipe boundary is the most important behaviour of this whole feature.

### Step 7.5 — Regression checks

- [ ] **Step 7.5a** — Visit `/registration` in the browser. The Liverpool event (Event B, `active`) is the current active event; the registration form should load and let you start a fake registration. (Don't submit — just confirm the form renders with org options.)
- [ ] **Step 7.5b** — Visit `/admin/event/registrations` (after setting `sessionStorage.adminAuth = 'event'` and `sessionStorage.administeringEventId = '<Event B uuid>'`). Confirm Event B's 14 registrations are shown.
- [ ] **Step 7.5c** — Visit `/admin/event/report` for Event B. Confirm counts render without throwing.
- [ ] **Step 7.5d** — Visit `/admin/p2i/manage-events` again. Confirm the Manchester archived row's **View Archive** button works on a fresh page load.
- [ ] **Step 7.5e** — From `software/nextjs/`, run `npm run build` one more time. Expected: schema drift check still passes, build succeeds.

### Step 7.6 — Record results and commit verification artifacts

- [ ] **Decide if any final cleanup is needed.** If any verification step revealed a defect, fix it now, re-test, and commit a fix as a separate commit.

- [ ] **No commit is needed for the verification task itself** unless step 7.6's fix produced changes. The branch is now ready for review / merge.

---

## Self-review checklist (run after writing this plan)

✅ Every spec section maps to at least one task:
- Spec §3 (schema) → Task 1
- Spec §4 (archive flow) → Task 3 (DB service) + Task 4 (action export)
- Spec §5 (UI changes) → Task 5
- Spec §6 (counting semantics) → Task 3 (`computeArchiveData` body) + Task 2 (`EventArchivePreview` doc comment)
- Spec §7 (code rename surface) → spread across Tasks 1-5
- Spec §8 risks: Neon transaction support is addressed in Task 3 step 3.3 (with documented fallback); existing event_summaries rows in §3.3 step 1.1; participant-count semantics in §6; sequence-number uniqueness — open per spec, plan does NOT add the constraint, matching the spec
- Spec §9 (verification checklist) → Task 7
- Spec §10 (documentation updates) → Task 6
- Spec §11 milestones map 1:1 onto Tasks 1-7

✅ No placeholders, TBDs, or "implement similarly" hand-waves — every code block is concrete.

✅ Type consistency:
- `archiveId` (string) vs `id` (uuid) — checked, both refer to the `event_archive.id` column
- `EventArchivePreview.orgLines` is `Omit<EventArchiveOrgLine, 'id' | 'archiveId' | 'createdAt'>[]` — preview lines don't have these fields yet; saved view has full `EventArchiveOrgLine[]` — consistent across Task 2, 3, 5
- Method names: `previewEventArchive`, `archiveEvent`, `getEventArchive` — consistent across schema, db-service, actions, UI

✅ The plan does not touch `clearEventData` (`software/nextjs/lib/actions.ts:303`), which has overlapping behaviour but a different use case (admin "clear and archive without keeping counts"). It is left in place; future cleanup can decide whether to remove it.
