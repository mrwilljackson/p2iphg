# Power2Inspire Event CRM - Client Questions & Decisions Required

**Date Created:** 2026-02-13  
**Last Updated:** 2026-04-16  
**Status:** Resolved  
**Project Phase:** API Routes & Database Integration

---

## Purpose

This document captures key decisions and questions that require client input before proceeding with the next development phase. Please review each section and provide your answers/preferences.

---

## 1. Admin Dashboard & Access Control

### Question 1.1: Admin Authentication
**Context:** The admin dashboard will provide access to sensitive functions like:
- Fetching data from Airtable to the database (pre-event setup)
- Syncing registrations from database to Airtable (post-event)
- Wiping the database clean (post-event cleanup)
- Viewing live registration statistics

**Question:** How should we protect access to the admin dashboard?

**Options:**
- [ ] **Option A:** Password protection (simple password entry screen)
- [ ] **Option B:** Physical device security only (no password, rely on tablet being in staff possession)
- [x] **Option C:** PIN code (4-6 digit PIN)
- [ ] **Option D:** Email-based magic link (send login link to authorized email)

**Implementation Answer:**  
PIN-based authentication has been implemented. Two roles with separate PINs:
- **P2I Admin (parent company):** PIN `9876` — grants access to `/admin/p2i/*` routes (import events, manage organisations, volunteers)
- **Event Admin (event staff):** PIN `1234` — grants access to `/admin/event/*` routes (manage registrations, run reports, sync to Airtable)

Authentication tokens stored in `sessionStorage`:
- `adminAuth` = `"p2i"` or `"event"`
- `administeringEventId` = event ID for P2I admins selecting which event to manage

No server-side sessions or JWTs required. Client-side page components check `sessionStorage` on page load.

---

### Question 1.2: Admin User Roles
**Context:** We need to determine who should have access to admin functions.

**Question:** Who will be using the admin dashboard?

**Options:**
- [ ] Single admin user (one person manages everything)
- [x] Multiple staff members (several people can access admin functions)
- [x] Role-based access (different permissions for different staff)

**Implementation Answer:**  
Role-based access implemented with two distinct admin tiers:

1. **P2I (Parent Company) Admin** — Data ingestion & event management
   - Import events, organisations, volunteers from Airtable
   - Manage which event is "active" (only one active at a time)
   - Access: `/admin/p2i/` (airtable-import, manage-events)

2. **Event Admin** — Day-of operations & registration management
   - View live registrations and statistics
   - Perform check-in/check-out for attendees
   - Export registrations to CSV
   - Sync registrations back to Airtable (post-event)
   - Wipe database after sync
   - Access: `/admin/event/` (registrations, organisations, reports)

All admin routes are protected by client-side session checks. Multiple staff can use the same PIN on different devices.

---

## 2. Event Management Workflow

### Question 2.1: Pre-Event Data Setup
**Context:** Before each event, we need to load event details and organization data into the database.

**Question:** How will event data be prepared before the event?

**Current Plan:**
1. Admin clicks "Fetch from Airtable" button in admin dashboard
2. System pulls latest events and organizations from Airtable
3. Data is stored in Neon database for fast access during event

**Implementation Answer:**  
Workflow accepted and implemented via `/admin/p2i/airtable-import` page:

1. **P2I Admin Access** — Enters PIN `9876` to access `/admin/p2i/airtable-import`
2. **Bulk Import** — Fetch from Airtable button triggers:
   - Pull all events (creates `events` table records)
   - Pull all organisations (creates `organisations` + `organisation_contacts` table records)
   - Pull all volunteers (creates `volunteers` table records)
   - Sync runs via `app/actions/airtable-import.ts`
   - Links maintained via `airtableRecordId` and `airtableEventId` fields

3. **Manual Event Activation** — P2I Admin uses `/admin/p2i/manage-events` to:
   - Select which event is "active"
   - Only one event can be active at a time
   - Active event is what public registration form uses

