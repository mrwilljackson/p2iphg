# Event Setup Guide

**Version:** 1.3
**Date:** 2026-04-29
**Purpose:** Step-by-step instructions for setting up a new PowerHouseGames event in the system

> ⚠️ **Deprecation note (2026-04-29):** Step 7 below previously instructed admins to "Sync to Airtable" via the in-app button. **That button and the underlying `syncRegistrationsToAirtable()` function are deprecated.** The supported post-event workflow is now CSV export only — download the CSV from the P2I Admin Dashboard and import it into Airtable manually. The sync-status fields (`pending` / `synced` / `failed`) on registrations remain in the schema but should be ignored. See `AIRTABLE_INTEGRATION.md` for full detail.

---

## Overview

Before participants can register for an event through the public registration pages, you must set up the event in the system with all necessary pre-registration data. This guide walks you through the complete setup process.

---

## Prerequisites

- Access to P2I Admin Dashboard (PIN: 9876)
- Event details (name, date, location)
- List of pre-registered organizations from Airtable
- List of pre-registered volunteers from Airtable

---

## Setup Process

### Step 1: Create the Event

1. **Log in to P2I Admin**
   - URL: `/admin/p2i`
   - Enter P2I Admin PIN: `9876`
   - After login, you are redirected to **Manage Events** page (`/admin/p2i/manage-events`)

2. **Navigation**
   - The **P2iAdminNav** component at the top provides access to all P2I admin sections:
     - **Manage Events** - Create events and set the current active event
     - **Manage Organisations** - Add and manage organizations
     - **Manage Helpers** - Add and manage volunteers
     - **Logout** - Exit P2I Admin

3. **Create New Event**
   - On the **Manage Events** page, click **"➕ Create New Event"**
   - Fill in the required fields:
     - **Event Name*** (required): e.g., "Manchester Arena 2026"
     - **Event Date*** (required): Select the event date
     - **Location** (optional): e.g., "Manchester Arena"
   - Click **"Create Event"**

3. **Event Status**
   - New events are created with status `'planned'` (blue badge)
   - The event will NOT be visible to the public yet
   - Only P2I Admin can see and manage planned events

---

### Step 2: Add Pre-Registered Organizations

Organizations must be added to the system BEFORE the event so they appear in the registration form dropdown.

#### 2.1 Navigate to Organization Management
- From any P2I Admin page, use the **P2iAdminNav** component at the top
- Click **"Manage Organisations"**
- Or use the database seed script for bulk import
- Or manually add via database

#### 2.2 Required Organization Data

For each organization, you need:

**Required Fields:**
- **Event ID**: Link to the event you created
- **Organization Name**: Full name of the organization (2-200 characters)
- **Airtable Record ID**: The organization's record ID from Airtable (e.g., "recORG123")
  - ⚠️ **IMPORTANT:** Organizations WITH `airtable_record_id` are counted as "expected" groups
  - Organizations WITHOUT `airtable_record_id` are "walk-in" groups

**Optional but Recommended Fields:**
- **Group Type**: Classification for reporting
  - `Family` - Family groups
  - `Disability` - Disability organizations
  - `Corporate` - Corporate groups
  - `Sporting` - Sports clubs/teams
  - `Community` - Community organizations
  - `Educational` - Schools/universities
  - `Other` - Default if not specified
- **Expected Group Size**: Number of participants expected (for planning)
  - Used for future events to show expected participant counts
  - Ignored once the organization completes registration
- **Contact Information**:
  - Contact First Name
  - Contact Last Name
  - Contact Email
  - Contact Phone
- **Image URL**: Logo or image for the organization
- **Notes**: Additional information

#### 2.3 Example Organization Entry

```json
{
  "eventId": "evt_abc123",
  "name": "Cambridge University Boat Club",
  "groupType": "Sporting",
  "expectedGroupSize": 25,
  "contactFirstName": "James",
  "contactLastName": "Mitchell",
  "contactEmail": "james.mitchell@cubc.org.uk",
  "contactPhone": "+44 1223 338400",
  "notes": "University rowing club",
  "airtableRecordId": "recCAM_CUBC"
}
```

---

### Step 3: Add Pre-Registered Volunteers

Volunteers must be added to the system BEFORE the event so they can register through the public form.

#### 3.1 Navigate to Volunteer Registration
- From any P2I Admin page, use the **P2iAdminNav** component at the top
- Click **"Manage Helpers"**
- Or use Event Admin Dashboard → **"Register Volunteer"**

#### 3.2 Required Volunteer Data

For each volunteer, you need:

**Required Fields:**
- **Event ID**: Link to the event you created
- **Email**: Volunteer's email address (must be unique per event)
- **First Name**: Volunteer's first name
- **Last Name**: Volunteer's last name
- **Airtable Record ID**: The volunteer's record ID from Airtable (e.g., "recVOL123")

