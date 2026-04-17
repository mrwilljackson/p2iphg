# Data Export Guide

**Last Updated:** 2026-04-16

---

## How to Export Registration Data

1. Log in as a P2I administrator (PIN: 9876)
2. Navigate to the P2I dashboard — you'll see the event options page
3. Find the **System Integration** panel
4. Click **"Export to CSV"**
5. A file downloads automatically, named something like `EventName-registrations-2026-04-16.csv`

---

## What's in the CSV

The exported file contains one row per registration with these columns:

| Column | Description |
|---|---|
| Attendee Name | First name |
| Attendee Surname | Last name |
| Email | Email address |
| Organisation Name | Which organisation the person registered with |
| Role | Participant, Volunteer, or Group |
| Impairment | Whether the person has an impairment |
| Photo Consent | Yes or No |
| Feedback Consent | Yes or No |
| Next Event Consent | Yes or No |
| Group Size | Number of participants in the group (Group role only) |
| Disabled Students | Number of disabled students (Group role only) |
| SEN Students | Number of SEN students (Group role only) |
| Group Leader Participating | Whether the leader is personally participating (Group role only) |

The file also includes technical fields (ID, Event ID, sync status, timestamps) which can be ignored for most purposes.

---

## Importing to Airtable

After downloading the CSV:

1. Open Airtable and navigate to the **Registrations** table
2. Use Airtable's **CSV import** feature to upload the file
3. Map the CSV columns to the appropriate Airtable fields
4. Review the imported data to confirm everything looks correct

**Note:** Consent and participation fields are formatted as "Yes" or "No" for readability. Dates use ISO 8601 format (e.g. 2026-04-16).
