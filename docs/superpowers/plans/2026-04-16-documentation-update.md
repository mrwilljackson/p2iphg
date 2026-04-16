# Documentation Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit, rewrite, consolidate, and prepare for Confluence sync all project documentation that has drifted from the codebase since 2026-02-13.

**Architecture:** Repo is the single source of truth. Developer docs live in their canonical locations across the repo. Stakeholder-friendly versions for Confluence live in `documentation/confluence_exports/`. The Confluence update tracker is rewritten as the final deliverable.

**Tech Stack:** Markdown only. No code changes.

**Spec:** `docs/superpowers/specs/2026-04-16-documentation-update-design.md`

---

## File Map

### Files to Modify (developer docs)

| File | Severity | Summary of changes |
|---|---|---|
| `documentation/confluence_documentation/00_PROJECT_OVERVIEW.md` | HIGH | Wrong role names, missing features, wrong data flow |
| `documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | HIGH | Missing Group role, wrong consent fields, no Neon workflow, missing components/routes |
| `documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | MEDIUM | Missing `eventSummaries` table, `Individual` GroupType, `openGroup` field |
| `documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md` | HIGH | Many features listed as not started that are complete |
| `documentation/confluence_documentation/01_PLANNING/TODO.md` | HIGH | References Flutter, pre-implementation questions now answered |
| `documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md` | MEDIUM | TBD items now resolved, missing Group role requirements |
| `documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` | HIGH | References Flutter, SQLite, offline-first — completely wrong |
| `documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` | MEDIUM | Field inconsistencies, wrong visibility rules |
| `documentation/confluence_documentation/CLIENT_QUESTIONS.md` | LOW | Still says "Awaiting Response" — questions are answered |
| `documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md` | HIGH | Rewrite with new state |

### Files to Modify (developer reference)

| File | Severity | Summary of changes |
|---|---|---|
| `software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md` | MEDIUM | Missing `Individual` type, needs `openGroup` emphasis |
| `software/nextjs/documentation/EVENT_SETUP_GUIDE.md` | LOW | P2I admin flow changed (manage-events landing, new nav) |

### Files to Modify (consolidation & historical)

| File | Severity | Summary of changes |
|---|---|---|
| `documentation/REGISTRATION_FORM_LOGIC.md` | MEDIUM | Add smart filtering, auto-detect group leaders, merge element map |
| `documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md` | LOW | Mark as historical |

### Files to Delete

| File | Reason |
|---|---|
| `docs/registration-form-element-map.md` | Content merged into `REGISTRATION_FORM_LOGIC.md` |
| `documentation/confluence_documentation/REORGANIZATION_SUMMARY.md` | Historical, no longer needed |
| `documentation/confluence_documentation/DOCUMENTATION_WORKFLOW.md` | Superseded by updated tracker |

### Files Confirmed Accurate (no changes)

| File | Notes |
|---|---|
| `software/nextjs/documentation/PARTICIPANT_COUNTING_LOGIC.md` | v3.1, current ✓ |
| `documentation/REGISTRATION_FORM_LOGIC.md` | v1, 2026-03-13, current ✓ |
| `docs/registration-form-element-map.md` | Current ✓ |
| `software/nextjs/documentation/AIRTABLE_BASE_STRUCTURE.md` | Import reference, still valid ✓ |
| `software/nextjs/documentation/AIRTABLE_IMPORT_SPECIFICATIONS.md` | Import specs, still valid ✓ |
| `software/nextjs/documentation/AIRTABLE_SETUP_GUIDE.md` | Setup reference, still valid ✓ |
| `software/nextjs/documentation/POSTMAN_AIRTABLE_API_GUIDE.md` | API testing guide, still valid ✓ |

### Files to Create

| File | Purpose |
|---|---|
| `documentation/confluence_exports/PROJECT_OVERVIEW.md` | Stakeholder-friendly project overview |
| `documentation/confluence_exports/EVENT_SETUP_GUIDE.md` | Operational guide for event organisers |
| `documentation/confluence_exports/REGISTRATION_FLOW.md` | How registration works (attendee/admin perspective) |
| `documentation/confluence_exports/DATA_EXPORT.md` | How to export data via CSV for Airtable import |

---

## Reference: Current Codebase State

These are the ground-truth facts that all documentation must reflect. Refer back to this section when rewriting each doc.

### Roles
- **Participant** (not "Attendee") — individual attendee
- **Volunteer** — identified by email lookup against pre-imported volunteers table
- **Group** — group leader; label shown to users: "Teacher, Parent or Community Group Leader"

