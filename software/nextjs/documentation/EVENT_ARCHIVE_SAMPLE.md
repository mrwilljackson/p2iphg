# Event Archive — Sample Output

This document shows what the planned **event archive** will look like for a single completed event. It's intended for sharing with the client to confirm the format before implementation begins.

## Background

When an event is archived in the CRM, all of its personally-identifying information (attendee names, emails, contact phone numbers, etc.) is **permanently deleted** from the operational tables (`registrations`, `organisation_contacts`, `volunteers`). What remains is a compact, anonymised archive of the event's aggregate metrics — enough to support year-on-year reporting, per-organisation history, consent auditing, and operational review, without retaining any personal data.

The archive consists of two pieces:

1. A single `event_archive` row — the event header with headline counts.
2. One `event_archive_org_lines` row per participating organisation — the per-org breakdown.

## Worked example

Below is a realistic example for a fictional Manchester Arena event: 6 organisations, 125 people total (100 participants and 25 helpers).

### `event_archive` row

```json
{
  "id": "a8f5c2e1-4d3b-4a7e-9c8d-3f6b1e2d4a90",
  "eventId": "d7e2b5a3-8f1c-4e9d-b2a4-7c5e8f1d3b6a",

  "eventName": "Manchester Arena Powerhouse Games 2026",
  "eventDate": "2026-03-15",
  "eventLocation": "Manchester Arena, Manchester",
  "eventDescription": "Spring 2026 inclusive sports day",
  "eventAirtableRecordId": "recABC123XYZ",
  "eventSequenceNumber": 43,

  "participantCount": 100,
  "volunteerCount": 25,
  "groupCount": 6,
  "totalHeadcount": 125,
  "companiesCount": 6,

  "impairedParticipantCount": 46,
  "nonImpairedParticipantCount": 54,

  "photoConsentCount": 76,
  "feedbackConsentCount": 57,
  "nextEventConsentCount": 62,

  "createdAt": "2026-03-16T10:42:18Z",
  "sourcePurgedAt": "2026-03-16T10:42:18Z"
}
```

### `event_archive_org_lines` rows (one per organisation)

| Organisation | Org Airtable ID | Contact Airtable ID | Attended | Impaired | Non-impaired |
|---|---|---|---|---|---|
| Royal Lancashire Disability Network | recORG001 | recCON101 | 8 | 6 | 2 |
| St Helens Family Centre | recORG002 | recCON102 | 15 | 5 | 10 |
| Greater Manchester Cadets | recORG003 | recCON103 | 31 | 0 | 31 |
| Wrexham Wheelchair Basketball | recORG004 | recCON104 | 18 | 16 | 2 |
| Manchester College SEN | recORG005 | recCON105 | 22 | 18 | 4 |
| Salford Community Hub | recORG006 | recCON106 | 6 | 1 | 5 |

Totals reconcile to the header: 100 attended (= participantCount), 46 impaired, 54 non-impaired.

Each row additionally stores: `id` (uuid), `archiveId` (FK to `event_archive`), `organisationId` (FK to the long-lived `organisations` record, which survives the archive purge), `orgNameSnapshot` (frozen at archive time so the report is robust to later organisation renames), and `createdAt`.

## What an admin sees in the CRM

```
┌─────────────────────────────────────────────────────────────┐
│ Manchester Arena Powerhouse Games 2026               #43    │
│ Sunday 15 March 2026 — Manchester Arena, Manchester         │
│ Source data purged 16 Mar 2026                              │
├─────────────────────────────────────────────────────────────┤
│ Headline counts                                             │
│   Companies / organisations                              6  │
│   Total headcount                                      125  │
│     – Participants                                     100  │
│     – Helpers                                           25  │
│                                                             │
│ Participant impairment split                                │
│   Impaired                                              46  │
│   Non-impaired                                          54  │
│                                                             │
│ Consent                                                     │
│   Photo                                                 76  │
│   Feedback                                              57  │
│   Next event                                            62  │
├─────────────────────────────────────────────────────────────┤
│ Per-organisation breakdown                                  │
│                                                             │
│   Royal Lancashire Disability Network                       │
│     8 attended · 6 impaired, 2 not                          │
│                                                             │
│   St Helens Family Centre                                   │
│     15 attended · 5 impaired, 10 not                        │
│                                                             │
│   Greater Manchester Cadets                                 │
│     31 attended · 0 impaired, 31 not                        │
│                                                             │
│   Wrexham Wheelchair Basketball                             │
│     18 attended · 16 impaired, 2 not                        │
│                                                             │
│   Manchester College SEN                                    │
│     22 attended · 18 impaired, 4 not                        │
│                                                             │
│   Salford Community Hub                                     │
│     6 attended · 1 impaired, 5 not                          │
└─────────────────────────────────────────────────────────────┘
```

## What is deliberately NOT in the archive

- Names, emails, phone numbers, or any other personal identifier of any attendee, helper, or organisation contact — all permanently deleted from the source tables when the event is archived.
- Per-organisation consent breakdowns — consent totals are kept at the event level only.
- Expected vs. actual attendance figures (the "expected group size" planning numbers are dropped).
- Open-group / closed-group categorisation — internal operational distinction, not retained in the archive.
- Free-text admin notes about the event.

## Airtable record IDs

Both `org_airtable_record_id` (the organisation's own Airtable record) and `contact_airtable_record_id` (the per-event organisation-contact Airtable record) are preserved on each archive line. This supports a future CSV export feature where the client can re-link archive rows back to records in their Airtable base.

The contact-level Airtable ID is *captured at archive time* before the source row is deleted, otherwise it would be unrecoverable.
