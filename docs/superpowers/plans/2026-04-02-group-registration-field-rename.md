# Group Registration Field Rename & Validation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename `disabled_students` → `impaired_participants` and `sen_students` → `non_impaired_participants` across the database, codebase, and UI; add smart advisory validation for participant count consistency.

**Architecture:** Column rename in Drizzle schema cascaded through all 17 referencing files (types, validation, services, components, scripts, docs). New inline advisory warning component in the registration form using watched form values.

**Tech Stack:** Drizzle ORM, Zod, React Hook Form, Shadcn UI, Neon PostgreSQL

**Note on Airtable:** The Airtable field constants `DISABLED_STUDENTS` and `SEN_STUDENTS` in `lib/airtable.ts` map to actual Airtable column names ("Disabled Students", "SEN Students"). These string values must match whatever the Airtable base uses. If the Airtable base columns are also being renamed, update the string values in Task 2. If not, keep the string values as-is but rename the constant keys to match the new terminology. This plan assumes the Airtable column names stay the same and only the constant keys are renamed for code consistency.

---

### Task 1: Rename database columns in Drizzle schema

**Files:**
- Modify: `lib/db/schema.ts:77-78`

- [ ] **Step 1: Update column definitions**

In `lib/db/schema.ts`, change lines 77-78 from:

```ts
disabledStudents: integer('disabled_students'),
senStudents: integer('sen_students'),
```

to:

```ts
impairedParticipants: integer('impaired_participants'),
nonImpairedParticipants: integer('non_impaired_participants'),
```

- [ ] **Step 2: Generate migration to inspect SQL**

Run:
```bash
npm run db:generate
```

Check the generated migration file in `drizzle/` — confirm it contains `ALTER TABLE ... RENAME COLUMN` statements (not `DROP COLUMN` + `ADD COLUMN`). If it generates drop+create, write a custom SQL migration with rename statements instead.

- [ ] **Step 3: Push schema changes**

Run:
```bash
npm run db:push
```

Expected: Schema applied successfully. The `registrations` table now has `impaired_participants` and `non_impaired_participants` columns.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts drizzle/
git commit -m "feat: rename disabled_students and sen_students columns in schema"
```

---

### Task 2: Update TypeScript types and Airtable field constants

**Files:**
- Modify: `lib/types.ts:70-71, 211-212`
- Modify: `lib/airtable.ts:80-81`

- [ ] **Step 1: Update Registration interface in lib/types.ts**

Change lines 70-71 from:

```ts
disabledStudents?: number; // Number of disabled participants (REQUIRED for Group)
senStudents?: number; // Number of SEN/additional learning support students (REQUIRED for Group)
```

to:

```ts
impairedParticipants?: number; // Number of impaired participants (REQUIRED for closed Group)
nonImpairedParticipants?: number; // Number of non-impaired participants (REQUIRED for closed Group)
```

- [ ] **Step 2: Update RegistrationFormData interface in lib/types.ts**

Change lines 211-212 from:

```ts
disabledStudents?: number; // Required for Group
senStudents?: number; // Required for Group
```

to:

```ts
impairedParticipants?: number; // Required for closed Group
nonImpairedParticipants?: number; // Required for closed Group
```

- [ ] **Step 3: Update Airtable field constant keys in lib/airtable.ts**

Change lines 80-81 from:

```ts
DISABLED_STUDENTS: "Disabled Students",
SEN_STUDENTS: "SEN Students",
```

to:

```ts
IMPAIRED_PARTICIPANTS: "Disabled Students",
NON_IMPAIRED_PARTICIPANTS: "SEN Students",
```

Note: The string values ("Disabled Students", "SEN Students") stay the same because they map to actual Airtable column names. Only the constant keys change for code consistency.

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts lib/airtable.ts
git commit -m "feat: update TypeScript types and Airtable constants for field rename"
```

---

### Task 3: Update validation schemas

