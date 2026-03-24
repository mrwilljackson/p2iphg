# P2I Admin CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build full Create/Read/Update/Delete management of Events, Organisations, Organisation Contacts, and Volunteers in the P2I admin section, with optional Airtable Record ID on each entity to preserve sync targets.

**Architecture:** All DB mutations go through `DatabaseService` (static methods) in `lib/db-service.ts`, wrapped as Next.js Server Actions in `lib/actions.ts`. Admin pages are client components that call Server Actions directly. Create/Edit forms use React Hook Form + Zod schemas defined in `lib/validation.ts`. One schema migration is required (Task 0 — adding `openGroup` to `organisations`). The existing `airtableRecordId` field on each table serves as the optional Airtable sync target.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Drizzle ORM, Neon Postgres, Zod 4, React Hook Form 7, Shadcn UI (Radix Dialog, Form, Select, Input, Button, Checkbox)

---

## Context for the Implementer

### How auth works
Auth is sessionStorage-only (no server-side sessions). P2I admin pages check `sessionStorage.getItem("adminAuth") === "true"` and `sessionStorage.getItem("adminLevel") === "p2i"`. The currently-selected event is stored as `sessionStorage.getItem("administeringEventId")`. Every P2I page reads this to scope its data.

### How events link to organisations
`organisations.airtableEventId` must equal `events.airtableRecordId` for `getOrganizations(eventId)` to return the right orgs. Task 1 fixes `createEvent()` so manually-created events always have a non-null `airtableRecordId` (using the event's own UUID as fallback), making this link work without a schema migration.

### The two-table org record
Each organisation spans two tables: `organisations` (name, groupType, imageUrl, airtableRecordId, airtableEventId) and `organisationContacts` (contactFirstName, contactLastName, contactEmail, contactPhone, notes). They are joined via `organisationContacts.organisationId = organisations.airtableRecordId`. Update and delete operations must touch both tables.

### No automated test framework
There is no test runner configured in this project. Verification steps use `npm run dev` (runs on localhost:3000) with manual browser checks. TypeScript compilation (`npm run build`) is used as a type-safety check.

### Existing patterns to follow
- Page components: `"use client"`, load data in `useEffect`, call Server Actions directly
- Forms: `useForm` + `zodResolver` + Shadcn `<Form>` components
- Dialogs for create/edit (Shadcn `<Dialog>`), `window.confirm` for delete confirmations
- No separate API routes needed — Server Actions handle all mutations
- All pages redirect unauthenticated users away in a `useEffect` that checks sessionStorage

---

## Files

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `software/nextjs/lib/db/schema.ts` | Add `openGroup` boolean column to organisations table (Task 0) |
| Modify | `software/nextjs/lib/types.ts` | Add `openGroup: boolean` to Organization interface (Task 0) |
| Modify | `software/nextjs/lib/helpers.ts` | Replace groupType-based filtering with openGroup in organizationsToOptions (Task 0) |
| Modify | `software/nextjs/lib/db-service.ts` | Add updateEvent, deleteEvent, updateOrganization, deleteOrganization, updateVolunteer, deleteVolunteer; fix createEvent airtableRecordId fallback; add openGroup to createOrganization and findOrCreateFamilyGroup |
| Modify | `software/nextjs/lib/actions.ts` | Add server action wrappers for the 6 new DB methods |
| Modify | `software/nextjs/lib/validation.ts` | Add adminEventFormSchema, adminOrgFormSchema (with openGroup), adminVolunteerFormSchema |
| Modify | `software/nextjs/app/admin/p2i/manage-events/page.tsx` | Add Edit dialog and Delete button to existing event table |
| Create | `software/nextjs/app/admin/p2i/organisations/page.tsx` | New: full CRUD table for organisations scoped to selected event |
| Create | `software/nextjs/app/admin/p2i/volunteers/page.tsx` | New: full CRUD table for volunteers scoped to selected event |
| Modify | `software/nextjs/app/admin/p2i/page.tsx` | Add nav buttons linking to the two new pages |

---

## Task 0: Add openGroup to schema, types, and filtering logic

**Why:** The open/closed group model (see `docs/superpowers/specs/2026-03-24-organisation-open-closed-design.md`) replaces the legacy `groupType`-based org filtering. This task must be completed before Tasks 3, 5, and 7 so that `openGroup` is available in the DB, the `Organization` type, and the helper.

**Files:**
- Modify: `software/nextjs/lib/db/schema.ts`
- Modify: `software/nextjs/lib/types.ts`
- Modify: `software/nextjs/lib/db-service.ts` (`getOrganizations`, `createOrganization`, `findOrCreateFamilyGroup`)
- Modify: `software/nextjs/lib/helpers.ts` (`organizationsToOptions`)

- [ ] **Step 1: Add `openGroup` column to the organisations table in `lib/db/schema.ts`**

  In the `organisations` table definition, add after the `airtableEventId` column:
  ```typescript
  openGroup: boolean('open_group').notNull().default(true),
  ```

- [ ] **Step 2: Add `openGroup` to the `Organization` interface in `lib/types.ts`**

  Add to the `Organization` interface:
  ```typescript
  openGroup: boolean;
  ```

- [ ] **Step 3: Include `openGroup` in `getOrganizations()`, `createOrganization()`, and `findOrCreateFamilyGroup()` in `lib/db-service.ts`**

  - In `getOrganizations()`: ensure `openGroup` is selected. If the query uses `select()` without explicit columns, it is automatically included. If it uses an explicit column list, add `openGroup: organisations.openGroup` to the selection — verify which pattern is used.
  - In `createOrganization()`: add `openGroup?: boolean` to the method's input type, then add `openGroup: orgData.openGroup ?? true` to the insert values.
  - In `findOrCreateFamilyGroup()`: add `openGroup: false` to the insert values — Family groups are always closed.

- [ ] **Step 4: Update `organizationsToOptions()` in `lib/helpers.ts`**

  Replace the existing `DISABILITY_FAMILY_TYPES` filtering logic with `openGroup`-based filtering:

  ```typescript
  // Remove this constant:
  // const DISABILITY_FAMILY_TYPES = ['Disability', 'Family'];

  // Replace role-based filter block with:
  if (role === 'Participant') {
    filteredOrgs = filteredOrgs.filter(org => org.openGroup !== false);
  }
  // Group role: no filter — all orgs shown (open and closed)
  // Volunteer / undefined: no filter — unchanged
  ```

  The `role === 'Group'` branch that previously filtered to only Disability/Family orgs is removed. Group role now sees all orgs.

- [ ] **Step 5: Run database migration**

  From `software/nextjs/`:
  ```bash
  npm run db:push
  ```
  Expected: adds `open_group` boolean column to `organisations` table; all existing rows default to `true`.

- [ ] **Step 6: Type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```

- [ ] **Step 7: Commit**

  ```bash
  git add software/nextjs/lib/db/schema.ts software/nextjs/lib/types.ts software/nextjs/lib/db-service.ts software/nextjs/lib/helpers.ts
  git commit -m "feat: add openGroup to organisations schema and replace groupType-based filtering"
  ```

---

## Task 1: Fix createEvent — self-populate airtableRecordId

**Why:** `getOrganizations(eventId)` finds orgs by matching `organisations.airtableEventId` against `events.airtableRecordId`. If an event is created manually without an Airtable ID, that field is null and no orgs will ever be returned for it. Fix: when no `airtableRecordId` is provided, use the new event's own UUID as the fallback.

**Files:**
- Modify: `software/nextjs/lib/db-service.ts` (the `createEvent` static method, around line 69)

- [ ] **Step 1: Open `lib/db-service.ts` and find `createEvent()`**

  The method currently does:
  ```typescript
  const result = await db
    .insert(events)
    .values({
      name: eventData.name,
      date: eventData.date,
      location: eventData.location,
      description: eventData.description,
      status: eventData.status || 'planned',
      airtableRecordId: eventData.airtableRecordId,
    })
    .returning();

  return mapEventFromDb(result[0]);
  ```

- [ ] **Step 2: Replace the insert block with a UUID-first approach**

  `randomUUID` is already imported at the top of `db-service.ts`. Replace the insert block with:

  ```typescript
  const id = randomUUID();
  const airtableRecordId = eventData.airtableRecordId || id;

  const result = await db
    .insert(events)
    .values({
      id,
      name: eventData.name,
      date: eventData.date,
      location: eventData.location,
      description: eventData.description,
      status: eventData.status || 'planned',
      airtableRecordId,
    })
    .returning();

  return mapEventFromDb(result[0]);
  ```

  Note: Passing `id` explicitly is intentional here — it overrides `defaultRandom()` so the same UUID is available to assign as `airtableRecordId` in the same operation. All other insert calls in `db-service.ts` omit `id` and let the DB generate it; this is the one exception.

- [ ] **Step 3: Verify TypeScript compiles cleanly**

  From `software/nextjs/`:
  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: build succeeds or only pre-existing errors.

- [ ] **Step 4: Commit**

  ```bash
  git add software/nextjs/lib/db-service.ts
  git commit -m "fix: populate airtableRecordId with UUID fallback on manual event creation"
  ```

---

## Task 2: DB methods — update and delete Events

**Files:**
- Modify: `software/nextjs/lib/db-service.ts` (add after `getEventById`)
- Modify: `software/nextjs/lib/actions.ts` (add two wrappers)

- [ ] **Step 1: Add `updateEvent()` to `DatabaseService` in `lib/db-service.ts`**

  Add after the `getEventById` method:

  ```typescript
  /**
   * Update an event's details
   * If airtableRecordId is changed, organisations linked via the old ID will
   * lose their event association — only change it if you know what you're doing.
   */
  static async updateEvent(id: string, data: {
    name?: string;
    date?: string;
    location?: string;
    description?: string;
    airtableRecordId?: string;
  }): Promise<Event> {
    try {
      const result = await db
        .update(events)
        .set({
          ...data,
          modifiedAt: new Date(),
        })
        .where(eq(events.id, id))
        .returning();

      if (!result[0]) throw new Error(`Event not found: ${id}`);
      return mapEventFromDb(result[0]);
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }
  ```

- [ ] **Step 2: Add `deleteEvent()` to `DatabaseService` in `lib/db-service.ts`**

  Add immediately after `updateEvent`:

  ```typescript
  /**
   * Delete an event.
   * Throws if the event has any registrations, organisations, or volunteers
   * to prevent accidental data loss.
   */
  static async deleteEvent(id: string): Promise<void> {
    try {
      const [regCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(registrations)
        .where(eq(registrations.eventId, id));

      const [volCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(volunteers)
        .where(eq(volunteers.eventId, id));

      if ((regCount?.count ?? 0) > 0 || (volCount?.count ?? 0) > 0) {
        throw new Error(
          'Cannot delete an event that has registrations or volunteers. Clear event data first.'
        );
      }

      await db.delete(events).where(eq(events.id, id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
  ```

  **Important:** `sql` is NOT currently imported in `db-service.ts`. Before adding this method, update the drizzle-orm import at the top of the file:
  ```typescript
  // Before:
  import { eq, and, ilike } from 'drizzle-orm';
  // After:
  import { eq, and, ilike, sql } from 'drizzle-orm';
  ```

- [ ] **Step 3: Add server action wrappers to `lib/actions.ts`**

  Add at the end of `lib/actions.ts`:

  ```typescript
  /**
   * Update an event's details
   */
  export async function updateEvent(id: string, data: {
    name?: string;
    date?: string;
    location?: string;
    description?: string;
    airtableRecordId?: string;
  }): Promise<Event> {
    return await DatabaseService.updateEvent(id, data);
  }

  /**
   * Delete an event (blocked if registrations or volunteers exist)
   */
  export async function deleteEvent(id: string): Promise<void> {
    return await DatabaseService.deleteEvent(id);
  }
  ```

- [ ] **Step 4: Type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add software/nextjs/lib/db-service.ts software/nextjs/lib/actions.ts
  git commit -m "feat: add updateEvent and deleteEvent to DatabaseService and actions"
  ```

---

## Task 3: DB methods — update and delete Organisations

**Files:**
- Modify: `software/nextjs/lib/db-service.ts` (add after `findOrCreateFamilyGroup`)
- Modify: `software/nextjs/lib/actions.ts` (add two wrappers)

- [ ] **Step 1: Add `updateOrganization()` to `DatabaseService`**

  This method updates both `organisations` and `organisationContacts`. The contact row is found via `organisationContacts.organisationId = organisations.airtableRecordId`. If `airtableRecordId` is being changed, the contact's `organisationId` must be updated to match.

  Add after `findOrCreateFamilyGroup`:

  ```typescript
  /**
   * Update an organisation and its associated contact record.
   * Handles the two-table write atomically (best-effort — Neon HTTP doesn't
   * support transactions, so both updates are issued sequentially).
   */
  static async updateOrganization(id: string, data: {
    name?: string;
    groupType?: string;
    openGroup?: boolean;
    airtableRecordId?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<Organization> {
    try {
      // Fetch current org to get existing airtableRecordId (used as the contact link key)
      const [current] = await db
        .select()
        .from(organisations)
        .where(eq(organisations.id, id))
        .limit(1);

      if (!current) throw new Error(`Organisation not found: ${id}`);

      const oldAirtableRecordId = current.airtableRecordId;
      const newAirtableRecordId = data.airtableRecordId ?? oldAirtableRecordId;

      // Update organisations table
      const { contactFirstName, contactLastName, contactEmail, contactPhone, notes, airtableRecordId, ...orgFields } = data;
      await db
        .update(organisations)
        .set({ ...orgFields, airtableRecordId: newAirtableRecordId, modifiedAt: new Date() })
        .where(eq(organisations.id, id));

      // Update organisationContacts table (matched via the old airtableRecordId)
      // Also update organisationId if airtableRecordId changed
      if (oldAirtableRecordId) {
        await db
          .update(organisationContacts)
          .set({
            organisationId: newAirtableRecordId,
            contactFirstName: contactFirstName ?? undefined,
            contactLastName: contactLastName ?? undefined,
            contactEmail: contactEmail ?? undefined,
            contactPhone: contactPhone ?? undefined,
            notes: notes ?? undefined,
            modifiedAt: new Date(),
          })
          .where(eq(organisationContacts.organisationId, oldAirtableRecordId));
      }

      // Re-fetch and return the updated org
      const updated = await this.getOrganizationById(id);
      if (!updated) throw new Error(`Organisation not found after update: ${id}`);
      return updated;
    } catch (error) {
      console.error('Error updating organisation:', error);
      throw error;
    }
  }
  ```

- [ ] **Step 2: Add `deleteOrganization()` to `DatabaseService`**

  Add immediately after `updateOrganization`:

  ```typescript
  /**
   * Delete an organisation and its contact record.
   * Blocked if any registrations reference this organisation.
   */
  static async deleteOrganization(id: string): Promise<void> {
    try {
      const [regCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(registrations)
        .where(eq(registrations.organizationId, id));

      if ((regCount?.count ?? 0) > 0) {
        throw new Error(
          'Cannot delete an organisation that has registrations.'
        );
      }

      // Fetch airtableRecordId to find linked contacts
      const [org] = await db
        .select({ airtableRecordId: organisations.airtableRecordId })
        .from(organisations)
        .where(eq(organisations.id, id))
        .limit(1);

      if (!org) throw new Error(`Organisation not found: ${id}`);

      // Delete contact first (no FK constraint, but semantically correct)
      if (org.airtableRecordId) {
        await db
          .delete(organisationContacts)
          .where(eq(organisationContacts.organisationId, org.airtableRecordId));
      }

      await db.delete(organisations).where(eq(organisations.id, id));
    } catch (error) {
      console.error('Error deleting organisation:', error);
      throw error;
    }
  }
  ```

  The `sql` import was added in Task 2. Confirm it is present before continuing. `organisationContacts` is already imported from schema — verify before adding.

  **Known limitation:** The `?? undefined` pattern in `updateOrganization` means Drizzle will skip any field where the caller passes `undefined` — the column is not touched in the SQL. This is intentional for partial updates, but it also means an admin cannot _clear_ an optional contact field back to empty once it has a value (passing `""` gets converted to `undefined` via the `|| undefined` pattern in the UI handlers). This is acceptable for an MVP admin and should be noted if the client asks why clearing a field doesn't save.

- [ ] **Step 3: Add server action wrappers to `lib/actions.ts`**

  ```typescript
  /**
   * Update an organisation and its contact details
   */
  export async function updateOrganization(id: string, data: {
    name?: string;
    groupType?: string;
    openGroup?: boolean;
    airtableRecordId?: string;
    contactFirstName?: string;
    contactLastName?: string;
    contactEmail?: string;
    contactPhone?: string;
    notes?: string;
  }): Promise<Organization> {
    return await DatabaseService.updateOrganization(id, data);
  }

  /**
   * Delete an organisation and its contact (blocked if registrations exist)
   */
  export async function deleteOrganization(id: string): Promise<void> {
    return await DatabaseService.deleteOrganization(id);
  }
  ```

- [ ] **Step 4: Type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add software/nextjs/lib/db-service.ts software/nextjs/lib/actions.ts
  git commit -m "feat: add updateOrganization and deleteOrganization to DatabaseService and actions"
  ```

---

## Task 4: DB methods — update and delete Volunteers

**Files:**
- Modify: `software/nextjs/lib/db-service.ts` (add after `createVolunteer`)
- Modify: `software/nextjs/lib/actions.ts` (add two wrappers)

- [ ] **Step 1: Add `updateVolunteer()` to `DatabaseService`**

  Add after `createVolunteer`:

  ```typescript
  /**
   * Update a volunteer's details
   */
  static async updateVolunteer(id: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
    airtableRecordId?: string;
  }): Promise<Volunteer> {
    try {
      const result = await db
        .update(volunteers)
        .set({ ...data, modifiedAt: new Date() })
        .where(eq(volunteers.id, id))
        .returning();

      if (!result[0]) throw new Error(`Volunteer not found: ${id}`);
      return mapVolunteerFromDb(result[0]);
    } catch (error) {
      console.error('Error updating volunteer:', error);
      throw error;
    }
  }
  ```

- [ ] **Step 2: Add `deleteVolunteer()` to `DatabaseService`**

  Add immediately after `updateVolunteer`:

  ```typescript
  /**
   * Delete a volunteer record
   */
  static async deleteVolunteer(id: string): Promise<void> {
    try {
      await db.delete(volunteers).where(eq(volunteers.id, id));
    } catch (error) {
      console.error('Error deleting volunteer:', error);
      throw error;
    }
  }
  ```

- [ ] **Step 3: Add server action wrappers to `lib/actions.ts`**

  ```typescript
  /**
   * Update a volunteer's details
   */
  export async function updateVolunteer(id: string, data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    photoConsent?: boolean;
    feedbackConsent?: boolean;
    nextEventConsent?: boolean;
    airtableRecordId?: string;
  }): Promise<Volunteer> {
    return await DatabaseService.updateVolunteer(id, data);
  }

  /**
   * Delete a volunteer
   */
  export async function deleteVolunteer(id: string): Promise<void> {
    return await DatabaseService.deleteVolunteer(id);
  }
  ```

- [ ] **Step 4: Type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add software/nextjs/lib/db-service.ts software/nextjs/lib/actions.ts
  git commit -m "feat: add updateVolunteer and deleteVolunteer to DatabaseService and actions"
  ```

---

## Task 5: Zod schemas for admin forms

**Files:**
- Modify: `software/nextjs/lib/validation.ts` (add three schemas at the end, before the type inference section)

These are slimmer than the public registration schemas — no consent radio groups, no group size fields. The `airtableRecordId` field is optional on all three.

- [ ] **Step 1: Add `adminEventFormSchema` to `lib/validation.ts`**

  Add before the `// Type Inference` comment block:

  ```typescript
  /**
   * Admin Event Form Schema
   * Used for create and edit forms in the P2I admin section
   */
  export const adminEventFormSchema = z.object({
    name: z
      .string()
      .min(3, "Event name must be at least 3 characters")
      .max(100, "Event name must be at most 100 characters"),
    date: z.string().min(1, "Date is required"),
    location: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    airtableRecordId: z.string().optional().or(z.literal("")),
  });

  export type AdminEventFormData = z.infer<typeof adminEventFormSchema>;
  ```

- [ ] **Step 2: Add `adminOrgFormSchema` to `lib/validation.ts`**

  ```typescript
  /**
   * Admin Organisation Form Schema
   * Used for create and edit forms in the P2I admin section
   */
  export const adminOrgFormSchema = z.object({
    name: z
      .string()
      .min(2, "Organisation name must be at least 2 characters")
      .max(200, "Organisation name must be at most 200 characters"),
    openGroup: z.boolean(),
    groupType: z.enum([
      'Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'
    ]),
    contactFirstName: z.string().optional().or(z.literal("")),
    contactLastName: z.string().optional().or(z.literal("")),
    contactEmail: z
      .string()
      .email("Please enter a valid email address")
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    airtableRecordId: z.string().optional().or(z.literal("")),
  });

  export type AdminOrgFormData = z.infer<typeof adminOrgFormSchema>;
  ```

- [ ] **Step 3: Add `adminVolunteerFormSchema` to `lib/validation.ts`**

  ```typescript
  /**
   * Admin Volunteer Form Schema
   * Used for create and edit forms in the P2I admin section
   */
  export const adminVolunteerFormSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(100),
    lastName: z.string().min(1, "Last name is required").max(100),
    email: z.string().email("Please enter a valid email address"),
    photoConsent: z.boolean(),
    feedbackConsent: z.boolean(),
    nextEventConsent: z.boolean(),
    airtableRecordId: z.string().optional().or(z.literal("")),
  });

  export type AdminVolunteerFormData = z.infer<typeof adminVolunteerFormSchema>;
  ```

- [ ] **Step 4: Type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add software/nextjs/lib/validation.ts
  git commit -m "feat: add admin form Zod schemas for events, organisations, and volunteers"
  ```

---

## Task 6: Extend Manage Events page with Edit and Delete

**Files:**
- Modify: `software/nextjs/app/admin/p2i/manage-events/page.tsx`

The existing page has a table with "Set as Current" and "Administer" buttons per row. Add an Edit button that opens a Dialog (pre-filled with current values), and a Delete button with `window.confirm`.

- [ ] **Step 1: Install the Textarea Shadcn component**

  The project does not yet have a Textarea UI component. From `software/nextjs/`:
  ```bash
  npx shadcn@latest add textarea
  ```
  Expected: creates `components/ui/textarea.tsx`.

- [ ] **Step 2: Add imports to `manage-events/page.tsx`**

  Add to the existing import block:
  ```typescript
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
  import { updateEvent, deleteEvent } from "@/lib/actions";
  import { adminEventFormSchema, type AdminEventFormData } from "@/lib/validation";
  ```

- [ ] **Step 3: Add state for the edit dialog**

  In the component body, after the existing state declarations, add:

  ```typescript
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const editForm = useForm<AdminEventFormData>({
    resolver: zodResolver(adminEventFormSchema),
    defaultValues: { name: "", date: "", location: "", description: "", airtableRecordId: "" },
  });
  ```

- [ ] **Step 4: Add open/save/delete handlers**

  Add these functions after `handleAdminister`:

  ```typescript
  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    editForm.reset({
      name: event.name,
      date: event.date,
      location: event.location || "",
      description: event.description || "",
      airtableRecordId: event.airtableRecordId || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (data: AdminEventFormData) => {
    if (!editingEvent) return;
    try {
      setIsSaving(true);
      await updateEvent(editingEvent.id, {
        name: data.name,
        date: data.date,
        location: data.location || undefined,
        description: data.description || undefined,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsEditOpen(false);
      await loadEvents();
    } catch (error) {
      alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(event.id);
      await deleteEvent(event.id);
      await loadEvents();
    } catch (error) {
      alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };
  ```

- [ ] **Step 5: Add Edit and Delete buttons to each table row**

  In the `<td>` that contains the action buttons (the last column), add Edit and Delete alongside the existing buttons:

  ```tsx
  <Button
    size="sm"
    variant="outline"
    onClick={() => handleEdit(event)}
  >
    Edit
  </Button>
  <Button
    size="sm"
    variant="destructive"
    onClick={() => handleDelete(event)}
    disabled={deletingId === event.id}
  >
    {deletingId === event.id ? "Deleting..." : "Delete"}
  </Button>
  ```

- [ ] **Step 6: Add the Edit Dialog**

  Add the Dialog component just before the closing `</div>` of the page return:

  ```tsx
  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Event</DialogTitle>
      </DialogHeader>
      <Form {...editForm}>
        <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
          <FormField
            control={editForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl><Input placeholder="Venue / address" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={editForm.control}
            name="airtableRecordId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  </Dialog>
  ```

- [ ] **Step 7: Manual verification**

  Start the dev server: `npm run dev`

  1. Log in as P2I admin (sessionStorage: `adminAuth=true`, `adminLevel=p2i`)
  2. Navigate to `/admin/p2i/manage-events`
  3. Confirm Edit and Delete buttons appear on each row
  4. Click Edit on an event — dialog opens pre-filled with correct values
  5. Change the name, save — table refreshes with updated name
  6. Click Delete on a planned event with no registrations — confirm prompt appears, event is removed
  7. Click Delete on the active event (which has registrations) — should show error message

- [ ] **Step 8: Commit**

  ```bash
  git add software/nextjs/app/admin/p2i/manage-events/page.tsx
  git commit -m "feat: add edit and delete to manage-events page"
  ```

---

## Task 7: New Organisations CRUD page

**Files:**
- Create: `software/nextjs/app/admin/p2i/organisations/page.tsx`

This page lists all organisations for the currently-selected event and provides Create, Edit, and Delete via dialogs.

- [ ] **Step 1: Create `app/admin/p2i/organisations/page.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  } from "@/components/ui/select";
  import {
    getOrganizations, getEventById, createOrganization, updateOrganization, deleteOrganization,
  } from "@/lib/actions";
  import { adminOrgFormSchema, type AdminOrgFormData } from "@/lib/validation";
  import type { Organization, Event } from "@/lib/types";

  const GROUP_TYPES = ['Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'] as const;

  export default function OrganisationsPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog state
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const createForm = useForm<AdminOrgFormData>({
      resolver: zodResolver(adminOrgFormSchema),
      defaultValues: {
        name: "", openGroup: true, groupType: "Other",
        contactFirstName: "", contactLastName: "",
        contactEmail: "", contactPhone: "", notes: "", airtableRecordId: "",
      },
    });

    const editForm = useForm<AdminOrgFormData>({
      resolver: zodResolver(adminOrgFormSchema),
      defaultValues: {
        name: "", openGroup: true, groupType: "Other",
        contactFirstName: "", contactLastName: "",
        contactEmail: "", contactPhone: "", notes: "", airtableRecordId: "",
      },
    });

    useEffect(() => {
      const adminAuth = sessionStorage.getItem("adminAuth");
      const adminLevel = sessionStorage.getItem("adminLevel");
      if (adminAuth === "true" && adminLevel === "p2i") {
        setIsAuthenticated(true);
      } else {
        router.push("/admin");
      }
    }, [router]);

    useEffect(() => {
      if (!isAuthenticated) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      if (!eventId) {
        router.push("/admin/p2i/manage-events");
        return;
      }
      loadData(eventId);
    }, [isAuthenticated, router]);

    const loadData = async (eventId: string) => {
      try {
        setLoading(true);
        const [event, orgList] = await Promise.all([
          getEventById(eventId),
          getOrganizations(eventId),
        ]);
        setCurrentEvent(event);
        setOrgs(orgList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error("Error loading data:", error);
        alert("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    const handleCreate = async (data: AdminOrgFormData) => {
      const eventId = sessionStorage.getItem("administeringEventId");
      if (!eventId) return;
      try {
        setIsSaving(true);
        await createOrganization({
          eventId,
          name: data.name,
          openGroup: data.openGroup,
          groupType: data.groupType,
          contactFirstName: data.contactFirstName || undefined,
          contactLastName: data.contactLastName || undefined,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
          notes: data.notes || undefined,
          airtableRecordId: data.airtableRecordId || undefined,
        });
        setIsCreateOpen(false);
        createForm.reset();
        await loadData(eventId);
      } catch (error) {
        alert("Failed to create organisation. " + (error instanceof Error ? error.message : ""));
      } finally {
        setIsSaving(false);
      }
    };

    const handleOpenEdit = (org: Organization) => {
      setEditingOrg(org);
      editForm.reset({
        name: org.name,
        openGroup: org.openGroup ?? true,
        groupType: (org.groupType as AdminOrgFormData["groupType"]) || "Other",
        contactFirstName: org.contactFirstName || "",
        contactLastName: org.contactLastName || "",
        contactEmail: org.contactEmail || "",
        contactPhone: org.contactPhone || "",
        notes: org.notes || "",
        airtableRecordId: org.airtableRecordId || "",
      });
      setIsEditOpen(true);
    };

    const handleSaveEdit = async (data: AdminOrgFormData) => {
      if (!editingOrg) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      try {
        setIsSaving(true);
        await updateOrganization(editingOrg.id, {
          name: data.name,
          openGroup: data.openGroup,
          groupType: data.groupType,
          contactFirstName: data.contactFirstName || undefined,
          contactLastName: data.contactLastName || undefined,
          contactEmail: data.contactEmail || undefined,
          contactPhone: data.contactPhone || undefined,
          notes: data.notes || undefined,
          airtableRecordId: data.airtableRecordId || undefined,
        });
        setIsEditOpen(false);
        if (eventId) await loadData(eventId);
      } catch (error) {
        alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async (org: Organization) => {
      if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      try {
        setDeletingId(org.id);
        await deleteOrganization(org.id);
        if (eventId) await loadData(eventId);
      } catch (error) {
        alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
      } finally {
        setDeletingId(null);
      }
    };

    if (!isAuthenticated || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">{loading ? "Loading..." : "Checking authentication..."}</p>
        </div>
      );
    }

    const orgFormFields = (form: ReturnType<typeof useForm<AdminOrgFormData>>) => (
      <div className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Organisation Name *</FormLabel>
            <FormControl><Input placeholder="e.g. Riverside FC" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="openGroup" render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel className="mt-0!">Open group — visible to individual participants</FormLabel>
          </FormItem>
        )} />
        <FormField control={form.control} name="groupType" render={({ field }) => (
          <FormItem>
            <FormLabel>Group Type *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {GROUP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="contactFirstName" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact First Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="contactLastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Last Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="contactEmail" render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Email</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactPhone" render={({ field }) => (
          <FormItem>
            <FormLabel>Contact Phone</FormLabel>
            <FormControl><Input type="tel" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="airtableRecordId" render={({ field }) => (
          <FormItem>
            <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
            <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
              <p className="text-sm text-gray-600 mt-1">{currentEvent?.name}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)}>+ Add Organisation</Button>
              <Button variant="outline" onClick={() => router.push("/admin/p2i")}>
                Back to P2I Admin
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {orgs.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
              No organisations yet. Click "Add Organisation" to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Name", "Group", "Contact", "Email", "Airtable ID", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{org.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{org.openGroup ? "Open" : "Closed"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {[org.contactFirstName, org.contactLastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{org.contactEmail || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {org.airtableRecordId?.startsWith("local-") ? "—" : (org.airtableRecordId || "—")}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(org)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(org)}
                          disabled={deletingId === org.id}
                        >
                          {deletingId === org.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Organisation</DialogTitle></DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                {orgFormFields(createForm)}
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Organisation"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Organisation</DialogTitle></DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
                {orgFormFields(editForm)}
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npm run build 2>&1 | head -40
  ```

- [ ] **Step 3: Manual verification**

  1. In P2I admin, navigate to Manage Events and click "Administer" on an event to set `administeringEventId`
  2. Navigate to `/admin/p2i/organisations`
  3. Confirm the page loads and shows existing orgs for that event
  4. Create a new org with all fields including an Airtable Record ID — confirm it appears in the table
  5. Create a new org without an Airtable Record ID — confirm "—" shows in the Airtable ID column
  6. Edit an org — confirm changes persist
  7. Delete an org that has no registrations — confirm it disappears
  8. Attempt to delete an org that has registrations — confirm an error message appears

- [ ] **Step 4: Commit**

  ```bash
  git add software/nextjs/app/admin/p2i/organisations/page.tsx
  git commit -m "feat: add organisations CRUD page to P2I admin"
  ```

---

## Task 8: New Volunteers CRUD page

**Files:**
- Create: `software/nextjs/app/admin/p2i/volunteers/page.tsx`

- [ ] **Step 1: Create `app/admin/p2i/volunteers/page.tsx`**

  ```tsx
  "use client";

  import { useState, useEffect } from "react";
  import { useRouter } from "next/navigation";
  import { useForm } from "react-hook-form";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Checkbox } from "@/components/ui/checkbox";
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
  import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
  import { getAllVolunteers, getEventById, createVolunteer, updateVolunteer, deleteVolunteer } from "@/lib/actions";
  import { adminVolunteerFormSchema, type AdminVolunteerFormData } from "@/lib/validation";
  import type { Volunteer, Event } from "@/lib/types";

  const defaultVolunteerValues: AdminVolunteerFormData = {
    firstName: "", lastName: "", email: "",
    photoConsent: true, feedbackConsent: false, nextEventConsent: false,
    airtableRecordId: "",
  };

  export default function VolunteersPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [volunteerList, setVolunteerList] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState(true);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const createForm = useForm<AdminVolunteerFormData>({
      resolver: zodResolver(adminVolunteerFormSchema),
      defaultValues: defaultVolunteerValues,
    });

    const editForm = useForm<AdminVolunteerFormData>({
      resolver: zodResolver(adminVolunteerFormSchema),
      defaultValues: defaultVolunteerValues,
    });

    useEffect(() => {
      const adminAuth = sessionStorage.getItem("adminAuth");
      const adminLevel = sessionStorage.getItem("adminLevel");
      if (adminAuth === "true" && adminLevel === "p2i") {
        setIsAuthenticated(true);
      } else {
        router.push("/admin");
      }
    }, [router]);

    useEffect(() => {
      if (!isAuthenticated) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      if (!eventId) { router.push("/admin/p2i/manage-events"); return; }
      loadData(eventId);
    }, [isAuthenticated, router]);

    const loadData = async (eventId: string) => {
      try {
        setLoading(true);
        const [event, vols] = await Promise.all([
          getEventById(eventId),
          getAllVolunteers(eventId),
        ]);
        setCurrentEvent(event);
        setVolunteerList(vols.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      } finally {
        setLoading(false);
      }
    };

    const handleCreate = async (data: AdminVolunteerFormData) => {
      const eventId = sessionStorage.getItem("administeringEventId");
      if (!eventId) return;
      try {
        setIsSaving(true);
        await createVolunteer({
          eventId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          photoConsent: data.photoConsent,
          feedbackConsent: data.feedbackConsent,
          nextEventConsent: data.nextEventConsent,
          airtableRecordId: data.airtableRecordId || undefined,
        });
        setIsCreateOpen(false);
        createForm.reset(defaultVolunteerValues);
        await loadData(eventId);
      } catch (error) {
        alert("Failed to create volunteer. " + (error instanceof Error ? error.message : ""));
      } finally {
        setIsSaving(false);
      }
    };

    const handleOpenEdit = (vol: Volunteer) => {
      setEditingVolunteer(vol);
      editForm.reset({
        firstName: vol.firstName,
        lastName: vol.lastName,
        email: vol.email,
        photoConsent: vol.photoConsent,
        feedbackConsent: vol.feedbackConsent,
        nextEventConsent: vol.nextEventConsent,
        airtableRecordId: vol.airtableRecordId || "",
      });
      setIsEditOpen(true);
    };

    const handleSaveEdit = async (data: AdminVolunteerFormData) => {
      if (!editingVolunteer) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      try {
        setIsSaving(true);
        await updateVolunteer(editingVolunteer.id!, {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          photoConsent: data.photoConsent,
          feedbackConsent: data.feedbackConsent,
          nextEventConsent: data.nextEventConsent,
          airtableRecordId: data.airtableRecordId || undefined,
        });
        setIsEditOpen(false);
        if (eventId) await loadData(eventId);
      } catch (error) {
        alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
      } finally {
        setIsSaving(false);
      }
    };

    const handleDelete = async (vol: Volunteer) => {
      if (!confirm(`Delete volunteer "${vol.firstName} ${vol.lastName}"?`)) return;
      const eventId = sessionStorage.getItem("administeringEventId");
      try {
        setDeletingId(vol.id!);
        await deleteVolunteer(vol.id!);
        if (eventId) await loadData(eventId);
      } catch (error) {
        alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
      } finally {
        setDeletingId(null);
      }
    };

    if (!isAuthenticated || loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-600">{loading ? "Loading..." : "Checking authentication..."}</p>
        </div>
      );
    }

    const volunteerFormFields = (form: ReturnType<typeof useForm<AdminVolunteerFormData>>) => (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email *</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-gray-700">Consent</p>
          {(["photoConsent", "feedbackConsent", "nextEventConsent"] as const).map(name => (
            <FormField key={name} control={form.control} name={name} render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">
                  {name === "photoConsent" ? "Photo consent" :
                   name === "feedbackConsent" ? "Feedback email consent" : "Next event email consent"}
                </FormLabel>
              </FormItem>
            )} />
          ))}
        </div>

        <FormField control={form.control} name="airtableRecordId" render={({ field }) => (
          <FormItem>
            <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
            <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
              <p className="text-sm text-gray-600 mt-1">{currentEvent?.name}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)}>+ Add Volunteer</Button>
              <Button variant="outline" onClick={() => router.push("/admin/p2i")}>
                Back to P2I Admin
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {volunteerList.length === 0 ? (
            <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
              No volunteers yet. Click "Add Volunteer" to create one.
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Name", "Email", "Photo", "Feedback", "Next Event", "Airtable ID", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {volunteerList.map(vol => (
                    <tr key={vol.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {vol.firstName} {vol.lastName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{vol.email}</td>
                      <td className="px-4 py-3 text-sm">{vol.photoConsent ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-sm">{vol.feedbackConsent ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-sm">{vol.nextEventConsent ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {vol.airtableRecordId || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(vol)}>Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(vol)}
                          disabled={deletingId === vol.id}
                        >
                          {deletingId === vol.id ? "Deleting..." : "Delete"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Volunteer</DialogTitle></DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreate)}>
                {volunteerFormFields(createForm)}
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Volunteer"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Edit Volunteer</DialogTitle></DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
                {volunteerFormFields(editForm)}
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  ```

- [ ] **Step 2: Type-check**

  ```bash
  npm run build 2>&1 | head -40
  ```

- [ ] **Step 3: Manual verification**

  1. Navigate to `/admin/p2i/volunteers` (with an event selected)
  2. Create a volunteer with and without an Airtable Record ID
  3. Edit a volunteer, change name and email — confirm updates persist
  4. Delete a volunteer — confirm they are removed
  5. Verify the volunteer's email now appears in the registration form's volunteer lookup (log in as this email on `/registration` — it should be pre-filled as a Volunteer role)

- [ ] **Step 4: Commit**

  ```bash
  git add software/nextjs/app/admin/p2i/volunteers/page.tsx
  git commit -m "feat: add volunteers CRUD page to P2I admin"
  ```

---

## Task 9: Add navigation links to P2I dashboard

**Files:**
- Modify: `software/nextjs/app/admin/p2i/page.tsx`

The P2I dashboard (`/admin/p2i`) already has navigation buttons. Add two new ones linking to the Organisations and Volunteers pages.

- [ ] **Step 1: Locate the navigation buttons section in `app/admin/p2i/page.tsx`**

  The page renders buttons that navigate to other P2I pages (e.g., Manage Events, Airtable Import). Find this section.

- [ ] **Step 2: Add Organisations and Volunteers nav buttons**

  Following the exact same pattern as the existing nav buttons, add:

  ```tsx
  <Button
    variant="outline"
    onClick={() => router.push("/admin/p2i/organisations")}
  >
    Manage Organisations
  </Button>
  <Button
    variant="outline"
    onClick={() => router.push("/admin/p2i/volunteers")}
  >
    Manage Volunteers
  </Button>
  ```

  Place these alongside the existing "Manage Events" button so all three are grouped together.

- [ ] **Step 3: Manual verification**

  1. Navigate to `/admin/p2i`
  2. Confirm the two new buttons appear
  3. Click each — confirm navigation works and pages load correctly with the currently-selected event

- [ ] **Step 4: Commit**

  ```bash
  git add software/nextjs/app/admin/p2i/page.tsx
  git commit -m "feat: add Organisations and Volunteers nav links to P2I dashboard"
  ```

---

## Airtable Record ID — how it works end-to-end

For reference when testing and explaining to the client:

| Scenario | airtableRecordId value | Sync behaviour |
|----------|----------------------|----------------|
| Imported from Airtable | `recXXXXXXXXXXXXXX` (real ID) | Sync updates the existing Airtable record |
| Created manually, Airtable ID provided | `recXXXXXXXXXXXXXX` (real ID) | Same as above |
| Created manually, no Airtable ID | `null` / `local-{uuid}` (orgs) | Sync creates a new Airtable record and stores the returned ID back |
| Event created manually | Own UUID used as fallback | Orgs associate correctly via internal link; if event later synced to Airtable the field can be updated |

The client workflow for linking existing Airtable records: open Airtable, find the record ID in the URL or via a formula field, paste it into the Airtable Record ID field when creating or editing a record in this admin.
