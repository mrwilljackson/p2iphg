# Airtable Integration Architecture

**Document Version:** 1.0  
**Date:** 2026-02-09  
**Status:** Design Discussion

## 1. Overview

The Power2Inspire Event CRM App will use Airtable as its backend database, with the Flutter app acting as a mobile interface for event registration and attendance tracking. This document outlines the integration approach, security considerations, and implementation details.

## 2. Integration Approach

### 2.1 Direct API Access
The app will communicate directly with Airtable's REST API from the Flutter application.

**Rationale:**
- Controlled environment (charity-owned devices only)
- Not publicly distributed app
- Limited, specific API operations coded into the app
- Simpler architecture (no middleware server required)
- Offline-first with local SQLite cache

### 2.2 Authentication Method
**User Access Token** - Each device will require an Airtable user access token to function.

**Token Storage:**
- Stored securely in device keychain/keystore
- Entered once during initial app setup
- Can be updated/rotated by authorized staff

## 3. Security Considerations

### 3.1 Acceptable Risks (Controlled Environment)
✅ **Why direct API access is acceptable:**
1. **Not Public:** App is not distributed via App Store/Play Store to general public
2. **Controlled Devices:** Only runs on charity-owned tablets
3. **Physical Security:** Devices remain in charity's possession
4. **Limited Scope:** API access is restricted to specific operations only
5. **User Token:** Requires valid Airtable user credentials
6. **Audit Trail:** All API calls logged in Airtable

### 3.2 Security Measures Implemented
🔒 **Mitigations:**
- [ ] Access token stored in secure device storage (iOS Keychain / Android Keystore)
- [ ] Token never logged or displayed in UI
- [ ] API calls use HTTPS only (TLS 1.2+)
- [ ] Rate limiting respected (Airtable: 5 requests/second)
- [ ] Minimal API permissions (read events, write registrations only)
- [ ] Local data encrypted at rest (SQLite encryption)
- [ ] App requires device PIN/biometric to access (optional)
- [ ] Token can be revoked remotely via Airtable

### 3.3 Known Limitations & Risks
⚠️ **Acknowledged risks:**
1. **Token Exposure:** If device is compromised, token could be extracted
   - *Mitigation:* Token can be revoked in Airtable, device should be locked
2. **API Key in Code:** API endpoints are visible in decompiled app
   - *Mitigation:* Acceptable for controlled deployment, not public app
3. **No Server-Side Validation:** App directly modifies Airtable data
   - *Mitigation:* Airtable's built-in validation and permissions apply

## 4. Airtable Schema Design

### 4.1 Base Structure
**Base Name:** `Power2Inspire Events` (or as defined by charity)

### 4.2 Tables

#### Table 1: Events
| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Event ID | Auto Number | Unique identifier | Yes |
| Event Name | Single Line Text | Name of event | Yes |
| Event Date | Date | When event occurs | Yes |
| Location | Single Line Text | Venue/address | No |
| Description | Long Text | Event details | No |
| Status | Single Select | active, completed, cancelled | Yes |
| Created At | Created Time | Auto-generated | Yes |
| Modified At | Last Modified Time | Auto-generated | Yes |

#### Table 2: Organizations
| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Organization ID | Auto Number | Unique identifier | Yes |
| Organization Name | Single Line Text | Name of organization | Yes |
| Contact Email | Email | Primary contact | No |
| Contact Phone | Phone | Primary contact | No |
| Notes | Long Text | Additional info | No |

#### Table 3: Registrations
| Field Name | Type | Description | Required |
|------------|------|-------------|----------|
| Registration ID | Auto Number | Unique identifier | Yes |
| Event | Link to Events | Which event | Yes |
| Attendee Name | Single Line Text | First name | Yes |
| Attendee Surname | Single Line Text | Last name | Yes |
| Impairment | Single Line Text | Disability/accessibility needs | No |
| Organization | Link to Organizations | Linked organization | No |
| Email | Email | Contact email | No |
| Phone | Phone | Contact phone | No |
| Role | Single Select | Attendee, Volunteer | Yes |
| Marketing Consent | Checkbox | Opt-in for marketing | Yes (default: No) |
| Photo Consent | Checkbox | Consent for photography | Yes (default: No) |
| Check-in Time | Date & Time | When checked in | No |
| Check-out Time | Date & Time | When checked out | No |
| Sync Status | Single Select | pending, synced, failed | Yes |
| Created At | Created Time | Auto-generated | Yes |
| Modified At | Last Modified Time | Auto-generated | Yes |

### 4.3 Views (in Airtable)
- **Active Event:** Filter by Status = "active"
- **Today's Registrations:** Filter by Event Date = today
- **Checked In:** Filter by Check-in Time is not empty AND Check-out Time is empty
- **Marketing Consent:** Filter by Marketing Consent = true
- **Volunteers:** Filter by Role = "Volunteer"

## 5. API Operations

### 5.1 Read Operations
```
GET /v0/{baseId}/Events
- Fetch active event details
- Used when app starts or syncs

GET /v0/{baseId}/Organizations
- Fetch organization list for dropdown
- Cached locally for offline use
```

### 5.2 Write Operations
```
POST /v0/{baseId}/Registrations
- Create new registration record
- Includes all attendee/volunteer data

PATCH /v0/{baseId}/Registrations/{recordId}
- Update check-in/check-out times
- Update sync status
```

### 5.3 Rate Limiting
- Airtable limit: 5 requests per second per base
- App will implement request queuing
- Batch operations where possible

## 6. Offline-First Architecture

### 6.1 Data Flow

**Offline Mode (Primary):**
1. User registers attendee → Saved to local SQLite
2. User checks in attendee → Updated in local SQLite
3. All operations work without internet

**Sync Mode (On-Demand):**
1. User triggers sync
2. App reads pending records from SQLite
3. App sends to Airtable API
4. On success: Update sync status to "synced"
5. On failure: Log error, mark for retry

### 6.2 Conflict Resolution
**Strategy:** Last Write Wins (Local app is authoritative)

**Scenarios:**
- **New Registration:** Always create in Airtable (no conflict)
- **Check-in Update:** Overwrite Airtable timestamp with local timestamp
- **Duplicate Detection:** Check by Email + Event ID before creating

## 7. Implementation Checklist

### 7.1 Setup Tasks
- [ ] Create Airtable base with schema above
- [ ] Generate user access token in Airtable
- [ ] Document token generation process for charity staff
- [ ] Test API access with Postman/curl

### 7.2 App Development Tasks
- [ ] Create Airtable API client (Dio-based)
- [ ] Implement token storage (flutter_secure_storage)
- [ ] Build sync engine with retry logic
- [ ] Add organization lookup/autocomplete
- [ ] Map local SQLite models to Airtable schema
- [ ] Handle API errors gracefully
- [ ] Add sync status UI

## 8. Questions for Power2Inspire

1. **Airtable Account:** Do you already have an Airtable workspace set up?
2. **Base Access:** Who will have access to the Airtable base?
3. **Token Management:** Who will generate and manage access tokens?
4. **Organization List:** Do you have an existing list of organizations to import?
5. **Impairment Field:** What values should be available? (Free text or dropdown?)
6. **Data Ownership:** Is Airtable the permanent storage, or just a sync target?
7. **Mailchimp Sync:** Should we sync to Mailchimp from Airtable or directly from app?

## 9. Next Steps

1. Finalize Airtable schema with charity
2. Create Airtable base and test tables
3. Generate access token for development
4. Implement API client in Flutter
5. Test end-to-end sync flow
6. Document setup process for production deployment

