# Event Setup Guide

This guide walks you through setting up and running an event using the Power2Inspire registration system — from importing data before the event through to exporting results afterwards. No technical knowledge is required.

---

## Before the Event

### Step 1 — Log in as P2I Admin

Go to the admin page and enter the P2I admin PIN: **9876**. You will land on the Manage Events page, which is your starting point for all pre-event setup.

### Step 2 — Import from Airtable

Click **Airtable Import** in the navigation bar. Run the imports in this order:

1. **Import Events** — pulls the latest list of events from Airtable
2. **Import Organisations** — pulls all organisations and group contacts
3. **Import Volunteers** — pulls the list of helpers and staff

Each import shows a confirmation once complete. Always run all three before an event to make sure the system has the latest data. If your event details have changed in Airtable since the last import, re-running the import will update them.

### Step 3 — Review Your Data

Before opening registration, take a few minutes to check what has been imported:

- Go to **Manage Organisations** to confirm that all expected organisations are listed and their details look correct.
- Go to **Manage Helpers** to verify that your volunteers are present and their contact details are accurate.

If anything is missing or incorrect, update the records in Airtable first, then re-run the relevant import.

### Step 4 — Set the Event as Active

On the **Manage Events** page, find your event in the list and click **Set as Active**. This opens the public registration form to attendees. Only one event can be active at a time — setting a new event as active will automatically deactivate any previously active event.

Once your event is active, the registration page is live and ready for use.

---

## On Event Day

### Step 5 — Registration Setup

Set up tablets or laptops at the venue, each with the registration page open. Attendees fill in the form themselves — no staff input is required. We recommend at least one device per registration station, with a staff member nearby to help anyone who needs assistance.

### Step 6 — Three Registration Paths

When an attendee opens the registration form, they choose one of three paths:

**Participant**
For individual attendees taking part in the event. They enter their name and email address, choose their organisation from a list, answer a question about impairment, and tick the consent checkboxes. The form takes roughly one minute and is split into two steps.

**Volunteer**
For helpers and staff supporting the event. They enter their email address and the system automatically finds their details from the pre-loaded volunteer list. They only need to confirm consent — this is a single quick step.

**Group Leader**
For teachers, parents, community group leaders, or anyone registering on behalf of a group. They enter their name, select their organisation, and provide details about their group — including how many people are in it and whether the leader themselves is participating. This is a more detailed form split into three steps.

### Step 7 — Monitor Registrations

Event admins can log in during the event using the event admin PIN: **1234**. From the event admin dashboard, you can:

- See all registrations in real time as they come in
- Check participant counts per organisation
- View a breakdown by registration type (participants, volunteers, group leaders)

This lets you keep an eye on attendance and address any issues as they arise.

---

## After the Event

### Step 8 — Mark as Completed

Once the event is over, go to the **Manage Events** page and mark the event as **Completed**. This closes the public registration form so no further registrations can be submitted.

### Step 9 — Generate Event Summary

On the Manage Events page, click **Generate Summary** next to the completed event. You will see a preview of all the key numbers, including:

- Total participants, volunteers, and group leaders
- Group sizes and organisation breakdown
- Consent response rates (photo, feedback, next event)

Review the numbers, enter the event sequence number and any relevant admin notes, then click **Confirm** to save the summary.

### Step 10 — Export Data

From the P2I dashboard, click **Export to CSV** to download all registration data for the event. The file is automatically named with the event name and date, making it easy to identify. This file contains all the information you need for reporting and Airtable upload.

### Step 11 — Import to Airtable

Open the downloaded CSV file and import it into Airtable manually using Airtable's standard import tool. Match the columns as prompted and confirm the import to update your Airtable records with the event's registration data.

---

## Tips and Good to Know

- **No duplicate group leaders** — The system automatically removes an organisation from the Group Leader dropdown once a group leader has already registered for it on the day. You won't end up with two group leaders for the same organisation.
- **No duplicate volunteers** — Volunteers who have already registered are removed from the system's volunteer list so they cannot register twice.
- **Wrong registration type** — If a group leader accidentally starts registering as a participant, the system detects this automatically when they enter their email and prompts them to switch to the correct path.
- **Preparation is key** — The Airtable import only takes a few minutes, but leaving it to the last moment risks bringing in stale data. Run the import the evening before or early on the morning of the event.
