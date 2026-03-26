# Individual Participant Registration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow Participants who travel independently to select "Individual" from the organisation dropdown, backed by a permanent seeded DB record that groups them in reports.

**Architecture:** A single seeded `organisations` row with `groupType = 'Individual'` acts as the always-available option. `getOrganizations` appends it to every event's org list. `organizationsToOptions` places it at the bottom for Participants only.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Neon PostgreSQL, TypeScript, `npx tsx` for scripts.

---

## File Map

| File | Change |
|---|---|
| `lib/types.ts` | **Modify** — extend `GroupType` union to include `'Individual'` |
| `scripts/seed-individual-org.ts` | **Create** — idempotent script to insert the Individual org |
| `package.json` | **Modify** — add `db:seed-individual` npm script |
| `lib/db-service.ts` | **Modify** — `getOrganizations` always appends `groupType = 'Individual'` orgs |
| `lib/helpers.ts` | **Modify** — `organizationsToOptions` moves Individual orgs to bottom for Participant; excludes them for all other roles |

---

## Task 1: Extend GroupType to include Individual

**Files:**
- Modify: `software/nextjs/lib/types.ts` (line 84)

`GroupType` is a TypeScript union used in the `Organization` interface. The `organizationsToOptions` function compares `org.groupType === 'Individual'`, which TypeScript will reject unless `'Individual'` is a valid union member.

- [ ] **Step 1: Add 'Individual' to the GroupType union**

In `software/nextjs/lib/types.ts`, find line 84:

```ts
export type GroupType = 'Family' | 'Disability' | 'Corporate' | 'Sporting' | 'Community' | 'Educational' | 'Other';
```

Replace with:

```ts
export type GroupType = 'Family' | 'Disability' | 'Corporate' | 'Sporting' | 'Community' | 'Educational' | 'Other' | 'Individual';
```

- [ ] **Step 2: Check TypeScript compiles**

```bash
cd software/nextjs
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ../..
git add software/nextjs/lib/types.ts
git commit -m "feat: extend GroupType union to include Individual system marker"
```

---

## Task 2: Seed the Individual org record

**Files:**
- Create: `software/nextjs/scripts/seed-individual-org.ts`
- Modify: `software/nextjs/package.json`

- [ ] **Step 1: Create the seed script**

Create `software/nextjs/scripts/seed-individual-org.ts`:

```ts
/**
 * Seed script: Individual Organisation
 *
 * Inserts a single "Individual" organisation record if one doesn't already exist.
 * This record uses groupType = 'Individual' as a system marker — it is always
 * included in every event's org list regardless of Airtable import.
 *
 * Safe to run multiple times (idempotent).
 *
 * Usage: npm run db:seed-individual
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '../lib/db/schema';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function seedIndividualOrg() {
  console.log('🌱 Seeding Individual org record...');

  const existing = await db
    .select()
    .from(schema.organisations)
    .where(eq(schema.organisations.groupType, 'Individual'))
    .limit(1);

  if (existing.length > 0) {
    console.log('✅ Individual org already exists — skipping. ID:', existing[0].id);
    process.exit(0);
  }

  const [inserted] = await db
    .insert(schema.organisations)
    .values({
      name: 'Individual',
      groupType: 'Individual',
    })
    .returning();

  console.log('✅ Individual org created. ID:', inserted.id);
  process.exit(0);
}

seedIndividualOrg().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `software/nextjs/package.json`, add to the `"scripts"` block (after `db:seed`):

```json
"db:seed-individual": "npx tsx scripts/seed-individual-org.ts"
```

- [ ] **Step 3: Run the script**

```bash
cd software/nextjs
npm run db:seed-individual
```

Expected output:
```
🌱 Seeding Individual org record...
✅ Individual org created. ID: <some-uuid>
```

- [ ] **Step 4: Run again to verify idempotency**

```bash
npm run db:seed-individual
```

Expected output:
```
🌱 Seeding Individual org record...
✅ Individual org already exists — skipping. ID: <same-uuid>
```

- [ ] **Step 5: Commit**

```bash
cd ../..  # repo root
git add software/nextjs/scripts/seed-individual-org.ts software/nextjs/package.json
git commit -m "feat: add seed script for Individual org record"
```

---

## Task 3: Always include Individual org in `getOrganizations`

**Files:**
- Modify: `software/nextjs/lib/db-service.ts` (lines ~107–143)

Context: `getOrganizations(eventId)` fetches orgs joined with `organisation_contacts`, filtered by `airtableEventId`. The Individual org has no Airtable IDs so it would never appear in event-scoped results. We fix this by appending Individual orgs after the main query.

- [ ] **Step 1: Read the current method**

Open `software/nextjs/lib/db-service.ts` and locate `getOrganizations` (~line 107). It ends at ~line 143 with:
```ts
return filtered.map(r => mapOrganisationToOrganization(r.org, r.contact, eventUuid));
```

- [ ] **Step 2: Replace the return line**

Find this exact block at the end of `getOrganizations` (inside the `try`):

```ts
      return filtered.map(r => mapOrganisationToOrganization(r.org, r.contact, eventUuid));
