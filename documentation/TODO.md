# Power2Inspire Event CRM App - TODO List

**Last Updated:** 2026-02-11
**Project Status:** Documentation Complete - Ready for Implementation
**Current Version:** V2 (Based on existing Airtable form)

---

## ✅ Completed Tasks

### 1. Initialize project infrastructure
- [x] Set up git repository
- [x] Create Flutter project structure in software/flutter directory
- [x] Configure .gitignore for Flutter and sensitive files
- [x] Initial git commit

### 2. Create initial documentation
- [x] REQUIREMENTS.md - Functional and non-functional requirements
- [x] ARCHITECTURE.md - Technical architecture and design decisions
- [x] DATA_MODELS.md - Entity definitions and validation rules
- [x] PROJECT_STATUS.md - Current status and next steps
- [x] TODO.md - This task tracking document
- [x] AIRTABLE_INTEGRATION.md - Airtable backend integration specification
- [x] INTEGRATION_DISCUSSION.md - Decision summary and outstanding questions

### 3. Install dependencies
- [x] State management (Riverpod)
- [x] Database (Drift/SQLite)
- [x] Networking (Dio)
- [x] CSV export (CSV package)
- [x] Code generation tools (Freezed, JSON Serializable, Build Runner)
- [x] Utilities (UUID, Path Provider, Shared Preferences, Intl)

---

### 4. Define Airtable integration approach
- [x] Document direct API access decision and rationale
- [x] Define security measures and risk mitigations
- [x] Design Airtable schema (Events, Organizations, Registrations)
- [x] Define API operations (GET/POST/PATCH endpoints)
- [x] Document offline-first sync strategy
- [x] Update data models with new fields (name/surname, impairment, organizationId)
- [x] Create Organization entity for linked records
- [x] Document outstanding questions for Power2Inspire

### 5. Analyze existing Airtable form and create V2 specifications
- [x] Review existing PowerHouseGames volunteer signup form
- [x] Create EXISTING_FORM_ANALYSIS.md comparing current form vs wireframes
- [x] Get user decisions on field requirements (event, organization, impairment, consents)
- [x] Create UI_WIREFRAMES_V2.md with updated specifications
- [x] Build interactive HTML wireframe V2 with all 8 screens
- [x] Add consent radio buttons to registration forms (photo + marketing)
- [x] Update DATA_MODELS.md to V2 (remove phone, make fields required)
- [x] Update AIRTABLE_INTEGRATION.md with new field mappings
- [x] Document orange wristband language for photo consent
- [x] Document event dropdown with pre-selection

---

## 🔄 In Progress

### 6. Finalize Airtable setup and outstanding questions
- [x] ~~**AWAITING INPUT:** Impairment field format~~ **ANSWERED:** Free text, required
- [x] ~~**AWAITING INPUT:** Exact consent text~~ **ANSWERED:** Matches existing form
- [ ] **AWAITING INPUT:** Organization field implementation (dropdown/autocomplete/free text)
- [ ] **AWAITING INPUT:** Conditional fields for Attendee vs Volunteer (1-2 fields difference)
- [ ] **AWAITING INPUT:** Airtable workspace details (plan level, admin access)
- [ ] **AWAITING INPUT:** Organization list to import (if any)
- [ ] **AWAITING INPUT:** Token management process and rotation schedule
- [ ] **AWAITING INPUT:** Mailchimp sync approach (direct vs Airtable automation)
- [ ] **AWAITING INPUT:** Data retention and GDPR policy
- [ ] Create Airtable base with V2 schema (updated field names and requirements)
- [ ] Generate test access token for development
- [ ] Import organization data (if provided)

---

## 📋 Pending Tasks

### 7. Set up local database schema
- [ ] Run build_runner to generate Drift database code
- [ ] Test database creation and migrations
- [ ] Verify indexes are created correctly
- [ ] Add sample data for testing
- [ ] Document database setup in ARCHITECTURE.md