**Files:**
- Modify: `lib/validation.ts:77, 117-127`
- Modify: `app/admin/event/register-organization/page.tsx:43-44, 70-71`

- [ ] **Step 1: Update Zod schema in lib/validation.ts**

Change the comment at line 77 from:

```ts
* - Group fields (groupSize, disabledStudents, senStudents, groupLeaderParticipating) are OPTIONAL
```

to:

```ts
* - Group fields (groupSize, impairedParticipants, nonImpairedParticipants, groupLeaderParticipating) are OPTIONAL
```

Change lines 117-127 from:

```ts
disabledStudents: z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
  .max(999, "Disabled students must be at most 999")
  .optional(),
senStudents: z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
```

to:

```ts
impairedParticipants: z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
  .max(999, "Must be at most 999")
  .optional(),
nonImpairedParticipants: z
  .number()
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
```

Also update the `.max()` message for `senStudents` → `nonImpairedParticipants` (check the line after 127 for the max validator — update its message similarly).

- [ ] **Step 2: Update register-organization page Zod schema**

In `app/admin/event/register-organization/page.tsx`, change lines 43-44 from:

```ts
disabledStudents: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
senStudents: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
```

to:

```ts
impairedParticipants: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
nonImpairedParticipants: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
```

- [ ] **Step 3: Update register-organization page form defaults**

In the same file, change lines 70-71 from:

```ts
disabledStudents: undefined,
senStudents: undefined,
```

to:

```ts
impairedParticipants: undefined,
nonImpairedParticipants: undefined,
```

- [ ] **Step 4: Commit**

```bash
git add lib/validation.ts app/admin/event/register-organization/page.tsx
git commit -m "feat: update validation schemas for field rename"
```

---

### Task 4: Update DatabaseService and server actions

**Files:**
- Modify: `lib/db-service.ts:786-787, 1287-1288`
- Modify: `app/actions/airtable-sync.ts:69-70`

- [ ] **Step 1: Update insert registration in lib/db-service.ts**

Change lines 786-787 from:

```ts
disabledStudents: data.disabledStudents ?? null,
senStudents: data.senStudents ?? null,
```

to:

```ts
impairedParticipants: data.impairedParticipants ?? null,
nonImpairedParticipants: data.nonImpairedParticipants ?? null,
```

- [ ] **Step 2: Update participant counting query in lib/db-service.ts**

Change lines 1287-1288 from:

```ts
disabledStudents: registrations.disabledStudents,
senStudents: registrations.senStudents,
```

to:

```ts
impairedParticipants: registrations.impairedParticipants,
nonImpairedParticipants: registrations.nonImpairedParticipants,
```

- [ ] **Step 3: Update Airtable sync field mapping**

In `app/actions/airtable-sync.ts`, change lines 69-70 from:

```ts
if (reg.disabledStudents != null) fields[F.DISABLED_STUDENTS] = reg.disabledStudents;
if (reg.senStudents != null) fields[F.SEN_STUDENTS] = reg.senStudents;
```

to:

```ts
if (reg.impairedParticipants != null) fields[F.IMPAIRED_PARTICIPANTS] = reg.impairedParticipants;
if (reg.nonImpairedParticipants != null) fields[F.NON_IMPAIRED_PARTICIPANTS] = reg.nonImpairedParticipants;
```

- [ ] **Step 4: Commit**

```bash
git add lib/db-service.ts app/actions/airtable-sync.ts
git commit -m "feat: update db-service and airtable-sync for field rename"
```

---

### Task 5: Update participant counting logic

**Files:**
- Modify: `lib/participant-counting.ts:55-56, 111-112, 239-240, 255-256, 444-445`

- [ ] **Step 1: Update GroupRegistration interface**

Change lines 55-56 from:

```ts
disabledStudents?: number | null;
senStudents?: number | null;
```

to:

```ts
impairedParticipants?: number | null;
nonImpairedParticipants?: number | null;
```

