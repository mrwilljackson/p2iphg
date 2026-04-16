# Power2Inspire Event CRM App - Project Overview

**Project Type:** Next.js Web Application
**Organization:** Power2Inspire (Charity)
**Purpose:** Event registration, volunteer coordination, and attendance tracking
**Status:** In Active Use
**Last Updated:** 2026-04-16

---

## Project Mission

Build a web-based application for Power2Inspire charity events that enables:
- Quick and accessible participant and volunteer registration
- Real-time attendance tracking for safety compliance
- Contact capture with GDPR-compliant consent management
- Post-event data export for Airtable CRM

---

## Application Overview

### Target Platform
- **Devices:** Tablets (primary), phones (secondary), desktop (tertiary)
- **Deployment:** Vercel (serverless, edge network)
- **Usage Model:** Web browser access, kiosk-style at events
- **Connectivity:** Requires internet connection

### Core Features
1. **Event Lifecycle Management** — Events move through states: planned → active → completed → archived. Only one event may be active at a time.
2. **Registration** — Multi-step registration form supporting Participant, Volunteer, and Group roles with role-specific fields and validation.
3. **Attendance Tracking** — Check-in/check-out for fire drill compliance.
4. **Contact Capture** — Email with GDPR-compliant marketing, photo, and feedback consent.
5. **Organisation Filtering** — Group dropdown hides already fully-registered organisations; Participants see only open-group organisations.
6. **Auto-detect Group Leaders** — When a Participant registers with an email matching a known group leader contact, the system automatically sets groupLeaderParticipating and copies expectedGroupSize into the registration.
7. **Volunteer Detection** — Identifies volunteers by email lookup against pre-imported volunteers table; hides already-registered volunteers from the picker.
8. **P2I Admin CRUD** — P2I admins can create, edit, and delete organisations, helpers, and group leaders directly from the dashboard.
9. **HelpTip Inline Help** — Contextual help tooltips throughout the form via a reusable HelpTip component.
10. **Event Summary and Archival** — Generate and store an event summary before archiving a completed event.
11. **CSV Export** — Export registrations as CSV from the P2I dashboard for manual import into Airtable.
12. **Airtable Import** — Bulk import events, organisations, and volunteers from Airtable before each event.

---

## Technical Stack

- **Framework:** Next.js 16.1.6 (App Router + Turbopack)
- **UI Library:** React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Components:** Shadcn/ui (Radix-based accessible component library)
- **Forms:** React Hook Form 7
- **Validation:** Zod 4 (client + server)
- **Icons:** Lucide React
- **Database:** Neon serverless PostgreSQL (EU West London, GDPR compliant)
- **ORM:** Drizzle ORM with Drizzle Kit
- **Hosting:** Vercel (serverless, edge network)
- **Airtable SDK:** airtable 0.12.2

---

## Documentation Structure

### 1. Project Planning
- **[Requirements V2](./01_PLANNING/REQUIREMENTS.md)** — Next.js web application requirements
- **[Project Status](./01_PLANNING/PROJECT_STATUS.md)** — Current implementation status
- **[TODO & Task Tracking](./01_PLANNING/TODO.md)** — Current tasks organised into phases

### 2. Technical Design
- **[Next.js Architecture](./02_TECHNICAL/ARCHITECTURE.md)** — Complete architecture with implementation status
- **[Data Models](./02_TECHNICAL/DATA_MODELS.md)** — Entity definitions with Neon PostgreSQL schema

### 3. Integration Design
- **[Airtable Integration](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)** — Field mappings and API examples
- **[Integration Discussion](./03_INTEGRATION/INTEGRATION_DISCUSSION.md)** — Integration decisions and questions

### 4. Development Notes
- **[Data Requirements](./04_DEVELOPMENT/data_requirements.md)** — Development data requirements

---

## Key Design Principles

### Accessibility First
- WCAG AA compliance (Lighthouse Accessibility score 100)
- Large touch targets (minimum 48x48 dp, prefer 72x72 dp)
- High contrast UI for visually impaired users
- Screen reader support (semantic HTML + ARIA labels)
- Keyboard navigation support
- Clear, simple navigation

### Security and Privacy
- GDPR compliant consent management
- Airtable API keys stored server-side only (never exposed to browser)
- HTTPS-only communication (enforced by Vercel)
- Input validation (client-side + server-side with Zod)
- XSS prevention (React auto-escaping)
- Minimal data retention

---

## Registration Types

### Participant
Individual event attendees. Register with name, email, organisation, impairment status, and GDPR consents. See only open-group organisations in the organisation dropdown. Registration is 2 steps.

### Volunteer
Event helpers and staff. Identified automatically by email lookup against the volunteers table, which is pre-populated from Airtable before the event. Registration is a single step. Already-registered volunteers are hidden from the volunteer picker.

### Group (Teacher, Parent or Community Group Leader)
Group leaders registering on behalf of or alongside a group. See all organisations (open and closed) in the organisation dropdown. Capture additional fields: group size, number of disabled students, number of SEN students, and whether the leader is personally participating. Registration is 3 steps.

---

## User Roles (App Operators)

### Event Admin
P2I staff running the event on the day. Access the event admin dashboard to:
- View and manage registrations
- Check in and check out attendees
- Monitor live registration counts
- Manually register organisations and volunteers

### P2I Admin
Power2Inspire organisational admins. Access the P2I admin dashboard to:
- Import events, organisations, and volunteers from Airtable
- Manage organisations, helpers, and group leaders (CRUD)
- Set the active event
- Export registrations as CSV
- Generate event summaries and archive completed events

---

## Data Flow

### Pre-Event
P2I admin imports events, organisations, and volunteers from Airtable into Neon Postgres via the `/admin/p2i/airtable-import` page. This populates the dropdown options and volunteer lookup table used on event day.

### Event Day
Attendees register via the public `/registration` form. Registrations are written directly to Neon Postgres. The form supports Participant, Volunteer, and Group roles with role-specific field sets and validation.

### Post-Event
After the event, the P2I admin exports registrations as a CSV file from the P2I dashboard. This CSV is manually imported into Airtable as the standard post-event workflow.

A legacy `syncRegistrationsToAirtable()` server action exists in `app/actions/airtable-sync.ts` for direct API sync, but CSV export is the current standard workflow.

After export, the admin generates an event summary and archives the event, transitioning it from `completed` to `archived` status.

---

## Event Lifecycle

```
planned → active → completed → archived
```

- **Planned** — Event exists but registration is not yet open
- **Active** — Registration form is live; only one event may be active at a time
- **Completed** — Event day is over; data is available for export and review
- **Archived** — Event summary has been generated and the event is closed

---

## Quick Links

- [Project Status](./01_PLANNING/PROJECT_STATUS.md)
- [Next.js Architecture](./02_TECHNICAL/ARCHITECTURE.md)
- [Requirements](./01_PLANNING/REQUIREMENTS.md)
- [Data Models](./02_TECHNICAL/DATA_MODELS.md)
- [Airtable Integration](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)
- [TODO & Task Tracking](./01_PLANNING/TODO.md)

---

*This documentation is maintained in sync with the git repository and updated as the project evolves.*