### 8. Implement core data models (V2 specifications)
- [ ] Create Event model with Freezed
- [ ] Create Registration model with Freezed (V2 fields):
  - [ ] eventId (required) - Airtable event record ID
  - [ ] attendeeName (required) - First name
  - [ ] attendeeSurname (required) - Last name
  - [ ] email (required) - Email address
  - [ ] organizationId (required) - Airtable organization record ID
  - [ ] impairment (required) - Free text accessibility needs
  - [ ] role (required) - Attendee or Volunteer
  - [ ] photoConsent (required) - Boolean (false = orange wristband)
  - [ ] marketingConsent (required) - Boolean (false = no mailing list)
  - [ ] checkinTime (optional)
  - [ ] checkoutTime (optional)
  - [ ] airtableRecordId (optional) - Populated after sync
  - [ ] ~~phone~~ - REMOVED (not needed)
- [ ] Create Organization model with Freezed
- [ ] Create SyncLog model with Freezed
- [ ] Add validation logic to models:
  - [ ] Email format validation
  - [ ] Name length validation (2-100 chars)
  - [ ] Required field validation
- [ ] Implement computed properties (fullName, isCheckedIn, attendanceDuration)
- [ ] Create enums (EventStatus, RegistrationRole, SyncStatus, SyncTarget)
- [ ] Add JSON serialization
- [ ] Write unit tests for models

### 9. Build registration UI (Based on Wireframe V2)
- [ ] Design app navigation structure (8 screens total)
- [ ] **Screen 1: Home Screen**
  - [ ] Display current event card (name, date)
  - [ ] "NEW REGISTRATION" button (primary green)
  - [ ] "ATTENDANCE LIST" button (secondary blue)
  - [ ] "ADMIN" button (warning orange)
- [ ] **Screen 2: Event Info Screen**
  - [ ] Display event details (name, date, location, time)
  - [ ] Expected attendees and volunteers count
  - [ ] Back button navigation
- [ ] **Screen 3: Registration Type Screen**
  - [ ] "ATTENDEE" card with icon
  - [ ] "VOLUNTEER" card with icon
  - [ ] Navigate to appropriate form
- [ ] **Screen 4 & 5: Registration Forms (Attendee & Volunteer)**
  - [ ] Event dropdown (pre-selected to current event, can change)
  - [ ] First Name field (required, text input)
  - [ ] Last Name field (required, text input)
  - [ ] Email field (required, email validation)
  - [ ] Organization field (required, autocomplete with datalist)
  - [ ] "Do you have an impairment" field (required, free text with hint)
  - [ ] Photo consent (required, radio buttons):
    - [ ] "Yes, I consent to the use of photographs as specified"
    - [ ] "No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way"
  - [ ] Marketing consent (required, radio buttons):
    - [ ] "Yes, I would like to hear from Power2Inspire"
    - [ ] "No, please don't add me to the mailing list"
  - [ ] SUBMIT button (goes directly to confirmation)
  - [ ] Form validation with clear error messages
  - [ ] Large, accessible input fields (48x48 dp minimum)
- [ ] **Screen 6: Confirmation Screen**
  - [ ] Success icon and message
  - [ ] Registration summary (name, email, organization, event, type)
  - [ ] "DONE" button (return to home)
  - [ ] "REGISTER ANOTHER PERSON" button
- [ ] **Screen 7: Attendance List Screen**
  - [ ] Search box for filtering by name/email
  - [ ] Filter tabs (All, Attendees, Volunteers)
  - [ ] Stats box (Checked In count, Not Checked In count)
  - [ ] List items showing:
    - [ ] Name, email, check-in status
    - [ ] CHECK IN button (green) or CHECK OUT button (orange)
  - [ ] Visual distinction for checked-in attendees (green border)
- [ ] **Screen 8: Admin Menu Screen**
  - [ ] Sync with Airtable card (with last sync time)
  - [ ] Export CSV Report card
  - [ ] Settings card
  - [ ] Stats summary (total registrations, pending sync, storage used)
- [ ] Implement tablet-optimized layout (landscape/portrait)
- [ ] Add accessibility features:
  - [ ] Minimum 48x48 dp touch targets (prefer 72x72 dp)
  - [ ] High contrast colors (WCAG AA compliance)
  - [ ] Screen reader labels
  - [ ] Support for system font scaling