### GroupType Values
`'Family' | 'Disability' | 'Corporate' | 'Sporting' | 'Community' | 'Educational' | 'Other' | 'Individual'`

### Organisation Filtering (source of truth: `openGroup` boolean, NOT `groupType`)
- `openGroup === true` (or null): open group — Participants register individually
- `openGroup === false`: closed group — group leader registers on behalf of all members
- Participant dropdown: only orgs where `openGroup !== false`; `Individual` org always last
- Group dropdown: only orgs where `openGroup === false`
- Volunteer: no org dropdown

### Database Tables
- **events**: id, name, date, location, description, status (planned/active/completed/archived), airtableRecordId
- **registrations**: id, eventId, attendeeName, attendeeSurname, email, organizationId, impairment, role, photoConsent, feedbackConsent, nextEventConsent, groupSize, disabledStudents, senStudents, groupLeaderParticipating, organisationName, syncStatus, airtableRecordId
- **volunteers**: id, eventId, email, firstName, lastName, photoConsent, feedbackConsent, nextEventConsent, airtableRecordId
- **organisations**: id, name, groupType, imageUrl, airtableRecordId, airtableEventId
- **organisationContacts**: id, organisationId (Airtable record ID), airtableEventId, openGroup, photoConsent, feedbackConsent, nextEventConsent, contactFirstName, contactLastName, contactEmail, contactPhone, expectedGroupSize, notes, airtableRecordId
- **eventSummaries**: id, eventId, eventName, eventDate, eventLocation, eventDescription, eventAirtableRecordId, participantCount, volunteerCount, groupCount, totalHeadcount, photoConsentCount, feedbackConsentCount, nextEventConsentCount, orgBreakdown (JSON), eventSequenceNumber, adminNotes

### Event Lifecycle
`planned` → `active` (only one at a time) → `completed` → `archived` (after summary generated)

### Data Flow
1. **Pre-event**: P2I admin imports events, organisations, volunteers from Airtable via `/admin/p2i/airtable-import`
2. **Event day**: Attendees register via `/registration` form → written to Neon Postgres
3. **Post-event**: Admin exports registrations as CSV from P2I dashboard for manual Airtable import. Legacy `syncRegistrationsToAirtable()` function exists in code but CSV export is the primary workflow.

### App Routes
- `/` — Landing page (logo + redirect)
- `/registration` — Public registration (active events only)
- `/admin` — Admin login
- `/admin/p2i/` — P2I admin dashboard (event options, CSV export, Airtable sync)
- `/admin/p2i/manage-events` — Event management (P2I login lands here)
- `/admin/p2i/organisations` — Organisation CRUD
- `/admin/p2i/helpers` — Volunteer management
- `/admin/p2i/group-leaders` — Group leader contacts
- `/admin/p2i/airtable-import` — Airtable data import
- `/admin/event/` — Event admin dashboard
- `/admin/event/registrations` — Registration list
- `/admin/event/registrations/[id]` — Registration detail
- `/admin/event/register-volunteer` — Manual volunteer registration
- `/admin/event/register-organization` — Manual org registration
- `/admin/event/organizations/[organizationId]` — Org detail
- `/admin/event/report` — Group registration report

### Key Components
- `P2iAdminNav` — shared nav across P2I admin pages (Manage Events, Manage Organisations, Manage Helpers, Logout)
- `HelpTip` — inline help popovers with P2I brand colours, centralised in `lib/help-tips.ts`
- Event summary modal — preview counts, enter sequence number + notes, archive event
- `registration-form.tsx` — multi-step form (~50KB): Participant 2 steps, Group 3 steps, Volunteer 1 step

### Key Features Implemented Since Feb 2026
- Event summary generation and archival workflow
- Individual participant registration (`Individual` org type)
- P2I admin nav overhaul (shared component, manage-events as landing)
- HelpTip component system
- P2I CRUD pages (organisations, helpers, group-leaders)
- Auto-detect group leaders registering as Participants
- Hide fully-registered orgs from Group dropdown
- Hide already-registered volunteers from picker
- CSV export from P2I dashboard
- Closed-org scoping fix (case-insensitive email, event-scoped)
- Group leader table on event options page

### Consent Fields
- `photoConsent` (boolean)
- `feedbackConsent` (boolean)
- `nextEventConsent` (boolean)
- There is NO `marketingConsent` field — old docs that reference it are wrong

### Authentication
- sessionStorage-based, no server-side auth
- `adminAuth` = `"event"` for event admin, `"p2i"` for P2I admin
- P2I PIN: 9876, Event PIN: 1234
- P2I login redirects to `/admin/p2i/manage-events` (not the old dashboard)