4. **Event States** — Workflow: `planned` → `active` → `completed` → `archived`

Data is ready as soon as import completes. Event state is set manually by P2I admin.

---

### Question 2.2: Post-Event Data Sync
**Context:** After the event, all registrations need to be synced back to Airtable for long-term storage.

**Question:** What is the post-event workflow?

**Current Plan:**
1. Event ends
2. Admin clicks "Sync to Airtable" button
3. All registrations are uploaded to Airtable
4. Admin verifies sync was successful
5. Admin clicks "Wipe Database" button to clear temporary data

**Implementation Answer:**  
Workflow implemented and accepted. Post-event process:

1. **Sync to Airtable** — Event Admin accesses `/admin/event/report` and triggers sync via `syncRegistrationsToAirtable()` function
   - Batches registrations in groups of 10
   - 250ms delay between batches (respects Airtable rate limits)
   - Updates `registrations.syncStatus` field (pending → synced or failed)
   - Populates `registrations.airtableRecordId` on successful sync

2. **CSV Export Available** — Standard data backup option
   - CSV download functionality available from registration views
   - No JSON export needed at this time

3. **Database Wipe** — (Safe to implement without safety checks)
   - Runs via `npm run db:clear` (executes `scripts/clear-database.ts`)
   - Admin can run after verifying sync completed
   - No server-side prevention needed (runs client-triggered)

All registrations marked as synced before clearing. CSV provides backup for records.

---

## 3. Airtable Configuration

### Question 3.1: Airtable Access
**Context:** The application needs API access to your Airtable base.

**Question:** Who will provide the Airtable API credentials?

**What we need:**
- Airtable API Key (personal access token)
- Airtable Base ID

**Implementation Answer:**  
Credentials configured via environment variables in `.env.local`:
```
AIRTABLE_API_KEY=<your-personal-access-token>
AIRTABLE_BASE_ID=<your-base-id>
```

**Setup Process:**
1. Admin generates Airtable Personal Access Token (requires admin access to workspace)
2. Credentials added to `.env.local` in project root
3. Airtable SDK initialized in `lib/airtable.ts`
4. Used by import/sync functions in `/admin/p2i/` and `/admin/event/` routes

**Airtable SDK** configured with `baseId` and API key. All field mappings between Airtable and local database managed in `lib/airtable.ts`.

---

### Question 3.2: Airtable Base Structure
**Context:** We need to confirm the Airtable base structure matches our expectations.

**Question:** Is your Airtable base already set up with the V2 schema?

**Expected Tables:**
- Events (with fields: Event Name, Date, Location, etc.)
- Organizations (with fields: Organization Name, etc.)
- Registrations (with all V2 fields from requirements)

**Implementation Answer:**  
Airtable base structure confirmed and documented. Import/sync operations expect:

**Events Table** (pulled on import):
- Event Name, Date, Location, Status (planned/active/completed/archived)
- Links to: Organisations, Registrations, Volunteers

**Organizations Table** (pulled on import):
- Organisation Name, Group Type (18 Airtable types)
- Stored in `organisations` table with `airtableRecordId`

**Organisation Contacts Table** (pulled on import):
- Contact details, expectedGroupSize, notes
- Stored in `organisation_contacts` with critical field: `openGroup` boolean
- **IMPORTANT:** `openGroup` controls group visibility/behaviour (not `groupType`)
  - `openGroup !== false`: Participant registrations visible (open groups)
  - `openGroup === false`: Only Group Leader registrations allowed (closed groups)

**Registrations Table** (synced back post-event):
- Attendee name, email, role (Participant/Volunteer/Group)
- Consent fields: photoConsent, feedbackConsent, nextEventConsent
- Group fields: groupSize, disabledStudents, senStudents, groupLeaderParticipating

Schema documented in `software/nextjs/documentation/` folder. Field mappings in `lib/airtable.ts`.

