# Event Summary Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a P2I admin to generate a structured summary snapshot for a completed event, archive the event, and see archived events in a dedicated section of the manage-events page.

**Architecture:** New `event_summaries` DB table stores a point-in-time snapshot of counts and admin notes. A modal on the P2I admin dashboard fetches a live preview of the computed counts before the admin commits. Saving calls `generateEventSummary` which inserts the summary row and sets the event status to `'archived'`. No data is deleted. The manage-events page is restructured into three sections to surface archived events clearly.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon PostgreSQL (HTTP, no transactions), React `useState`, Shadcn UI (Dialog, Button, Input, Textarea, Label), TypeScript

---

## File Map

| File | Change |
|---|---|
| `lib/db/schema.ts` | Add `eventSummaries` table definition |
| `lib/types.ts` | Add `EventSummaryPreview` and `EventSummary` interfaces |
| `lib/db-service.ts` | Add `computeSummaryData` (private), `previewEventSummary`, `generateEventSummary` |
| `lib/actions.ts` | Add `previewEventSummary` and `generateEventSummary` server action wrappers |
| `app/admin/p2i/page.tsx` | Add "Generate Summary" button + modal; fix archived badge colour |
| `app/admin/p2i/manage-events/page.tsx` | Three-section layout; fix archived badge colour; archived row = name only |

---

### Task 1: DB Schema — `eventSummaries` table

**Files:**
- Modify: `software/nextjs/lib/db/schema.ts`

- [ ] **Step 1: Add the `eventSummaries` table to schema.ts, and update the `events` status comment**

Open `lib/db/schema.ts`. First, update the comment on the `status` column of the `events` table to include `'archived'`:

```ts
// Change:
  status: text('status').notNull(), // 'planned' | 'active' | 'completed'
// To:
  status: text('status').notNull(), // 'planned' | 'active' | 'completed' | 'archived'
```

Then, after the `organisationContacts` table block, add:

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

- [ ] **Step 2: Push the schema change to the DB**

```bash
cd software/nextjs && npm run db:push
```

Expected: Drizzle reports the new `event_summaries` table was created. No errors.

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/lib/db/schema.ts
git commit -m "feat: add event_summaries table to schema"
```

---

### Task 2: Types — `EventSummaryPreview` and `EventSummary`

**Files:**
- Modify: `software/nextjs/lib/types.ts`

- [ ] **Step 1: Add the interfaces at the end of `lib/types.ts`**

Append after the last line of the file:

```ts
// ============================================================================
// Event Summary Types
// ============================================================================

/**
 * Read-only preview of computed event counts (returned before saving).
 */
export interface EventSummaryPreview {
  participantCount: number;
  volunteerCount: number;
  groupCount: number;
  totalHeadcount: number;
  photoConsentCount: number;
  feedbackConsentCount: number;
  nextEventConsentCount: number;
  orgBreakdown: { orgName: string; headcount: number }[];
}

/**
 * Saved event summary — persisted snapshot plus admin-entered fields.
 */