### Field Visibility by Role

| Field | Participant | Volunteer | Group |
|---|---|---|---|
| attendeeName | ✓ | ✗ | ✓ |
| attendeeSurname | ✓ | ✗ | ✓ |
| email | ✓ | ✓ | ✓ |
| organizationId | ✓ | ✗ | ✓ |
| impairment | ✓ | ✗ | ✗ |
| photoConsent | ✓ | ✓ | ✓ |
| feedbackConsent | ✓ | ✓ | ✓ |
| nextEventConsent | ✓ | ✓ | ✓ |
| groupSize | ✗ | ✗ | ✓ |
| disabledStudents | ✗ | ✗ | ✓ |
| senStudents | ✗ | ✗ | ✓ |

---

## Tasks

### Task 1: Create branch and set up confluence_exports directory

**Files:**
- Create: `documentation/confluence_exports/.gitkeep`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b docs/full-documentation-update
```

- [ ] **Step 2: Create the confluence_exports directory**

```bash
mkdir -p documentation/confluence_exports
touch documentation/confluence_exports/.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_exports/.gitkeep
git commit -m "chore: create confluence_exports directory for stakeholder docs"
```

---

### Task 2: Rewrite 00_PROJECT_OVERVIEW.md

**Files:**
- Modify: `documentation/confluence_documentation/00_PROJECT_OVERVIEW.md`

**What's wrong:**
- Says "Attendee" — should be "Participant"
- Says "Teacher/Coordinator" — should be "Group" (with label "Teacher, Parent or Community Group Leader")
- Claims Phase 3 (API Routes) not started — it's complete
- Missing features: event summary, Individual org, HelpTip, P2I admin CRUD, CSV export, auto-detect group leaders
- Data flow describes Airtable sync as primary export — should describe CSV export as primary

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/00_PROJECT_OVERVIEW.md` in full.

- [ ] **Step 2: Rewrite the document**

Update these sections:
1. **Registration Types**: Replace "Attendee" with "Participant", replace "Teacher/Coordinator" with "Group". Add descriptions matching the Reference section above.
2. **Current Status/Phase**: Update to reflect all phases complete through event summary and archival. The system is in active use.
3. **Core Features**: Add to the features list:
   - Event summary generation and archival
   - Individual participant registration (no group affiliation)
   - P2I admin CRUD (organisations, helpers, group leaders)
   - HelpTip inline help system
   - CSV export for Airtable import
   - Auto-detect group leaders registering as Participants
   - Group dropdown filtering (hide fully-registered orgs)
   - Volunteer picker filtering (hide already-registered)
4. **Data Flow**: Replace the post-event sync description. Primary export is CSV download from P2I dashboard. Legacy `syncRegistrationsToAirtable()` exists but CSV is the standard workflow.
5. **Technology Stack**: Confirm Next.js 16, React 19, Drizzle ORM, Neon PostgreSQL, Zod, Shadcn UI, Tailwind CSS 4.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/00_PROJECT_OVERVIEW.md
git commit -m "docs: update project overview with current features, roles, and data flow"
```

---

### Task 3: Rewrite 02_TECHNICAL/ARCHITECTURE.md

**Files:**
- Modify: `documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md`

**What's wrong:**
- Data flow shows writing directly to Airtable (wrong — writes to Neon)
- Only 2 roles: "Attendee" and "Volunteer" — missing Group entirely
- API routes listed don't match actual routes
- No mention of Neon database, Drizzle ORM, or the three-phase workflow
- Consent fields wrong: says "Marketing Consent" — should be feedbackConsent + nextEventConsent
- Missing components: P2iAdminNav, HelpTip, event summary modal
- Missing routes: P2I CRUD pages, manage-events

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` in full.

- [ ] **Step 2: Rewrite the document**

This file needs a near-complete rewrite. Structure it as:

1. **Technology Stack**: Next.js 16 App Router, React 19, TypeScript 5, Drizzle ORM + Neon PostgreSQL, Airtable SDK, Zod, Shadcn UI (Radix) + Tailwind CSS 4.

2. **Key Layers** (match CLAUDE.md but with more detail):
   - `lib/db/schema.ts` — Drizzle schema
   - `lib/db/client.ts` — Drizzle + Neon HTTP client
   - `lib/db-service.ts` — DatabaseService class (all query logic)
   - `lib/actions.ts` — Server Actions (thin wrappers)
   - `lib/types.ts` — TypeScript interfaces
   - `lib/airtable.ts` — Airtable SDK client + field mappings
   - `lib/validation.ts` — Zod schemas
   - `lib/helpers.ts` — Pure utility functions
   - `lib/participant-counting.ts` — Counting business logic
   - `lib/field-visibility-config.ts` — Form field visibility per role
   - `lib/help-tips.ts` — Centralised help tip content

