# Event Setup Guide

**Version:** 1.1
**Date:** 2026-03-13
**Purpose:** Step-by-step instructions for setting up a new PowerHouseGames event in the system

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

1. **Navigate to P2I Admin Dashboard**
   - URL: `/admin/p2i`
   - Enter P2I Admin PIN: `9876`

2. **Create New Event**
   - In the **Data Management** section, click **"➕ Create New Event"**
   - Fill in the required fields:
     - **Event Name*** (required): e.g., "Manchester Arena 2026"
     - **Event Date*** (required): Select the event date
     - **Location** (optional): e.g., "Manchester Arena"
     - **Description** (optional): Brief description of the event
   - Click **"Create Event"**

3. **Event Status**
   - New events are created with status `'planned'` (blue badge)
   - The event will NOT be visible to the public yet
   - Only P2I Admin can see and manage planned events

---

### Step 2: Add Pre-Registered Organizations

Organizations must be added to the system BEFORE the event so they appear in the registration form dropdown.

#### 2.1 Navigate to Organization Management
- From P2I Admin Dashboard, click **"🏢 Manage Organizations"** (when implemented)
- OR use the database seed script for bulk import
- OR manually add via database

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
- From P2I Admin Dashboard, click **"👥 Manage Volunteers"** (when implemented)
- OR use Event Admin Dashboard → **"Register Volunteer"**

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
   - From P2I Admin Dashboard, click **"📅 Manage Events"**

2. **Set as Current Event**
   - Find your event in the list (sorted by date, most recent first)
   - Click **"Set as Current Event"** button
   - Confirm the action

3. **Event Status Changes**
   - Your event status changes from `'planned'` → `'active'` (green badge)
   - All other events automatically change to `'completed'` (gray badge)
   - ⚠️ **Business Rule:** Only ONE event can be active at a time
   - Events that have had their data cleared will show as `'archived'` (see Step 8)

4. **Public Access**
   - The event is now visible on the public registration form
   - Event Admin Dashboard (PIN: 1234) can now access this event
   - Participants can register through `/registration`

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
7. After Event: Change status to 'completed'
   ↓
8. Sync registrations to Airtable
   ↓
9. Clear Event Data → status changes to 'archived'
```

---

## Registration Form Behavior

Once the event is active, the public registration form will:

### For Participants (Individual)
- Show the active event name (read-only)
- Organisation dropdown shows **non-Disability/Family** organisations only (Corporate, Sporting, Community, Educational, Other) plus the **"Family Group"** placeholder option
- Organisation selection is **required** (validated by Zod `superRefine`)
- Require: Name, Surname, Email, Organisation, Impairment details
- Optional: Photo consent, Feedback consent, Next event consent

### For Groups
- Organisation dropdown shows **only Disability and Family** organisations
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

## Step 8: Clear Event Data (Post-Event Housekeeping)

After the event is complete and registrations have been **synced to Airtable**, you can clear local data to keep the database tidy.

1. **Navigate to P2I Admin Dashboard** → Select the completed event
2. Click **"🗑️ Clear Event Data"**
3. The system shows a count of records that will be deleted
4. **Safety check:** If there are unsynced registrations (status `'pending'` or `'failed'`), the clear is blocked unless you tick the **"Force clear"** checkbox
5. Confirm the action

**What gets deleted (in FK-safe order):**
1. All **registrations** for the event
2. All **volunteers** for the event
3. All **organisation contacts** linked via the event's Airtable ID
4. All **organisations** linked through those contacts

**After clearing:**
- The event status changes to **`'archived'`**
- The event record itself is preserved (name, date, location remain)
- The event will not appear in the public registration form
- Archived events are shown with a distinct badge in P2I Admin

⚠️ **This action is irreversible.** Always sync to Airtable first.

---

## Next Steps

After event setup is complete:
1. Test the registration form with sample data
2. Share registration URL with participants
3. Monitor registrations through Event Admin Dashboard
4. Export data to CSV when needed
5. After event: Change status to 'completed'
6. Sync registrations to Airtable
7. Clear event data (optional) → status becomes 'archived'

---

## Related Documentation

- [Data Models](./DATA_MODELS.md) - Database schema and entity definitions
- [Participant Counting Logic](./PARTICIPANT_COUNTING_LOGIC.md) - How counts are calculated
- [UI Wireframes](./UI_WIREFRAMES.md) - User interface designs
- [Registration Form Fields](./REGISTRATION_FORM_FIELDS.md) - Form field specifications