export interface EventSummary extends EventSummaryPreview {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventAirtableRecordId: string | null;
  eventSequenceNumber: number;
  adminNotes: string | null;
  createdAt: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add software/nextjs/lib/types.ts
git commit -m "feat: add EventSummaryPreview and EventSummary types"
```

---

### Task 3: DB Service — summary computation methods

**Files:**
- Modify: `software/nextjs/lib/db-service.ts`

- [ ] **Step 1: Update imports in `lib/db-service.ts`**

In the imports block, add `eventSummaries` to the schema import and `inArray` to the drizzle-orm import:

```ts
// Change this line:
import { events, organisations, organisationContacts, volunteers, registrations } from './db/schema';
// To:
import { events, organisations, organisationContacts, volunteers, registrations, eventSummaries } from './db/schema';

// Change this line:
import { eq, and, ilike, sql } from 'drizzle-orm';
// To:
import { eq, and, ilike, sql, inArray } from 'drizzle-orm';
```

Also add to the types import from `'./types'`:
```ts
// Add EventSummaryPreview and EventSummary to the existing types import:
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
```

- [ ] **Step 2: Add the private `computeSummaryData` method to `DatabaseService`**

Add this private static method inside the `DatabaseService` class, before the closing `}`. This method fetches all registrations for an event and applies the open/closed headcount rules from the spec:

```ts
  /**
   * Compute summary counts for an event without writing to the DB.
   * Uses open/closed group logic: closed groups count groupSize + leader;
   * open groups count leader only if participating.
   */
  private static async computeSummaryData(
    eventId: string,
    event: { id: string; airtableRecordId?: string },
  ): Promise<EventSummaryPreview> {
    // Fetch all registrations for this event
    const regs = await db
      .select()
      .from(registrations)
      .where(eq(registrations.eventId, eventId));

    const groupRegs = regs.filter(r => r.role === 'Group');
    const participantRegs = regs.filter(r => r.role === 'Participant');

    // Build openGroup lookup: organisations.id (UUID) → isOpen (boolean)
    const openGroupMap = new Map<string, boolean>();
    const orgUuids = [...new Set(
      groupRegs.map(r => r.organizationId).filter((id): id is string => id != null)
    )];

    if (orgUuids.length > 0 && event.airtableRecordId) {
      const orgRows = await db
        .select({ orgId: organisations.id, openGroup: organisationContacts.openGroup })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          and(
            eq(organisationContacts.organisationId, organisations.airtableRecordId),
            eq(organisationContacts.airtableEventId, event.airtableRecordId),
          ),
        )
        .where(inArray(organisations.id, orgUuids));

      for (const row of orgRows) {
        // row.openGroup is normally boolean (notNull in DB), but the leftJoin can return null
        // when no matching organisationContacts row exists for this event.
        // `!== false` is intentional: null (no contact found) defaults to open, matching spec behaviour.
        openGroupMap.set(row.orgId, row.openGroup !== false);
      }
    }

    // Role counts
    const participantCount = participantRegs.length;
    const volunteerCount = regs.filter(r => r.role === 'Volunteer').length;
    const groupCount = groupRegs.length;

    // Headcount: participants = 1 each; groups use open/closed rules
    let totalHeadcount = participantCount;
    for (const reg of groupRegs) {
      const isOpen = reg.organizationId
        ? (openGroupMap.get(reg.organizationId) ?? true)
        : true;
      if (!isOpen) {
        // Closed group: groupSize + 1 if leader participating
        totalHeadcount += reg.groupSize ?? 0;
        if (reg.groupLeaderParticipating === true) totalHeadcount += 1;
      } else {
        // Open group: leader only if participating
        if (reg.groupLeaderParticipating === true) totalHeadcount += 1;
      }
    }

    // Consent counts (across all roles)
    const photoConsentCount = regs.filter(r => r.photoConsent === true).length;
    const feedbackConsentCount = regs.filter(r => r.feedbackConsent === true).length;
    const nextEventConsentCount = regs.filter(r => r.nextEventConsent === true).length;

    // Org breakdown by organisationName snapshot, using same open/closed headcount rules
    const orgHeadcountMap = new Map<string, number>();

    for (const reg of participantRegs) {
      const orgName = reg.organisationName ?? 'No organisation';
      orgHeadcountMap.set(orgName, (orgHeadcountMap.get(orgName) ?? 0) + 1);
    }

    for (const reg of groupRegs) {
      const orgName = reg.organisationName ?? 'No organisation';
      const isOpen = reg.organizationId
        ? (openGroupMap.get(reg.organizationId) ?? true)
        : true;
      let contribution = 0;
      if (!isOpen) {
        contribution += reg.groupSize ?? 0;
        if (reg.groupLeaderParticipating === true) contribution += 1;
      } else {
        if (reg.groupLeaderParticipating === true) contribution += 1;
      }
      if (contribution > 0) {
        orgHeadcountMap.set(orgName, (orgHeadcountMap.get(orgName) ?? 0) + contribution);
      }
    }

    const orgBreakdown = [...orgHeadcountMap.entries()]
      .map(([orgName, headcount]) => ({ orgName, headcount }))
      .sort((a, b) => b.headcount - a.headcount);

    return {
      participantCount,
      volunteerCount,
      groupCount,
      totalHeadcount,
      photoConsentCount,
      feedbackConsentCount,
      nextEventConsentCount,
      orgBreakdown,
    };
  }
