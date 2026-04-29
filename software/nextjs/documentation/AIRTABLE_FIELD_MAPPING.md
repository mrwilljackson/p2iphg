# Registration Sync: Neon → Airtable Field Mapping

> ⚠️ **Deprecated as of 2026-04-29.** The direct sync path described in this document (`syncRegistrationsToAirtable()` in `app/actions/airtable-sync.ts`) is no longer the supported post-event workflow. The standard workflow is **CSV export** from the P2I admin dashboard, followed by manual import into Airtable. The sync code remains in the repository for reference but should not be extended; new post-event work should target CSV export only.

**Date:** 2026-03-11
**Status:** Deprecated (see banner above) — Sync action: `app/actions/airtable-sync.ts`
**Airtable Table:** `Registrations`

---

## Field-by-Field Mapping

| # | Neon Column | Drizzle Property | Airtable Field | Airtable Type | Transform / Notes |
|---|---|---|---|---|---|
| 1 | id | id | Record ID | Single line text | Send Neon UUID for sync tracking |
| 2 | event_id | eventId | Event | Link to Events | Lookup: resolve Neon UUID → event's airtableRecordId, send as array |
| 3 | attendee_name | attendeeName | First Name | Single line text | Direct mapping |
| 4 | attendee_surname | attendeeSurname | Last Name | Single line text | Direct mapping |
| 5 | email | email | Email | Email | Direct mapping (nullable) |
| 6 | organization_id | organizationId | Organization | Link to Orgs | Lookup: resolve Neon UUID → org's airtableRecordId, send as array. Skip if null or no Airtable ID. |
| 7 | impairment | impairment | Impairment | Single select | Direct mapping (nullable). Values: "Yes", "No", "Rather not say" |
| 8 | role | role | Role | Single select | Direct mapping: "Participant", "Volunteer", "Group" |
| 9 | photo_consent | photoConsent | Photo Consent | Checkbox | true = checked, omit for unchecked (do NOT send false) |
| 10 | feedback_consent | feedbackConsent | Feedback Consent | Checkbox | true = checked, omit for unchecked |
| 11 | next_event_consent | nextEventConsent | Next Event Consent | Checkbox | true = checked, omit for unchecked |
| 12 | group_size | groupSize | Group Size | Number (integer) | Group role only. Send as number or omit if null. |
| 13 | impaired_participants | impairedParticipants | Disabled Students | Number (integer) | Group role only. Send as number or omit if null. |
| 14 | non_impaired_participants | nonImpairedParticipants | SEN Students | Number (integer) | Group role only. Send as number or omit if null. |
| 15 | group_leader_participating | groupLeaderParticipating | Leader Participating | Checkbox | Group role only. true = checked, omit for unchecked. |
| 16 | checkin_time | checkinTime | Check-in Time | Date & Time | ISO 8601 string, omit if null |
| 17 | checkout_time | checkoutTime | Check-out Time | Date & Time | ISO 8601 string, omit if null |

### Fields Not Sent to Airtable

| Neon Column | Drizzle Property | Reason |
|---|---|---|
| sync_status | syncStatus | Local tracking only. Set to "synced" after successful push. |
| airtable_record_id | airtableRecordId | Received back from Airtable after creating the record. |
| created_at | createdAt | Airtable auto-generates this. |
| modified_at | modifiedAt | Airtable auto-generates this. |

---

## Resolved Discrepancies

| Issue | Resolution |
|---|---|
| Table name typo ("regsitrations") | Confirmed: table name is `Registrations` |
| Impairment field name | Confirmed: `Impairment` (not "Do you have an impairment") |
| Photo consent field name | Confirmed: `Photo Consent` (not "Photography Consent") |
| Marketing consent vs two fields | Confirmed: two separate fields — `Feedback Consent` and `Next Event Consent` |
| Orgs without Airtable record ID | Skip org linking for locally-created orgs |
| Event linking validation | Not needed — events originate from Airtable |

---

## Sync Logic

1. Query registrations where `syncStatus = 'pending'` (or `'failed'` or `null`)
2. For each registration:
   - Look up event's `airtableRecordId` from events table
   - Look up organisation's `airtableRecordId` from organisations table (if linked)
   - Build Airtable fields object with mapped field names
   - Create record in Airtable via API
   - On success: store returned Airtable record ID, set `syncStatus = 'synced'`
   - On failure: set `syncStatus = 'failed'`, log error
3. Return summary of created/failed records

---

## Airtable API Notes

- Batch creates support up to 10 records per request
- Checkboxes: send `true` for checked, omit field entirely for unchecked (do NOT send `false`)
- Linked records: send as array of Airtable Record IDs, e.g. `["recABC123"]`
- Rate limit: 5 requests per second per base — use 250ms delays between batches