**Optional Fields:**
- **Photo Consent**: Whether volunteer consents to photos (default: false)
- **Feedback Consent**: Whether volunteer consents to feedback surveys (default: false)
- **Next Event Consent**: Whether volunteer wants info about next event (default: false)

#### 3.3 Example Volunteer Entry

```json
{
  "eventId": "evt_abc123",
  "email": "alex.taylor@volunteer.com",
  "firstName": "Alex",
  "lastName": "Taylor",
  "photoConsent": true,
  "feedbackConsent": true,
  "nextEventConsent": true,
  "airtableRecordId": "recVOL_ALEX"
}
```

---

### Step 4: Set Event as Active

Once all organizations and volunteers are added, make the event active so the public can register.

1. **Navigate to Manage Events**
   - From the P2iAdminNav component, click **"Manage Events"**

2. **Set as Current Event**
   - Find your event in the list (sorted by date, most recent first)
   - Click **"Set as Current Event"** button
   - Confirm the action

3. **Event Status Changes**
   - Your event status changes from `'planned'` → `'active'` (green badge)
   - All other events automatically change to `'completed'` (gray badge)
   - ⚠️ **Business Rule:** Only ONE event can be active at a time
   - Events that have had their data cleared will show as `'archived'` (see Post-Event Workflow)

4. **Public Access**
   - The event is now visible on the public registration form
   - Event Admin Dashboard (PIN: 1234) can now access this event
   - Participants can register through `/registration`

---

## Event Lifecycle

Events progress through four stages:

1. **`planned`** (blue badge)
   - New event, not yet active
   - Visible to P2I Admin only
   - Organizations and volunteers being set up

2. **`active`** (green badge)
   - Current event accepting public registrations
   - Event Admin Dashboard can manage registrations
   - Only ONE event can be active at a time

3. **`completed`** (gray badge)
   - Past event, no longer active
   - Registration is closed to the public
   - Event admin can still view registrations
   - Ready for event summary and data export

4. **`archived`** (dim badge)
   - Event data has been cleared from local database
   - Registrations, volunteers, and organizations deleted
   - Event record preserved for historical reference
   - Cannot be reactivated

---

## Data Flow Summary

```
1. Create Event (status: 'planned')
   ↓
2. Add Organizations (with airtable_record_id)
   ↓
3. Add Volunteers (with airtable_record_id)
   ↓
4. Set Event as Active (status: 'active')
   ↓
5. Public Registration Opens
   ↓
6. Registrations Collected
   ↓
7. After Event: Mark as Completed (status: 'completed')
   ↓
8. Generate Event Summary
   ↓
9. Event becomes Archived (status: 'archived')
   ↓
10. Sync registrations to Airtable
   ↓
11. Clear Event Data (optional)
```

---

## Registration Form Behavior

Once the event is active, the public registration form will:

### For Participants (Individual)
- Show the active event name (read-only)
- Organisation dropdown shows **open-group organisations only** (`openGroup !== false` on the contact row for the active event), plus the **"Family Group"** placeholder option
- Organisation selection is **required** (validated by Zod `superRefine`)
- Require: Name, Surname, Email, Organisation, Impairment details
- Optional: Photo consent, Feedback consent, Next event consent

### For Groups
- Organisation dropdown shows **all** organisations participating in the event (open-group orgs first, closed-group orgs at the bottom). Closed-group orgs disappear from the list once their leader has registered.
- Organisation selection is **required** (validated by Zod `superRefine`)
- No "Family Group" placeholder in Group role
- Require: Group leader details, Group size, Disabled students count, SEN students count
- Optional: Group leader participating checkbox

### For Volunteers
- Organisation field is hidden
- Check if email exists in pre-registered volunteers
- If YES: Allow registration with consent preferences
- If NO: Show error message (volunteer not pre-registered)

> **Note:** Switching role clears the selected organisation automatically, since the dropdown options differ between roles. See `documentation/REGISTRATION_FORM_LOGIC.md` for full field-by-field reference.

---

## Planning Features

### Expected Group Size
For future events (status: 'planned'), you can set `expectedGroupSize` on organizations to see projected participant counts:

- **P2I Admin Dashboard** will show:
  - **Participants**: 0 registered, (70 expected)
  - **Groups**: 0 registered, (3 expected)

- **Calculation**:
  - Sum of `expectedGroupSize` from all organizations with `airtable_record_id`
  - Family/Disability groups counted separately from Other groups
  - Once organization registers, actual `groupSize` replaces `expectedGroupSize`

---

## Important Notes

### Organization Classification
- **Pre-registered** (expected): Has `airtable_record_id`
- **Walk-in**: No `airtable_record_id` (registered on the day)

### Group Types
- **Family/Disability**: Expected = Registered (group-level count)
- **Other Groups**: Track expected vs registered separately

### Event Status
- **'planned'**: Future event, not yet active
- **'active'**: Current event, public can register
- **'completed'**: Past event, no longer active
- **'archived'**: Event data has been cleared (registrations, volunteers, organisations deleted)

