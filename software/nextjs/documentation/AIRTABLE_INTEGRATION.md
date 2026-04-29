# Airtable Integration Architecture

**Document Version:** 2.1
**Date:** 2026-04-29
**Status:** Current — Section 4 (Direct Sync) deprecated

> ⚠️ **Direct Neon → Airtable sync is deprecated as of 2026-04-29.** Section 4 ("Legacy Sync") and Section 5 ("Airtable Field Mappings") describe a code path that is no longer the supported post-event workflow. Use **CSV export** (Section 3) instead. The sync code remains in the repository for reference but should not be extended.

## 1. Overview

The Power2Inspire Event CRM is a Next.js web application. Airtable serves two roles in the workflow:

- **Pre-event source of truth** — events, organisations, and volunteers are maintained in Airtable and imported into the application's Neon PostgreSQL database before each event.
- **Post-event target** — registration data collected on event day is exported as CSV from the P2I admin dashboard for manual import into Airtable. (A direct-sync code path also exists but is deprecated; see Section 4.)

The application stores all working data in Neon PostgreSQL (online only, no offline or SQLite layer). Airtable is not queried during event-day operations.

## 2. Import Flow (Airtable → Neon)

### 2.1 Trigger

A P2I admin visits `/admin/p2i/airtable-import` and imports data before each event. Import is manual and on-demand.

### 2.2 API Routes

| Route | Purpose |
|---|---|
| `GET /api/airtable/events` | Fetch events from Airtable |
| `POST /api/airtable/events` | Write fetched events to Neon |
| `GET /api/airtable/organizations` | Fetch organisations from Airtable |
| `POST /api/airtable/organizations` | Write fetched organisations to Neon |
| `GET /api/airtable/volunteers` | Fetch volunteers from Airtable |
| `POST /api/airtable/volunteers` | Write fetched volunteers to Neon |
| `GET /api/airtable/organisation-contacts` | Fetch organisation contacts from Airtable |

### 2.3 Organisation Type Normalisation

Airtable carries 18 distinct `groupType` values. These are normalised to 7 application categories on import:

| Application Category |
|---|
| Family |
| Disability |
| Corporate |
| Sporting |
| Community |
| Educational |
| Other |

See `software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md` for the full mapping of all 18 Airtable values to these 7 categories.

> **Important:** `groupType` is an administrative label used for external reporting only. All in-application filtering and conditional logic uses the `openGroup` boolean on `organisation_contacts`, not `groupType`.

## 3. Export Flow (Neon → CSV → Manual Airtable Import)

### 3.1 Primary Method: CSV Export

The standard post-event workflow is CSV download from the P2I admin dashboard, followed by manual import into Airtable.

**Filename format:** `{eventName}-registrations-{date}.csv`

### 3.2 CSV Columns

| Column | Notes |
|---|---|
| ID | Internal UUID |
| Event ID | Internal UUID |
| Event Date | ISO date |
| Venue Name | |
| Attendee Name | First name |
| Attendee Surname | Last name |
| Email | |
| Organization Name | |
| Impairment | |
| Role | Participant, Volunteer, or Group |
| Photo Consent | "Yes" / "No" |
| Feedback Consent | "Yes" / "No" |
| Next Event Consent | "Yes" / "No" |
| Group Size | Participants from org, excluding leader |
| Disabled Students | |
| SEN Students | |
| Group Leader Participating | "Yes" / "No" |
| Sync Status | pending / synced / failed |
| Airtable Record ID | Populated after sync; empty for new records |
| Created At | |
| Modified At | |

All boolean fields are formatted as `"Yes"` or `"No"` in the CSV output.

## 4. Legacy Sync (Direct Push to Airtable) — Deprecated

> ⚠️ **Deprecated as of 2026-04-29.** Do not extend or recommend this path. CSV export (Section 3) is the only supported post-event workflow.

A direct sync function still exists in the codebase but is no longer in active use.

- **Location:** `app/actions/airtable-sync.ts` — `syncRegistrationsToAirtable()`
- **Behaviour (for reference):** Reads all registrations with `syncStatus = "pending"` and pushes them to Airtable in batches of 10 with 250 ms delays between batches (to respect Airtable's rate limits).
- **Status:** Deprecated. Code retained for reference only; not part of the supported workflow.

## 5. Airtable Field Mappings (Deprecated Sync Path)

> ⚠️ Retained for reference only — the direct sync described here is deprecated (see Section 4).

The following mappings apply when using the direct sync (`syncRegistrationsToAirtable()`). Field name constants are defined in `lib/airtable.ts` as `AIRTABLE_FIELDS`.

| Airtable Field | Type | Source Field | Notes |
|---|---|---|---|
| First Name | Single Line Text | `attendeeName` | |
| Last Name | Single Line Text | `attendeeSurname` | |
| Email | Email | `email` | |
| Organisation | Single Line Text | `organizationName` | Denormalised name, not a linked record |
| Impairment | Checkbox | `impairment` | `"Yes"` string → `true` |
| Photo Consent | Checkbox | `photoConsent` | Only `true` sent |
| Feedback Consent | Checkbox | `feedbackConsent` | Only `true` sent |
| Next Event Consent | Checkbox | `nextEventConsent` | Only `true` sent |
| Role | Single Select | `role` | Participant / Volunteer / Group |
| Event | Linked Record | `eventAirtableRecordId` | Links to Events table |
| Group Size | Number | `groupSize` | Participants from org, excluding leader |
| Disabled Students | Number | `disabledStudents` | |
| SEN Students | Number | `senStudents` | |
| Leader Participating | Checkbox | `groupLeaderParticipating` | |

## 6. Environment Variables

Both import and direct sync require the following variables in `.env.local`:

```
AIRTABLE_API_KEY=      # Personal access token or legacy API key
AIRTABLE_BASE_ID=      # Airtable base identifier (appXXXXXXXXXXXXXX)
```
