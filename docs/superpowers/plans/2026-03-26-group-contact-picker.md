# Group Contact Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On Group Leader Step 1, after an org is selected in `org.picker.group`, display a `group.contactPicker` radio list of all known unregistered contacts for that org, so leaders can identify themselves with one tap rather than typing their details. A mandatory "new contact" option with inline entry fields is always shown last.

**Architecture:** A new server action `getOrgContactsForEvent(eventId, orgId)` returns all contacts for the selected org, each tagged with an `alreadyRegistered` boolean (detected by email-matching against existing Group registrations for that event + org). The form renders a radio group from this data. Selecting a known contact pre-populates `identity.*` and `consent.*` fields silently and stores the `contactId` for post-submit consent sync. Selecting the new-contact option reveals inline entry fields and clears `contactId`. No schema changes are needed.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM + Neon PostgreSQL, React Hook Form, Shadcn UI, TypeScript

**Dependency:** This plan must be fully implemented before resuming `2026-03-26-group-registration-sorted-dropdown.md` Tasks 3 and 4, as both touch Group Step 1.

**Element map reference:** `docs/registration-form-element-map.md` — `GROUP_CONTACT_PICKER` section.

---

## Governing Rule (reminder)

`groupType` must never be used for filtering, selection, or UI logic. All group behaviour is driven by `openGroup`. See CLAUDE.md.

---

## Design Decisions (captured)

1. `group.contactPicker` appears below `org.picker.group` on Step 1 after any org is selected (except `org.picker.group.familyGroup`).
2. Even orgs with only one contact show the picker (one known-contact option + new-contact option).
3. Contacts are hidden from the picker if their `contactEmail` matches an existing Group registration email for this event + org.
4. `group.contactPicker.newContact` is always the final radio option with blank inline entry fields.
5. Applies to both open and closed groups (Group role only).
6. Contact data is fetched on org selection (not on page load) — only one org's contacts needed at a time.
7. Known contact options show name and email as read-only text — no editable input boxes.
8. If a new contact registers via `group.contactPicker.newContact`, the org is not removed from `org.picker.group.openSection` (the system cannot confirm whether the intended pre-registered contact has arrived).

---

## Files

| File | Change |
|---|---|
| `lib/types.ts` | Add `OrgContactOption` interface |
| `lib/db-service.ts` | Add `getOrgContactsForEvent(eventId, orgId)` static method |
| `lib/actions.ts` | Add `getOrgContactsForEvent` server action wrapper |
| `components/registration-form.tsx` | New state + fetch on org selection + render `group.contactPicker` + wire pre-population + Step 1 validation |

---

## Task 1: `OrgContactOption` type

**Files:**
- Modify: `lib/types.ts`

A new interface representing a single contact option in `group.contactPicker`.

- [ ] **Step 1: Add interface to `lib/types.ts`**

Add after the `GroupLeader` interface:

```ts
/**
 * A contact option for the Group leader contact picker.
 * Returned by getOrgContactsForEvent — one entry per organisation_contacts row.
 */
export interface OrgContactOption {
  contactId: string;        // organisation_contacts.id (UUID)
  firstName: string;
  lastName: string;
  email: string | null;
  photoConsent: boolean;
  feedbackConsent: boolean;
  nextEventConsent: boolean;
  alreadyRegistered: boolean; // true if email matches an existing Group reg for this event + org
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Check editor — no red underlines in `lib/types.ts`.

- [ ] **Step 3: Commit**

```bash
cd software/nextjs
git add lib/types.ts
git commit -m "feat: add OrgContactOption type for group contact picker"
```

---

## Task 2: `getOrgContactsForEvent` — DB method and server action

**Files:**
- Modify: `lib/db-service.ts`
- Modify: `lib/actions.ts`

Fetches all `organisation_contacts` rows for the given org + event, and tags each with `alreadyRegistered` based on email matching against existing Group registrations.

- [ ] **Step 1: Add static method to `lib/db-service.ts`**

Add after `getRegistrationsByOrganization`. The join chain:
- `orgId` (UUID) → look up `organisations.airtableRecordId`
- `airtableRecordId` + event's `airtableRecordId` → query `organisation_contacts`
- Also query existing Group registration emails for this event + org to compute `alreadyRegistered`

```ts
/**
 * Get all contacts for an organisation at a specific event, with registration status.
 * Used to populate group.contactPicker in the Group leader registration form.
 *
 * @param eventId  - The event UUID (local)
 * @param orgId    - The organisation UUID (local, organisations.id)
 */
