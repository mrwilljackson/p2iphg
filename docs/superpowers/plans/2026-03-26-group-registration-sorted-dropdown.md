# Group Registration Sorted Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ⚠️ **ON HOLD — Tasks 3 and 4** depend on `2026-03-26-group-contact-picker.md` being fully implemented first. Tasks 0 and 1 are independent and may proceed at any time.

**Goal:** In the Group Leader registration form, show open groups (sorted first, removed once registered) above closed groups (always visible), so the list acts as a live progress indicator on event day.

**Architecture:** A new server action returns the set of org IDs that already have a Group registration for the current event. A new pure helper splits all orgs into open/closed sections. The registration form renders two labelled `SelectGroup` blocks, fetching the registered-org set on load and after role changes. No changes to Participant or Volunteer flows.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon PostgreSQL, React Hook Form, Shadcn UI (Select/SelectGroup/SelectLabel/SelectSeparator), TypeScript

---

## Governing Rule: `openGroup` is the only source of truth for group behaviour

**`groupType` is an administrative label for external reporting systems. It must never be used for filtering, selection, conditional logic, or UI visibility decisions within this application.**

The `openGroup` boolean on `organisation_contacts` is the sole authority:
- `openGroup !== false` → open group: participants register individually; group leader registers to set expected count
- `openGroup === false` → closed group: leader registers on behalf of all members; no individual participant registrations

This rule applies everywhere — form fields, dropdown filtering, participant counting, admin pages. Any new code that makes a behavioural decision based on `groupType` (e.g. `groupType === 'Family'`, `groupType === 'Disability'`) is incorrect and must be rewritten using `openGroup`.

**Acceptable uses of `groupType`:** display-only labels in reporting tables and external sync (Airtable). These do not drive logic.

---

## Background & Design Decisions

### Why this change?

Currently `organizationsToOptions()` for Group role only shows `openGroup === false` (closed groups). This means open-group leaders (Corporate, Sporting, Community, etc.) have no way to select their org in `org.picker.group` — they hit `org.picker.group.notListed`. The new design adds open groups to `org.picker.group.openSection` at the top and removes them once their leader registers, creating a natural event-day workflow.

### Closed groups stay visible throughout

Closed groups (`openGroup === false`) register last by convention. They remain in `org.picker.group.closedSection` all day even after registering — their "already registered" notice is handled by the existing `group.existingLeaderNotice` mechanism.

### Family Group placeholder

`org.picker.group.familyGroup` (the on-the-day family group entry) belongs with closed groups. It moves from the top of the flat list to the top of `org.picker.group.closedSection`.

### GROUP_DETAILS fields for open vs closed groups

When an open-group org is selected in `org.picker.group`, the `GROUP_DETAILS` section shows only `group.size.open` ("How many participants in your group?") — the leader enters their expected count. No `group.disabledStudents` or `group.senStudents` fields appear for open groups.

When a closed-group org is selected, `GROUP_DETAILS` shows `group.size.closed`, `group.disabledStudents`, and `group.senStudents`.

### Multi-leader edge case

A second leader from the same open-group org won't find their org in `org.picker.group.openSection` (it was removed once the first leader registered). They'd use `org.picker.group.notListed`. This is an acceptable limitation — the `group.existingLeaderNotice` + `group.additionalLeaderChoice` mechanism handles the case when they can still find the org (closed groups, which remain visible).

---

## Files

| File | Change |
|---|---|
| `lib/participant-counting.ts` | Remove dead `isExpectedOnlyGroupType()` function |
| `components/registration-form.tsx` | Replace `groupType === 'Disability'` hint with `openGroup`-based check; add state + fetch + rewrite Group dropdown |
| `lib/db-service.ts` | Add `getRegisteredGroupOrgIds(eventId)` static method |
| `lib/actions.ts` | Add `getRegisteredGroupOrgIds(eventId)` server action wrapper |
| `lib/helpers.ts` | Add `groupOrgsToSections(orgs, registeredOrgIds)` helper |
| `CLAUDE.md` | Updated (already done) — documents the governing rule |

---

## Task 0: Remove remaining `groupType` logic violations

**Files:**
- Modify: `lib/participant-counting.ts`
- Modify: `components/registration-form.tsx`

Two `groupType`-based logic uses were found during audit. Both must be removed before the new dropdown feature lands.

### 0a — Remove dead `isExpectedOnlyGroupType()` from `lib/participant-counting.ts`

