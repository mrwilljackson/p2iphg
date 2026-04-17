# Power2Inspire Event CRM App - Project Status

**Last Updated:** 2026-04-16
**Status:** System in Active Use — Ongoing Refinement ✅

## Current Phase

The system is fully built and in active event-day use. All core phases (infrastructure, registration, API routes, admin dashboards, Airtable integration, reporting, and export) are complete. Work is now focused on incremental refinements, UX improvements, and additional admin tooling as operational needs emerge.

## Recent Completions (Feb–Apr 2026)

- Event summary generation and archival workflow
- Individual participant registration (Individual org type)
- P2I admin CRUD pages (organisations, helpers, group leaders)
- HelpTip inline help component
- CSV export from P2I dashboard
- Auto-detect group leaders registering as Participants
- Hide fully-registered orgs from Group leader dropdown
- Hide already-registered volunteers from volunteer picker
- P2I admin navigation overhaul (shared `P2iAdminNav` component)
- Group leader table on event options page

---

## Completed Tasks

### ✅ Phase 1: Setup & Infrastructure (COMPLETE)
- **NextJS Project:** Initialized with version 16.1.6
  - App Router with Turbopack enabled
  - TypeScript 5.x configured
  - Tailwind CSS 4.x installed
  - Project deployed to Vercel: https://p2iphg-ewodz4p4i-mrwilljackson-com.vercel.app

- **Database Setup:**
  - Neon PostgreSQL database created (EU West London region)
  - Drizzle ORM configured with schema and migrations
  - Tables created: events, organisations, registrations, volunteers, organisationContacts
  - Environment variables configured (.env.local)

- **UI Components:**
  - Shadcn/ui components installed: button, input, label, select, radio-group, form, checkbox, command, popover, dialog
  - Lucide React icons installed
  - Roboto font configured via next/font

- **Form Infrastructure:**
  - React Hook Form 7.x installed
  - Zod validation configured
  - Form validation schemas created

### ✅ Phase 2: Registration Form (COMPLETE)

- **Form Component:**
  - Full registration form built (`components/registration-form.tsx`)
  - Three registration roles: Participant, Volunteer, Group
  - All required fields implemented
  - Conditional fields per role driven by `lib/field-visibility-config.ts`
  - Multi-step flow with role detection and auto-detection of group leaders registering as Participants

- **Form Fields:**
  - Event (hidden, pre-populated from header)
  - First name and last name (side-by-side layout)
  - Email (optional, with volunteer lookup)
  - Organisation (autocomplete combobox, filtered by role)
  - Impairment (optional, dropdown select)
  - Registration role (3 radio button options: Participant, Volunteer, Group)
  - Photo consent, feedback consent, next event consent
  - Group-role conditional fields: groupSize, disabledStudents, senStudents, groupLeaderParticipating

- **Validation:**
  - Client-side validation with Zod schema
  - Required field validation
  - Email format validation
  - Number input validation for Group-role fields

### ✅ UI/UX Enhancements (COMPLETE)

- **Event Header:** P2I logo, event name, date, location — fully responsive
- **Typography:** Roboto headings, Geist Sans body text
- **Interactive Elements:** Fully clickable selection boxes, hover effects, lime green submit button
- **Layout:** Responsive mobile-first design, horizontal field layouts, gradient background
- **Accessibility:** Native `<label>` elements, larger click targets, semantic HTML
- **HelpTip Component:** Inline contextual help tooltips throughout forms and admin pages

### ✅ Phase 3: API Routes & Server Actions (COMPLETE)

- `GET /api/airtable/events` — Fetch events from Airtable
- `POST /api/airtable/events` — Import events to Neon
- `GET /api/airtable/organizations` — Fetch organisations from Airtable
- `POST /api/airtable/organizations` — Import organisations to Neon
- `GET /api/airtable/volunteers` — Fetch volunteers from Airtable
- `POST /api/airtable/volunteers` — Import volunteers to Neon
- `GET /api/airtable/organisation-contacts` — Fetch org contacts from Airtable
- Server Actions in `lib/actions.ts`: thin wrappers around `DatabaseService` for all CRUD operations
- `app/actions/airtable-import.ts`: bulk Airtable → Neon import
- `app/actions/airtable-sync.ts`: Neon registrations → Airtable sync (batched, rate-limited)

### ✅ Phase 4: Admin Dashboards (COMPLETE)

- **P2I Admin (`/admin/p2i/`):**
  - Airtable import page (events, organisations, volunteers)
  - Manage events page (set active event)
  - Organisation CRUD pages
  - Helpers (volunteers) management pages
  - Group leaders management pages
  - CSV export of registration data
  - Shared `P2iAdminNav` navigation component
  - Group leader table on event options page