static async getOrgContactsForEvent(
  eventId: string,
  orgId: string,
): Promise<OrgContactOption[]> {
  // 1. Get the event's airtable record ID
  const [evt] = await db.select({ airtableRecordId: events.airtableRecordId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!evt) return [];

  // 2. Get the org's airtable record ID
  const [org] = await db.select({ airtableRecordId: organisations.airtableRecordId })
    .from(organisations)
    .where(eq(organisations.id, orgId))
    .limit(1);
  if (!org?.airtableRecordId) return [];

  // 3. Fetch all contacts for this org + event
  const contacts = await db.select()
    .from(organisationContacts)
    .where(
      and(
        eq(organisationContacts.organisationId, org.airtableRecordId),
        eq(organisationContacts.airtableEventId, evt.airtableRecordId ?? ''),
      )
    );
  if (contacts.length === 0) return [];

  // 4. Fetch emails of Group registrations already submitted for this event + org
  const existingRegs = await db
    .select({ email: registrations.email })
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.organizationId, orgId),
        eq(registrations.role, 'Group'),
      )
    );
  const registeredEmails = new Set(
    existingRegs.map(r => r.email).filter((e): e is string => e != null)
  );

  // 5. Map to OrgContactOption
  return contacts.map(c => ({
    contactId: c.id,
    firstName: c.contactFirstName ?? '',
    lastName: c.contactLastName ?? '',
    email: c.contactEmail ?? null,
    photoConsent: c.photoConsent,
    feedbackConsent: c.feedbackConsent,
    nextEventConsent: c.nextEventConsent,
    alreadyRegistered: c.contactEmail != null && registeredEmails.has(c.contactEmail),
  }));
}
```

Note: the import for `OrgContactOption` must be added at the top of `lib/db-service.ts`:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption } from './types';
```

- [ ] **Step 2: Add server action in `lib/actions.ts`**

Add after `getRegistrationsByOrganization`:

```ts
/**
 * Get contacts for an organisation at a specific event, with registration status.
 * Used to populate group.contactPicker in the registration form.
 */
export async function getOrgContactsForEvent(
  eventId: string,
  orgId: string,
): Promise<OrgContactOption[]> {
  return await DatabaseService.getOrgContactsForEvent(eventId, orgId);
}
```

Add `OrgContactOption` to the import from `./types` in `lib/actions.ts`:

```ts
import type { Event, Organization, OrgRecord, GroupLeader, Volunteer, Registration, OrgContactOption } from './types';
```

- [ ] **Step 3: Verify no TypeScript errors**

Check editor — no red underlines in `lib/db-service.ts` or `lib/actions.ts`.

- [ ] **Step 4: Commit**

```bash
git add lib/db-service.ts lib/actions.ts
git commit -m "feat: add getOrgContactsForEvent server action for contact picker"
```

---

## Task 3: Form state for `group.contactPicker`

**Files:**
- Modify: `components/registration-form.tsx`

Add state to hold the fetched contacts and the user's current picker selection. Trigger a fetch when `org.picker.group` selection changes.

- [ ] **Step 1: Add import for the new action and type**

Update the actions import line to include `getOrgContactsForEvent`:

```ts
import { ..., getOrgContactsForEvent } from "@/lib/actions";
```

Add a type import near the top:

```ts
import type { RegistrationFormData, Event, Organization, Volunteer, OrgContactOption } from "@/lib/types";
```

- [ ] **Step 2: Add state variables**

After the existing `allOrganizations` state, add:

```ts
// Group contact picker state
const [orgContacts, setOrgContacts] = useState<OrgContactOption[]>([]);
const [contactsLoading, setContactsLoading] = useState(false);
// 'new' = new contact option selected; contactId string = known contact selected; null = none yet
const [selectedContactId, setSelectedContactId] = useState<string | 'new' | null>(null);
```

- [ ] **Step 3: Fetch contacts when `org.picker.group` selection changes**

The form already has a `useEffect` watching `selectedOrgId` for multi-leader detection. Add a separate `useEffect` for the contact picker fetch:

```ts
// Fetch contacts for group.contactPicker when org is selected in Group role
useEffect(() => {
  async function fetchOrgContacts() {
    if (selectedRole !== 'Group' || !selectedOrgId || selectedOrgId === 'FAMILY_GROUP_PLACEHOLDER' || selectedOrgId === 'NOT_LISTED' || !currentEvent?.id) {
      setOrgContacts([]);
      setSelectedContactId(null);
      return;
    }
    try {
      setContactsLoading(true);
      const contacts = await getOrgContactsForEvent(currentEvent.id, selectedOrgId);
      setOrgContacts(contacts);
      setSelectedContactId(null); // reset selection when org changes
    } catch (err) {
      console.error('Error fetching org contacts:', err);
      setOrgContacts([]);
    } finally {
      setContactsLoading(false);
    }
  }
  fetchOrgContacts();
}, [selectedOrgId, selectedRole, currentEvent?.id]);
```

- [ ] **Step 4: Reset contact picker when role changes away from Group**

The existing `useEffect` that resets org selection on role change should also reset contact state:

```ts
useEffect(() => {
  if (selectedRole !== 'Group') {
    setShowOrganizationAlert(false);
    setOrgContacts([]);
    setSelectedContactId(null);
  }
  form.setValue("organizationId", "");
}, [selectedRole, form]);
```

- [ ] **Step 5: Verify no TypeScript errors**

Check editor.