- [ ] **Step 2: Update ParticipantCounts return type**

Change lines 111-112 from:

```ts
disabledStudents: number;
senStudents: number;
```

to:

```ts
impairedParticipants: number;
nonImpairedParticipants: number;
```

- [ ] **Step 3: Update aggregation logic**

Change lines 239-240 from:

```ts
existing.totalDisabled += group.disabledStudents || 0;
existing.totalSen += group.senStudents || 0;
```

to:

```ts
existing.totalDisabled += group.impairedParticipants || 0;
existing.totalSen += group.nonImpairedParticipants || 0;
```

Change lines 255-256 from:

```ts
totalDisabled: group.disabledStudents || 0,
totalSen: group.senStudents || 0,
```

to:

```ts
totalDisabled: group.impairedParticipants || 0,
totalSen: group.nonImpairedParticipants || 0,
```

- [ ] **Step 4: Update return statement**

Change lines 444-445 from:

```ts
disabledStudents: totalDisabledStudents,
senStudents: totalSenStudents,
```

to:

```ts
impairedParticipants: totalDisabledStudents,
nonImpairedParticipants: totalSenStudents,
```

- [ ] **Step 5: Commit**

```bash
git add lib/participant-counting.ts
git commit -m "feat: update participant counting logic for field rename"
```

---

### Task 6: Update field visibility config

**Files:**
- Modify: `lib/field-visibility-config.ts:20-21, 49-50, 68-69, 87-88`

- [ ] **Step 1: Update field type union**

Change lines 20-21 from:

```ts
| "disabledStudents"
| "senStudents";
```

to:

```ts
| "impairedParticipants"
| "nonImpairedParticipants";
```

- [ ] **Step 2: Update all three role visibility objects**

In the Participant config (lines 49-50), Volunteer config (lines 68-69), and Group config (lines 87-88), change all occurrences of:

```ts
disabledStudents: false,  // (or true for Group)
senStudents: false,       // (or true for Group)
```

to:

```ts
impairedParticipants: false,  // (or true for Group)
nonImpairedParticipants: false,       // (or true for Group)
```

- [ ] **Step 3: Commit**

```bash
git add lib/field-visibility-config.ts
git commit -m "feat: update field visibility config for field rename"
```

---

### Task 7: Update registration form — field rename and new labels

**Files:**
- Modify: `components/registration-form.tsx:82-83, 224, 414-415, 926-927, 946-947, 1271-1277, 1298-1304`

- [ ] **Step 1: Update form default values**

Change lines 82-83 from:

```ts
disabledStudents: undefined,
senStudents: undefined,
```

to:

```ts
impairedParticipants: undefined,
nonImpairedParticipants: undefined,
```

- [ ] **Step 2: Update step 2 validation field list**

Change line 224 from:

```ts
fieldsToValidate = ["groupLeaderParticipating", "groupSize", "disabledStudents", "senStudents"];
```

to:

```ts
fieldsToValidate = ["groupLeaderParticipating", "groupSize", "impairedParticipants", "nonImpairedParticipants"];
```

- [ ] **Step 3: Update form submission data**

Change lines 414-415 from:

```ts
disabledStudents: data.disabledStudents,
senStudents: data.senStudents,
```

to:

```ts
impairedParticipants: data.impairedParticipants,
nonImpairedParticipants: data.nonImpairedParticipants,
```

- [ ] **Step 4: Update additional leader choice setValue calls**

Change lines 926-927 from:

```ts
form.setValue('disabledStudents', 0);
form.setValue('senStudents', 0);
```

to:

```ts
form.setValue('impairedParticipants', 0);
form.setValue('nonImpairedParticipants', 0);
```

Change lines 946-947 from:

```ts
form.setValue('disabledStudents', undefined);
form.setValue('senStudents', undefined);
```

to:

```ts
form.setValue('impairedParticipants', undefined);
form.setValue('nonImpairedParticipants', undefined);
```