The function at lines 139–141 (`function isExpectedOnlyGroupType(groupType?)`) was used in previous counting logic but all call sites were already migrated to `openGroup === false` checks in a prior session. The function is now unreachable dead code and should be deleted.

- [ ] **Step 1: Confirm the function is unused**

Search for `isExpectedOnlyGroupType` in the file — it should appear only in its own definition. If any call sites remain, they must be replaced with `openGroup === false` first.

- [ ] **Step 2: Delete the function**

Remove these lines from `lib/participant-counting.ts`:

```ts
/**
 * Determine if a group type uses expected-only counting
 * (Family and Disability groups don't have individual registrations)
 */
function isExpectedOnlyGroupType(groupType?: GroupType | null): boolean {
  return groupType === 'Family' || groupType === 'Disability';
}
```

- [ ] **Step 3: Verify no TypeScript errors**

The `GroupType` import at line 46 may now be unused if `isExpectedOnlyGroupType` was its only consumer in this file. Check whether `GroupType` is still referenced elsewhere in `participant-counting.ts`. If not, remove the import.

### 0b — Replace `groupType === 'Disability'` hint in `components/registration-form.tsx`

Line 672 shows an instructional message beneath the `IDENTITY` name fields on Group Step 1. It currently fires only when a Disability-type org is selected in `org.picker.group`:

```tsx
{selectedRole === "Group" && selectedOrg?.groupType === 'Disability' && (
  <p className="text-sm text-blue-600 mt-2">
    ℹ️ <strong>Please check your details are correct - sometimes other staff attend on behalf of the original organiser!</strong>
  </p>
)}
```

This uses `groupType` to decide what to show — a violation of the governing rule. The hint applies equally to all closed-group orgs in `org.picker.group.closedSection` (any closed group may have a substitute leader on the day), so replace the `groupType` check with `openGroup`:

- [ ] **Step 4: Replace the condition**

```tsx
{selectedRole === "Group" && selectedOrg?.openGroup === false && (
  <p className="text-sm text-blue-600 mt-2">
    ℹ️ <strong>Please check your details are correct - sometimes other staff attend on behalf of the original organiser!</strong>
  </p>
)}
```

- [ ] **Step 5: Commit**

```bash
cd software/nextjs
git add lib/participant-counting.ts components/registration-form.tsx
git commit -m "refactor: remove groupType-based filtering logic, use openGroup exclusively"
```

---

## Task 1: `getRegisteredGroupOrgIds` — DB method and server action

**Files:**
- Modify: `lib/db-service.ts` (add one static method)
- Modify: `lib/actions.ts` (add one exported server action)

This returns the set of organisation UUIDs that already have at least one Group-role registration for the given event. It is used to filter open groups out of `org.picker.group.openSection` once their leader has registered.

- [ ] **Step 1: Add static method to DatabaseService in `lib/db-service.ts`**

Find the block of static methods and add after `getRegistrationsByOrganization`:

```ts
/**
 * Get distinct organization IDs that already have a Group registration for this event.
 * Used to remove registered open groups from the Group leader dropdown.
 */
static async getRegisteredGroupOrgIds(eventId: string): Promise<string[]> {
  const rows = await db
    .selectDistinct({ organizationId: registrations.organizationId })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.role, 'Group'),
      )
    );
  return rows
    .map(r => r.organizationId)
    .filter((id): id is string => id != null);
}
```

- [ ] **Step 2: Add server action wrapper in `lib/actions.ts`**

Add after `getRegistrationsByOrganization`:

```ts
/**
 * Get org IDs that already have a Group registration for this event.
 * Used by the Group leader dropdown to hide already-registered open groups.
 */
export async function getRegisteredGroupOrgIds(eventId: string): Promise<string[]> {
  return await DatabaseService.getRegisteredGroupOrgIds(eventId);
}
```

- [ ] **Step 3: Verify manually**

Start dev server (`npm run dev` from `software/nextjs/`), open browser console, and run:

```js
// In a component that imports the action, or via Network tab on /registration page load
// Confirm the action exists and is callable — check for TypeScript errors in editor
```

Check: no TypeScript errors in `lib/actions.ts` or `lib/db-service.ts`.

- [ ] **Step 4: Commit**

```bash
cd software/nextjs
git add lib/db-service.ts lib/actions.ts
git commit -m "feat: add getRegisteredGroupOrgIds server action"
```

---

## Task 2: `groupOrgsToSections` — pure helper in helpers.ts

**Files:**
- Modify: `lib/helpers.ts`