### Data Validation
- Organization names: 2-200 characters
- Email addresses: Must be valid format
- Group size: Must be positive integer
- Only one event can be 'active' at a time

---

## Troubleshooting

### Organization not appearing in dropdown
- Check organization has correct `eventId`
- Check organization has `airtableRecordId` set
- Check event is 'active'
- Refresh the registration form page

### Volunteer cannot register
- Check volunteer email matches exactly
- Check volunteer has correct `eventId`
- Check volunteer has `airtableRecordId` set
- Check event is 'active'

### Expected counts not showing
- Check organizations have `airtableRecordId` set
- Check `expectedGroupSize` is set and > 0
- Check you're viewing the correct event in P2I Admin

---

---

## Post-Event Workflow

### Step 5: Mark Event as Completed

Once the event has finished and registration is closed:

1. **Navigate to Manage Events**
   - From the P2iAdminNav component, click **"Manage Events"**

2. **Change Status to Completed**
   - Find your event in the list
   - Click **"Mark as Completed"** button
   - Event status changes from `'active'` → `'completed'` (gray badge)
   - Public registration form no longer shows this event

3. **Event Admin Access**
   - Event Admin Dashboard can still view and manage registrations
   - Export registrations as CSV for records
   - Prepare event summary data

---

### Step 6: Generate Event Summary

After the event is completed, generate an event summary that captures participant statistics and consent preferences.

1. **Access Event Summary**
   - From the Event Admin Dashboard, click **"📊 Event Summary"**
   - A modal dialog opens showing:
     - **Participant Counts**: Total registrations by type (Participants, Volunteers, Group Leaders)
     - **Consent Statistics**: 
       - Photo consent acceptance rate
       - Feedback consent acceptance rate
       - Next event consent acceptance rate
     - **Group Breakdown** (if applicable):
       - Number of groups registered
       - Average group size
       - Disabled students total
       - SEN students total

2. **Complete Event Summary Form**
   - **Event Sequence Number** (required): Sequential number for this event (e.g., "2026-04-16-001")
     - Used for historical record-keeping and Airtable sync
   - **Admin Notes** (optional): Notes for future reference (e.g., "Smooth event, high volunteer turnout", "Weather delays on arrival")
   - Click **"Generate Summary"**

3. **Event Becomes Archived**
   - After summary generation, event status automatically changes to `'archived'`
   - Event record is locked and cannot be reactivated
   - Registrations are marked as synced and ready for Airtable export

---

### Step 7: Export and Sync Registrations

Export registrations and sync to Airtable before clearing data.

1. **Export Registrations as CSV**
   - From Event Admin Dashboard, click **"📥 Export Registrations"**
   - CSV file downloads with all registration data
   - Keep for local records and backup

2. **Sync to Airtable**
   - From P2I Admin Dashboard, select the completed event
   - Click **"🔄 Sync to Airtable"**
   - System batches registrations (10 at a time) with 250ms delays
   - Monitor sync status:
     - **pending** - Not yet synced
     - **synced** - Successfully exported to Airtable
     - **failed** - Sync attempt failed (manual review needed)

3. **Verify All Synced**
   - Check that all registrations show status `'synced'`
   - If any show `'failed'`, investigate and retry before clearing

---

### Step 8: Clear Event Data (Optional Housekeeping)

After the event is archived and registrations are synced to Airtable, you can optionally clear local data to keep the database tidy.

1. **Navigate to Manage Events**
   - From the P2iAdminNav component, click **"Manage Events"**

2. **Clear Event Data**
   - Find your archived event in the list
   - Click **"🗑️ Clear Event Data"**
   - The system shows a count of records that will be deleted
   - **Safety check:** If there are unsynced registrations (status `'pending'` or `'failed'`), the clear is blocked unless you tick the **"Force clear"** checkbox
   - Confirm the action

3. **What Gets Deleted (in FK-safe order)**
   - All **registrations** for the event
   - All **volunteers** for the event
   - All **organisation contacts** linked via the event's Airtable ID
   - All **organisations** linked through those contacts
   - Event summary record

4. **After Clearing**
   - The event record itself is preserved (name, date, location remain)
   - Event status remains `'archived'`
   - The event will not appear in any dropdowns or lists
   - Archived events with cleared data are shown with a dim badge in P2I Admin

⚠️ **This action is irreversible.** Always verify all registrations are synced to Airtable first.

---

## Quick Reference: Event Admin PIN

- **Event Admin PIN:** `1234`
- Grants access to Event Admin Dashboard when event is `'active'`
- Used to view, export, and manage registrations for the current event

---

## Related Documentation

- [Data Models](./DATA_MODELS.md) - Database schema and entity definitions
- [Participant Counting Logic](./PARTICIPANT_COUNTING_LOGIC.md) - How counts are calculated
- [UI Wireframes](./UI_WIREFRAMES.md) - User interface designs
- [Registration Form Fields](./REGISTRATION_FORM_FIELDS.md) - Form field specifications

