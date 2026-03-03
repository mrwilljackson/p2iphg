# Airtable Setup Guide for PowerHouseGames

**Version:** 1.0  
**Date:** 2026-03-03  
**Purpose:** Step-by-step guide to set up the Airtable base for PowerHouseGames event management

---

## Prerequisites

- Airtable account (Free or paid plan)
- Access to the PowerHouseGames workspace
- CSV import files from `documentation/airtable-import/` folder

---

## Step 1: Create a New Base

1. Log in to Airtable
2. Click **"Add a base"** or **"Create a base"**
3. Choose **"Start from scratch"**
4. Name the base: **"PowerHouseGames Event Management"**
5. Choose a color/icon for easy identification

---

## Step 2: Create Tables

You'll create 4 tables. For each table:

### Table 1: Events

1. Rename the default table to **"Events"**
2. Delete all default fields except the first one
3. Create the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Event Name | Single line text | - |
| Event Date | Date | Format: ISO (YYYY-MM-DD), Include time: No |
| Location | Single line text | - |
| Description | Long text | Enable rich text formatting |
| Status | Single select | Options: planned, active, completed |

4. Import sample data from `events-table.csv`:
   - Click **"..."** menu → **"Import data"** → **"CSV file"**
   - Upload `events-table.csv`
   - Map columns to fields
   - Click **"Import"**

### Table 2: Organizations

1. Click **"+"** to add a new table
2. Name it **"Organizations"**
3. Create the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Organization Name | Single line text | - |
| Event | Link to another record | Link to: Events table, Allow linking to multiple records: No |
| Group Type | Single select | Options: Family, Disability, Corporate, Sporting, Community, Educational, Other |
| Expected Group Size | Number | Format: Integer, Allow negative: No |
| Image URL | URL | - |
| Contact First Name | Single line text | - |
| Contact Last Name | Single line text | - |
| Contact Email | Email | - |
| Contact Phone | Phone number | - |
| Notes | Long text | Enable rich text formatting |

4. Import sample data from `organizations-table.csv`

### Table 3: Volunteers

1. Click **"+"** to add a new table
2. Name it **"Volunteers"**
3. Create the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Event | Link to another record | Link to: Events table, Allow linking to multiple records: No |
| Email | Email | - |
| First Name | Single line text | - |
| Last Name | Single line text | - |
| Photo Consent | Checkbox | - |
| Feedback Consent | Checkbox | - |
| Next Event Consent | Checkbox | - |

4. Import sample data from `volunteers-table.csv`

### Table 4: Registrations

1. Click **"+"** to add a new table
2. Name it **"Registrations"**
3. Create the following fields:

| Field Name | Field Type | Configuration |
|------------|------------|---------------|
| Event | Link to another record | Link to: Events table, Allow linking to multiple records: No |
| First Name | Single line text | - |
| Last Name | Single line text | - |
| Email | Email | - |
| Organization | Link to another record | Link to: Organizations table, Allow linking to multiple records: No |
| Impairment | Single select | Options: Yes, No, Rather not say |
| Role | Single select | Options: Participant, Volunteer, Group |
| Photo Consent | Checkbox | - |
| Feedback Consent | Checkbox | - |
| Next Event Consent | Checkbox | - |
| Group Size | Number | Format: Integer, Allow negative: No |
| Disabled Students | Number | Format: Integer, Allow negative: No |
| SEN Students | Number | Format: Integer, Allow negative: No |
| Leader Participating | Checkbox | - |
| Check-in Time | Date | Format: ISO, Include time: Yes |
| Check-out Time | Date | Format: ISO, Include time: Yes |
| Sync Status | Single select | Options: pending, synced, failed |

4. Import sample data from `registrations-table.csv`

---

## Step 3: Configure Views

### Events Table Views

**View 1: All Events**
- Default grid view showing all events
- Sort by: Event Date (descending)

**View 2: Active Event**
- Filter: Status = "active"
- This should only show one event at a time

**View 3: Upcoming Events**
- Filter: Status = "planned"
- Sort by: Event Date (ascending)

### Organizations Table Views

**View 1: All Organizations**
- Default grid view
- Group by: Event

**View 2: By Group Type**
- Group by: Group Type
- Sort by: Organization Name

**View 3: Current Event Organizations**
- Filter: Event → Status = "active"
- Shows only organizations for the current active event

### Volunteers Table Views

**View 1: All Volunteers**
- Default grid view
- Group by: Event

**View 2: Current Event Volunteers**
- Filter: Event → Status = "active"
- Shows only volunteers for the current active event

### Registrations Table Views

**View 1: All Registrations**
- Default grid view
- Sort by: Created time (descending)

**View 2: By Role**
- Group by: Role
- Shows registrations grouped by Participant/Volunteer/Group

**View 3: Pending Sync**
- Filter: Sync Status = "pending"
- Shows registrations that haven't been synced yet

**View 4: Current Event Registrations**
- Filter: Event → Status = "active"
- Shows only registrations for the current active event

---

## Step 4: Set Up API Access

1. Go to your Airtable account settings
2. Navigate to **"Developer hub"** → **"Personal access tokens"**
3. Click **"Create new token"**
4. Name it: **"PowerHouseGames NextJS App"**
5. Set scopes:
   - `data.records:read` - Read records
   - `data.records:write` - Create/update records
   - `schema.bases:read` - Read base schema
6. Select the PowerHouseGames base
7. Click **"Create token"**
8. **IMPORTANT:** Copy the token immediately and store it securely
9. Add the token to your NextJS app's `.env.local` file:
   ```
   AIRTABLE_API_KEY=your_token_here
   AIRTABLE_BASE_ID=your_base_id_here
   ```

---

## Step 5: Get Base and Table IDs

### Get Base ID:
1. Open your Airtable base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. The Base ID is the part starting with `app` (e.g., `appXXXXXXXXXXXXXX`)

### Get Table IDs:
1. Click on a table
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/tblYYYYYYYYYYYYYY/...`
3. The Table ID is the part starting with `tbl` (e.g., `tblYYYYYYYYYYYYYY`)

Record these IDs:
- Events Table ID: `tbl_______________`
- Organizations Table ID: `tbl_______________`
- Volunteers Table ID: `tbl_______________`
- Registrations Table ID: `tbl_______________`

---

## Step 6: Test the Setup

1. Add a test event to the Events table
2. Add a test organization linked to that event
3. Add a test volunteer linked to that event
4. Verify all links are working correctly
5. Test filtering views to ensure they show correct data

---

## Step 7: Configure Automations (Optional)

You can set up Airtable automations for:

1. **Email notifications** when new registrations are synced
2. **Slack notifications** for event status changes
3. **Automatic status updates** (e.g., mark event as completed after event date)

---

## Next Steps

1. ✅ Base structure created
2. ✅ Sample data imported
3. ✅ Views configured
4. ✅ API access set up
5. 🔄 Configure NextJS app to sync with Airtable
6. 🔄 Test sync process with real data
7. 🔄 Train staff on using Airtable

---

## Troubleshooting

### Issue: CSV import fails
**Solution:** Ensure CSV files are UTF-8 encoded and column names match exactly

### Issue: Links between tables not working
**Solution:** Ensure you're using "Link to another record" field type, not text

### Issue: API authentication fails
**Solution:** Verify token has correct scopes and base access

### Issue: Can't find Base ID or Table ID
**Solution:** Check the URL when viewing the base/table in your browser

---

## Support

For questions or issues:
- Check Airtable documentation: https://support.airtable.com
- Contact PowerHouseGames technical team
- Review the AIRTABLE_BASE_STRUCTURE.md file for detailed field specifications