```

- [ ] **Step 3: Add `previewEventSummary` (read-only)**

Add after `computeSummaryData`:

```ts
  /**
   * Compute and return event summary counts without writing anything to the DB.
   * Used by the modal to show a preview before the admin confirms.
   * Throws if the event is not found or not status='completed'.
   */
  static async previewEventSummary(eventId: string): Promise<EventSummaryPreview> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status})`);
    }
    return DatabaseService.computeSummaryData(eventId, {
      id: event.id,
      airtableRecordId: event.airtableRecordId ?? undefined,
    });
  }
```

- [ ] **Step 4: Add `generateEventSummary` (write)**

Add after `previewEventSummary`:

```ts
  /**
   * Generate and persist an event summary, then set the event status to 'archived'.
   *
   * Atomicity note: Neon HTTP client has no transaction support. Steps run sequentially:
   * 1. Insert summary row
   * 2. Update event status to 'archived'
   * If step 2 fails, the summary row exists but the event remains 'completed'.
   * This is the preferred failure mode — it is recoverable by retrying.
   *
   * Throws if the event is not found or not status='completed'.
   */
  static async generateEventSummary(
    eventId: string,
    eventSequenceNumber: number,
    adminNotes: string | null,
  ): Promise<EventSummary> {
    const eventRows = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    const event = eventRows[0];
    if (!event) throw new Error(`Event not found: ${eventId}`);
    if (event.status !== 'completed') {
      throw new Error(`Event is not completed (status: ${event.status})`);
    }

    const preview = await DatabaseService.computeSummaryData(eventId, {
      id: event.id,
      airtableRecordId: event.airtableRecordId ?? undefined,
    });

    // Step 1: Insert summary row
    const inserted = await db
      .insert(eventSummaries)
      .values({
        eventId,
        eventName: event.name,
        eventDate: event.date,
        eventLocation: event.location ?? null,
        eventDescription: event.description ?? null,
        eventAirtableRecordId: event.airtableRecordId ?? null,
        participantCount: preview.participantCount,
        volunteerCount: preview.volunteerCount,
        groupCount: preview.groupCount,
        totalHeadcount: preview.totalHeadcount,
        photoConsentCount: preview.photoConsentCount,
        feedbackConsentCount: preview.feedbackConsentCount,
        nextEventConsentCount: preview.nextEventConsentCount,
        orgBreakdown: JSON.stringify(preview.orgBreakdown),
        eventSequenceNumber,
        adminNotes: adminNotes ?? null,
      })
      .returning();

    const row = inserted[0];
    if (!row) throw new Error('Failed to insert event summary');

    // Step 2: Archive the event
    await db
      .update(events)
      .set({ status: 'archived' })
      .where(eq(events.id, eventId));

    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      eventDate: row.eventDate,
      eventLocation: row.eventLocation,
      eventDescription: row.eventDescription,
      eventAirtableRecordId: row.eventAirtableRecordId,
      participantCount: row.participantCount,
      volunteerCount: row.volunteerCount,
      groupCount: row.groupCount,
      totalHeadcount: row.totalHeadcount,
      photoConsentCount: row.photoConsentCount,
      feedbackConsentCount: row.feedbackConsentCount,
      nextEventConsentCount: row.nextEventConsentCount,
      orgBreakdown: JSON.parse(row.orgBreakdown) as { orgName: string; headcount: number }[],
      eventSequenceNumber: row.eventSequenceNumber,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }
```

- [ ] **Step 5: Build check**