- [ ] Test on actual tablet devices
- [ ] Match styling from interactive wireframe V2

### 10. Implement attendance tracking (Wireframe V2 Screen 7)
- [ ] Implement search functionality
  - [ ] Search by name (first or last)
  - [ ] Search by email
  - [ ] Real-time filtering as user types
- [ ] Implement filter tabs
  - [ ] "All" - show all registrations
  - [ ] "Attendees" - filter by role = Attendee
  - [ ] "Volunteers" - filter by role = Volunteer
- [ ] Display attendance statistics
  - [ ] Count of checked-in attendees
  - [ ] Count of not checked-in attendees
  - [ ] Update counts in real-time
- [ ] Build attendance list items
  - [ ] Display name (first + last)
  - [ ] Display email
  - [ ] Display check-in status (visual indicator)
  - [ ] CHECK IN button (green) when not checked in
  - [ ] CHECK OUT button (orange) when checked in
  - [ ] Green border for checked-in attendees
- [ ] Implement check-in functionality
  - [ ] Record check-in timestamp (ISO 8601)
  - [ ] Update UI immediately
  - [ ] Mark for sync to Airtable
- [ ] Implement check-out functionality
  - [ ] Record check-out timestamp (ISO 8601)
  - [ ] Calculate attendance duration
  - [ ] Update UI immediately
  - [ ] Mark for sync to Airtable
- [ ] Fire drill/emergency evacuation view
  - [ ] Quick view of all currently checked-in people
  - [ ] Print-friendly format

### 11. Create CSV export functionality (V2 fields)
- [ ] Design CSV export data structure (RegistrationExportDTO)
- [ ] Implement CSV generation with V2 fields:
  - [ ] Event Name (looked up from eventId)
  - [ ] First Name (attendeeName)
  - [ ] Last Name (attendeeSurname)
  - [ ] Email
  - [ ] Organization (looked up from organizationId)
  - [ ] Do you have an impairment (impairment field)
  - [ ] Role (Attendee/Volunteer)
  - [ ] Photo Consent (Yes/No - false = orange wristband)
  - [ ] Marketing Consent (Yes/No - false = no mailing list)
  - [ ] Check-in Time (ISO 8601 format)
  - [ ] Check-out Time (ISO 8601 format)
  - [ ] Attendance Duration (calculated)
  - [ ] ~~Phone~~ - REMOVED (not in V2)
- [ ] Add date range filtering for exports
- [ ] Add event filtering for exports
- [ ] Save CSV to device storage
- [ ] Create export history/log
- [ ] Add export preview before saving
- [ ] Test with 500+ records
- [ ] Implement from Admin Menu Screen (Wireframe V2 Screen 8)

### 12. Build sync framework
- [ ] Design sync engine architecture
- [ ] Implement sync status tracking (SyncLog entity)
- [ ] Create sync queue for pending operations
- [ ] Add retry logic for failed syncs (max 3 attempts)
- [ ] Implement conflict resolution strategy (Last Write Wins - local is authoritative)
- [ ] Build sync UI in Admin Menu (Wireframe V2 Screen 8):
  - [ ] "Sync with Airtable" card
  - [ ] Display last sync time
  - [ ] Display pending sync count
  - [ ] Manual sync trigger button
  - [ ] Sync progress indicator
  - [ ] Sync history/log viewer
  - [ ] Error notification and retry options
- [ ] Implement bidirectional sync:
  - [ ] Upload new registrations to Airtable (POST)
  - [ ] Upload check-in/out updates to Airtable (PATCH)
  - [ ] Store Airtable record IDs in local database
  - [ ] Use App Record ID for matching records
- [ ] Add background sync capability (optional)
- [ ] Test offline → online sync scenarios
- [ ] Handle duplicate detection (by email + event ID)

