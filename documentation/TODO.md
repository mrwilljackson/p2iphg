# Power2Inspire Event CRM App - TODO List

**Last Updated:** 2026-02-06  
**Project Status:** Requirements Gathering Phase

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

### 3. Install dependencies
- [x] State management (Riverpod)
- [x] Database (Drift/SQLite)
- [x] Networking (Dio)
- [x] CSV export (CSV package)
- [x] Code generation tools (Freezed, JSON Serializable, Build Runner)
- [x] Utilities (UUID, Path Provider, Shared Preferences, Intl)

---

## 🔄 In Progress

### 4. Gather detailed field requirements
- [ ] **AWAITING INPUT:** Specific fields required for Attendee registration
- [ ] **AWAITING INPUT:** Specific fields required for Volunteer registration
- [ ] **AWAITING INPUT:** Any differences between Attendee and Volunteer data capture
- [ ] **AWAITING INPUT:** Validation rules for each field (required/optional, format)
- [ ] **AWAITING INPUT:** Consent text for marketing and photo permissions
- [ ] Document field requirements in DATA_MODELS.md

---

## 📋 Pending Tasks

### 5. Set up local database schema
- [ ] Run build_runner to generate Drift database code
- [ ] Test database creation and migrations
- [ ] Verify indexes are created correctly
- [ ] Add sample data for testing
- [ ] Document database setup in ARCHITECTURE.md

### 6. Implement core data models
- [ ] Create Event model with Freezed
- [ ] Create Registration model with Freezed
- [ ] Create SyncLog model with Freezed
- [ ] Add validation logic to models
- [ ] Implement computed properties (isCheckedIn, attendanceDuration)
- [ ] Create enums (EventStatus, RegistrationRole, SyncStatus, SyncTarget)
- [ ] Add JSON serialization
- [ ] Write unit tests for models

### 7. Build registration UI
- [ ] Design app navigation structure
- [ ] Create home screen with event selection
- [ ] Build attendee registration form
  - [ ] Large, accessible input fields
  - [ ] Clear labels and instructions
  - [ ] Marketing consent checkbox with explanation
  - [ ] Photo consent checkbox with explanation
  - [ ] Form validation with clear error messages
- [ ] Build volunteer registration form
  - [ ] Same accessibility features as attendee form
  - [ ] Additional volunteer-specific fields (TBD)
- [ ] Create confirmation screen after registration
- [ ] Implement tablet-optimized layout (landscape/portrait)
- [ ] Add accessibility features:
  - [ ] Minimum 48x48 dp touch targets (prefer 72x72 dp)
  - [ ] High contrast colors (WCAG AA compliance)
  - [ ] Screen reader labels
  - [ ] Support for system font scaling
- [ ] Test on actual tablet devices

### 8. Implement attendance tracking
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

### 9. Create CSV export functionality
- [ ] Design CSV export data structure
- [ ] Implement CSV generation with required fields:
  - [ ] Name
  - [ ] Organization
  - [ ] Email
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

### 10. Build sync framework
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

### 11. Integrate external APIs
- [ ] **Airtable Integration:**
  - [ ] Set up API authentication
  - [ ] Implement read events endpoint
  - [ ] Implement write registrations endpoint
  - [ ] Map app data models to Airtable schema
  - [ ] Handle API errors gracefully
  - [ ] Test with actual Airtable account
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

### 12. Testing & Quality Assurance
- [ ] Write unit tests (target >80% coverage)
- [ ] Write widget tests for UI components
- [ ] Write integration tests for user flows
- [ ] Perform accessibility testing
- [ ] Performance testing with 500+ registrations
- [ ] Test on multiple tablet models
- [ ] Test offline functionality thoroughly
- [ ] Security audit (data encryption, GDPR compliance)
- [ ] User acceptance testing with Power2Inspire

### 13. Documentation & Deployment
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

### From Power2Inspire:
1. **Field Requirements:** What specific fields are needed for attendees vs volunteers?
2. **Branding:** Logo, color scheme, and branding guidelines?
3. **Data Retention:** How long to keep event data on device?
4. **Sync Timing:** When should sync occur? (end of event, daily, manual only)
5. **Conflict Resolution:** Which system takes precedence - Airtable or Mailchimp?
6. **Testing Devices:** What specific tablet models will be used?
7. **Consent Text:** Exact wording for marketing and photo consent?
8. **Source of Truth:** Is Airtable the primary CRM or is it Mailchimp?

### Technical Decisions:
- [ ] Flutter SDK upgrade to resolve dependency conflicts? (Recommended)
- [ ] Use code generation or manual models? (Depends on SDK upgrade)
- [ ] Implement database encryption? (Recommended for GDPR)
- [ ] Add biometric/PIN lock for app access?
- [ ] Support multiple languages? (i18n)

---

## 📝 Notes

- Project is currently in **requirements gathering phase**
- Awaiting detailed field requirements before proceeding with coding
- All documentation is version controlled in git
- Database schema is drafted but not yet generated
- Dependencies are installed and ready to use

---

## 🎯 Next Immediate Steps

1. **Gather field requirements** from Power2Inspire
2. Update DATA_MODELS.md with specific fields
3. Generate database code with build_runner
4. Begin UI development with concrete requirements
5. Implement registration forms with validated fields

