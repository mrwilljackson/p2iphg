# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Directory

All application code lives in `software/nextjs/`. Run all commands from that directory.

```bash
cd software/nextjs
```

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint

# Database (Drizzle + Neon)
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Push schema changes directly to DB (dev)
npm run db:studio    # Open Drizzle Studio (DB browser)
npm run db:clear     # Clear all data (runs scripts/clear-database.ts)
npm run db:seed      # Seed with test data (runs scripts/seed-database-v2.ts)
```

There are no automated tests. Manual verification via the dev server is the standard approach.

## Git Workflow

**Never develop directly on `master`.** All feature work, bug fixes, and refactors must start on a new branch.

**If the user asks to build, fix, or change anything and the current branch is `master`, stop and say:** "You're on `master` — let's create a branch first. What should we call it?" Do not write any code until a branch has been created.

```bash
git checkout -b feature/my-feature-name
```

`master` is the stable baseline. Branches are merged back to `master` only once manually verified via the dev server.

## Feature Development Process

For every new feature or fix, always produce two lists before writing any code:

**1. Implementation task list** — the steps required to build the feature, broken into small discrete tasks (one concern per task, each ending with a commit).

**2. Verification checklist** — a simple numbered list of manual steps the user can follow in the browser to confirm the feature works and that existing functionality has not broken. This must cover:
- The new behaviour being tested
- Any existing flows that touch the same area (regression checks)

Present both lists to the user for review before starting implementation.

## Architecture Overview

Next.js 16 App Router application. The data lifecycle is:
1. **Pre-event**: P2I admin imports events, organisations, and volunteers from Airtable into Neon Postgres via `/admin/p2i/airtable-import`
2. **Event day**: Attendees register via the public `/registration` form, written directly to Neon
3. **Post-event**: Admin downloads registrations as a CSV from the P2I dashboard for manual import into Airtable. The direct-sync function `syncRegistrationsToAirtable()` in `app/actions/airtable-sync.ts` is **deprecated** (as of 2026-04-29) — do not extend or recommend it; new post-event work should target CSV export.

### Key Layers

- **`lib/db/schema.ts`** — Drizzle schema (single source of truth for DB structure)
- **`lib/db/client.ts`** — Drizzle + Neon HTTP client instance
- **`lib/db-service.ts`** — `DatabaseService` class: all DB query logic lives here
- **`lib/actions.ts`** — Next.js Server Actions: thin wrappers around `DatabaseService`
- **`lib/types.ts`** — TypeScript interfaces for all entities
- **`lib/airtable.ts`** — Airtable SDK client + field mappings between Airtable and local schema
- **`lib/validation.ts`** — Zod schemas for form validation
- **`lib/helpers.ts`** — Pure utility functions (no DB/server imports; safe for client use)
- **`lib/participant-counting.ts`** — Business logic for participant count calculations
- **`lib/field-visibility-config.ts`** — Config object controlling which form fields show per registration type

### Authentication

No proper auth library. Access is controlled by `sessionStorage`:
- `adminAuth` = `"event"` grants access to event admin routes (`/admin/event/*`)
- `adminAuth` = `"p2i"` grants access to P2I admin routes (`/admin/p2i/*`)
- `administeringEventId` stores which event the P2I admin has selected to manage

This is checked client-side in page components. There is no server-side session or JWT.

### Registration Form

`components/registration-form.tsx` is the core of the application (~50KB). It handles three registration roles with different field sets:

- **Participant** — individual attendee; sees open-group organisations (`openGroup !== false`)
- **Volunteer** — identified by email lookup against the `volunteers` table pre-populated from Airtable
- **Group** — group leader; sees all organisations (open and closed); captures group size and whether the leader is participating

Field visibility per role is driven by `lib/field-visibility-config.ts`.

### Database FKs — RULE: UUID FKs only, never Airtable IDs

`airtableRecordId` (and any other `airtable_*_id` text fields) are **reference-only** — they exist to track which Airtable record a row originated from for re-import upserts. They must never be used as join keys, filter conditions, or constraints.

All joins, filtering, and constraints between local tables go through UUID FKs:
- `organisation_contacts.organisationId` → `organisations.id`
- `organisation_contacts.eventId` → `events.id`
- `registrations.eventId` → `events.id`
- `registrations.organizationId` → `organisations.id`

Organisations are **global records** reused across events. Per-event scoping (which org participates in which event, with what leader) lives on `organisation_contacts` — never on `organisations`.

### Organisation Filtering — RULE: Use `openGroup`, never `groupType`

**`groupType` is an administrative label for external reporting systems only. It must never be used for filtering, selection, or any conditional logic within this application.**

The single source of truth for group behaviour is the `openGroup` boolean on `organisation_contacts`:

- `openGroup === true` (or `null`): open group — participants register individually; group leader registers to set expected count
- `openGroup === false`: closed group — group leader registers on behalf of all members; no individual participant registrations

`lib/helpers.ts` `organizationsToOptions()` enforces:
- Participants see only open-group orgs (`openGroup !== false`)
- Volunteer / undefined: no filter

`groupOrgsToSections()` (same file) is used for the Group leader dropdown:
- Open groups listed first; removed once their leader has registered on the day
- Closed groups always listed at the bottom

### Participant Counting Rules (`lib/participant-counting.ts`)

- **Closed groups** (`openGroup === false`): individuals don't register separately; count = `groupSize` from the Group registration (+ 1 if leader participating)
- **Open groups** (`openGroup !== false`): individuals register separately; reported count = actual Participant registrations (not `groupSize`)
- `groupSize` field = participants from the org, NOT including the leader

### Airtable Integration

- 18 Airtable `groupType` values are normalised to 7 dashboard categories (mapping in `lib/airtable.ts`)
- During contact import, the Airtable org/event record IDs are resolved to local UUIDs once and written onto `organisation_contacts.organisationId` / `eventId`. The Airtable text IDs are not stored on the contact row beyond `airtable_record_id` (the contact's own).
- Direct push from Neon to Airtable (`syncRegistrationsToAirtable()`) is **deprecated** — see data-lifecycle note above

## Environment Variables

Required in `.env.local`:
```
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
DATABASE_URL=          # Neon PostgreSQL connection string
NEXT_PUBLIC_APP_URL=
```
