# Airtable Base Structure for PowerHouseGames Event Management

**Version:** 1.0  
**Date:** 2026-03-03  
**Purpose:** Define the Airtable base structure for syncing event data before and after PowerHouseGames events

---

## Overview

This Airtable base consists of **4 main tables** that sync with the NextJS application database:

1. **Events** - Event information (synced before event)
2. **Organizations** - Groups/organizations attending events (synced before event)
3. **Volunteers** - Pre-registered volunteers (synced before event)
4. **Registrations** - Attendee registrations collected during event (synced after event)

---

## Table 1: Events

**Purpose:** Store event information that gets synced to the app before each event.

### Fields

| Field Name | Field Type | Options/Format | Required | Description |
|------------|------------|----------------|----------|-------------|
| Record ID | Auto Number | - | Auto | Airtable's unique record ID |
| Event Name | Single line text | - | ✅ Yes | Name of the event (e.g., "PowerHouseGames Cambridge 2025") |
| Event Date | Date | ISO 8601 format | ✅ Yes | Date of the event (YYYY-MM-DD) |
| Location | Single line text | - | No | Venue name and address |
| Description | Long text | - | No | Event description and details |
| Status | Single select | planned, active, completed | ✅ Yes | Event status (only one can be 'active' at a time) |
| Created At | Created time | - | Auto | When record was created |
| Modified At | Last modified time | - | Auto | When record was last updated |

### Status Options
- **planned** - Future events that are not yet active
- **active** - The current active event (only one at a time)
- **completed** - Past events that have finished

---

## Table 2: Organizations

**Purpose:** Store organization/group information that gets synced to the app before each event.

### Fields

| Field Name | Field Type | Options/Format | Required | Description |
|------------|------------|----------------|----------|-------------|
| Record ID | Auto Number | - | Auto | Airtable's unique record ID |
| Event | Link to Events | Link to Events table | ✅ Yes | Which event this organization is attending |
| Organization Name | Single line text | - | ✅ Yes | Name of the organization/group |
| Group Type | Single select | See options below | ✅ Yes | Type of organization |
| Expected Group Size | Number | Integer | No | Expected number of participants (for planning) |
| Image URL | URL | - | No | Logo or image URL for the organization |
| Contact First Name | Single line text | - | No | Primary contact's first name |
| Contact Last Name | Single line text | - | No | Primary contact's last name |
| Contact Email | Email | - | No | Primary contact's email address |
| Contact Phone | Phone | - | No | Primary contact's phone number |
| Notes | Long text | - | No | Additional notes about the organization |
| Created At | Created time | - | Auto | When record was created |
| Modified At | Last modified time | - | Auto | When record was last updated |

### Group Type Options
- **Family** - Family groups
- **Disability** - Disability organizations/schools
- **Corporate** - Corporate groups
- **Sporting** - Sports clubs/teams
- **Community** - Community organizations
- **Educational** - Schools and educational institutions
- **Other** - Other types of organizations

---

## Table 3: Volunteers

**Purpose:** Store pre-registered volunteer information that gets synced to the app before each event.

### Fields

| Field Name | Field Type | Options/Format | Required | Description |
|------------|------------|----------------|----------|-------------|
| Record ID | Auto Number | - | Auto | Airtable's unique record ID |
| Event | Link to Events | Link to Events table | ✅ Yes | Which event this volunteer is helping at |
| Email | Email | - | ✅ Yes | Volunteer's email address (unique per event) |
| First Name | Single line text | - | ✅ Yes | Volunteer's first name |
| Last Name | Single line text | - | ✅ Yes | Volunteer's last name |
| Photo Consent | Checkbox | true/false | ✅ Yes | Consent for photography (default: true) |
| Feedback Consent | Checkbox | true/false | ✅ Yes | Consent for feedback survey (default: false) |
| Next Event Consent | Checkbox | true/false | ✅ Yes | Consent for next event info (default: false) |
| Created At | Created time | - | Auto | When record was created |
| Modified At | Last modified time | - | Auto | When record was last updated |

---

## Table 4: Registrations

**Purpose:** Store attendee registrations collected during the event. This data is synced FROM the app TO Airtable after the event.

### Fields

| Field Name | Field Type | Options/Format | Required | Description |
|------------|------------|----------------|----------|-------------|
| Record ID | Auto Number | - | Auto | Airtable's unique record ID |
| Event | Link to Events | Link to Events table | ✅ Yes | Which event this registration is for |
| First Name | Single line text | - | ✅ Yes | Attendee's first name |
| Last Name | Single line text | - | ✅ Yes | Attendee's last name |
| Email | Email | - | No | Attendee's email address |
| Organization | Link to Organizations | Link to Organizations table | No | Which organization they're with (if applicable) |
| Impairment | Single select | Yes, No, Rather not say | No | Self-reported disability/impairment status |
| Role | Single select | Participant, Volunteer, Group | ✅ Yes | Registration type |
| Photo Consent | Checkbox | true/false | ✅ Yes | Consent for photography |
| Feedback Consent | Checkbox | true/false | No | Consent for feedback survey |
| Next Event Consent | Checkbox | true/false | No | Consent for next event info |
| Group Size | Number | Integer | No | Number of participants in group (for Group role) |
| Disabled Students | Number | Integer | No | Number of disabled participants (for Group role) |
| SEN Students | Number | Integer | No | Number of SEN participants (for Group role) |
| Leader Participating | Checkbox | true/false | No | Is group leader participating in games? |
| Check-in Time | Date & Time | ISO 8601 format | No | When attendee checked in |
| Check-out Time | Date & Time | ISO 8601 format | No | When attendee checked out |
| Sync Status | Single select | pending, synced, failed | No | Sync status with Airtable |
| Created At | Created time | - | Auto | When registration was created |
| Modified At | Last modified time | - | Auto | When record was last updated |

---

## Relationships Between Tables

```
Events (1) ──→ (Many) Organizations
Events (1) ──→ (Many) Volunteers
Events (1) ──→ (Many) Registrations
Organizations (1) ──→ (Many) Registrations
```

### Key Relationships:
1. Each **Event** can have multiple **Organizations**, **Volunteers**, and **Registrations**
2. Each **Registration** can be linked to one **Organization** (optional)
3. All tables link back to **Events** to maintain event-specific data

---

## Data Flow

### Before Event (Airtable → App):
1. Create event in Airtable Events table
2. Add organizations to Organizations table (linked to event)
3. Add volunteers to Volunteers table (linked to event)
4. Sync data from Airtable to NextJS app database

### During Event (App Only):
1. Attendees register using the app
2. Data stored in local NextJS database
3. No sync during event (offline-capable)

### After Event (App → Airtable):
1. Export registrations from app
2. Sync registrations to Airtable Registrations table
3. Link registrations to appropriate organizations
4. Mark sync status as 'synced'

---

## Next Steps

1. **Create Airtable Base**: Use the CSV files provided to import table structures
2. **Configure Views**: Set up useful views for each table
3. **Set Up Automations**: Configure any needed automations
4. **Test Sync**: Test the sync process with sample data
5. **Document API Keys**: Store Airtable API credentials securely

---

## CSV Import Files

See the following CSV files for importing table structures:
- `airtable-events-table.csv`
- `airtable-organizations-table.csv`
- `airtable-volunteers-table.csv`
- `airtable-registrations-table.csv`