3. **Data Flow**: Three-phase workflow as described in Reference section.

4. **Route Map**: Full route list from Reference section, grouped by public / P2I admin / event admin.

5. **Registration Roles**: Participant, Volunteer, Group — with field visibility table from Reference section.

6. **Organisation Model**: `openGroup` boolean, filtering rules, `Individual` system org.

7. **Authentication**: sessionStorage-based, two levels (event/p2i), P2I login → manage-events.

8. **Key Components**: P2iAdminNav, HelpTip, event summary modal, registration-form.tsx.

9. **Event Lifecycle**: planned → active → completed → archived.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md
git commit -m "docs: rewrite architecture doc to reflect current Next.js + Neon system"
```

---

### Task 4: Update 02_TECHNICAL/DATA_MODELS.md

**Files:**
- Modify: `documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md`

**What's wrong:**
- Missing `eventSummaries` table entirely
- Missing `Individual` in GroupType union
- Missing `openGroup` field on organisationContacts
- Missing `organisationName` field on registrations
- Missing `description` field on events

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md` in full.

- [ ] **Step 2: Update the document**

1. **GroupType**: Add `Individual` to the union type. Add a note that `Individual` is a system marker for participants without group affiliation — it is excluded from participant counting.
2. **events table**: Add `description` (text, optional) if missing.
3. **registrations table**: Add `organisationName` (text, optional) — stores org name at registration time.
4. **organisationContacts table**: Add `openGroup` (boolean, default true) — controls whether org is visible to Participants. Add `photoConsent`, `feedbackConsent`, `nextEventConsent` (boolean) fields if missing.
5. **eventSummaries table**: Add entire new table definition with all columns from the Reference section. Note: point-in-time snapshot created when event is archived.
6. **Organisation Filtering**: Add a section explaining that `openGroup` (not `groupType`) is the source of truth for filtering. Reference `lib/helpers.ts`.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md
git commit -m "docs: add eventSummaries table, Individual type, and openGroup field to data models"
```

---

### Task 5: Update 01_PLANNING/PROJECT_STATUS.md

**Files:**
- Modify: `documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md`

**What's wrong:**
- Many features marked as "NOT STARTED" are now complete
- Uses "Attendee" instead of "Participant"

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md` in full.

- [ ] **Step 2: Update the document**

1. Mark all implemented phases/features as COMPLETE. Based on the commit history, the following are done:
   - Database implementation (Neon + Drizzle)
   - Registration form (3 roles, multi-step, all field logic)
   - API routes (Airtable import, server actions)
   - Admin dashboards (P2I + event admin)
   - Organisation management (CRUD, filtering, contacts)
   - Volunteer management
   - Participant counting and reporting
   - Event summary and archival
   - CSV export
   - HelpTip system
   - P2I admin navigation
2. Fix role names: "Attendee" → "Participant" throughout.
3. Add a "Recent Completions" section listing features built since Feb 2026 (from Reference section: "Key Features Implemented Since Feb 2026").
4. Update "Current Phase" to reflect the system is in active use with ongoing refinement.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md
git commit -m "docs: update project status — mark all implemented features as complete"
```

---

### Task 6: Rewrite 01_PLANNING/TODO.md

**Files:**
- Modify: `documentation/confluence_documentation/01_PLANNING/TODO.md`

**What's wrong:**
- References Flutter in places
- Lists pre-implementation questions that are now answered
- Task list doesn't reflect current state

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/01_PLANNING/TODO.md` in full.

- [ ] **Step 2: Rewrite the document**

1. Remove all Flutter references.
2. Move answered questions into a "Resolved" section with brief answers.
3. Remove tasks that are complete (cross-reference with commit history and PROJECT_STATUS).
4. Keep only genuinely outstanding items. If none remain, state that and list potential future enhancements:
   - Proper authentication (replacing sessionStorage PINs)
   - Server-side session management
   - Automated testing
   - Check-in/check-out time tracking during events
   - The group registration field rename (spec exists at `docs/superpowers/specs/2026-04-02-group-registration-field-rename-design.md`)

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/01_PLANNING/TODO.md
git commit -m "docs: rewrite TODO — remove completed items and Flutter references"
```

---

### Task 7: Update 01_PLANNING/REQUIREMENTS.md

**Files:**
- Modify: `documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md`

**What's wrong:**
- TBD items for org support and volunteer fields are now resolved
- Missing Group role requirements
- Technology listed as "NextJS 14" — now Next.js 16

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md` in full.

