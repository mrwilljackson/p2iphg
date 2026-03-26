# Individual Participant Registration — Design Spec

**Date:** 2026-03-26
**Branch:** `individual-participant`
**Status:** Approved

## Problem

Participants who travel independently to an event — not part of any pre-registered organisation — have no way to complete registration. The organisation dropdown is required and only shows event-imported orgs.

## Goal

Provide an "Individual" option always available at the bottom of the Participant organisation dropdown, backed by a real DB record, so independent attendees can register and appear grouped in reports.

---

## Data Layer

### Seeded Organisation Record

One new row in the `organisations` table:

| Column | Value |
|---|---|
| `name` | `"Individual"` (editable — rename in DB to change label everywhere) |
| `groupType` | `"Individual"` (system marker) |
| `airtableRecordId` | `null` |
| `airtableEventId` | `null` |
| All other fields | `null` / default |

The `groupType = 'Individual'` value is the system marker. It is never imported from Airtable and should never appear in org management views alongside normal group types.

### Query Change — `getOrganizations(eventId)`

Modified to always append orgs where `groupType = 'Individual'` after the normal event-scoped query result, regardless of event. No `organisation_contacts` row is needed for the Individual org.

---

## Dropdown Behaviour

In `organizationsToOptions` (`lib/helpers.ts`):

- **Participant role:** "Individual" org (identified by `groupType === 'Individual'`) is always placed at the bottom of the options list, below all other organisations.
- **Group / Volunteer roles:** no change — "Individual" does not appear.

---

## Form Submission

No special handling. "Individual" is a real org with a real UUID. The form submits its `organizationId` like any other org. `createRegistration` stores the UUID and resolves `organisationName = "Individual"` automatically via the existing DB name lookup.

---

## Reporting & Admin

Registrations linked to the Individual org group naturally in all reports. The displayed name always reflects the current DB value — rename the record once and it updates everywhere with no code changes.

---

## Files to Change

| File | Change |
|---|---|
| `lib/db-service.ts` | `getOrganizations` — always append orgs with `groupType = 'Individual'` |
| `lib/helpers.ts` | `organizationsToOptions` — move Individual-typed org to bottom for Participant role |
| `scripts/seed-individual-org.ts` | One-off seed script to insert the Individual org record |

---

## Out of Scope

- No `expectedGroupSize` for the Individual org (not applicable)
- No Airtable sync for Individual registrations (no airtable record to sync to)
- No admin UI to manage the Individual org record (edit directly in DB or Drizzle Studio if needed)
