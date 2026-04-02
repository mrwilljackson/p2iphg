# Group Registration Field Rename & Validation

**Date:** 2026-04-02
**Status:** Draft
**Scope:** Registration form Step 2 (Group role, closed groups only), database schema, all referencing code

## Summary

Rename two database columns and their corresponding UI labels on the Group registration flow to align with client expectations for CSV exports and in-app terminology. Add a smart advisory validation warning when participant counts don't add up to the group size.

## 1. Database Schema Changes

In `lib/db/schema.ts`, rename columns on the `registrations` table:

| Current Column | New Column | Type |
|---|---|---|
| `disabled_students` | `impaired_participants` | integer |
| `sen_students` | `non_impaired_participants` | integer |

Drizzle camelCase field names become `impairedParticipants` and `nonImpairedParticipants`.

**Migration approach:** Run `db:generate` to inspect the SQL. Expect `ALTER TABLE ... RENAME COLUMN`. If Drizzle generates drop+create instead, write a custom rename migration. Back up data before applying.

**Cascade:** The rename affects all files referencing the old names. Known files (16 total):

- `lib/db/schema.ts` — column definitions
- `lib/types.ts` — TypeScript interfaces
- `lib/validation.ts` — Zod schemas
- `lib/db-service.ts` — DatabaseService queries
- `lib/participant-counting.ts` — counting logic
- `lib/field-visibility-config.ts` — visibility config
- `lib/FIELD_VISIBILITY_README.md` — documentation
- `components/registration-form.tsx` — form fields and labels
- `app/actions/airtable-sync.ts` — Airtable sync field mapping
- `app/admin/event/page.tsx` — event admin dashboard
- `app/admin/event/registrations/[id]/page.tsx` — registration detail view
- `app/admin/event/register-organization/page.tsx` — org registration page
- `app/admin/p2i/page.tsx` — P2I admin dashboard
- `scripts/test-airtable-push.ts` — test script
- `scripts/analyze-participant-counts.ts` — analysis script
- `documentation/REGISTRATION_SYNC_FIELD_MAPPING.txt` — sync field mapping docs

## 2. UI Label Changes

On Group registration Step 2 (closed groups only, `openGroup === false`):

| Field | New Label |
|---|---|
| `groupSize` | *(no change)* |
| `impairedParticipants` | "How many participants in your group have a disability or long-term physical or mental health condition or impairment?" |
| `nonImpairedParticipants` | "How many participants in your group are not impaired?" |

Visibility rules unchanged: these two fields only appear for closed group registrations.

## 3. Smart Advisory Validation

A non-blocking, real-time warning when the three participant count fields don't add up.

### Rule

```
impairedParticipants + nonImpairedParticipants === groupSize
```

### Behaviour

- **Advisory only** — the form still submits even if numbers don't match
- **Real-time** — warning updates as any of the three values change
- **Smart suggestion** — calculates and displays the expected value for the missing/mismatched field:
  - If `groupSize` and `impairedParticipants` are filled but `nonImpairedParticipants` is empty or wrong: suggest `nonImpairedParticipants = groupSize - impairedParticipants`
  - If `groupSize` and `nonImpairedParticipants` are filled but `impairedParticipants` is empty or wrong: suggest `impairedParticipants = groupSize - nonImpairedParticipants`
  - If all three are filled and don't add up: suggest the expected value for whichever field was edited last
- **Disappears** when the numbers align

### Warning Message Example

> "These numbers don't add up to your group size of **10**. Based on your entries, non-impaired participants should be **7**."

### Styling

Amber/yellow advisory style — distinct from red validation errors. Inline, positioned below the participant count fields.

## 4. What Does NOT Change

- `groupSize` field — label, column name, and behaviour unchanged
- `groupLeaderParticipating` field — unchanged
- Field visibility rules — closed groups only, unchanged
- Participant counting logic in `lib/participant-counting.ts` — same business rules, just updated field names
- Airtable sync logic — same sync behaviour, updated field references
- Open group registration flow — unaffected
- Participant and Volunteer registration flows — unaffected
