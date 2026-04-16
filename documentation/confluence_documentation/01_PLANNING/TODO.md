# Power2Inspire Event CRM App - TODO

**Last Updated:** 2026-04-16
**Project Status:** Live — Next.js application deployed and in use
**Current Version:** V2 (production)
**Technology:** Next.js 16 + Neon PostgreSQL + Vercel

---

## Overview

The application is fully implemented and operational. This document tracks remaining outstanding items and future enhancement opportunities.

---

## Resolved Questions

The following questions were raised during planning. All are now answered and implemented.

| Question | Resolution |
|---|---|
| Organisation field implementation (dropdown/autocomplete/free text) | Dropdown with role-based filtering. Participants see open-group orgs only (`openGroup !== false`); Group leaders see all orgs. Implemented in `lib/helpers.ts`. |
| Conditional fields for Attendee vs Volunteer | Fully implemented via `lib/field-visibility-config.ts`. Three roles (Participant, Volunteer, Group) each have distinct field sets. |
| Registration roles | Three roles: **Participant**, **Volunteer** (identified by email lookup against `volunteers` table), **Group** (group leader capturing group size and participation status). |
| Admin authentication | PIN-based: P2I admin uses `9876`, Event admin uses `1234`. Access stored in `sessionStorage` (`adminAuth` key). No server-side session. |
| Airtable sync (import/export) | Import: Airtable → Neon via `/admin/p2i/airtable-import`. Export: CSV download is the standard post-event workflow. A legacy `syncRegistrationsToAirtable()` function exists in `app/actions/airtable-sync.ts` but CSV export is the current standard. |
| Impairment field format | Free text, required. |
| Consent text | Matches existing Airtable form; photo consent uses orange wristband language. |
| Technology stack | Next.js 16 + Vercel (confirmed and implemented). Flutter approach was considered but not used. |

---

## Completed Work

- Next.js 16 App Router application initialised and deployed
- Drizzle ORM + Neon PostgreSQL schema (`lib/db/schema.ts`)
- Public registration form (`components/registration-form.tsx`) supporting all three roles
- Volunteer identification by email lookup
- Role-based organisation filtering (open/closed groups via `openGroup` boolean)
- Field visibility config per registration role (`lib/field-visibility-config.ts`)
- P2I admin dashboard (`/admin/p2i/`)
- Event admin dashboard (`/admin/event/`)
- Airtable import for events, organisations, and volunteers (`/admin/p2i/airtable-import`)
- CSV export for post-event reporting
- Participant counting logic (`lib/participant-counting.ts`) for open and closed groups
- Vercel deployment with environment variable configuration
- All core documentation written and version-controlled

---

## Outstanding Items

There are no critical bugs or blocking issues at this time. The items below are enhancements and technical debt.

### Known Technical Debt

- **Authentication**: Admin access is controlled by hardcoded PINs stored in `sessionStorage`. This is client-side only and not secure. Should be replaced with a proper auth library (e.g. NextAuth.js or Clerk) with server-side session management.
- **No automated tests**: Manual verification via dev server is the current standard. An automated test suite (unit + integration + E2E) would improve confidence during future changes.
- **Check-in/check-out time tracking**: The `checkinTime` and `checkoutTime` fields exist on the `registrations` table but attendance tracking UI is not currently surfaced in the event admin dashboard.

### Planned Features (Specs Written)

- **Group registration field rename**: Design spec exists at `docs/superpowers/specs/2026-04-02-group-registration-field-rename-design.md`. Renames the `groupSize` field label and adds validation improvements. Implementation plan also exists.

### Future Enhancement Ideas

- Proper authentication replacing sessionStorage PINs (e.g. NextAuth.js or Clerk)
- Server-side session management
- Automated testing suite (unit, integration, E2E)
- Check-in/check-out attendance tracking UI during events
- PWA support (install to home screen, offline-first registration)
- Multi-language support (i18n)
- Vercel Analytics integration
- GDPR data retention policy and tooling

---

## Notes

- `groupType` on organisations is an administrative label for external reporting only — it must never be used for filtering or conditional logic within the application. The `openGroup` boolean on `organisation_contacts` is the single source of truth for group behaviour.
- Organisations are linked to events via `organisations.airtableEventId` matching `events.airtableRecordId`.
- Airtable sync batches 10 records at a time with 250ms delays to respect rate limits.
