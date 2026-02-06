# Power2Inspire Event CRM App - Requirements Specification

**Document Version:** 1.0  
**Date:** 2026-02-06  
**Project:** Event CRM Application for Power2Inspire Charity

## 1. Executive Summary

The Power2Inspire Event CRM App is a tablet-first, offline-capable mobile application designed to facilitate event management, attendee registration, volunteer coordination, and contact capture for a charitable organization. The application prioritizes accessibility, usability, and offline-first operation with on-demand synchronization to external systems.

## 2. Stakeholders

- **Primary Users:** Event attendees, volunteers, charity staff
- **Organization:** Power2Inspire (Charity)
- **Device Ownership:** Charity-controlled tablets at events
- **User Interaction Model:** Kiosk-style self-service registration

## 3. Functional Requirements

### 3.1 Event Management
- **FR-001:** Support single active event at a time
- **FR-002:** Event details editable offline at the event location
- **FR-003:** Event details may be pre-populated from Airtable when online
- **FR-004:** Event information includes: name, date, location, description

### 3.2 Attendee Registration
- **FR-010:** Capture attendee information: name, organization, email, phone
- **FR-011:** Record marketing consent (opt-in/opt-out)
- **FR-012:** Record photo consent for event photography
- **FR-013:** Assign role: Attendee or Volunteer
- **FR-014:** Validate required fields before submission
- **FR-015:** Support quick re-registration for returning attendees

### 3.3 Volunteer Registration
- **FR-020:** Capture volunteer-specific information
- **FR-021:** Track volunteer roles/responsibilities
- **FR-022:** Record volunteer availability and preferences

### 3.4 Attendance Tracking
- **FR-030:** Real-time check-in functionality
- **FR-031:** Check-out functionality for safety compliance
- **FR-032:** Display current attendance count
- **FR-033:** Support fire drill/emergency evacuation reporting
- **FR-034:** Track entry and exit timestamps

### 3.5 Contact Management
- **FR-040:** Store contact information for future marketing
- **FR-041:** Respect marketing consent preferences
- **FR-042:** Support contact deduplication
- **FR-043:** Export contacts for Mailchimp integration

### 3.6 Reporting & Export
- **FR-050:** Generate CSV reports with: names, organizations, emails, consent flags, photo consent, roles
- **FR-051:** Export attendance statistics
- **FR-052:** Export volunteer participation data
- **FR-053:** Support date-range filtering for reports
- **FR-054:** Save exports to local storage and Google Drive

### 3.7 Data Synchronization
- **FR-060:** Operate fully offline (no internet required during event)
- **FR-061:** On-demand sync to Airtable
- **FR-062:** On-demand sync to Mailchimp
- **FR-063:** On-demand backup to Google Drive
- **FR-064:** Conflict resolution strategy (to be defined with charity)
- **FR-065:** Sync status indicators and error reporting
- **FR-066:** Retry mechanism for failed sync operations

## 4. Non-Functional Requirements

### 4.1 Platform Support
- **NFR-001:** Support Android tablets (API level 21+)
- **NFR-002:** Support iOS tablets (iOS 12+)
- **NFR-003:** Optimize for tablet form factor (10-13 inch screens)
- **NFR-004:** Support mobile phones as secondary devices

### 4.2 Accessibility
- **NFR-010:** Large touch targets (minimum 48x48 dp)
- **NFR-011:** High contrast UI elements
- **NFR-012:** Screen reader compatibility
- **NFR-013:** Support for users with motor disabilities
- **NFR-014:** Clear, readable fonts (minimum 16sp for body text)
- **NFR-015:** Minimal, uncluttered interface design

### 4.3 Performance
- **NFR-020:** App launch time < 3 seconds
- **NFR-021:** Registration form submission < 1 second
- **NFR-022:** Support 500+ registrations per event
- **NFR-023:** Database query response < 100ms

### 4.4 Data Integrity
- **NFR-030:** Local data persistence using SQLite
- **NFR-031:** Automatic data backup before sync
- **NFR-032:** Transaction-based database operations
- **NFR-033:** Data validation at input and storage layers

### 4.5 Security
- **NFR-040:** Secure storage of personal data
- **NFR-041:** GDPR compliance for data collection
- **NFR-042:** Encrypted data transmission during sync
- **NFR-043:** No sensitive data in logs

## 5. External System Integrations

### 5.1 Airtable
- **Purpose:** CRM data storage (potential source of truth)
- **Operations:** Read event details, write registrations, sync contacts
- **API:** Airtable REST API v0

### 5.2 Mailchimp
- **Purpose:** Marketing communications (current primary system)
- **Operations:** Export contacts with consent, manage subscriber lists
- **API:** Mailchimp Marketing API v3

### 5.3 Google Drive
- **Purpose:** File storage and backup
- **Operations:** Upload CSV exports, backup database files
- **API:** Google Drive API v3

## 6. Data Model (High-Level)

### 6.1 Event
- ID, Name, Date, Location, Description, Status, Created/Modified timestamps

### 6.2 Registration
- ID, Event ID, Name, Organization, Email, Phone, Role, Marketing Consent, Photo Consent, Check-in Time, Check-out Time, Sync Status

### 6.3 Sync Log
- ID, Entity Type, Entity ID, Sync Target, Status, Timestamp, Error Message

## 7. Out of Scope (Current Version)
- Multi-event concurrent management
- User authentication/authorization
- Payment processing
- Advanced analytics/dashboards
- Push notifications
- QR code scanning

## 8. Future Considerations
- Determine single source of truth (Airtable vs Mailchimp vs App)
- Conflict resolution strategy for sync operations
- Multi-device coordination at same event
- Historical event analytics