```

Replace with:

```ts
      // Always append system orgs (groupType = 'Individual') regardless of event
      const systemOrgs = await db
        .select({ org: organisations, contact: organisationContacts })
        .from(organisations)
        .leftJoin(
          organisationContacts,
          eq(organisations.airtableRecordId, organisationContacts.organisationId)
        )
        .where(eq(organisations.groupType, 'Individual'));

      // Avoid duplicates if Individual org somehow appears in filtered already
      const filteredIds = new Set(filtered.map(r => r.org.id));
      const toAppend = systemOrgs.filter(r => !filteredIds.has(r.org.id));

      return [...filtered, ...toAppend].map(r =>
        mapOrganisationToOrganization(r.org, r.contact, eventUuid)
      );
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
cd software/nextjs
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add software/nextjs/lib/db-service.ts
git commit -m "feat: always include Individual org in getOrganizations results"
```

---

## Task 4: Place Individual at the bottom of the Participant dropdown; exclude from all other roles

**Files:**
- Modify: `software/nextjs/lib/helpers.ts`

Context: `organizationsToOptions` maps org records to `ComboboxOption[]`. For Participant role it already filters to `openGroup !== false`. We need to also sort any `groupType === 'Individual'` orgs to the bottom.

The Individual org has no `organisation_contacts` row, so `openGroup` defaults to `true` via `mapOrganisationToOrganization` — it will pass the Participant filter. We only need to sort it last.

- [ ] **Step 1: Read the current function**

Open `software/nextjs/lib/helpers.ts`. The `organizationsToOptions` function currently ends with:

```ts
  return orgOptions;
}
```

- [ ] **Step 2: Replace the full `organizationsToOptions` function**

Replace the entire function (lines ~23–64) with:

```ts
/**
 * Convert organizations to combobox options, filtered by role.
 *
 * Filtering rules:
 *  - Participant: show only orgs where openGroup === true; Individual org always last
 *  - Group:       show only orgs where openGroup === false
 *  - Volunteer / undefined: show all (no filtering)
 *
 * Always includes "Family Group" placeholder for Group role.
 * Deduplicates organizations by name (keeps first occurrence).
 */
export function organizationsToOptions(
  organizations: Organization[],
  role?: RegistrationType,
): ComboboxOption[] {
  // Filter out any existing "Family Group" entries from the database
  let filteredOrgs = organizations.filter(org => org.name !== 'Family Group');

  // Apply role-based filtering
  if (role === 'Participant') {
    // Participants see only open groups (Individual org is open, so it passes through)
    filteredOrgs = filteredOrgs.filter(org => org.openGroup !== false);
  } else if (role === 'Group') {
    // Group leaders see only closed groups (Individual is open, so naturally excluded)
    filteredOrgs = filteredOrgs.filter(org => org.openGroup === false);
  } else {
    // Volunteer / undefined: show all real orgs, but exclude system-only Individual org
    filteredOrgs = filteredOrgs.filter(org => org.groupType !== 'Individual');
  }

  // Deduplicate by organization name (keep first occurrence)
  const uniqueOrgs = filteredOrgs.reduce((acc, org) => {
    if (!acc.some(existing => existing.name === org.name)) {
      acc.push(org);
    }
    return acc;
  }, [] as Organization[]);

  // For Participant role, split Individual-typed orgs to the bottom
  let mainOrgs = uniqueOrgs;
  let individualOrgs: Organization[] = [];
  if (role === 'Participant') {
    individualOrgs = uniqueOrgs.filter(org => org.groupType === 'Individual');
    mainOrgs = uniqueOrgs.filter(org => org.groupType !== 'Individual');
  }

  const toOptions = (orgs: Organization[]) =>
    orgs.map(org => ({ value: org.id!, label: org.name }));

  // Add "Family Group" placeholder only for Group role (on-the-day family group registrations)
  if (role === 'Group') {
    return [{ value: 'FAMILY_GROUP_PLACEHOLDER', label: 'Family Group' }, ...toOptions(mainOrgs)];
  }

  return [...toOptions(mainOrgs), ...toOptions(individualOrgs)];
}
```

- [ ] **Step 3: Check TypeScript compiles**

```bash
cd software/nextjs
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd ../..
git add software/nextjs/lib/helpers.ts
git commit -m "feat: place Individual org at bottom of Participant org dropdown"
```

---

## Verification Checklist

Manual steps to confirm the feature works and nothing is broken.

**Setup:** ensure an event is active and the dev server is running (`npm run dev` from `software/nextjs`).

1. **Individual appears at bottom of Participant dropdown**
   - Open `/registration`, select role **Participant**
   - Open the "Your Group Name" dropdown
   - Scroll to the bottom — "Individual" should be the last option

2. **Individual not visible for Group role**
   - On `/registration`, select role **Group**
   - Open the org dropdown — "Individual" should NOT appear

3. **Individual not visible for Volunteer role**
   - On `/registration`, select role **Volunteer**
   - If an org dropdown appears, "Individual" should NOT appear

4. **Participant can register as Individual**
   - Select role **Participant**, select **Individual** from the dropdown
   - Complete the form (name, surname, consents) and submit
   - Confirm the success screen appears

5. **Registration saved correctly**
   - Go to `/admin/event/registrations`
   - Find the registration just created — organisation column should show "Individual"

6. **Normal Participant registration still works**
   - Register a Participant selecting any non-Individual org
   - Confirm registration saves with the correct org name

7. **Family Group registration still works (regression)**
   - Register a **Group** leader
   - Select "Family Group" and complete registration
   - Confirm the family group org is created/found as before

8. **Re-running seed is safe**
   - `npm run db:seed-individual` a second time should print "already exists" and not create a duplicate