```bash
cd software/nextjs && npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors. (Build may show unrelated warnings — that's fine.)

- [ ] **Step 6: Commit**

```bash
git add software/nextjs/lib/db-service.ts
git commit -m "feat: add computeSummaryData, previewEventSummary, generateEventSummary to DatabaseService"
```

---

### Task 4: Server Actions — wrappers

**Files:**
- Modify: `software/nextjs/lib/actions.ts`

- [ ] **Step 1: Verify `'use server'` directive, then add type imports and two new exports to `lib/actions.ts`**

Confirm `lib/actions.ts` has `"use server";` as its first line. The new exports inherit this directive automatically — no change needed, just verify it is present.

In the existing type import line at the top, add `EventSummaryPreview` and `EventSummary`:

```ts
// Change:
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption } from './types';
// To:
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption, EventSummaryPreview, EventSummary } from './types';
```

Then append the two new exports at the end of the file:

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

- [ ] **Step 2: Build check**

```bash
cd software/nextjs && npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/lib/actions.ts
git commit -m "feat: add previewEventSummary and generateEventSummary server actions"
```

---

### Task 5: P2I Admin page — Generate Summary button + modal

**Files:**
- Modify: `software/nextjs/app/admin/p2i/page.tsx`

- [ ] **Step 1: Add action imports**

Find the existing import line:

```ts
import { getCurrentEvent, getEventById, getRegistrationCountsByRole, getAllRegistrations, getOrganizations, getAllVolunteers, createEvent, markEventCompleted, getEventDataCounts, clearEventData } from "@/lib/actions";
```

Add `previewEventSummary` and `generateEventSummary` to it:

```ts
import { getCurrentEvent, getEventById, getRegistrationCountsByRole, getAllRegistrations, getOrganizations, getAllVolunteers, createEvent, markEventCompleted, getEventDataCounts, clearEventData, previewEventSummary, generateEventSummary } from "@/lib/actions";
```

Also add the type import:

```ts
// Add to the existing type import line:
import type { Event, Registration, Organization, Volunteer, EventSummaryPreview } from "@/lib/types";
```

Add the Textarea import to the UI imports (it's already imported in manage-events; check if it's missing from this page):

```ts
import { Textarea } from "@/components/ui/textarea";
```

- [ ] **Step 2: Add Generate Summary dialog state**

Find the Clear Event Data Dialog State block and add the Generate Summary state immediately after it:

```ts
  // Generate Summary Dialog State
  const [isGenerateSummaryOpen, setIsGenerateSummaryOpen] = useState(false);
  const [summaryPreview, setSummaryPreview] = useState<EventSummaryPreview | null>(null);
  const [isSummaryPreviewLoading, setIsSummaryPreviewLoading] = useState(false);
  const [summarySequenceNumber, setSummarySequenceNumber] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
```

- [ ] **Step 3: Add the modal open handler**

Find `handleClearEventDialogOpen` and add the Generate Summary handler after it:

```ts
  const handleGenerateSummaryOpen = async (open: boolean) => {
    setIsGenerateSummaryOpen(open);
    if (!open) {
      setSummaryPreview(null);
      setSummarySequenceNumber("");
      setSummaryNotes("");
      return;
    }
    if (currentEvent) {
      setIsSummaryPreviewLoading(true);
      try {
        const preview = await previewEventSummary(currentEvent.id);
        setSummaryPreview(preview);
      } catch (error) {
        console.error("Failed to load summary preview:", error);
        alert("Failed to load event summary. " + (error instanceof Error ? error.message : ""));
        setIsGenerateSummaryOpen(false);
      } finally {
        setIsSummaryPreviewLoading(false);
      }
    }
  };
