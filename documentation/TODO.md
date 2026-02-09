# Power2Inspire Event CRM App - TODO List

**Last Updated:** 2026-02-09
**Project Status:** Airtable Integration Design Phase

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

---

## 🔄 In Progress

### 5. Finalize field requirements and Airtable setup
- [ ] **AWAITING INPUT:** Answers to questions in INTEGRATION_DISCUSSION.md
- [ ] **AWAITING INPUT:** Airtable workspace details (plan level, admin access)
- [ ] **AWAITING INPUT:** Organization list to import (if any)
- [ ] **AWAITING INPUT:** Impairment field format (free text vs dropdown)
- [ ] **AWAITING INPUT:** Token management process and rotation schedule
- [ ] **AWAITING INPUT:** Mailchimp sync approach (direct vs Airtable automation)
- [ ] **AWAITING INPUT:** Data retention and GDPR policy
- [ ] **AWAITING INPUT:** Exact consent text for marketing and photo permissions
- [ ] Create Airtable base with proposed schema
- [ ] Generate test access token for development
- [ ] Import organization data (if provided)

---

## 📋 Pending Tasks

### 6. Set up local database schema
- [ ] Run build_runner to generate Drift database code
- [ ] Test database creation and migrations
- [ ] Verify indexes are created correctly
- [ ] Add sample data for testing
- [ ] Document database setup in ARCHITECTURE.md

### 7. Implement core data models
- [ ] Create Event model with Freezed
- [ ] Create Registration model with Freezed
- [ ] Create SyncLog model with Freezed
- [ ] Add validation logic to models
- [ ] Implement computed properties (isCheckedIn, attendanceDuration)
- [ ] Create enums (EventStatus, RegistrationRole, SyncStatus, SyncTarget)
- [ ] Add JSON serialization
- [ ] Write unit tests for models

### 8. Build registration UI
- [ ] Design app navigation structure
- [ ] Create home screen with event selection
- [ ] Build attendee registration form
  - [ ] Fields: Attendee Name, Attendee Surname, Impairment, Organization (autocomplete)
  - [ ] Fields: Email, Phone (at least one required)
  - [ ] Large, accessible input fields
  - [ ] Clear labels and instructions
  - [ ] Marketing consent checkbox with explanation
  - [ ] Photo consent checkbox with explanation
  - [ ] Form validation with clear error messages
- [ ] Build volunteer registration form
  - [ ] Same fields and accessibility features as attendee form
  - [ ] Role automatically set to "Volunteer"
- [ ] Create confirmation screen after registration
- [ ] Implement tablet-optimized layout (landscape/portrait)
- [ ] Add accessibility features:
  - [ ] Minimum 48x48 dp touch targets (prefer 72x72 dp)
  - [ ] High contrast colors (WCAG AA compliance)
  - [ ] Screen reader labels
  - [ ] Support for system font scaling
- [ ] Test on actual tablet devices

### 9. Implement attendance tracking
- [ ] Create check-in screen
  - [ ] Search/filter registered attendees
  - [ ] Quick check-in button
  - [ ] Display current attendance count
- [ ] Create check-out screen
  - [ ] List currently checked-in attendees
  - [ ] Quick check-out button
- [ ] Build attendance dashboard
  - [ ] Total registered count
  - [ ] Currently present count
  - [ ] Checked out count
  - [ ] Fire drill/emergency evacuation view
- [ ] Add timestamp recording for check-in/check-out
- [ ] Implement attendance duration calculation

### 10. Create CSV export functionality
- [ ] Design CSV export data structure
- [ ] Implement CSV generation with required fields:
  - [ ] Attendee Name
  - [ ] Attendee Surname
  - [ ] Impairment
  - [ ] Organization (looked up from organizationId)
  - [ ] Email
  - [ ] Phone
  - [ ] Role (Attendee/Volunteer)
  - [ ] Marketing consent (Yes/No)
  - [ ] Photo consent (Yes/No)
  - [ ] Check-in time
  - [ ] Check-out time
- [ ] Add date range filtering for exports
- [ ] Save CSV to device storage
- [ ] Create export history/log
- [ ] Add export preview before saving
- [ ] Test with 500+ records

### 11. Build sync framework
- [ ] Design sync engine architecture
- [ ] Implement sync status tracking
- [ ] Create sync queue for pending operations
- [ ] Add retry logic for failed syncs (max 3 attempts)
- [ ] Implement conflict resolution strategy (TBD with charity)
- [ ] Build sync UI:
  - [ ] Manual sync trigger button
  - [ ] Sync status indicator
  - [ ] Sync history/log viewer
  - [ ] Error notification and retry options