- [ ] **Step 6: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: add contact picker state and fetch logic to registration form"
```

---

## Task 4: Render `group.contactPicker` UI

**Files:**
- Modify: `components/registration-form.tsx`

Render the `GROUP_CONTACT_PICKER` section in Group Step 1, below `org.picker.group`. The section is hidden until an org has been selected.

The visible contacts list = `orgContacts.filter(c => !c.alreadyRegistered)`. If all known contacts are already registered, show only `group.contactPicker.newContact` with a note.

- [ ] **Step 1: Add the contact picker block after the Group org/email row**

Locate the end of the Group role `organizationEmail` section (just after the closing `</div>` of the org + email grid, around line 583). Insert:

```tsx
{/* GROUP_CONTACT_PICKER — Group Step 1, after org selected */}
{selectedRole === 'Group' && shouldShowSection('organizationEmail') && selectedOrgId && selectedOrgId !== 'FAMILY_GROUP_PLACEHOLDER' && selectedOrgId !== 'NOT_LISTED' && !showOrganizationAlert && (
  <div className="mt-4">
    {contactsLoading ? (
      <p className="text-sm text-gray-500">Loading contacts...</p>
    ) : (
      <div className="space-y-2">
        {/* Note when all known contacts have already registered */}
        {orgContacts.length > 0 && orgContacts.every(c => c.alreadyRegistered) && (
          <p className="text-sm text-blue-600 mb-2">
            ℹ️ All registered contacts for this organisation have already checked in.
          </p>
        )}

        <p className="text-sm font-medium text-gray-700">Please select your details:</p>

        {/* Known contact options — hidden if already registered */}
        {orgContacts.filter(c => !c.alreadyRegistered).map(contact => (
          <label
            key={contact.contactId}
            className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${selectedContactId === contact.contactId ? 'border-lime-500 bg-lime-50' : 'border-gray-200'}`}
          >
            <input
              type="radio"
              name="contactPicker"
              value={contact.contactId}
              checked={selectedContactId === contact.contactId}
              onChange={() => {
                setSelectedContactId(contact.contactId);
                // Pre-populate IDENTITY fields silently
                form.setValue('attendeeName', contact.firstName);
                form.setValue('attendeeSurname', contact.lastName);
                form.setValue('email', contact.email ?? '');
                // Pre-populate consent preferences
                form.setValue('photoConsent', contact.photoConsent);
                form.setValue('feedbackConsent', contact.feedbackConsent);
                form.setValue('nextEventConsent', contact.nextEventConsent);
              }}
              className="mt-1 accent-lime-600"
            />
            <div className="flex-1">
              <p className="font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
              {contact.email && (
                <p className="text-sm text-gray-500">{contact.email}</p>
              )}
            </div>
          </label>
        ))}

        {/* New contact option — always last */}
        <label
          className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${selectedContactId === 'new' ? 'border-lime-500 bg-lime-50' : 'border-gray-200'}`}
        >
          <input
            type="radio"
            name="contactPicker"
            value="new"
            checked={selectedContactId === 'new'}
            onChange={() => {
              setSelectedContactId('new');
              // Clear pre-populated fields so user enters fresh details
              form.setValue('attendeeName', '');
              form.setValue('attendeeSurname', '');
              form.setValue('email', '');
              form.setValue('photoConsent', true);
              form.setValue('feedbackConsent', false);
              form.setValue('nextEventConsent', false);
            }}
            className="mt-1 accent-lime-600"
          />
          <div className="flex-1">
            <p className="font-medium text-gray-900">Register as a new contact</p>
            {selectedContactId === 'new' && (
              <div className="mt-3 space-y-3">
                {/* inline identity.firstName */}
                <FormField
                  control={form.control}
                  name="attendeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* inline identity.lastName */}
                <FormField
                  control={form.control}
                  name="attendeeSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* inline identity.email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </label>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 2: Hide the separate IDENTITY name fields for Group Step 1**

The existing `identity.firstName` and `identity.lastName` fields are shown in a shared block for Group and Participant Step 1. For Group role, they must not show as separate entry boxes on Step 1 — the contact picker handles them.

Find the `personalDetails` section block (around line 633). The condition already gates on `shouldShowSection("personalDetails")`. Add a guard to exclude Group Step 1:

```tsx
{/* First Name and Last Name — Side by Side */}
{!showOrganizationAlert && shouldShowSection("personalDetails") && (isFieldVisible("attendeeName", selectedRole) || isFieldVisible("attendeeSurname", selectedRole)) && !(selectedRole === 'Group' && currentStep === 1) && (
```

This hides the separate name fields on Group Step 1. They remain visible on all other steps/roles.

- [ ] **Step 3: Hide the separate `identity.email` field for Group Step 1**

The Group role email field is currently shown in the org/email grid on Step 1. Since the contact picker now populates email, this field should be hidden on Group Step 1. It will still be available via the picker's inline fields for new contacts.

In the Group org/email grid (around line 504), the email field is rendered alongside the org picker:

```tsx
{/* Email - Right */}
{isFieldVisible("email", selectedRole) && (
```

Wrap this with an additional condition to exclude Group Step 1:

```tsx
{isFieldVisible("email", selectedRole) && !(selectedRole === 'Group' && currentStep === 1) && (
```

- [ ] **Step 4: Verify no TypeScript errors**

Check editor.

- [ ] **Step 5: Manual smoke test — basic rendering**

Start dev server (`npm run dev`). Open `/registration`, select Group role:

1. Before org selected: contact picker not visible
2. Select a known org with multiple contacts: contact picker appears with radio options showing name + email as text, plus "Register as a new contact" at the end
3. Select a known contact: `identity.*` fields in the DOM are pre-populated (check React DevTools or confirm they're populated when advancing to Step 2)
4. Select "new contact": inline firstName / lastName / email fields appear
5. `org.picker.group.familyGroup` selected: contact picker does NOT appear

- [ ] **Step 6: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: render group.contactPicker UI in Group Step 1"
```

---

## Task 5: Step 1 validation — require contact picker selection

**Files:**
- Modify: `components/registration-form.tsx`

`validateCurrentStep` currently requires `["organizationId", "email", "attendeeName", "attendeeSurname"]` for Group Step 1. With the contact picker, IDENTITY fields are populated via the picker — but we must also require that a contact picker option has been selected before advancing.

Contact picker selection is not a React Hook Form field (it's local state), so validation is handled in `validateCurrentStep` as a manual check alongside the form field validation.

- [ ] **Step 1: Update `validateCurrentStep` for Group Step 1**

Find the `validateCurrentStep` function (around line 150). Update the Group Step 1 branch:

```ts
} else if (selectedRole === 'Group') {
  if (currentStep === 1) {
    // Require org selection
    fieldsToValidate = ['organizationId'];

    // If contact picker is shown (org selected, not family group), require a selection
    if (selectedOrgId && selectedOrgId !== 'FAMILY_GROUP_PLACEHOLDER' && selectedOrgId !== 'NOT_LISTED' && !contactsLoading) {
      if (!selectedContactId) {
        // Contact picker shown but nothing selected — block advancement
        // React Hook Form can't validate this field; handle via a toast or inline message
        // For simplicity: alert the user and return false
        alert('Please select your contact details or choose "Register as a new contact".');
        return false;
      }
      // If new contact selected, also validate the inline fields
      if (selectedContactId === 'new') {
        fieldsToValidate = ['organizationId', 'attendeeName', 'attendeeSurname'];
      }
    }
  }
```

Note: the `alert()` is a temporary measure consistent with the existing error handling pattern in `onSubmit`. A future improvement can replace this with an inline validation message.

- [ ] **Step 2: Verify Step 2 still validates correctly**

Step 2 validation (`fieldsToValidate = ["groupLeaderParticipating", ...]`) is unchanged. Confirm it still works after Step 1 modifications.

- [ ] **Step 3: Manual test — Step 1 validation**

1. Select Group role, select an org — try advancing without selecting a contact: blocked with message
2. Select a known contact — advance succeeds; Step 2 shown with correct name pre-populated
3. Select "new contact", leave fields blank — advance blocked by form validation on `attendeeName`/`attendeeSurname`
4. Select "new contact", fill in fields — advance succeeds

- [ ] **Step 4: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: require contact picker selection before advancing Group Step 1"
```

---

## Task 6: Submit — conditional consent sync

**Files:**
- Modify: `components/registration-form.tsx`

After a successful Group registration, `updateGroupLeaderConsents` is called using `contactOrg.contactId`. With the contact picker, `contactId` is now known directly from `selectedContactId` (when a known contact was selected).

- [ ] **Step 1: Update the post-submit consent sync block**

Find the consent sync block in `onSubmit` (around line 358):

```ts
if (data.role === "Group") {
  const contactOrg = createdFamilyGroup ?? selectedOrg;
  if (contactOrg?.contactId) {
    await updateGroupLeaderConsents(contactOrg.contactId, {
      ...
    });
  }
}
```

Replace with:

```ts
if (data.role === "Group") {
  // Determine which contactId to sync consents to:
  // - Family Group (created on submit): use contactId from newly created org
  // - Known contact from picker: use selectedContactId directly
  // - New contact from picker: no contactId — skip consent sync
  const contactId =
    createdFamilyGroup?.contactId ??
    (selectedContactId !== 'new' && selectedContactId ? selectedContactId : null);

  if (contactId) {
    await updateGroupLeaderConsents(contactId, {
      contactEmail: data.email,
      photoConsent: data.photoConsent,
      feedbackConsent: data.feedbackConsent ?? false,
      nextEventConsent: data.nextEventConsent ?? false,
    });
  }
}
```

- [ ] **Step 2: Reset contact picker state on form reset**

After the `form.reset()` call in the submit success timeout, also reset:

```ts
setSelectedContactId(null);
setOrgContacts([]);
```

- [ ] **Step 3: Manual test — full submit flow**

**Scenario A — Known contact submits:**
1. Select Group, select an org, select a known contact, complete Step 2 + 3, submit
2. Confirm registration row created with correct name/email
3. Confirm `organisation_contacts` row updated with new consent values (check via Drizzle Studio)

**Scenario B — New contact submits:**
1. Select Group, select an org, select "new contact", enter details, complete and submit
2. Confirm registration row created with entered name/email
3. Confirm no error thrown (no consent sync attempt)

**Scenario C — Contact already registered is hidden:**
1. Complete Scenario A to register a known contact
2. Reload form, select Group, select same org
3. Confirm that contact is no longer listed in `group.contactPicker` (hidden because already registered)

**Scenario D — Family group unaffected:**
1. Select Group, select `org.picker.group.familyGroup` (the Family Group placeholder)
2. Confirm: no contact picker shown; IDENTITY fields appear directly as before

**Scenario E — Participant flow unchanged:**
1. Select Participant role — confirm no contact picker; `identity.*` fields show directly

- [ ] **Step 4: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: wire consent sync to contactId from contact picker on Group submit"
```

---

## Completion Checklist

- [ ] All scenarios in Task 6 Step 3 pass manual testing
- [ ] No TypeScript errors in editor
- [ ] No console errors during Group registration flow
- [ ] Contact picker not shown for `org.picker.group.familyGroup`
- [ ] Participant and Volunteer flows completely unchanged
- [ ] `identity.*` name fields not shown as separate boxes on Group Step 1
- [ ] Separate `identity.email` field not shown on Group Step 1 (email captured via picker)
- [ ] `group.existingLeaderNotice` / `group.additionalLeaderChoice` still appear correctly on Step 2 when the org already has a Group registration
- [ ] Consent preferences stored on `organisation_contacts` are updated correctly after a known-contact registration
