# Power2Inspire Event CRM App - Project Status

**Last Updated:** 2026-02-06  
**Status:** Initial Setup Complete ✅

## Completed Tasks

### ✅ 1. Project Infrastructure
- **Git Repository:** Initialized at project root
- **Flutter Project:** Created in `software/flutter/event_crm_app`
  - Organization: `com.power2inspire`
  - Project Name: `event_crm_app`
  - Platforms: Android & iOS
  - Flutter Version: 3.32.0 (Dart 3.8.0)

### ✅ 2. Documentation
Created comprehensive documentation in `documentation/` folder:

- **REQUIREMENTS.md:** Complete functional and non-functional requirements
  - Event management (single event at a time)
  - Attendee and volunteer registration
  - Attendance tracking for safety compliance
  - Contact capture with consent management
  - CSV reporting capabilities
  - Offline-first with on-demand sync
  - External integrations (Airtable, Mailchimp, Google Drive)

- **ARCHITECTURE.md:** Technical architecture and design
  - Clean Architecture pattern (Presentation → Application → Domain → Infrastructure)
  - Technology stack decisions
  - Database schema design (SQLite with Drift)
  - Security and accessibility considerations
  - Testing strategy

- **DATA_MODELS.md:** Detailed data model specifications
  - Event entity with validation rules
  - Registration entity (attendees & volunteers)
  - Sync log entity for tracking external sync
  - Enums: EventStatus, RegistrationRole, SyncStatus, SyncTarget
  - CSV export DTO structure
  - Database indexes for performance

### ✅ 3. Dependencies Installed

**Core Dependencies:**
- `riverpod` ^3.2.1 - State management
- `flutter_riverpod` ^3.2.1 - Flutter integration for Riverpod
- `riverpod_annotation` ^4.0.2 - Code generation annotations
- `freezed_annotation` ^3.1.0 - Immutable data classes
- `json_annotation` ^4.9.0 - JSON serialization

**Database & Storage:**
- `drift` ^2.31.0 - Type-safe SQLite database
- `path_provider` ^2.1.5 - File system access
- `shared_preferences` ^2.5.3 - Simple key-value storage
- `uuid` ^4.5.2 - UUID generation

**Networking & Export:**
- `dio` ^5.9.1 - HTTP client for API calls
- `csv` ^6.0.0 - CSV file generation
- `intl` ^0.20.2 - Internationalization and date formatting

**Dev Dependencies:**
- `build_runner` ^2.7.1 - Code generation runner
- `freezed` ^3.2.3 - Code generator for data classes
- `json_serializable` ^6.11.2 - JSON serialization code gen
- `flutter_lints` ^5.0.0 - Linting rules

## Pending Tasks

### 🔲 3. Set up local database schema
- Implement Drift database with tables for Events, Registrations, and Sync Logs
- Create DAOs (Data Access Objects) for database operations
- Add database migrations support

### 🔲 4. Implement core data models
- Create Freezed models for Event, Registration, SyncLog
- Add validation logic
- Implement computed properties (e.g., isCheckedIn, attendanceDuration)

### 🔲 5. Build registration UI
- Design tablet-optimized layout with large touch targets
- Create registration form with accessibility features
- Implement form validation
- Add consent checkboxes (marketing, photo)

### 🔲 6. Implement attendance tracking
- Build check-in/check-out interface
- Display current attendance count
- Support fire drill/emergency reporting

### 🔲 7. Create CSV export functionality
- Generate CSV reports with required fields
- Save to local storage
- Prepare for Google Drive upload

### 🔲 8. Build sync framework
- Design sync engine architecture
- Implement retry logic for failed syncs
- Add conflict resolution (to be defined with charity)
- Create sync status UI

### 🔲 9. Integrate external APIs
- **Airtable:** Read events, write registrations
- **Mailchimp:** Export contacts with consent
- **Google Drive:** Upload CSV exports and database backups

## Known Issues & Considerations

### Dependency Version Conflicts
- **Issue:** `drift_dev` and `riverpod_generator` have conflicts with current Dart SDK (3.8.0)
- **Impact:** Code generation for Drift and Riverpod will need manual setup or SDK upgrade
- **Workaround:** Can use manual Drift table definitions or upgrade Flutter SDK
- **Recommendation:** Consider upgrading Flutter to latest stable version (run `flutter upgrade`)

### Source of Truth Decision Pending
- Need to determine with charity whether Airtable or Mailchimp is primary system
- This affects sync conflict resolution strategy
- Current approach: Local app is authoritative, syncs to both systems

### Multi-Device Coordination
- Current scope: Single device at event
- Future consideration: Multiple tablets at same event
- Would require real-time sync or server-side coordination

## Next Steps

1. **Immediate (This Week):**
   - Decide on Flutter SDK upgrade (recommended)
   - Set up database schema with Drift
   - Create core data models with Freezed
   - Build basic UI structure and navigation

2. **Short-term (Next 2 Weeks):**
   - Implement registration forms
   - Add attendance tracking
   - Create CSV export functionality
   - Test offline functionality

3. **Medium-term (Next Month):**
   - Integrate Airtable API
   - Integrate Mailchimp API
   - Integrate Google Drive API
   - Implement sync engine with retry logic
   - Conduct accessibility testing

4. **Before Production:**
   - User acceptance testing with Power2Inspire
   - Performance testing with 500+ registrations
   - Security audit (data encryption, GDPR compliance)
   - Create user documentation/training materials

## Questions for Power2Inspire

1. **Flutter SDK Upgrade:** Can we upgrade to the latest Flutter version? This will resolve dependency issues.

2. **Branding:** Do you have logo, color scheme, and branding guidelines for the app?

3. **Data Retention:** How long should event data be kept on the device? Should old events be archived?

4. **Sync Timing:** When should sync occur? (e.g., end of event, daily, manual only)

5. **Conflict Resolution:** If a contact exists in both Airtable and Mailchimp with different data, which takes precedence?

6. **Testing Devices:** What specific tablet models will be used? (for testing and optimization)

## Git Repository

- **Location:** `/Users/willjackson/Documents/Work/power2inspire/event-crm-app`
- **Initial Commit:** ✅ Complete
- **Commit Message:** "Initial project setup: Flutter app with documentation and dependencies"

## File Structure

```
event-crm-app/
├── .gitignore
├── documentation/
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODELS.md
│   └── PROJECT_STATUS.md (this file)
└── software/
    └── flutter/
        └── event_crm_app/
            ├── lib/
            │   └── main.dart
            ├── test/
            ├── android/
            ├── ios/
            └── pubspec.yaml
```

