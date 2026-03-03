# Postman Guide for Testing Airtable API

**Version:** 1.0  
**Date:** 2026-03-03  
**Purpose:** Test Airtable API connection using Postman

---

## Prerequisites

- Postman installed (Desktop app or web version)
- Airtable Personal Access Token (from secrets.txt)
- Airtable Base ID (from your Airtable base URL)

---

## Step 1: Get Your Airtable Base ID

1. Open your Airtable base in a browser
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXXXX/...`
3. Copy the Base ID (starts with `app`, e.g., `appXXXXXXXXXXXXXX`)

---

## Step 2: Set Up Postman Environment

### Create Environment Variables:

1. In Postman, click **"Environments"** (left sidebar)
2. Click **"+"** to create a new environment
3. Name it: **"PowerHouseGames Airtable"**
4. Add these variables:

| Variable Name | Type | Initial Value | Current Value |
|---------------|------|---------------|---------------|
| `airtable_token` | secret | `YOUR_AIRTABLE_TOKEN_HERE` | (paste your actual token from .env.local) |
| `base_id` | default | `appXXXXXXXXXXXXXX` | (your actual base ID) |
| `events_table_name` | default | `Events` | `Events` |
| `organizations_table_name` | default | `Organizations` | `Organizations` |
| `volunteers_table_name` | default | `Volunteers` | `Volunteers` |
| `registrations_table_name` | default | `Registrations` | `Registrations` |

5. Click **"Save"**
6. Select this environment from the dropdown in top-right corner

---

## Step 3: Test API Requests

### Request 1: List All Events

**Purpose:** Verify API connection and retrieve all events

**Method:** `GET`

**URL:**
```
https://api.airtable.com/v0/{{base_id}}/{{events_table_name}}
```

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{airtable_token}}` |
| `Content-Type` | `application/json` |

**Expected Response (200 OK):**
```json
{
  "records": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "createdTime": "2025-01-15T10:30:00.000Z",
      "fields": {
        "Event Name": "PowerHouseGames Cambridge 2025",
        "Event Date": "2025-06-15",
        "Location": "Cambridge University Sports Centre",
        "Description": "Annual PowerHouseGames event at Cambridge",
        "Status": "active"
      }
    }
  ]
}
```

---

### Request 2: Get Single Event by Record ID

**Purpose:** Retrieve a specific event

**Method:** `GET`

**URL:**
```
https://api.airtable.com/v0/{{base_id}}/{{events_table_name}}/recXXXXXXXXXXXXXX
```
*(Replace `recXXXXXXXXXXXXXX` with actual Record ID from Request 1)*

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{airtable_token}}` |
| `Content-Type` | `application/json` |

---

### Request 3: List Organizations for an Event

**Purpose:** Get all organizations linked to a specific event

**Method:** `GET`

**URL:**
```
https://api.airtable.com/v0/{{base_id}}/{{organizations_table_name}}?filterByFormula=AND({Event}='PowerHouseGames Cambridge 2025')
```

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{airtable_token}}` |
| `Content-Type` | `application/json` |

**Expected Response:**
```json
{
  "records": [
    {
      "id": "recORG001XXXXXXXXX",
      "fields": {
        "Organization Name": "Cambridge University Boat Club",
        "Event": ["recEVENT001XXXXXX"],
        "Group Type": "Sporting",
        "Expected Group Size": 20,
        "Contact First Name": "John",
        "Contact Last Name": "Smith",
        "Contact Email": "john.smith@cubc.org.uk"
      }
    }
  ]
}
```

---

### Request 4: Create a New Event

**Purpose:** Test creating a new event record

**Method:** `POST`

**URL:**
```
https://api.airtable.com/v0/{{base_id}}/{{events_table_name}}
```

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{airtable_token}}` |
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "fields": {
    "Event Name": "Test Event from Postman",
    "Event Date": "2026-12-31",
    "Location": "Test Location",
    "Description": "This is a test event created via Postman",
    "Status": "planned"
  }
}
```

**Expected Response (200 OK):**
```json
{
  "id": "recNEWEVENTXXXXXXX",
  "createdTime": "2026-03-03T14:30:00.000Z",
  "fields": {
    "Event Name": "Test Event from Postman",
    "Event Date": "2026-12-31",
    "Location": "Test Location",
    "Description": "This is a test event created via Postman",
    "Status": "planned"
  }
}
```

---

### Request 5: Create a New Organization

**Purpose:** Test creating an organization linked to an event

**Method:** `POST`

**URL:**
```
https://api.airtable.com/v0/{{base_id}}/{{organizations_table_name}}
```

**Headers:**
| Key | Value |
|-----|-------|
| `Authorization` | `Bearer {{airtable_token}}` |
| `Content-Type` | `application/json` |

**Body (raw JSON):**
```json
{
  "fields": {
    "Organization Name": "Test Organization",
    "Event": ["recEVENT001XXXXXX"],
    "Group Type": "Community",
    "Expected Group Size": 15,
    "Contact First Name": "Jane",
    "Contact Last Name": "Doe",
    "Contact Email": "jane.doe@test.org"
  }
}
```

**Note:** Replace `recEVENT001XXXXXX` with an actual Event Record ID from your base.

---

## Quick Test - Start Here!

### Simplest Test: List Events

This is the easiest way to verify your API is working:

**Method:** `GET`

**URL:**
```
https://api.airtable.com/v0/YOUR_BASE_ID/Events
```

**Headers:**
```
Authorization: Bearer YOUR_AIRTABLE_TOKEN_HERE
Content-Type: application/json
```

**Steps in Postman:**
1. Create new request
2. Set method to `GET`
3. Paste URL (replace `YOUR_BASE_ID` with your actual base ID from Airtable URL)
4. Go to "Headers" tab
5. Add header: `Authorization` with value: `Bearer YOUR_AIRTABLE_TOKEN_HERE` (replace with your actual token from .env.local)
6. Add header: `Content-Type` with value: `application/json`
7. Click "Send"

**Expected:** 200 OK with list of events

---

## Postman Collection (Import This)

Save this as `PowerHouseGames-Airtable.postman_collection.json` and import into Postman:

```json
{
  "info": {
    "name": "PowerHouseGames Airtable API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "List All Events",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{airtable_token}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "https://api.airtable.com/v0/{{base_id}}/Events",
          "protocol": "https",
          "host": ["api", "airtable", "com"],
          "path": ["v0", "{{base_id}}", "Events"]
        }
      }
    },
    {
      "name": "List Organizations",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{airtable_token}}"
          }
        ],
        "url": "https://api.airtable.com/v0/{{base_id}}/Organizations"
      }
    },
    {
      "name": "List Volunteers",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{airtable_token}}"
          }
        ],
        "url": "https://api.airtable.com/v0/{{base_id}}/Volunteers"
      }
    }
  ]
}
```

---

## Troubleshooting

**❌ 401 Unauthorized**
- Check your token is correct
- Ensure "Bearer " prefix is included
- Token should start with `pat`

**❌ 404 Not Found**
- Verify Base ID is correct (starts with `app`)
- Check table name is exact: `Events` not `events`

**❌ 422 Invalid Request**
- Field names must match exactly (case-sensitive)
- Use "Event Name" not "EventName"

---

## Important Security Note

⚠️ **Your API token is visible in the .env.local file I can see. Make sure:**
- `.env.local` is in `.gitignore` (it is ✅)
- Never commit this file to git
- Never share screenshots with the token visible
- Rotate the token if it's been exposed