---

## 4. Testing & Validation

### Question 4.1: Test Event
**Context:** We need to test the full workflow with real data before the first live event.

**Question:** Can we create a test event in Airtable for development testing?

**What we need:**
- A test event entry in Airtable
- A few test organizations
- Permission to create/delete test registrations

**Implementation Answer:**  
Testing approach confirmed and implemented:

- Production Airtable base is used directly. Test data is imported via the standard `/admin/p2i/airtable-import` flow.
- Database can be cleared at any time using `npm run db:clear` and re-seeded with `npm run db:seed` (runs `scripts/seed-database-v2.ts`).
- Full end-to-end testing performed manually via the dev server on `localhost:3000`:
  1. Import events/orgs/volunteers from Airtable (`/admin/p2i/airtable-import`)
  2. Activate event (`/admin/p2i/manage-events`)
  3. Register test attendees via public form (`/registration`)
  4. Verify registrations in admin (`/admin/event/registrations`)
  5. Sync back to Airtable and verify records appear in Airtable base

---

## 5. Timeline & Priorities

### Question 5.1: Next Event Date
**Context:** Understanding when the next event is helps us prioritize development.

**Question:** When is the next PowerHouseGames event?

**Implementation Answer:**  
Event scheduling is managed within Airtable. As events are imported via `/admin/p2i/airtable-import`, the next upcoming event will appear automatically once it has been created in Airtable by the P2I team. The P2I admin then activates it via `/admin/p2i/manage-events`. No hardcoded event dates exist in the codebase — all event data is driven by Airtable records.

---

### Question 5.2: Feature Priorities
**Context:** We have several features in the backlog. Which are most important?

**Question:** Please rank these features in order of priority (1 = highest):

- [x] **1** Admin dashboard (fetch/sync/wipe functions)
- [x] **2** Live registration statistics
- [x] **3** Multi-event support (switching between events)
- [x] **4** CSV export functionality
- [x] **5** Attendance tracking (check-in/check-out)

**Implementation Answer:**  
All five features have been implemented:

- **Admin dashboard** — Fully built with P2I and Event admin tiers, Airtable import, sync, and database wipe.
- **Live registration statistics** — Available via `/admin/event/report` with participant counts, group breakdowns, and real-time totals.
- **Multi-event support** — P2I admin can switch active event at any time via `/admin/p2i/manage-events`. Only one event is active at a time.
- **CSV export** — Available from the registrations view in event admin.
- **Attendance tracking** — Check-in/check-out timestamps recorded per registration via the admin registrations list.

---

## 6. Additional Questions or Concerns

**Question:** Is there anything else we should consider or any concerns you have about the current implementation?

**Implementation Answer:**  
No outstanding concerns at this stage. Key implementation decisions made during development:

- **No marketing consent field** — Consent fields are: `photoConsent`, `feedbackConsent`, `nextEventConsent`. No `marketingConsent` field was added.
- **Organisation filtering uses `openGroup` boolean only** — `groupType` is retained for Airtable reporting only and is never used for filtering or conditional logic within the app.
- **3 registration roles** — Participant, Volunteer, and Group (leader). Volunteers are identified by email lookup against the pre-populated `volunteers` table.
- **No server-side auth** — PIN authentication is client-side only (sessionStorage). Appropriate for the kiosk/tablet use case at events.

All open questions resolved. Document updated to reflect implemented state.

---

## Resolution Summary

All questions in this document have been resolved through implementation. The system is built and operational:

1. **Admin dashboard** — PIN-based access, two roles (P2I and Event admin), fully functional.
2. **Airtable integration** — Import and sync implemented and tested.
3. **Registration form** — Three roles (Participant, Volunteer, Group) with field visibility driven by `openGroup` boolean.
4. **Post-event workflow** — Sync to Airtable, CSV export, and database wipe all available.

**Contact:** Will Jackson - will@play.physio

