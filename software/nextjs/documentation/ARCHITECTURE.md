# Architecture — Power2Inspire Event CRM

**Document Version:** 2.0
**Last Updated:** 2026-04-16
**Status:** Current

---

## 1. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| UI | React | 19 |
| Language | TypeScript | 5 |
| Database ORM | Drizzle ORM + Neon serverless PostgreSQL | — |
| External data | Airtable SDK | 0.12.2 |
| Validation | Zod + React Hook Form | 4.3.6 / 7.71.1 |
| Components | Shadcn UI (Radix) + Tailwind CSS | 4 |

---

## 2. Key Layers

| File | Purpose |
|---|---|
| `lib/db/schema.ts` | Drizzle schema — single source of truth for DB structure |
| `lib/db/client.ts` | Drizzle + Neon HTTP client instance |
| `lib/db-service.ts` | `DatabaseService` class — all DB query logic lives here |
| `lib/actions.ts` | Next.js Server Actions — thin wrappers around `DatabaseService` |
| `lib/types.ts` | TypeScript interfaces for all entities |
| `lib/airtable.ts` | Airtable SDK client + field mappings between Airtable and local schema |
| `lib/validation.ts` | Zod schemas for form validation |
| `lib/helpers.ts` | Pure utility functions (no DB/server imports; safe for client use) |
| `lib/participant-counting.ts` | Business logic for participant count calculations |
| `lib/field-visibility-config.ts` | Config object controlling which form fields show per registration type |
| `lib/help-tips.ts` | Centralised help tip content with `tipKey` lookup |

---

## 3. Data Flow

The system operates in three phases:

**Phase 1 — Pre-event**
P2I admin imports events, organisations, and volunteers from Airtable into Neon Postgres via `/admin/p2i/airtable-import`.

**Phase 2 — Event day**
Attendees register via the public `/registration` form. Registrations are written directly to Neon Postgres.

**Phase 3 — Post-event**
Admin exports registrations as a CSV from the P2I dashboard for manual import into Airtable. This is the only supported post-event workflow.

> ⚠️ **Deprecated:** A direct-sync function (`syncRegistrationsToAirtable()` in `app/actions/airtable-sync.ts`) still exists in the codebase for reference, but is **deprecated as of 2026-04-29**. Do not extend or recommend it; new post-event work should target CSV export only.

---

## 4. Route Map

### Public

| Route | Description |
|---|---|
| `/` | Landing page — shows logo and redirects to power2inspire.org.uk/powerhousegames/ after 5 seconds |
| `/registration` | Public registration form (only renders when an event is active) |

### P2I Admin (PIN: 9876)

| Route | Description |
|---|---|
| `/admin/p2i/` | P2I admin dashboard — event options and CSV export |
| `/admin/p2i/manage-events` | Event management — this is where P2I login lands |
| `/admin/p2i/organisations` | Organisation CRUD |
| `/admin/p2i/helpers` | Volunteer/helper management |
| `/admin/p2i/group-leaders` | Group leader contacts management |
| `/admin/p2i/airtable-import` | Airtable data import |

### Event Admin (PIN: 1234)

| Route | Description |
|---|---|
| `/admin/event/` | Event admin dashboard |
| `/admin/event/registrations` | Registration list |
| `/admin/event/registrations/[id]` | Registration detail |
| `/admin/event/register-volunteer` | Manual volunteer registration |
| `/admin/event/register-organization` | Manual org registration |
| `/admin/event/organizations/[organizationId]` | Org detail |
| `/admin/event/report` | Group registration report |

---

## 5. Registration Roles

The registration form (`components/registration-form.tsx`, ~50KB) supports three roles with different field sets and step counts.

| Role | Description | Steps |
|---|---|---|
| **Participant** | Individual attendee; sees open-group organisations (`openGroup !== false`) | 2 |
| **Volunteer** | Identified by email lookup against the `volunteers` table | 1 |
| **Group** | Group leader; sees all organisations (open and closed); captures group size, disabled students, SEN students, and whether the leader is participating | 3 |

### Field Visibility by Role

| Field | Participant | Volunteer | Group |
|---|---|---|---|
| attendeeName | Yes | No | Yes |
| attendeeSurname | Yes | No | Yes |
| email | Yes | Yes | Yes |
| organizationId | Yes | No | Yes |
| impairment | Yes | No | No |
| photoConsent | Yes | Yes | Yes |
| feedbackConsent | Yes | Yes | Yes |
| nextEventConsent | Yes | Yes | Yes |
| groupSize | No | No | Yes |
| impairedParticipants | No | No | Yes |
| nonImpairedParticipants | No | No | Yes |

Field visibility per role is driven by `lib/field-visibility-config.ts`.

---

## 6. Organisation Model

### Source of Truth: `openGroup`

The `openGroup` boolean on `organisationContacts` is the single source of truth for group behaviour and filtering.

- `openGroup === true` (or `null`): **open group** — Participants register individually; the group leader registers to set expected count
- `openGroup === false`: **closed group** — the group leader registers on behalf of all members; no individual Participant registrations are taken

**Rule: `groupType` is for reporting only.** It must never be used for filtering, selection, or any conditional logic within the application.

### Dropdown Filtering

- **Participant dropdown**: only organisations where `openGroup !== false`; the `Individual` option is always last
- **Group dropdown**: only organisations where `openGroup === false`
- `Individual` is a system `groupType` for participants without group affiliation and is excluded from counting

---

## 7. Authentication

Authentication is sessionStorage-based. There is no server-side session or JWT.

| Key | Value | Access |
|---|---|---|
| `adminAuth` | `"event"` | Event admin routes (`/admin/event/*`) |
| `adminAuth` | `"p2i"` | P2I admin routes (`/admin/p2i/*`) |
| `administeringEventId` | event UUID | Tracks which event the P2I admin is managing |

Access is checked client-side in page components. P2I login redirects to `/admin/p2i/manage-events`.

---

## 8. Key Components

**`registration-form.tsx`**
Multi-step registration form (~50KB). The core of the application. Handles all three registration roles, field visibility, step navigation, and form submission.

**`P2iAdminNav`**
Shared navigation component across all P2I admin pages. Links: Manage Events, Manage Organisations, Manage Helpers, Logout.

**`HelpTip`**
Inline help popovers with randomised P2I brand colours. Content is centralised in `lib/help-tips.ts` and looked up by `tipKey`.

**Event summary modal**
Allows P2I admin to preview participant counts and consent stats, enter an event sequence number and admin notes, then archive the event.

---

## 9. Event Lifecycle

Events progress through a fixed sequence of statuses:

```
planned → active → completed → archived
```

Only one event can be `active` at a time. The `active` event is what the public registration form displays. An event moves to `archived` after the summary modal has been completed.