- [ ] Add background sync capability (optional)
- [ ] Test offline → online sync scenarios

### 12. Integrate external APIs
- [ ] **Airtable Integration:**
  - [ ] Install flutter_secure_storage for token storage
  - [ ] Create Airtable API client using Dio
  - [ ] Implement token storage in device keychain/keystore
  - [ ] Implement GET /v0/{baseId}/Events (fetch active event)
  - [ ] Implement GET /v0/{baseId}/Organizations (fetch org list)
  - [ ] Implement POST /v0/{baseId}/Registrations (create registration)
  - [ ] Implement PATCH /v0/{baseId}/Registrations/{id} (update check-in/out)
  - [ ] Map app data models to Airtable schema
  - [ ] Implement rate limiting (5 req/sec)
  - [ ] Handle API errors gracefully with retry logic
  - [ ] Test with actual Airtable account and access token
- [ ] **Mailchimp Integration:**
  - [ ] Set up API authentication
  - [ ] Implement export contacts endpoint
  - [ ] Respect marketing consent flags
  - [ ] Map app data to Mailchimp subscriber format
  - [ ] Handle API errors gracefully
  - [ ] Test with actual Mailchimp account
- [ ] **Google Drive Integration:**
  - [ ] Set up OAuth authentication
  - [ ] Implement CSV upload to Drive
  - [ ] Implement database backup to Drive
  - [ ] Create folder structure in Drive
  - [ ] Handle API errors gracefully
  - [ ] Test with actual Google account

### 13. Testing & Quality Assurance
- [ ] Write unit tests (target >80% coverage)
- [ ] Write widget tests for UI components
- [ ] Write integration tests for user flows
- [ ] Perform accessibility testing
- [ ] Performance testing with 500+ registrations
- [ ] Test on multiple tablet models
- [ ] Test offline functionality thoroughly
- [ ] Security audit (data encryption, GDPR compliance)
- [ ] User acceptance testing with Power2Inspire

### 14. Documentation & Deployment
- [ ] Create user manual/guide
- [ ] Create training materials for charity staff
- [ ] Document API integration setup
- [ ] Create deployment guide
- [ ] Set up CI/CD pipeline (optional)
- [ ] Prepare for Google Play Store submission
- [ ] Prepare for Apple App Store submission
- [ ] Create privacy policy
- [ ] Create terms of service

---

## 🤔 Questions & Decisions Needed

### From Power2Inspire (See INTEGRATION_DISCUSSION.md for details):
1. **Airtable Setup:** Do you have a workspace? What plan level? Who has admin access?
2. **Organization Data:** Existing list to import? How many organizations typically attend?
3. **Impairment Field:** Free text or dropdown? What are common values?
4. **Token Management:** Who generates tokens? Rotation schedule? Lost device protocol?
5. **Mailchimp Sync:** Direct from app or via Airtable automation?
6. **Data Retention:** How long to keep event data? GDPR retention policy?
7. **Consent Text:** Exact wording for marketing and photo consent checkboxes?
8. **Branding:** Logo, color scheme, and branding guidelines?
9. **Testing Devices:** What specific tablet models will be used?
10. **Sync Timing:** When should sync occur? (end of event, daily, manual only)

### Technical Decisions:
- [ ] Flutter SDK upgrade to resolve dependency conflicts? (Recommended)
- [ ] Use code generation or manual models? (Depends on SDK upgrade)
- [ ] Implement database encryption? (Recommended for GDPR)
- [ ] Add biometric/PIN lock for app access?
- [ ] Support multiple languages? (i18n)

---

## 📝 Notes

- Project is currently in **Airtable integration design phase**
- Direct API access approach approved for controlled environment
- Data model updated with name/surname split, impairment field, and organization entity
- Awaiting answers to questions in INTEGRATION_DISCUSSION.md before proceeding with coding
- All documentation is version controlled in git
- Database schema is drafted but not yet generated (pending dependency resolution)
- Dependencies are installed and ready to use
- Airtable base needs to be created with proposed schema

---

## 🎯 Next Immediate Steps

1. **Get answers** to questions in INTEGRATION_DISCUSSION.md from Power2Inspire
2. **Create Airtable base** with proposed schema (Events, Organizations, Registrations)
3. **Generate access token** for development and testing
4. **Import organization data** (if provided by charity)
5. **Resolve dependency conflicts** (consider Flutter SDK upgrade or manual approach)
6. **Generate database code** with build_runner or write manual Drift tables
7. **Begin UI development** with finalized field requirements
8. **Implement Airtable API client** for sync functionality