- [ ] **Step 5: Update the impaired participants field (formerly disabled students)**

Change the block starting at line 1270-1293. Update the comment, visibility check, field name, and label:

```tsx
{/* Impaired Participants - Only for closed groups - Step 2 for Group */}
{!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("impairedParticipants", selectedRole) && (
  <FormField
    control={form.control}
    name="impairedParticipants"
    render={({ field }) => (
      <FormItem>
        <FormLabel>How many participants in your group have a disability or long-term physical or mental health condition or impairment? *</FormLabel>
```

Keep the rest of the FormField render (Input, FormMessage) the same, just ensure `field` props are passed through identically.

- [ ] **Step 6: Update the non-impaired participants field (formerly SEN students)**

Change the block starting at line 1297-1320. Update the comment, visibility check, field name, and label:

```tsx
{/* Non-impaired Participants - Only for closed groups - Step 2 for Group */}
{!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("nonImpairedParticipants", selectedRole) && (
  <FormField
    control={form.control}
    name="nonImpairedParticipants"
    render={({ field }) => (
      <FormItem>
        <FormLabel>How many participants in your group are not impaired? *</FormLabel>
```

Keep the rest of the FormField render identical.

- [ ] **Step 7: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: rename fields and update labels in registration form"
```

---

### Task 8: Add smart advisory validation warning

**Files:**
- Modify: `components/registration-form.tsx` (add warning below the participant count fields in Step 2)

- [ ] **Step 1: Add watched values and last-edited tracking**

Near the top of the component (alongside existing `useWatch` or `watch` calls), add watchers for the three fields and a ref to track last-edited:

```tsx
const watchedGroupSize = form.watch("groupSize");
const watchedImpaired = form.watch("impairedParticipants");
const watchedNonImpaired = form.watch("nonImpairedParticipants");
const lastEditedField = useRef<"impairedParticipants" | "nonImpairedParticipants" | null>(null);
```

Add `onChange` handlers (or extend existing ones) on the `impairedParticipants` and `nonImpairedParticipants` input fields to track which was edited last:

For the impaired field's Input `onChange`:
```tsx
onChange={(e) => {
  field.onChange(e.target.value === '' ? undefined : Number(e.target.value));
  lastEditedField.current = "impairedParticipants";
}}
```

For the non-impaired field's Input `onChange`:
```tsx
onChange={(e) => {
  field.onChange(e.target.value === '' ? undefined : Number(e.target.value));
  lastEditedField.current = "nonImpairedParticipants";
}}
```

- [ ] **Step 2: Compute the advisory warning message**

Add a `useMemo` that computes the warning:

```tsx
const participantCountWarning = useMemo(() => {
  const groupSize = watchedGroupSize;
  const impaired = watchedImpaired;
  const nonImpaired = watchedNonImpaired;

  // Only show warning when at least two of three fields are filled
  const groupSizeFilled = groupSize != null && groupSize >= 0;
  const impairedFilled = impaired != null && impaired >= 0;
  const nonImpairedFilled = nonImpaired != null && nonImpaired >= 0;

  if (!groupSizeFilled) return null;

  // Both filled — check if they add up
  if (impairedFilled && nonImpairedFilled) {
    if (impaired + nonImpaired === groupSize) return null; // All good

    // Suggest the value for whichever was edited last (or most recently)
    if (lastEditedField.current === "impairedParticipants") {
      const expected = groupSize - impaired;
      return `These numbers don't add up to your group size of ${groupSize}. Based on your entries, non-impaired participants should be ${expected}.`;
    } else {
      const expected = groupSize - nonImpaired;
      return `These numbers don't add up to your group size of ${groupSize}. Based on your entries, impaired participants should be ${expected}.`;
    }
  }

  // Only impaired filled — suggest non-impaired
  if (impairedFilled && !nonImpairedFilled) {
    const expected = groupSize - impaired;
    return `Based on your group size of ${groupSize}, non-impaired participants should be ${expected}.`;
  }

  // Only non-impaired filled — suggest impaired
  if (!impairedFilled && nonImpairedFilled) {
    const expected = groupSize - nonImpaired;
    return `Based on your group size of ${groupSize}, impaired participants should be ${expected}.`;
  }

  return null;
}, [watchedGroupSize, watchedImpaired, watchedNonImpaired]);
```

- [ ] **Step 3: Render the advisory warning**

Add the warning immediately after the `nonImpairedParticipants` FormField block (after the closing `)}` of the non-impaired field's conditional render):

```tsx
{/* Advisory: participant count mismatch */}
{participantCountWarning && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && (
  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
    <p>{participantCountWarning}</p>
  </div>
)}
```

- [ ] **Step 4: Verify the form builds**

Run:
```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add components/registration-form.tsx
git commit -m "feat: add smart advisory validation for participant count mismatch"
```

---

### Task 9: Update admin pages and CSV export

**Files:**
- Modify: `app/admin/event/page.tsx:35-36`
- Modify: `app/admin/event/registrations/[id]/page.tsx:160-161`
- Modify: `app/admin/p2i/page.tsx:32-33, 287-288, 324-325, 428-429`

- [ ] **Step 1: Update event admin page ParticipantCounts init**

In `app/admin/event/page.tsx`, change lines 35-36 from:

```ts
disabledStudents: 0,
senStudents: 0,
```

to:

```ts
impairedParticipants: 0,
nonImpairedParticipants: 0,
```

- [ ] **Step 2: Update registration detail page labels**

In `app/admin/event/registrations/[id]/page.tsx`, change lines 160-161 from:

```tsx
<DetailField label="Disabled Students" value={registration.disabledStudents?.toString() || '—'} />
<DetailField label="SEN Students" value={registration.senStudents?.toString() || '—'} />
```

to:

```tsx
<DetailField label="Impaired Participants" value={registration.impairedParticipants?.toString() || '—'} />
<DetailField label="Non-impaired Participants" value={registration.nonImpairedParticipants?.toString() || '—'} />
```

- [ ] **Step 3: Update P2I admin CSV interface**

In `app/admin/p2i/page.tsx`, change the `RegistrationCSVRow` interface (lines 32-33) from:

```ts
disabledStudents: string;
senStudents: string;
```

to:

```ts
impairedParticipants: string;
nonImpairedParticipants: string;
```

- [ ] **Step 4: Update CSV headers**

In the same file, change lines 287-288 from:

```ts
'Disabled Students',
'SEN Students',
```

to:

```ts
'Impaired Participants',
'Non-impaired Participants',
```

- [ ] **Step 5: Update CSV row mapping**

Change lines 324-325 from:

```ts
escapeCSV(row.disabledStudents),
escapeCSV(row.senStudents),
```

to:

```ts
escapeCSV(row.impairedParticipants),
escapeCSV(row.nonImpairedParticipants),
```

- [ ] **Step 6: Update CSV data building**

Change lines 428-429 from:

```ts
disabledStudents: reg.disabledStudents?.toString() || '',
senStudents: reg.senStudents?.toString() || '',
```

to:

```ts
impairedParticipants: reg.impairedParticipants?.toString() || '',
nonImpairedParticipants: reg.nonImpairedParticipants?.toString() || '',
```

- [ ] **Step 7: Commit**

```bash
git add app/admin/event/page.tsx app/admin/event/registrations/[id]/page.tsx app/admin/p2i/page.tsx
git commit -m "feat: update admin pages and CSV export for field rename"
```

---

### Task 10: Update scripts and documentation

**Files:**
- Modify: `scripts/test-airtable-push.ts:56-57`
- Modify: `scripts/analyze-participant-counts.ts:48-49, 147-148, 169-170`
- Modify: `documentation/REGISTRATION_SYNC_FIELD_MAPPING.txt:30-31`
- Modify: `lib/FIELD_VISIBILITY_README.md:46-47, 64-65`

- [ ] **Step 1: Update test-airtable-push.ts**

Change lines 56-57 from:

```ts
if (reg.disabledStudents != null) fields["Disabled Students"] = reg.disabledStudents;
if (reg.senStudents != null) fields["SEN Students"] = reg.senStudents;
```

to:

```ts
if (reg.impairedParticipants != null) fields["Disabled Students"] = reg.impairedParticipants;
if (reg.nonImpairedParticipants != null) fields["SEN Students"] = reg.nonImpairedParticipants;
```

Note: The Airtable field name strings stay the same (they map to actual Airtable columns).

- [ ] **Step 2: Update analyze-participant-counts.ts**

Change lines 48-49 from:

```ts
disabledStudents: registrations.disabledStudents,
senStudents: registrations.senStudents,
```

to:

```ts
impairedParticipants: registrations.impairedParticipants,
nonImpairedParticipants: registrations.nonImpairedParticipants,
```

Change lines 147-148 from:

```ts
totalDisabledStudents += group.disabledStudents || 0;
totalSenStudents += group.senStudents || 0;
```

to:

```ts
totalDisabledStudents += group.impairedParticipants || 0;
totalSenStudents += group.nonImpairedParticipants || 0;
```

Change lines 169-170 from:

```ts
const disabled = String(group.disabledStudents || 0).padStart(8);
const sen = String(group.senStudents || 0).padStart(3);
```

to:

```ts
const disabled = String(group.impairedParticipants || 0).padStart(8);
const sen = String(group.nonImpairedParticipants || 0).padStart(3);
```

- [ ] **Step 3: Update REGISTRATION_SYNC_FIELD_MAPPING.txt**

Change lines 30-31 from:

```
13| disabled_students            | disabledStudents         | Disabled Students            | Number (integer)    | Only relevant for role='Group'. Send as number or omit if null.
14| sen_students                 | senStudents              | SEN Students                 | Number (integer)    | Only relevant for role='Group'. Send as number or omit if null.
```

to:

```
13| impaired_participants        | impairedParticipants     | Disabled Students            | Number (integer)    | Only relevant for role='Group'. Send as number or omit if null.
14| non_impaired_participants    | nonImpairedParticipants  | SEN Students                 | Number (integer)    | Only relevant for role='Group'. Send as number or omit if null.
```

- [ ] **Step 4: Update FIELD_VISIBILITY_README.md**

Change lines 46-47 from:

```
disabledStudents: true, // ← Changed from false to true
senStudents: true,      // ← Changed from false to true
```

to:

```
impairedParticipants: true, // ← Changed from false to true
nonImpairedParticipants: true,      // ← Changed from false to true
```

Change lines 64-65 from:

```
| `disabledStudents` | Number of disabled participants |
| `senStudents` | Number of SEN participants |
```

to:

```
| `impairedParticipants` | Number of impaired participants |
| `nonImpairedParticipants` | Number of non-impaired participants |
```

- [ ] **Step 5: Commit**

```bash
git add scripts/test-airtable-push.ts scripts/analyze-participant-counts.ts documentation/REGISTRATION_SYNC_FIELD_MAPPING.txt lib/FIELD_VISIBILITY_README.md
git commit -m "feat: update scripts and documentation for field rename"
```

---

### Task 11: Full build verification

- [ ] **Step 1: Run the build**

```bash
npm run build
```

Expected: Build succeeds with zero errors. All TypeScript types resolve correctly with the new field names.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors related to the renamed fields.

- [ ] **Step 3: Search for any remaining old references**

```bash
grep -r "disabledStudents\|senStudents\|disabled_students\|sen_students" --include="*.ts" --include="*.tsx" .
```

Expected: Zero matches. If any remain, fix them before proceeding.