This is a pure function (no DB calls) that splits the org list into the two sections of `org.picker.group`: `openSection` (unregistered open groups) and `closedSection` (all closed groups). It is used only for `org.picker.group`.

`organizationsToOptions` is **not changed** — `org.picker.participant` and the Volunteer flow are unaffected.

- [ ] **Step 1: Add `groupOrgsToSections` to `lib/helpers.ts`**

Add after the existing `organizationsToOptions` function:

```ts
/**
 * Split organisations into open/closed sections for the Group leader dropdown.
 *
 * Open groups (openGroup !== false):
 *   - Shown at the top of the list
 *   - Removed from the list once their leader has registered (registeredOrgIds)
 *
 * Closed groups (openGroup === false):
 *   - Always shown at the bottom, regardless of registration status
 *   - Family Group placeholder is prepended to this section by the caller
 *
 * Deduplicates by name within each section (keeps first occurrence).
 * Filters out any org named exactly 'Family Group' (handled as a placeholder by caller).
 */
export function groupOrgsToSections(
  organizations: Organization[],
  registeredOrgIds: string[],
): { openGroups: ComboboxOption[]; closedGroups: ComboboxOption[] } {
  const registeredSet = new Set(registeredOrgIds);

  // Filter out the static Family Group name (handled as placeholder)
  const orgs = organizations.filter(org => org.name !== 'Family Group');

  // Deduplicate by name, keeping first occurrence
  const dedupe = (list: Organization[]): Organization[] =>
    list.reduce((acc, org) => {
      if (!acc.some(existing => existing.name === org.name)) acc.push(org);
      return acc;
    }, [] as Organization[]);

  const openGroupOrgs = dedupe(
    orgs.filter(org => org.openGroup !== false && !registeredSet.has(org.id))
  );

  const closedGroupOrgs = dedupe(
    orgs.filter(org => org.openGroup === false)
  );

  return {
    openGroups: openGroupOrgs.map(org => ({ value: org.id, label: org.name })),
    closedGroups: closedGroupOrgs.map(org => ({ value: org.id, label: org.name })),
  };
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Check editor for type errors in `lib/helpers.ts`. Confirm `Organization` and `ComboboxOption` imports are already present at the top of the file (they are).

- [ ] **Step 3: Commit**

```bash
git add lib/helpers.ts
git commit -m "feat: add groupOrgsToSections helper for Group leader dropdown"
```

---

## Task 3: Fetch registered org IDs in the registration form

**Files:**
- Modify: `components/registration-form.tsx`

Add new state and fetch logic for `registeredGroupOrgIds`. This data is loaded once on mount (alongside orgs/volunteers) and refreshed whenever the role changes to Group.

No UI changes yet — that is Task 4.

- [ ] **Step 1: Add import for the new action and helper**

At the top of `components/registration-form.tsx`, update the imports:

```ts
// Add getRegisteredGroupOrgIds to the existing actions import line:
import { getCurrentEvent, getOrganizations, getAllVolunteers, createRegistration, updateVolunteer, updateGroupLeaderConsents, findOrCreateFamilyGroup, getExistingGroupLeaders, getRegisteredGroupOrgIds } from "@/lib/actions";