```

- [ ] **Step 4: Add the archive handler**

```ts
  const handleArchiveEvent = async () => {
    if (!currentEvent) return;
    const seqNum = parseInt(summarySequenceNumber, 10);
    if (isNaN(seqNum)) return;
    try {
      setIsArchiving(true);
      await generateEventSummary(currentEvent.id, seqNum, summaryNotes.trim() || null);
      setIsGenerateSummaryOpen(false);
      // Reload the page to reflect the new archived status
      window.location.reload();
    } catch (error) {
      console.error("Failed to archive event:", error);
      alert("Failed to archive event. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsArchiving(false);
    }
  };
```

- [ ] **Step 5: Add the "Generate Summary" banner for completed events**

Find the existing Past Event Warning Banner block:

```tsx
        {/* Past Event Warning Banner */}
        {currentEvent && isEventPast && currentEvent.status === 'active' && (
```

Add the Generate Summary banner **after** that block (after its closing parenthesis `)`):

```tsx
        {/* Generate Summary Banner — shown for completed events */}
        {currentEvent && currentEvent.status === 'completed' && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-semibold text-blue-800">This event is completed</p>
                <p className="text-sm text-blue-700">
                  Generate a summary snapshot to archive this event. Registration data will not be deleted.
                </p>
              </div>
            </div>
            <Dialog open={isGenerateSummaryOpen} onOpenChange={handleGenerateSummaryOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  📋 Generate Summary
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Generate Event Summary</DialogTitle>
                  <DialogDescription>
                    Review the computed counts below, then enter a sequence number and optional notes before archiving.
                  </DialogDescription>
                </DialogHeader>

                {isSummaryPreviewLoading ? (
                  <div className="py-8 text-center text-gray-500">Loading summary data...</div>
                ) : summaryPreview ? (
                  <div className="space-y-4 py-2">
                    {/* Registration counts */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">Registration Counts</h4>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participants</span>
                        <span className="font-medium">{summaryPreview.participantCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Volunteers</span>
                        <span className="font-medium">{summaryPreview.volunteerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Group leaders</span>
                        <span className="font-medium">{summaryPreview.groupCount}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold">
                        <span className="text-gray-900">Total headcount</span>
                        <span>{summaryPreview.totalHeadcount}</span>
                      </div>
                    </div>

                    {/* Consent counts */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Photo consent</span>
                        <span className="font-medium">{summaryPreview.photoConsentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Feedback consent</span>
                        <span className="font-medium">{summaryPreview.feedbackConsentCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next event consent</span>
                        <span className="font-medium">{summaryPreview.nextEventConsentCount}</span>
                      </div>
                    </div>

                    {/* Org breakdown */}
                    {summaryPreview.orgBreakdown.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Organisation Breakdown</h4>
                        <div className="space-y-1">
                          {summaryPreview.orgBreakdown.map(({ orgName, headcount }) => (
                            <div key={orgName} className="flex justify-between">
                              <span className="text-gray-600 truncate mr-4">{orgName}</span>
                              <span className="font-medium shrink-0">{headcount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin input */}
                    <div className="space-y-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="seq-number">Event sequence number *</Label>
                        <Input
                          id="seq-number"
                          type="number"
                          min="1"
                          value={summarySequenceNumber}
                          onChange={(e) => setSummarySequenceNumber(e.target.value)}
                          placeholder="e.g. 42"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="admin-notes">Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                        <Textarea
                          id="admin-notes"
                          rows={3}
                          value={summaryNotes}
                          onChange={(e) => setSummaryNotes(e.target.value)}
                          placeholder="Any notes about this event..."
                        />
                      </div>
                    </div>

                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      This will mark the event as archived. Registration data will not be deleted.
                    </p>
                  </div>
                ) : null}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateSummaryOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleArchiveEvent}
                    disabled={!summaryPreview || !summarySequenceNumber.trim() || isNaN(parseInt(summarySequenceNumber, 10)) || isArchiving}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isArchiving ? "Archiving..." : "Archive this event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Archived Event Banner */}
        {currentEvent && currentEvent.status === 'archived' && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-8 flex items-center gap-3">
            <span className="text-2xl">🗂️</span>
            <div>
              <p className="font-semibold text-gray-700">This event is archived</p>
              <p className="text-sm text-gray-500">A summary has been saved. No further actions are available.</p>
            </div>
          </div>
        )}
```

- [ ] **Step 6: Fix the status badge colour for `archived` in the event card header**

Find the status badge logic in the Current Event Card (around line 559–567):

```tsx
              currentEvent?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : currentEvent?.status === 'planned'
                ? 'bg-blue-100 text-blue-800'
                : currentEvent?.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
```

Replace with:

```tsx
              currentEvent?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : currentEvent?.status === 'planned'
                ? 'bg-blue-100 text-blue-800'
                : currentEvent?.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : currentEvent?.status === 'archived'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-red-100 text-red-800'
```

- [ ] **Step 7: Build check**

```bash
cd software/nextjs && npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 8: Commit**

```bash
git add software/nextjs/app/admin/p2i/page.tsx
git commit -m "feat: add Generate Summary button and archive modal to P2I admin dashboard"
```

---

### Task 6: Manage Events page — three-section layout

**Files:**
- Modify: `software/nextjs/app/admin/p2i/manage-events/page.tsx`

- [ ] **Step 1: Replace the single table with three filtered sections**

The current page renders one flat `<table>` over all events. Replace the entire `{events.length === 0 ? ... : ...}` block inside `<main>` with a three-section layout.

Find:
```tsx
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No events found in the database.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              ...
            </table>
          </div>
        )}
```

Replace with:

```tsx
        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No events found in the database.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section: Active / Planned */}
            {(() => {
              const activePlanned = events.filter(e => e.status === 'active' || e.status === 'planned');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Active / Planned</h2>
                  {activePlanned.length === 0 ? (
                    <p className="text-sm text-gray-500">No active or planned events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activePlanned.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">{event.name}</div>
                                  {event.status === 'active' && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Current Event
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                <div className="text-sm text-gray-900 truncate">{event.location || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {event.status !== 'active' && (
                                  <Button size="sm" variant="outline" onClick={() => handleSetCurrent(event.id)} disabled={settingCurrent !== null}>
                                    {settingCurrent === event.id ? 'Setting...' : 'Set as Current'}
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(event)} disabled={deletingId === event.id}>
                                  {deletingId === event.id ? 'Deleting...' : 'Delete'}
                                </Button>
                                <Button size="sm" onClick={() => handleAdminister(event.id)}>Administer →</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Section: Completed */}
            {(() => {
              const completed = events.filter(e => e.status === 'completed');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Completed</h2>
                  {completed.length === 0 ? (
                    <p className="text-sm text-gray-500">No completed events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completed.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{event.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                <div className="text-sm text-gray-900 truncate">{event.location || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Completed
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <Button size="sm" variant="outline" onClick={() => handleSetCurrent(event.id)} disabled={settingCurrent !== null}>
                                  {settingCurrent === event.id ? 'Setting...' : 'Set as Current'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(event)} disabled={deletingId === event.id}>
                                  {deletingId === event.id ? 'Deleting...' : 'Delete'}
                                </Button>
                                <Button size="sm" onClick={() => handleAdminister(event.id)}>Administer →</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Section: Archived */}
            {(() => {
              const archived = events.filter(e => e.status === 'archived');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-500 mb-3">Archived</h2>
                  {archived.length === 0 ? (
                    <p className="text-sm text-gray-400">No archived events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden opacity-75">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {archived.map((event) => (
                            <tr key={event.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-500">{event.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-400">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Archived
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}
          </div>
        )}
```

- [ ] **Step 2: Build check**

```bash
cd software/nextjs && npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/app/admin/p2i/manage-events/page.tsx
git commit -m "feat: split manage-events into three sections; add archived section with grey badge"
```

---

## Verification Checklist

1. Set an event to `status = 'completed'` in Drizzle Studio
2. Navigate to `/admin/p2i` and administer that event — the blue "Generate Summary" banner appears; the "Archived" banner does NOT appear
3. Click "Generate Summary" — modal opens showing computed counts (participants, volunteers, groups, headcount, consents, org breakdown); loading state visible briefly
4. Confirm "Archive this event" button is disabled until sequence number is entered
5. Click Cancel — modal closes, no row in `event_summaries` (verify in Drizzle Studio)
6. Re-open modal, enter sequence number and optional notes, click "Archive this event"
7. Confirm modal closes and page reloads showing "Archived" banner; no "Generate Summary" button
8. Navigate to `/admin/p2i/manage-events` — event appears in **Archived** section with name only; no action buttons; badge is grey (`bg-gray-100 text-gray-500`), not red
9. Confirm no data deleted: registrations, volunteers, organisations, organisation_contacts all intact in Drizzle Studio
10. Confirm one row in `event_summaries` with correct counts
11. Attempt to insert a second `event_summaries` row for the same event via Drizzle Studio — should fail (unique constraint on `event_id`)
12. Regression: active/planned events appear in the Active/Planned section with all action buttons
13. Regression: completed events appear in the Completed section with all action buttons
14. Regression: the public registration form is unaffected