### 13. Integrate external APIs (V2 field mappings)
- [ ] **Airtable Integration (V2):**
  - [ ] Install flutter_secure_storage for token storage
  - [ ] Create Airtable API client using Dio
  - [ ] Implement token storage in device keychain/keystore
  - [ ] Implement GET /v0/{baseId}/Events (fetch active events for dropdown)
  - [ ] Implement GET /v0/{baseId}/Organizations (fetch org list for autocomplete)
  - [ ] Implement POST /v0/{baseId}/Registrations with V2 fields:
    - [ ] Event (link to Events table)
    - [ ] First Name (attendeeName)
    - [ ] Last Name (attendeeSurname)
    - [ ] Email (required)
    - [ ] Organization (link to Organizations table)
    - [ ] Do you have an impairment (impairment field)
    - [ ] Role (Attendee/Volunteer)
    - [ ] Photo Consent (boolean → checkbox)
    - [ ] Marketing Consent (boolean → checkbox)
    - [ ] App Record ID (local UUID)
  - [ ] Implement PATCH /v0/{baseId}/Registrations/{id} for check-in/out:
    - [ ] Check-in Time (ISO 8601)
    - [ ] Check-out Time (ISO 8601)
  - [ ] Map app data models to Airtable schema (see AIRTABLE_INTEGRATION.md Section 5)
  - [ ] Implement rate limiting (5 req/sec)
  - [ ] Handle API errors gracefully with retry logic
  - [ ] Test with actual Airtable account and access token
  - [ ] Verify field mappings match V2 specifications
- [ ] **Mailchimp Integration:**
  - [ ] Set up API authentication
  - [ ] Implement export contacts endpoint
  - [ ] Respect marketing consent flags (only export if marketingConsent = true)
  - [ ] Map V2 data to Mailchimp subscriber format:
    - [ ] Email (required)
    - [ ] First Name (FNAME)
    - [ ] Last Name (LNAME)
    - [ ] Organization (merge field)
  - [ ] Handle API errors gracefully
  - [ ] Test with actual Mailchimp account
- [ ] **Google Drive Integration:**
  - [ ] Set up OAuth authentication
  - [ ] Implement CSV upload to Drive
  - [ ] Implement database backup to Drive
  - [ ] Create folder structure in Drive
  - [ ] Handle API errors gracefully
  - [ ] Test with actual Google account

### 14. Testing & Quality Assurance
- [ ] Write unit tests (target >80% coverage)
  - [ ] Registration model validation tests
  - [ ] Event model tests
  - [ ] Organization model tests
  - [ ] Sync logic tests
  - [ ] CSV export tests
- [ ] Write widget tests for UI components
  - [ ] Registration form validation
  - [ ] Consent radio button behavior
  - [ ] Event dropdown pre-selection
  - [ ] Organization autocomplete
  - [ ] Check-in/out buttons
- [ ] Write integration tests for user flows
  - [ ] Complete registration flow (Attendee)
  - [ ] Complete registration flow (Volunteer)
  - [ ] Check-in → Check-out flow
  - [ ] Sync to Airtable flow
  - [ ] CSV export flow
- [ ] Perform accessibility testing
  - [ ] Screen reader compatibility
  - [ ] Touch target sizes (48x48 dp minimum)
  - [ ] Color contrast (WCAG AA)
  - [ ] Font scaling support
- [ ] Performance testing with 500+ registrations
  - [ ] List scrolling performance
  - [ ] Search/filter performance
  - [ ] Database query performance
- [ ] Test on multiple tablet models
- [ ] Test offline functionality thoroughly
  - [ ] Register while offline
  - [ ] Check-in/out while offline
  - [ ] Sync when back online
- [ ] Security audit (data encryption, GDPR compliance)
  - [ ] Token storage security
  - [ ] Data encryption at rest
  - [ ] HTTPS-only communication
- [ ] User acceptance testing with Power2Inspire
  - [ ] Test with actual event data
  - [ ] Verify consent text matches requirements
  - [ ] Verify orange wristband language

### 15. Documentation & Deployment
- [ ] Create user manual/guide
  - [ ] How to register attendees/volunteers
  - [ ] How to check in/out
  - [ ] How to sync with Airtable
  - [ ] How to export CSV reports
  - [ ] Screenshots from wireframe V2
- [ ] Create training materials for charity staff
  - [ ] Video walkthrough of app
  - [ ] Quick reference guide
  - [ ] Troubleshooting guide
