# P2I Admin CRUD Design

**Date:** 2026-03-24
**Status:** Approved
**Implementation plan:** `docs/superpowers/plans/2026-03-23-p2i-crud-admin.md`

## Summary

The P2I admin section provides full Create/Read/Update/Delete management of Events, Organisations, and Volunteers. The Registrations table is excluded — registrations are created by attendees via the public registration form and are not managed here.

## Context

The previous data entry process required importing Events, Organisations, and Volunteers from Airtable via a bulk import page. This was fragile and difficult to manage. Direct CRUD admin pages give the client a simpler, more reliable way to manage records. The Airtable import page is not removed — it remains available as an alternative — but the CRUD pages become the primary workflow.

## How It Works

The P2I admin must first select an event to administer (via the Manage Events page). All subsequent Organisations and Volunteers pages are scoped to that selected event.

---

## Events

**Page:** `/admin/p2i/manage-events`

The admin can view a table of all events in the system.

### Create
Fields:
- **Event name** (required)
- **Date** (required)
- **Location** (optional)
- **Description** (optional)
- **Airtable Record ID** (optional — enter if this event already exists in Airtable to preserve the sync link)

### Edit
All fields above are editable after creation.

### Delete
An event can be deleted only if it has no registrations and no volunteers. If either exist, deletion is blocked with an error message.

---

## Organisations

**Page:** `/admin/p2i/organisations`

The admin can view a table of all organisations linked to the currently selected event.

### Create
Fields:
- **Organisation name** (required)
- **Open group** (required, checkbox — controls visibility in the registration form; see [open/closed spec](./2026-03-24-organisation-open-closed-design.md))
- **Group type** (required — Family, Disability, Corporate, Sporting, Community, Educational, Other; retained for Airtable sync compatibility)
- **Contact first name** (optional)
- **Contact last name** (optional)
- **Contact email** (optional)
- **Contact phone** (optional)
- **Notes** (optional)
- **Airtable Record ID** (optional — enter if this organisation already exists in Airtable)

### Edit
All fields above are editable after creation.

### Delete
An organisation can be deleted only if it has no registrations. If registrations exist against it, deletion is blocked with an error message.

### Notes
Each organisation record also stores a linked contact record internally. Create, edit, and delete operations update both records together — this is transparent to the admin.

---

## Volunteers

**Page:** `/admin/p2i/volunteers`

The admin can view a table of all volunteers linked to the currently selected event. Volunteers are identified at registration by email lookup — a volunteer record must exist before the event for this to work.

### Create
Fields:
- **First name** (required)
- **Last name** (required)
- **Email** (required — this is the lookup key used at registration)
- **Photo consent** (required, checkbox, defaults to yes)
- **Feedback consent** (required, checkbox, defaults to no)
- **Next event consent** (required, checkbox, defaults to no)
- **Airtable Record ID** (optional — enter if this volunteer already exists in Airtable)

### Edit
All fields above are editable after creation.

### Delete
Volunteer records can be deleted at any time. Deleting a volunteer who has already registered does not remove their registration record.

---

## Airtable Record ID

Every entity has an optional Airtable Record ID field. This is the mechanism that preserves the link to Airtable when syncing registrations back after an event:

- If an admin enters an Airtable Record ID when creating or editing a record, that record will update its Airtable counterpart when sync runs.
- If left blank, the record is treated as new by the sync and a new Airtable record is created on first sync.
- Records imported via the Airtable import page already carry their ID — it is preserved automatically.

## Out of Scope

- **Registrations** — created by attendees via the public `/registration` form; not managed in the admin
- **Registration form UI** — no changes to the public-facing form beyond organisation filtering (covered in the open/closed spec)
- **Airtable import page** — not removed; remains available alongside these CRUD pages