- [ ] **Step 2: Update the document**

1. Fix technology version: Next.js 16 (not 14).
2. Resolve all TBD items:
   - FR-021 (Volunteer fields): email lookup, auto-populate from volunteers table, consent fields only
   - FR-041 (Organization support): role-based org filtering via `openGroup`, `Individual` org for unaffiliated participants
3. Add Group role requirements if missing:
   - Group leader selects closed-group org, enters groupSize, disabledStudents, senStudents
   - Contact picker for pre-registered leaders
   - Auto-detect feature when Participant email matches a group leader
4. Mark implemented requirements with their status (IMPLEMENTED).
5. Fix role names throughout ("Attendee" → "Participant").

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md
git commit -m "docs: resolve TBD requirements, add Group role, fix versions"
```

---

### Task 8: Rewrite 03_INTEGRATION/AIRTABLE_INTEGRATION.md

**Files:**
- Modify: `documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md`

**What's wrong:**
- References Flutter app (now Next.js)
- Claims offline-first with SQLite (now Neon PostgreSQL)
- Only 2 roles (now 3)
- Says "Marketing Consent" (now feedbackConsent + nextEventConsent)
- Describes bidirectional sync as primary (now CSV export is primary)

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` in full.

- [ ] **Step 2: Rewrite the document**

Complete rewrite. Structure as:

1. **Overview**: Next.js web application integrates with Airtable for pre-event data import and post-event data export.

2. **Import Flow** (Airtable → Neon):
   - Events, organisations, volunteers imported via `/admin/p2i/airtable-import`
   - API routes: `/api/airtable/events`, `/api/airtable/organizations`, `/api/airtable/volunteers`, `/api/airtable/organisation-contacts`
   - 18 Airtable groupType values normalised to 7 categories (reference `software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md`)

3. **Export Flow** (Neon → CSV → manual Airtable import):
   - Primary method: CSV download from P2I admin dashboard
   - Filename format: `{eventName}-registrations-{date}.csv`
   - Full field list from CSV export (reference the `convertToCSV` function in `app/admin/p2i/page.tsx`)

4. **Legacy Sync** (optional section):
   - `syncRegistrationsToAirtable()` exists in `app/actions/airtable-sync.ts`
   - Pushes pending registrations in batches of 10 with 250ms delays
   - Available but CSV export is the standard workflow

5. **Airtable Field Mappings**: Reference `lib/airtable.ts` AIRTABLE_FIELDS constants. List the registration field mapping.

6. **Environment Variables**: AIRTABLE_API_KEY, AIRTABLE_BASE_ID.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md
git commit -m "docs: rewrite Airtable integration — remove Flutter refs, add CSV export flow"
```

---

### Task 9: Update 05_DESIGN/REGISTRATION_FORM_FIELDS.md

**Files:**
- Modify: `documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md`

**What's wrong:**
- Some field names inconsistent with implementation
- "Marketing Consent" referenced in older sections
- Impairment shown for all roles (should be Participant only)
- Organisation field doesn't describe role-based filtering

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` in full.

- [ ] **Step 2: Update the document**

1. Replace the field visibility section with the accurate table from the Reference section.
2. Fix consent field names: remove any "Marketing Consent" references, use photoConsent, feedbackConsent, nextEventConsent.
3. Update organisation field description:
   - Participant: sees open-group orgs (`openGroup !== false`), Individual org at bottom
   - Group: sees closed-group orgs (`openGroup === false`)
   - Volunteer: no org field
4. Fix impairment visibility: Participant only (not Volunteer or Group).
5. Add note about auto-detect group leader feature: if a Participant's email matches a group leader contact, the system auto-populates groupLeaderParticipating and expectedGroupSize.
6. Update step counts: Participant 2 steps, Group 3 steps, Volunteer 1 step.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md
git commit -m "docs: fix field visibility, consent names, and org filtering in form fields doc"
```

---

### Task 10: Update CLIENT_QUESTIONS.md

**Files:**
- Modify: `documentation/confluence_documentation/CLIENT_QUESTIONS.md`

- [ ] **Step 1: Read the current file**

Read `documentation/confluence_documentation/CLIENT_QUESTIONS.md` in full.

- [ ] **Step 2: Update the document**

1. Change status from "Awaiting Client Response" to "Resolved".
2. For each question, add the implementation answer:
   - Admin authentication: PIN-based (P2I: 9876, Event: 1234), sessionStorage
   - Event workflow: planned → active → completed → archived
   - Airtable config: Integrated, import via admin UI, export via CSV
   - Any other questions: answer based on current implementation
3. Add a "Last Updated" date of 2026-04-16.

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/CLIENT_QUESTIONS.md
git commit -m "docs: resolve client questions with implementation answers"
```