- [ ] Document API integration setup
  - [ ] How to create Airtable base with V2 schema
  - [ ] How to generate access token
  - [ ] How to configure app with token
  - [ ] How to import organization data
- [ ] Create deployment guide
  - [ ] Device setup instructions
  - [ ] App installation process
  - [ ] Initial configuration steps
- [ ] Set up CI/CD pipeline (optional)
- [ ] Prepare for Google Play Store submission (if needed)
- [ ] Prepare for Apple App Store submission (if needed)
- [ ] Create privacy policy
  - [ ] GDPR compliance
  - [ ] Data retention policy
  - [ ] Consent management
- [ ] Create terms of service

---

## 🤔 Questions & Decisions Needed

### From Power2Inspire (See INTEGRATION_DISCUSSION.md and EXISTING_FORM_ANALYSIS.md):
1. **Airtable Setup:** Do you have a workspace? What plan level? Who has admin access?
2. **Organization Data:** Existing list to import? How many organizations typically attend?
3. ~~**Impairment Field:**~~ **ANSWERED:** Free text field, required
4. **Token Management:** Who generates tokens? Rotation schedule? Lost device protocol?
5. **Mailchimp Sync:** Direct from app or via Airtable automation?
6. **Data Retention:** How long to keep event data? GDPR retention policy?
7. ~~**Consent Text:**~~ **ANSWERED:** Matches existing Airtable form (see wireframe V2)
8. **Branding:** Logo, color scheme, and branding guidelines?
9. **Testing Devices:** What specific tablet models will be used?
10. **Sync Timing:** When should sync occur? (end of event, daily, manual only)
11. **Organization Field:** Dropdown only, free text only, or autocomplete with ability to add new?
12. **Conditional Fields:** Which 1-2 fields should be different between Attendee and Volunteer forms?

### Technical Decisions:
- [ ] Flutter SDK upgrade to resolve dependency conflicts? (Recommended)
- [ ] Use code generation or manual models? (Depends on SDK upgrade)
- [ ] Implement database encryption? (Recommended for GDPR)
- [ ] Add biometric/PIN lock for app access?
- [ ] Support multiple languages? (i18n)

---

## 📝 Notes

- Project is currently in **Documentation Complete - Ready for Implementation** phase
- **Version 2.0** specifications based on existing PowerHouseGames Airtable volunteer signup form
- Direct API access approach approved for controlled environment
- Data model updated to V2 with required fields (eventId, email, organization, impairment)
- Phone field removed from V2 (not needed)
- Consent fields use radio buttons (not checkboxes) to force explicit choice
- Orange wristband language preserved for photo consent refusal
- Event dropdown with pre-selection to current event
- All documentation is version controlled in git
- Dependencies are installed and ready to use
- Airtable base needs to be created with V2 schema (updated field names)
- Interactive HTML wireframe V2 available for stakeholder review
- All core documentation aligned: UI_WIREFRAMES_V2.md, DATA_MODELS.md V2, AIRTABLE_INTEGRATION.md V2

---

## 🎯 Next Immediate Steps

1. **Get answers** to remaining questions:
   - Organization field implementation (dropdown/autocomplete/free text)
   - Conditional fields for Attendee vs Volunteer (1-2 fields difference)
   - Airtable workspace details and access
   - Token management process
   - Mailchimp sync approach
   - Data retention policy
2. **Create Airtable base** with V2 schema:
   - Events table (with Event Name, Event Date, Location, Status)
   - Organizations table (with Organization Name)
   - Registrations table (with V2 field names: First Name, Last Name, Email, Organization, Do you have an impairment, Photo Consent, Marketing Consent)
3. **Generate access token** for development and testing
4. **Import organization data** (if provided by charity)
5. **Set up local database** with Drift:
   - Run build_runner to generate code
   - Create tables matching V2 data models
   - Add indexes for performance
6. **Begin Flutter UI development** based on Wireframe V2:
   - Start with Home Screen (Screen 1)
   - Build Registration Type Screen (Screen 3)
   - Build Registration Forms (Screens 4 & 5) with all V2 fields
   - Implement consent radio buttons with exact text
7. **Implement Airtable API client** with V2 field mappings
8. **Test end-to-end flow** with actual Airtable base