// Add groupOrgsToSections to the existing helpers import line:
import { organizationsToOptions, groupOrgsToSections } from "@/lib/helpers";
```

- [ ] **Step 2: Add `registeredGroupOrgIds` state**

After the existing `allOrganizations` state declaration (around line 49), add:

```ts
const [registeredGroupOrgIds, setRegisteredGroupOrgIds] = useState<string[]>([]);
```

- [ ] **Step 3: Add `setAllOrganizations` to `loadData` (REQUIRED)**

`allOrganizations` is currently only set by the `updateOrganizations` useEffect (which runs on surname/role change), not by `loadData`. This means on a `preselectedRole="Group"` page load, `allOrganizations` is empty until the effect fires — causing `groupOrgsToSections` to return empty sections.

Inside `loadData`, immediately after `getOrganizations` returns (around line 282), add:

```ts
// Store all orgs for use in Group dropdown sections
setAllOrganizations(orgs);
```

This call belongs alongside the existing `setOrganizations(organizationsToOptions(orgs, selectedRole))` line — both should happen in `loadData`.

- [ ] **Step 4: Fetch registered org IDs on initial load**

In the same `loadData` function, after the orgs and volunteers have loaded, add:

```ts
// Fetch registered group org IDs (for Group leader dropdown filtering)
const registeredIds = await getRegisteredGroupOrgIds(event.id);
setRegisteredGroupOrgIds(registeredIds);
```

This ensures the Group dropdown is correct from the first render, not just after a role-change trigger.

- [ ] **Step 5: Refresh registered org IDs when role changes to Group**

The existing `useEffect` that calls `updateOrganizations` runs when `attendeeSurname` or `selectedRole` changes. Extend it to also refresh `registeredGroupOrgIds` when the role is Group:

```ts
useEffect(() => {
  const updateOrganizations = async () => {
    const eventId = form.getValues("eventId");
    if (!eventId) return;
    const orgs = await getOrganizations(eventId);

    setAllOrganizations(orgs);

    const orgOptions = organizationsToOptions(orgs, selectedRole);

    // Update Family Group label with surname
    const updatedOptions = orgOptions.map(option => {
      if (option.value === "FAMILY_GROUP_PLACEHOLDER" && attendeeSurname && attendeeSurname.trim()) {
        return { ...option, label: `${attendeeSurname} Family Group` };
      }
      return option;
    });
    setOrganizations(updatedOptions);

    // Refresh registered group IDs for Group dropdown
    if (selectedRole === 'Group') {
      const registeredIds = await getRegisteredGroupOrgIds(eventId);
      setRegisteredGroupOrgIds(registeredIds);
    }
  };

  updateOrganizations();
}, [attendeeSurname, selectedRole, form]);
```

- [ ] **Step 6: Verify no TypeScript errors**

Check editor — no red underlines in the form file.

- [ ] **Step 7: Manual smoke test**

Start dev server. Open `/registration`, select Group role. Check browser Network tab for the new server action call. Confirm no console errors.

- [ ] **Step 8: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: fetch registeredGroupOrgIds in registration form"
```

---

## Task 4: Rewrite Group org dropdown to use sectioned SelectGroups

**Files:**
- Modify: `components/registration-form.tsx`

Replace the flat `organizations.map()` in `org.picker.group` with two `<SelectGroup>` blocks: `org.picker.group.openSection` (unregistered open groups, hidden when empty) and `org.picker.group.closedSection` (closed groups + `org.picker.group.familyGroup`, always visible). Add `SelectGroup`, `SelectLabel`, `SelectSeparator` to the Shadcn imports if not already present.

- [ ] **Step 1: Add SelectGroup, SelectLabel, SelectSeparator to imports**

At the top of the file, update the Shadcn Select import:

```ts
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

- [ ] **Step 2: Compute sections inline before the return statement**

Just before the `return (` statement (around line 423), add:

```ts
// Sections for Group leader dropdown
const { openGroups, closedGroups } = groupOrgsToSections(allOrganizations, registeredGroupOrgIds);

// Build personalized Family Group label
const familyGroupLabel = attendeeSurname?.trim()
  ? `${attendeeSurname} Family Group`
  : 'Family Group';
```

- [ ] **Step 3: Replace Group org dropdown rendering**

Find the Group role org `<Select>` block (around lines 503–563). Replace the `<SelectContent>` internals:

**Before:**
```tsx
<SelectContent>
  {organizations.map((org) => (
    <SelectItem key={org.value} value={org.value}>
      {org.label}
    </SelectItem>
  ))}
  <SelectItem value="NOT_LISTED" className="text-orange-600 font-medium">
    ⚠️ My organisation isn&apos;t listed here!
  </SelectItem>
</SelectContent>
```

**After:**
```tsx
<SelectContent>
  {/* Open groups — disappear once their leader has registered */}
  {openGroups.length > 0 && (
    <SelectGroup>
      <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Arriving now
      </SelectLabel>
      {openGroups.map((org) => (
        <SelectItem key={org.value} value={org.value}>
          {org.label}
        </SelectItem>
      ))}
    </SelectGroup>
  )}

  {/* Separator between sections — only show if both sections have items */}
  {openGroups.length > 0 && (
    <SelectSeparator />
  )}

  {/* Closed groups — always visible; register last */}
  <SelectGroup>
    <SelectLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      Groups
    </SelectLabel>
    {/* Family Group placeholder — for on-the-day unregistered family groups */}
    <SelectItem value="FAMILY_GROUP_PLACEHOLDER">
      {familyGroupLabel}
    </SelectItem>
    {closedGroups.map((org) => (
      <SelectItem key={org.value} value={org.value}>
        {org.label}
      </SelectItem>
    ))}
  </SelectGroup>

  <SelectSeparator />
  <SelectItem value="NOT_LISTED" className="text-orange-600 font-medium">
    ⚠️ My organisation isn&apos;t listed here!
  </SelectItem>
</SelectContent>
```

- [ ] **Step 4: Remove the old Family Group label personalisation logic**

The `attendeeSurname`-based label update in the `updateOrganizations` useEffect was updating the `FAMILY_GROUP_PLACEHOLDER` entry in the flat `organizations` array. Since the Family Group placeholder is now rendered inline using `familyGroupLabel` computed in the render, remove that mapping from `updateOrganizations`:

```ts
// Remove this block from updateOrganizations:
const updatedOptions = orgOptions.map(option => {
  if (option.value === "FAMILY_GROUP_PLACEHOLDER" && attendeeSurname && attendeeSurname.trim()) {
    return { ...option, label: `${attendeeSurname} Family Group` };
  }
  return option;
});
setOrganizations(updatedOptions);  // ← Keep setOrganizations, but pass orgOptions directly

// Replace with:
setOrganizations(orgOptions);
```

`familyGroupLabel` is computed in the render using `attendeeSurname`, so it updates reactively without needing to regenerate options on every surname keystroke.

- [ ] **Step 5: Verify `organizationsToOptions` no longer adds Family Group for Group role**

`organizationsToOptions` adds `FAMILY_GROUP_PLACEHOLDER` for Group role (line 55–60 of helpers.ts). Since the Group dropdown no longer uses `organizations` state at all (it uses `openGroups`/`closedGroups` from `groupOrgsToSections`), the `FAMILY_GROUP_PLACEHOLDER` in `organizations` is now unused for Group role. This is harmless but worth noting. No change needed — `organizations` state is still used for Participant role.

- [ ] **Step 6: Manual test — full scenario walkthrough**

Test with dev server (`npm run dev`):

**Scenario A — `org.picker.group.openSection` appears first:**
1. Open `/registration`, select Group role
2. Open `org.picker.group`
3. Confirm: `org.picker.group.openSection` ("Arriving now") shows unregistered open-group orgs at top; `org.picker.group.closedSection` ("Groups") shows closed-group orgs below; `org.picker.group.familyGroup` appears at the top of the closed section

**Scenario B — Registered open group removed from `org.picker.group.openSection`:**
1. Register a Group leader for an open-group org (e.g., a Corporate or Sporting org)
2. Reload, select Group role, open `org.picker.group`
3. Confirm: that org is gone from `org.picker.group.openSection`

**Scenario C — `org.picker.group.closedSection` always visible:**
1. Register a Group leader for a closed-group org
2. Reload, select Group role, open `org.picker.group`
3. Confirm: that org still appears in `org.picker.group.closedSection`

**Scenario D — `org.picker.participant` unchanged:**
1. Select Participant role
2. Open `org.picker.participant` — confirm only open groups shown (unchanged Combobox behaviour)

**Scenario E — `org.picker.group.familyGroup` personalisation:**
1. Select Group role, type a surname in `identity.lastName`
2. Open `org.picker.group` — confirm the family group entry reads "[Surname] Family Group"

**Scenario F — Empty `org.picker.group.openSection`:**
1. After all open groups have registered, select Group role, open `org.picker.group`
2. Confirm: `org.picker.group.openSection` and its separator are hidden; only `org.picker.group.closedSection` shown

- [ ] **Step 7: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: group registration dropdown shows open groups first, sorted by registration status"
```

---

## Task 5: Edge case — org selected but removed from dropdown

If a Group leader has an org selected and then the dropdown re-renders (e.g., role toggle), the selected org ID may no longer appear in either section. The `<Select>` will show an empty `SelectValue`. This is acceptable — if they're mid-registration and their org has been registered by someone else, they should use "NOT_LISTED". No code change needed; document this as known behaviour.

---

## Completion Checklist

- [ ] All six scenarios in Task 4 Step 6 pass manual testing
- [ ] No TypeScript errors in editor
- [ ] No console errors in browser during Group registration flow
- [ ] `org.picker.participant` unchanged — Participant role still sees only open-group orgs via Combobox
- [ ] `volunteer.namePicker` and Volunteer flow unchanged
- [ ] Selecting a closed-group org in `org.picker.group` still pre-populates `identity.firstName`, `identity.lastName`, `identity.email`, and `CONSENT` fields from the org contact record
- [ ] `group.existingLeaderNotice` + `group.additionalLeaderChoice` still appear correctly when a closed-group org already has a registration
