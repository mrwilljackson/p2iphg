# Power2Inspire Event CRM — Project Overview

**Last Updated:** 2026-04-16

---

## What Is This?

The Power2Inspire Event CRM is a web application for managing Powerhouse Games event registrations. It handles everything from importing event data before the day, collecting registrations at the venue, and exporting the results afterwards.

The system is purpose-built for Power2Inspire charity events and runs on tablets, laptops, or phones via a web browser.

---

## What Does It Do?

- **Import event data** from Airtable before each event — organisations, volunteers, and event details
- **Collect registrations** on event day for participants, volunteers, and group leaders
- **Track participant counts** by organisation and group type, in real-time
- **Generate event summaries** with headcounts, consent statistics, and organisation breakdowns
- **Export registration data** as a CSV file for manual import into Airtable

---

## How Does It Work?

The system operates in three phases:

### Before the Event

A P2I administrator imports event details, organisations, and volunteers from Airtable into the system. They review the imported data and set the event as "Active" to open registration.

### On Event Day

Attendees visit the registration page on tablets or laptops set up at the venue. The form guides them based on their role:

- **Participants** enter their name, email, organisation, and consent preferences. This takes about a minute across two steps.
- **Volunteers** enter their email address and the system finds their details automatically. A quick single-step process.
- **Group Leaders** (teachers, parents, or community leaders) enter their details, select their organisation, and provide group size information across three steps.

Event administrators can monitor registrations in real-time and see participant counts broken down by organisation.

### After the Event

The administrator marks the event as complete, generates a summary with all the final numbers, and exports the registration data as a CSV file. This CSV is then imported into Airtable manually.

---

## Who Uses It?

### P2I Administrators
Manage events, organisations, and volunteers. Handle data import from Airtable and export after events. Generate event summaries and archive completed events.

### Event Administrators
Monitor registrations during the event. View real-time participant counts. Can manually register organisations and volunteers if needed.

### Attendees
Register on event day via the public registration form on tablets or laptops at the venue.

---

## Current Status

The system is fully built and in active use. Recent additions include:

- Event summary generation with detailed breakdowns
- Inline help tooltips throughout the admin interface
- Improved organisation and volunteer management
- CSV data export for Airtable import
- Automatic detection of group leaders registering as individual participants
- Smart dropdown filtering to prevent duplicate registrations