- **Event Admin (`/admin/event/`):**
  - Live registration list with search/filter
  - Individual registration detail view
  - Check-in / check-out functionality with timestamps
  - Manual organisation creation
  - Manual volunteer creation
  - Organisation detail pages
  - Analytics and reporting dashboard
  - Event summary generation and archival workflow

### ✅ Phase 5: Organisation Management (COMPLETE)

- Full organisation CRUD via P2I admin
- Organisation contacts (group leaders) linked to events
- `openGroup` boolean controls participant vs. group registration behaviour
- Filtering: Participants see only open-group orgs; Group leaders see all orgs
- Fully-registered open-group orgs hidden from Group leader dropdown
- Individual org type for participants without an org affiliation

### ✅ Phase 6: Airtable Integration (COMPLETE)

- Airtable API key and base ID configured via environment variables
- Fetch service: Airtable → Neon (events, organisations, volunteers, contacts)
- Sync service: Neon → Airtable (registrations, batches of 10, 250ms delay)
- Field mapping in `lib/airtable.ts` (18 Airtable groupType values normalised to 7 dashboard categories)
- Error handling and retry logic

### ✅ Phase 7: Participant Counting & Reporting (COMPLETE)

- `lib/participant-counting.ts`: business logic for all counting rules
  - Closed groups (`openGroup === false`): count = `groupSize` + 1 if leader participating
  - Open groups: count = actual Participant registrations
- Analytics dashboard with per-org and per-role breakdowns
- Event summary generation
- CSV export from P2I dashboard

### ✅ Phase 8: Volunteer Management (COMPLETE)

- Volunteers pre-populated from Airtable import
- Email lookup at registration auto-identifies volunteers
- Already-registered volunteers hidden from volunteer picker
- Manual volunteer creation via event admin

---

## Technical Decisions Made

### Database Selection: Neon PostgreSQL
- **Why:** Auto-wakes in 1-2 seconds after inactivity (acceptable for event start)
- **Region:** EU West (London) for GDPR compliance
- **Tier:** Free (512MB storage, sufficient as data is wiped after each event)
- **Rejected alternatives:**
  - Supabase (pauses after 7 days, requires manual reactivation)
  - PlanetScale (good option, but Neon chosen for EU region)
  - Turso (good option, but Neon chosen for PostgreSQL familiarity)

### Database Workflow: Three-Phase Approach
1. **Pre-Event:** Admin fetches data from Airtable → Stores in Neon database
2. **During Event:** Registrations stored in Neon (fast, no Airtable API calls)
3. **Post-Event:** Admin syncs all registrations to Airtable → Archives / wipes Neon database

### Organisation Filtering Rule: `openGroup`, Never `groupType`
- `groupType` is an administrative label for external reporting only; never used for filtering
- `openGroup` boolean is the single source of truth for group behaviour
- Enforced in `lib/helpers.ts` (`organizationsToOptions()`, `groupOrgsToSections()`)

### UI Pattern: Native Label Wrappers
- Entire selection boxes are clickable using native HTML `<label>` behaviour
- No custom JavaScript needed; accessible by default

### Photo Consent Default: Opt-Out
- Photo consent defaults to "Yes" (opt-out model)
- Users can still decline during registration

---

## Live Deployment

- **URL:** https://p2iphg-ewodz4p4i-mrwilljackson-com.vercel.app
- **Status:** Production deployment active — used on event days
- **Auto-Deploy:** Enabled on push to master branch
- **Environment:** Vercel Hobby (free tier)

## Git Repository

- **Location:** `/Users/willjackson/Documents/Work/power2inspire/event-crm-app`
- **Remote:** https://github.com/mrwilljackson/p2iphg.git
- **Branch strategy:** Feature branches merged to `master` after manual verification

## Key File Locations

```
software/nextjs/
├── lib/
│   ├── db/schema.ts               — Drizzle schema (single source of truth)
│   ├── db/client.ts               — Drizzle + Neon HTTP client
│   ├── db-service.ts              — DatabaseService class (all DB queries)
│   ├── actions.ts                 — Next.js Server Actions
│   ├── types.ts                   — TypeScript interfaces
│   ├── airtable.ts                — Airtable SDK client + field mappings
│   ├── validation.ts              — Zod schemas
│   ├── helpers.ts                 — Pure utility functions (org filtering)
│   ├── participant-counting.ts    — Participant count business logic
│   └── field-visibility-config.ts — Form field visibility per role
├── app/
│   ├── actions/
│   │   ├── airtable-import.ts     — Bulk Airtable → Neon import
│   │   └── airtable-sync.ts       — Neon → Airtable sync
│   ├── registration/              — Public registration form
│   ├── admin/p2i/                 — P2I admin routes
│   └── admin/event/               — Event admin routes
└── components/
    ├── registration-form.tsx      — Core registration form (~50KB)
    ├── registration-content.tsx   — Registration page wrapper
    └── ui/                        — Shadcn/ui components
```