---

### Task 11: Update ORGANISATION_TYPE_MAPPING.md

**Files:**
- Modify: `software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md`

**What's wrong:**
- Missing `Individual` type
- Doesn't emphasise `openGroup` as the filtering source of truth

- [ ] **Step 1: Read the current file**

Read `software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md` in full.

- [ ] **Step 2: Update the document**

1. Add `Individual` to the GroupType list. Explain it's a system marker for participants without group affiliation, excluded from counting.
2. Add a prominent section: "Organisation Filtering — `openGroup` is the source of truth". Explain that `groupType` is for reporting only and must never be used for filtering logic.
3. Update the role-based filtering rules to match the Reference section (using `openGroup` language, not `groupType` language).

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md
git commit -m "docs: add Individual type and openGroup filtering rules to org type mapping"
```

---

### Task 12: Update EVENT_SETUP_GUIDE.md

**Files:**
- Modify: `software/nextjs/documentation/EVENT_SETUP_GUIDE.md`

**What's wrong (minor):**
- P2I admin flow has changed: login now goes to manage-events page
- New P2iAdminNav component provides navigation (no more individual back buttons)
- Event summary and archival workflow not documented

- [ ] **Step 1: Read the current file**

Read `software/nextjs/documentation/EVENT_SETUP_GUIDE.md` in full.

- [ ] **Step 2: Update the document**

1. Update the P2I admin login flow: login redirects to `/admin/p2i/manage-events` (not the old dashboard).
2. Update navigation: P2iAdminNav provides Manage Events, Manage Organisations, Manage Helpers, and Logout buttons on all P2I admin pages.
3. Add post-event steps:
   - Mark event as completed from manage-events page
   - Generate event summary (modal with preview, sequence number, admin notes)
   - Event becomes archived after summary generation
   - Export registrations as CSV from P2I dashboard
4. Add event lifecycle: planned → active → completed → archived.

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/documentation/EVENT_SETUP_GUIDE.md
git commit -m "docs: update event setup guide with new admin flow and post-event workflow"
```

---

### Task 13: Update REGISTRATION_FORM_LOGIC.md and consolidate element map

**Files:**
- Modify: `documentation/REGISTRATION_FORM_LOGIC.md`
- Delete: `docs/registration-form-element-map.md` (merge useful content into REGISTRATION_FORM_LOGIC.md)

**What's wrong:**
- Missing auto-detect group leaders registering as Participants
- Missing closed-org scoping fix (case-insensitive email, event-scoped query)
- Missing: hide fully-registered orgs from Group dropdown
- Missing: hide already-registered volunteers from picker
- Element map in `docs/` is a separate file covering the same topic — consolidate

- [ ] **Step 1: Read both files**

Read `documentation/REGISTRATION_FORM_LOGIC.md` and `docs/registration-form-element-map.md` in full.

- [ ] **Step 2: Update REGISTRATION_FORM_LOGIC.md**

1. Add a section on **Smart Filtering**:
   - Organisations that already have a registered group leader for the current event are hidden from the Group dropdown
   - Volunteers who have already registered are hidden from the volunteer name picker
   - Closed-org queries are scoped by event (via `organisationContacts.airtableEventId`) and use case-insensitive email matching
2. Add a section on **Auto-Detect Group Leaders**:
   - When a Participant registers with an email matching a group leader contact, the system automatically sets `groupLeaderParticipating = true` and copies `expectedGroupSize` into the registration
3. Merge the element map content: incorporate the form element ID mapping and step-by-step layout from `docs/registration-form-element-map.md` as an appendix or reference section.

- [ ] **Step 3: Delete the element map file**

```bash
git rm docs/registration-form-element-map.md
```

- [ ] **Step 4: Commit**

```bash
git add documentation/REGISTRATION_FORM_LOGIC.md
git commit -m "docs: update registration form logic with smart filtering and consolidate element map"
```

---

### Task 14: Mark UI_WIREFRAMES.md as historical

**Files:**
- Modify: `documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md`

- [ ] **Step 1: Add historical notice**

Add a prominent notice at the top of the file:

```markdown
> **Historical Document** — These wireframes were created during initial design (V3.0, Feb 2026). The live application UI has diverged significantly from these mockups. Refer to the running application for current UI state.
```

- [ ] **Step 2: Commit**

