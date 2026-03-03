# Airtable Import Files

This folder contains CSV files for importing sample data into your Airtable base.

## Files

1. **events-table.csv** - Sample events data
2. **organizations-table.csv** - Sample organizations data
3. **volunteers-table.csv** - Sample volunteers data
4. **registrations-table.csv** - Sample registrations data

## How to Use

1. Create your Airtable base following the **AIRTABLE_SETUP_GUIDE.md**
2. For each table, use the "Import data" feature in Airtable
3. Upload the corresponding CSV file
4. Map the CSV columns to your Airtable fields
5. Click "Import"

## Important Notes

- These are **sample data** files to help you set up the structure
- Replace with your actual event data before going live
- Ensure all linked fields (Event, Organization) are properly connected after import
- The CSV files use TRUE/FALSE for checkbox fields

## Field Mapping

When importing, ensure these columns map correctly:

### Events Table
- Event Name → Event Name
- Event Date → Event Date
- Location → Location
- Description → Description
- Status → Status

### Organizations Table
- Organization Name → Organization Name
- Event → Event (Link to Events table)
- Group Type → Group Type
- Expected Group Size → Expected Group Size
- Contact First Name → Contact First Name
- Contact Last Name → Contact Last Name
- Contact Email → Contact Email
- Contact Phone → Contact Phone
- Notes → Notes

### Volunteers Table
- Event → Event (Link to Events table)
- Email → Email
- First Name → First Name
- Last Name → Last Name
- Photo Consent → Photo Consent
- Feedback Consent → Feedback Consent
- Next Event Consent → Next Event Consent

### Registrations Table
- Event → Event (Link to Events table)
- First Name → First Name
- Last Name → Last Name
- Email → Email
- Organization → Organization (Link to Organizations table)
- Impairment → Impairment
- Role → Role
- Photo Consent → Photo Consent
- Feedback Consent → Feedback Consent
- Next Event Consent → Next Event Consent
- Group Size → Group Size
- Disabled Students → Disabled Students
- SEN Students → SEN Students
- Leader Participating → Leader Participating
- Sync Status → Sync Status

## After Import

1. Verify all records imported correctly
2. Check that linked records (Event, Organization) are properly connected
3. Review checkbox fields to ensure TRUE/FALSE values converted correctly
4. Delete sample data and add your real data
5. Test the sync with your NextJS application

## Need Help?

See the **AIRTABLE_SETUP_GUIDE.md** for detailed setup instructions.

