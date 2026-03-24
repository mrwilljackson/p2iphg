# P2I Admin CRUD Design

**Date:** 2026-03-24
**Status:** Approved
**Implementation plan:** `docs/superpowers/plans/2026-03-23-p2i-crud-admin.md`

## Summary

Add full Create/Read/Update/Delete management of Events, Organisations, and Volunteers to the P2I admin section. This replaces the Airtable import workflow as the primary means of populating the database before an event.

## Context

The existing data entry process requires the client to import Events, Organisations, and Volunteers from Airtable via a bulk import page. This has proven difficult to manage: Airtable field mapping is fragile, import errors are hard to diagnose, and the client must maintain two systems in sync. Manual CRUD admin pages give the client a direct, reliable way to manage records without Airtable as an intermediary.

## Scope

### In scope
- **Events** — create, edit, delete
- **Organisations** — create, edit, delete (includes linked contact details)
- **Volunteers** — create, edit, delete

### Out of scope
- **Registrations** — individual attendee registration already exists via the public `/registration` form and is not changed
- **Removing the Airtable import** — the import page is not deleted; it remains available as an alternative data entry path for clients who prefer it
- **Registration form UI** — no changes to form labels, layout, or public-facing behaviour beyond what the open/closed filtering change requires

## Key Design Decisions

### Airtable Record ID as optional sync target

Every entity (Event, Organisation, Volunteer) has an `airtableRecordId` field. In the admin forms, this is an optional input:

- Records imported from Airtable already have an ID — it is preserved.
- Records created manually leave the field blank initially — it can be filled in later if the record is ever linked to an Airtable counterpart.
- When sync runs, records with a populated `airtableRecordId` update their Airtable counterpart; records without one create a new Airtable record and receive the ID on first sync.

This means the CRUD admin and the Airtable import can coexist without conflict.

### Event-first association

Organisations and Volunteers must be associated with an event. The P2I admin selects a current event (stored in `sessionStorage` as `administeringEventId`) before managing its organisations and volunteers. This scopes all CRUD pages to a single event at a time.

The link between events and organisations uses `organisations.airtableEventId = events.airtableRecordId`. For manually-created events that have no Airtable ID, `createEvent()` self-populates `airtableRecordId` with the event's own UUID as a fallback. This ensures the link works without a schema change.

### Two-table organisation record

An organisation record spans two tables:

- `organisations` — name, groupType, openGroup, imageUrl, airtableRecordId, airtableEventId
- `organisationContacts` — contact name, email, phone, notes

They are joined via `organisationContacts.organisationId = organisations.airtableRecordId`. Create, update, and delete operations must write to both tables. If `airtableRecordId` changes on update, `organisationContacts.organisationId` is updated to match.

### Open/closed group flag

Each organisation carries an `openGroup: boolean` field (default `true`) that controls its visibility in the registration form dropdowns. This is an admin-only concept — end users see only the organisations relevant to their role. See `docs/superpowers/specs/2026-03-24-organisation-open-closed-design.md` for the full filtering spec.

### No server-side auth

The P2I admin section has no server-side session. Access is controlled by `sessionStorage`:
- `adminAuth === "true"` and `adminLevel === "p2i"` grants access to P2I pages
- `administeringEventId` stores the currently selected event

All CRUD pages check these values in a `useEffect` and redirect unauthenticated users to `/admin`.

## Architecture

All database mutations follow the existing layered pattern:

```
Admin page (client component)
  → Server Action (lib/actions.ts, "use server")
    → DatabaseService static method (lib/db-service.ts)
      → Drizzle ORM + Neon Postgres
```

Forms use React Hook Form + Zod schemas (`lib/validation.ts`). Create and edit dialogs use Shadcn `<Dialog>`. Delete uses `window.confirm`.

## Affected Files

| File | Change |
|---|---|
| `lib/db/schema.ts` | Add `openGroup` boolean column to `organisations` table |
| `lib/types.ts` | Add `openGroup: boolean` to `Organization` interface |
| `lib/helpers.ts` | Replace `groupType`-based filtering with `openGroup` in `organizationsToOptions()` |
| `lib/db-service.ts` | Add updateEvent, deleteEvent, updateOrganization, deleteOrganization, updateVolunteer, deleteVolunteer; fix createEvent UUID fallback; add openGroup to createOrganization and findOrCreateFamilyGroup |
| `lib/actions.ts` | Add server action wrappers for all new DB methods |
| `lib/validation.ts` | Add adminEventFormSchema, adminOrgFormSchema (with openGroup), adminVolunteerFormSchema |
| `app/admin/p2i/manage-events/page.tsx` | Add Edit dialog and Delete button |
| `app/admin/p2i/organisations/page.tsx` | New page — full CRUD for organisations |
| `app/admin/p2i/volunteers/page.tsx` | New page — full CRUD for volunteers |
| `app/admin/p2i/page.tsx` | Add nav buttons for the two new pages |