```bash
git add documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md
git commit -m "docs: mark UI wireframes as historical reference"
```

---

### Task 15: Clean up redundant files

**Files:**
- Delete: `documentation/confluence_documentation/REORGANIZATION_SUMMARY.md`
- Delete: `documentation/confluence_documentation/DOCUMENTATION_WORKFLOW.md`

- [ ] **Step 1: Delete redundant files**

```bash
git rm documentation/confluence_documentation/REORGANIZATION_SUMMARY.md
git rm documentation/confluence_documentation/DOCUMENTATION_WORKFLOW.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: remove outdated reorganization summary and workflow docs"
```

---

### Task 16: Create stakeholder Project Overview

**Files:**
- Create: `documentation/confluence_exports/PROJECT_OVERVIEW.md`

- [ ] **Step 1: Write the stakeholder version**

Write a non-technical project overview for Confluence. Structure:

1. **What is this?** — Power2Inspire Event CRM: a web application for managing Powerhouse Games event registrations.
2. **What does it do?** — Plain-language list of capabilities:
   - Import event data from Airtable (organisations, volunteers)
   - Collect registrations on event day (participants, volunteers, group leaders)
   - Track participant counts by organisation and group type
   - Generate event summaries with headcounts and consent tracking
   - Export registration data as CSV
3. **How does it work?** — Three-phase description (before/during/after event) in operational terms, no technical jargon.
4. **User types** — P2I administrators, event administrators, attendees registering on the day.
5. **Current status** — Active and in use. List of recent additions.

Tone: clear, accessible, no code references. Aim for ~500 words.

- [ ] **Step 2: Commit**

```bash
git add documentation/confluence_exports/PROJECT_OVERVIEW.md
git commit -m "docs: add stakeholder-friendly project overview for Confluence"
```

---

### Task 17: Create stakeholder Event Setup Guide

**Files:**
- Create: `documentation/confluence_exports/EVENT_SETUP_GUIDE.md`

- [ ] **Step 1: Write the stakeholder version**

Write an operational guide for event organisers. Structure:

1. **Before the Event**
   - Log in as P2I admin (PIN: 9876)
   - Import event data from Airtable (step-by-step with screenshots descriptions)
   - Review organisations and volunteers on manage pages
   - Set the event as "Active"
2. **On Event Day**
   - Attendees visit the registration page on tablets/laptops
   - Three registration paths: Participant, Volunteer, Group Leader
   - Event admin can view registrations in real-time (PIN: 1234)
3. **After the Event**
   - Mark event as "Completed"
   - Generate event summary (headcounts, consent stats, org breakdown)
   - Export registrations as CSV
   - Import CSV into Airtable manually

Tone: step-by-step, operational, assumes no technical knowledge. Aim for ~800 words.

- [ ] **Step 2: Commit**

```bash
git add documentation/confluence_exports/EVENT_SETUP_GUIDE.md
git commit -m "docs: add stakeholder event setup guide for Confluence"
```

---

### Task 18: Create stakeholder Registration Flow guide

**Files:**
- Create: `documentation/confluence_exports/REGISTRATION_FLOW.md`

- [ ] **Step 1: Write the stakeholder version**

Write a guide explaining how registration works from the perspective of attendees and admins. Structure:

1. **For Attendees** — What they see when they visit the registration page:
   - Choose role: "I am a Participant", "I am a Volunteer", "I am a Group Leader"
   - Participant path: name, email, select organisation, impairment question, consent checkboxes (2 steps)
   - Volunteer path: enter email, system finds their details, consent checkboxes (1 step)
   - Group Leader path: name, email, select organisation, group size details, consent checkboxes (3 steps)
2. **For Event Admins** — What they can see and do:
   - View all registrations in real-time
   - See participant counts by organisation
   - View group leader details and expected vs actual counts
3. **Smart Features** (plain language):
   - Organisations that already have a registered leader are hidden from the Group dropdown
   - Volunteers who've already registered are hidden from the picker
   - If a participant's email matches a known group leader, the system records this automatically

Tone: user-facing, no code. Aim for ~600 words.

- [ ] **Step 2: Commit**

```bash
git add documentation/confluence_exports/REGISTRATION_FLOW.md
git commit -m "docs: add stakeholder registration flow guide for Confluence"
```

---

### Task 19: Create stakeholder Data Export guide

**Files:**
- Create: `documentation/confluence_exports/DATA_EXPORT.md`

- [ ] **Step 1: Write the stakeholder version**

Write a short guide on exporting data. Structure:

1. **How to Export** — Step-by-step:
   - Log in as P2I admin
   - Navigate to dashboard (event options page)
   - Click "Export to CSV" in the System Integration panel
   - File downloads as `{eventName}-registrations-{date}.csv`
