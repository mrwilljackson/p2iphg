# Airtable Integration - Discussion Summary

**Date:** 2026-02-09  
**Participants:** Development Team & Power2Inspire  
**Topic:** Direct Airtable API Access from Flutter App

---

## Key Decisions Made

### 1. ✅ Direct API Access Approved
**Decision:** The Flutter app will communicate directly with Airtable's REST API without an intermediary server.

**Justification:**
- App is deployed on **controlled, charity-owned devices only**
- **Not publicly distributed** via App Store or Google Play
- **Limited API scope** - only specific operations coded into app
- **Simpler architecture** - no need for backend server maintenance
- **Offline-first design** - local SQLite cache with sync

### 2. ✅ User Access Token Authentication
**Decision:** Each device will use an Airtable user access token for authentication.

**Implementation:**
- Token stored securely in device keychain/keystore
- Entered once during initial device setup
- Can be rotated/revoked by authorized staff
- Never logged or displayed in UI

### 3. ✅ Security Posture Acceptable
**Risk Assessment:** Direct API access is acceptable given the controlled environment.

**Mitigations in Place:**
- ✅ Secure token storage (iOS Keychain / Android Keystore)
- ✅ HTTPS-only communication (TLS 1.2+)
- ✅ Rate limiting respected (5 req/sec)
- ✅ Minimal API permissions (read events, write registrations)
- ✅ Local data encryption at rest
- ✅ Optional device PIN/biometric lock
- ✅ Remote token revocation capability

**Acknowledged Risks:**
- ⚠️ Token could be extracted if device is physically compromised
  - *Mitigation:* Device should be locked when not in use, token can be revoked
- ⚠️ API endpoints visible in decompiled app
  - *Mitigation:* Acceptable for non-public deployment
- ⚠️ No server-side validation layer
  - *Mitigation:* Airtable's built-in validation applies

---

## Data Model Updates

### Updated Registration Fields
Based on requirements discussion, the Registration entity now includes:

**New/Changed Fields:**
- `attendeeName` - First name (was: `name` as full name)
- `attendeeSurname` - Last name (new field)
- `impairment` - Accessibility needs (new field, free text)
- `organizationId` - Link to Organization entity (was: `organization` as text)

**Rationale:**
- Separate name fields for better data quality and reporting
- Impairment field supports accessibility planning
- Organization as linked entity enables better tracking and autocomplete

### New Organization Entity
Created to support organization tracking:
- Pre-loaded from Airtable for autocomplete
- Can be created on-the-fly during registration
- Linked to registrations via foreign key

---

## Airtable Schema Design

### Tables Structure

**1. Events Table**
- Stores event details (name, date, location, status)
- One active event at a time
- Synced to app on startup

**2. Organizations Table**
- Master list of organizations
- Pre-populated and synced to app
- Supports autocomplete during registration

**3. Registrations Table**
- Core data: attendee/volunteer information
- Links to Events and Organizations
- Includes consent flags and check-in/out times
- Sync status tracking

### Key Design Principles
1. **Airtable as Source of Truth** - App syncs to Airtable, not vice versa
2. **Offline-First** - All operations work without internet
3. **On-Demand Sync** - Manual trigger by staff, not automatic
4. **Last Write Wins** - Local app data overwrites Airtable on sync

---

## API Operations Defined

### Read Operations (GET)
```
/v0/{baseId}/Events
- Fetch active event details
- Used on app startup and manual sync

/v0/{baseId}/Organizations  
- Fetch organization list
- Cached locally for autocomplete
```

### Write Operations (POST/PATCH)
```
POST /v0/{baseId}/Registrations
- Create new registration
- Includes all attendee/volunteer data

PATCH /v0/{baseId}/Registrations/{recordId}
- Update check-in/check-out times
- Update sync status after successful sync
```

### Rate Limiting Strategy
- Airtable limit: 5 requests/second per base
- App implements request queuing
- Batch operations where possible
- Exponential backoff on errors

---

## Sync Strategy

### Offline Mode (Primary Operation)
1. User registers attendee → Saved to local SQLite
2. User checks in/out → Updated in local SQLite
3. All operations fully functional without internet
4. Sync status marked as "pending"

### Sync Mode (On-Demand)
1. Staff triggers manual sync
2. App queries all "pending" records from SQLite
3. Sends to Airtable API (create or update)
4. On success: Mark as "synced" in local DB
5. On failure: Log error, increment retry count, keep as "pending"

### Conflict Resolution
**Strategy:** Last Write Wins (Local is Authoritative)

**Scenarios:**
- **New Registration:** Always create in Airtable (no conflict possible)
- **Check-in Update:** Overwrite Airtable timestamp with local timestamp
- **Duplicate Detection:** Check by Email + Event ID before creating new record

---

## Outstanding Questions

### For Power2Inspire to Answer:

1. **Airtable Setup:**
   - [ ] Do you have an Airtable workspace already?
   - [ ] What plan level? (Free, Plus, Pro, Enterprise)
   - [ ] Who will have admin access to the base?

2. **Organization Data:**
   - [ ] Do you have an existing list of organizations to import?
   - [ ] How many organizations typically attend events?
   - [ ] Should organizations be pre-approved or can staff add new ones?

3. **Impairment Field:**
   - [ ] Free text or predefined dropdown values?
   - [ ] Examples: "Wheelchair user", "Hearing impaired", "Visual impairment", etc.
   - [ ] Is this sensitive data requiring extra protection?

4. **Token Management:**
   - [ ] Who will generate access tokens?
   - [ ] How often should tokens be rotated?
   - [ ] What happens if a device is lost/stolen?

5. **Mailchimp Integration:**
   - [ ] Should we sync to Mailchimp directly from app?
   - [ ] Or sync to Airtable, then Airtable → Mailchimp via automation?
   - [ ] Which approach fits your workflow better?

6. **Data Retention:**
   - [ ] How long should event data remain on the device?
   - [ ] Should old events be archived or deleted?
   - [ ] Is there a GDPR retention policy to follow?

---

## Next Steps

### Immediate (This Week):
1. ✅ Document Airtable integration approach
2. ✅ Update data models with new fields
3. [ ] Get answers to outstanding questions
4. [ ] Create Airtable base with proposed schema
5. [ ] Generate test access token

### Short-term (Next 2 Weeks):
1. [ ] Implement Airtable API client in Flutter
2. [ ] Build organization autocomplete UI
3. [ ] Implement sync engine with retry logic
4. [ ] Test end-to-end sync flow
5. [ ] Document token setup process for charity

### Before Production:
1. [ ] Security review of token storage
2. [ ] Test with actual Airtable account
3. [ ] Create user guide for token management
4. [ ] Plan for token rotation schedule
5. [ ] Test device loss/theft scenario

---

## References

- **AIRTABLE_INTEGRATION.md** - Detailed technical specification
- **DATA_MODELS.md** - Updated entity definitions
- **REQUIREMENTS.md** - Functional requirements
- **ARCHITECTURE.md** - Overall system architecture

---

## Approval

This approach has been discussed and is pending final approval from Power2Inspire leadership.

**Approved by:** _[Pending]_  
**Date:** _[Pending]_  
**Notes:** _[Any conditions or modifications]_

