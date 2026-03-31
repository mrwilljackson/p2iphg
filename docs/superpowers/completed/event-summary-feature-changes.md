# Event Summary Feature — Completed Changes

**Date:** 2026-03-27
**Branch:** `feature/event-summary`
**Plan:** `docs/superpowers/plans/2026-03-27-event-summary.md`

---

## Overview

Allows a P2I admin to generate a structured summary snapshot for a completed event, archive the event, and view archived events in a dedicated section of the manage-events page. No data is deleted during archival.

---

## Tasks Completed

### Task 1: DB Schema — `eventSummaries` table

**File:** `software/nextjs/lib/db/schema.ts`

- Updated the `status` column comment on the `events` table to include `'archived'`
- Added `eventSummaries` table with the following columns:
  - `id` (UUID, primary key)
  - `eventId` (UUID, unique, FK to `events.id`)
  - `eventName`, `eventDate`, `eventLocation`, `eventDescription`, `eventAirtableRecordId` — point-in-time snapshot of event metadata
  - `participantCount`, `volunteerCount`, `groupCount`, `totalHeadcount` — registration counts
  - `photoConsentCount`, `feedbackConsentCount`, `nextEventConsentCount` — consent counts
  - `orgBreakdown` — JSON string of `{ orgName, headcount }[]`
  - `eventSequenceNumber` — admin-entered sequence number
  - `adminNotes` — optional admin notes
  - `createdAt` — timestamp
- Exported `EventSummaryRow` and `NewEventSummaryRow` types
- Pushed schema to Neon DB (also cleaned up 5 redundant legacy columns)

### Task 2: Types — `EventSummaryPreview` and `EventSummary`

**File:** `software/nextjs/lib/types.ts`

- Added `EventSummaryPreview` interface — read-only preview of computed counts (participantCount, volunteerCount, groupCount, totalHeadcount, consent counts, orgBreakdown)
- Added `EventSummary` interface — extends preview with persisted fields (id, eventId, event metadata, sequenceNumber, adminNotes, createdAt)

### Task 3: DB Service — Summary Computation Methods

**File:** `software/nextjs/lib/db-service.ts`

- Added `eventSummaries` to schema import, `inArray` to drizzle-orm import, `EventSummaryPreview` and `EventSummary` to types import
- Added `computeSummaryData` (private static) — fetches all registrations for an event and applies open/closed group headcount rules:
  - Closed groups: `groupSize + 1` if leader participating
  - Open groups: leader only if participating
  - Participants: 1 each
  - Builds org breakdown by `organisationName` using the same rules
- Added `previewEventSummary` (public static) — returns computed counts without writing to DB; validates event exists and status is `'completed'`
- Added `generateEventSummary` (public static) — computes counts, inserts summary row, sets event status to `'archived'`; sequential two-step write (no transaction support on Neon HTTP)

### Task 4: Server Actions — Wrappers

**File:** `software/nextjs/lib/actions.ts`

- Added `EventSummaryPreview` and `EventSummary` to the types import
- Added `previewEventSummary(eventId)` — thin wrapper around `DatabaseService.previewEventSummary`
- Added `generateEventSummary(eventId, sequenceNumber, notes)` — thin wrapper around `DatabaseService.generateEventSummary`

### Task 5: P2I Admin Page — Generate Summary Button + Modal

**File:** `software/nextjs/app/admin/p2i/page.tsx`

- Added imports: `previewEventSummary`, `generateEventSummary` actions; `EventSummaryPreview` type; `Textarea` UI component
- Added state variables: `isGenerateSummaryOpen`, `summaryPreview`, `isSummaryPreviewLoading`, `summarySequenceNumber`, `summaryNotes`, `isArchiving`
- Added `handleGenerateSummaryOpen` handler — opens modal, fetches preview data, resets state on close
- Added `handleArchiveEvent` handler — validates sequence number, calls `generateEventSummary`, reloads page
- Added **Generate Summary banner** (blue) — shown when event status is `'completed'`; contains Dialog with:
  - Registration counts section (participants, volunteers, group leaders, total headcount)
  - Consent counts section (photo, feedback, next event)
  - Organisation breakdown section (sorted by headcount descending)
  - Admin input: sequence number (required) and notes (optional)
  - Warning text about archival
  - Archive button (disabled until sequence number entered)
- Added **Archived Event banner** (grey) — shown when event status is `'archived'`
- Fixed status badge colour: `archived` now shows `bg-gray-100 text-gray-600` instead of falling through to red

### Task 6: Manage Events Page — Three-Section Layout

**File:** `software/nextjs/app/admin/p2i/manage-events/page.tsx`

- Replaced single flat table with three filtered sections:
  - **Active / Planned** — full table with all columns and action buttons (Set as Current, Edit, Delete, Administer); active events show "Current Event" badge
  - **Completed** — full table with all columns and action buttons
  - **Archived** — reduced table (name, date, status only); no action buttons; grey/muted styling with `opacity-75`; badge is `bg-gray-100 text-gray-500`
- Each section shows a message when empty (e.g. "No archived events.")

---

## Build Status

All changes pass `npm run build` with zero TypeScript errors.

---

## Verification Checklist

1. [ ] Set an event to `status = 'completed'` in Drizzle Studio
2. [ ] Navigate to `/admin/p2i` and administer that event — blue "Generate Summary" banner appears; "Archived" banner does NOT appear
3. [ ] Click "Generate Summary" — modal opens showing computed counts; loading state visible briefly
4. [ ] Confirm "Archive this event" button is disabled until sequence number is entered
5. [ ] Click Cancel — modal closes, no row in `event_summaries` (verify in Drizzle Studio)
6. [ ] Re-open modal, enter sequence number and optional notes, click "Archive this event"
7. [ ] Confirm modal closes and page reloads showing "Archived" banner; no "Generate Summary" button
8. [ ] Navigate to `/admin/p2i/manage-events` — event appears in **Archived** section with name only; no action buttons; badge is grey
9. [ ] Confirm no data deleted: registrations, volunteers, organisations, organisation_contacts all intact in Drizzle Studio
10. [ ] Confirm one row in `event_summaries` with correct counts
11. [ ] Attempt to insert a second `event_summaries` row for the same event via Drizzle Studio — should fail (unique constraint on `event_id`)
12. [ ] Regression: active/planned events appear in the Active/Planned section with all action buttons
13. [ ] Regression: completed events appear in the Completed section with all action buttons
14. [ ] Regression: the public registration form is unaffected