2. **What's in the CSV** — Plain-language description of columns:
   - Attendee details (name, surname, email)
   - Organisation name
   - Role (Participant/Volunteer/Group)
   - Consent responses (photo, feedback, next event)
   - Group details (size, disabled students, SEN students, leader participating) — Group role only
3. **Importing to Airtable** — Brief guidance on manual CSV import into Airtable.

Tone: operational, brief. Aim for ~300 words.

- [ ] **Step 2: Commit**

```bash
git add documentation/confluence_exports/DATA_EXPORT.md
git commit -m "docs: add stakeholder data export guide for Confluence"
```

---

### Task 20: Rewrite CONFLUENCE_UPDATE_TRACKER.md

**Files:**
- Modify: `documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md`

- [ ] **Step 1: Rewrite the tracker**

Complete rewrite. Structure:

1. **Header**: Last Updated: 2026-04-16. Purpose: maps repo docs to Confluence pages.

2. **Confluence Space Structure**: Updated tree showing current page structure.

3. **Page Mapping Table**:

| Confluence Page | Repo Source (Developer) | Repo Source (Stakeholder) | Last Updated | Status |
|---|---|---|---|---|
| Project Overview | `confluence_documentation/00_PROJECT_OVERVIEW.md` | `confluence_exports/PROJECT_OVERVIEW.md` | 2026-04-16 | Ready for upload |
| Planning > Project Status | `confluence_documentation/01_PLANNING/PROJECT_STATUS.md` | — | 2026-04-16 | Ready for upload |
| Planning > Requirements | `confluence_documentation/01_PLANNING/REQUIREMENTS.md` | — | 2026-04-16 | Ready for upload |
| Planning > TODO | `confluence_documentation/01_PLANNING/TODO.md` | — | 2026-04-16 | Ready for upload |
| Technical > Architecture | `confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | — | 2026-04-16 | Ready for upload |
| Technical > Data Models | `confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | — | 2026-04-16 | Ready for upload |
| Technical > Deployment Guide | `confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md` | — | (unchanged) | Current |
| Integration > Airtable Integration | `confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` | — | 2026-04-16 | Ready for upload |
| Integration > Integration Discussion | `confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md` | — | (unchanged) | Review needed |
| Design > Registration Form Fields | `confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` | — | 2026-04-16 | Ready for upload |
| Design > UI Wireframes | `confluence_documentation/05_DESIGN/UI_WIREFRAMES.md` | — | (unchanged) | Historical |
| NEW: Event Setup Guide | `software/nextjs/documentation/EVENT_SETUP_GUIDE.md` | `confluence_exports/EVENT_SETUP_GUIDE.md` | 2026-04-16 | New page |
| NEW: Registration Flow | — | `confluence_exports/REGISTRATION_FLOW.md` | 2026-04-16 | New page |
| NEW: Data Export | — | `confluence_exports/DATA_EXPORT.md` | 2026-04-16 | New page |

4. **Upload Instructions**: For pages with a stakeholder version, upload the `confluence_exports/` version to Confluence (non-technical tone). For pages without a stakeholder version, upload the developer version directly.

5. **Workflow Going Forward**: All doc changes happen in the repo first. After updating a doc, update this tracker and upload to Confluence.

- [ ] **Step 2: Remove the .gitkeep** (directory now has real content via other tasks)

```bash
git rm documentation/confluence_exports/.gitkeep 2>/dev/null || true
```

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md
git commit -m "docs: rewrite Confluence update tracker with current page mapping"
```

---

### Task 21: Final review and branch summary

- [ ] **Step 1: Review all changes**

```bash
git log --oneline docs/full-documentation-update..HEAD
```

Verify all commits are present (up to 21 tasks, some may be combined) and no files were missed.

- [ ] **Step 2: Verify no broken internal links**

Grep for any references to deleted files:
```bash
grep -r "REORGANIZATION_SUMMARY" documentation/
grep -r "DOCUMENTATION_WORKFLOW" documentation/
```

Fix any references found.

- [ ] **Step 3: Verify role naming consistency**

```bash
grep -ri "attendee" documentation/ --include="*.md" | grep -v "archive"
```

Any remaining "Attendee" references (outside of historical context) should be fixed to "Participant".

- [ ] **Step 4: Verify no "Marketing Consent" references remain**

```bash
grep -ri "marketing.consent" documentation/ --include="*.md"
```

Fix any found.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A documentation/
git commit -m "docs: fix consistency issues found in final review"
```
