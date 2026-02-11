# Power2Inspire Event CRM App - Project Overview

**Project Type:** Flutter Mobile Application  
**Organization:** Power2Inspire (Charity)  
**Purpose:** Event registration, volunteer coordination, and attendance tracking  
**Status:** Airtable Integration Design Phase  
**Last Updated:** 2026-02-11

---

## 🎯 Project Mission

Build a tablet-based, offline-first mobile application for Power2Inspire charity events that enables:
- Quick and accessible attendee/volunteer registration
- Real-time attendance tracking for safety compliance
- Contact capture with GDPR-compliant consent management
- Seamless synchronization with Airtable CRM and Mailchimp

---

## 📱 Application Overview

### Target Platform
- **Devices:** Charity-owned Android/iOS tablets
- **Deployment:** Controlled environment (not public app stores)
- **Usage Model:** Kiosk-style, shared device at events
- **Connectivity:** Offline-first with on-demand sync

### Core Features
1. **Event Management** - Single active event per device
2. **Registration** - Attendee and volunteer sign-up
3. **Attendance Tracking** - Check-in/check-out for fire drill compliance
4. **Contact Capture** - Email/phone with marketing consent
5. **CSV Reporting** - Export event data for analysis
6. **Airtable Sync** - Bi-directional data synchronization

---

## 🏗️ Technical Stack

- **Framework:** Flutter 3.32.0 (Dart 3.8.0)
- **Architecture:** Clean Architecture (4-layer)
- **State Management:** Riverpod 3.2.1
- **Database:** Drift (SQLite) - offline-first
- **Networking:** Dio 5.9.1 with retry logic
- **Backend:** Airtable (direct REST API access)
- **Export:** CSV package for reporting

---

## 📚 Documentation Structure

### 1. Project Planning
- **[Requirements](./01_PLANNING/REQUIREMENTS.md)** - Functional and non-functional requirements
- **[TODO & Task Tracking](./01_PLANNING/TODO.md)** - Current tasks and progress
- **[Project Status](./01_PLANNING/PROJECT_STATUS.md)** - Status snapshot and known issues

### 2. Technical Design
- **[Architecture](./02_TECHNICAL/ARCHITECTURE.md)** - System architecture and design decisions
- **[Data Models](./02_TECHNICAL/DATA_MODELS.md)** - Entity definitions and validation rules

### 3. Integration Design
- **[Airtable Integration](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)** - Backend integration specification
- **[Integration Discussion](./03_INTEGRATION/INTEGRATION_DISCUSSION.md)** - Decisions and outstanding questions

### 4. Development Notes
- **[Data Requirements](./04_DEVELOPMENT/data_requirements.md)** - Field requirements and working notes

---

## 🎨 Key Design Principles

### Accessibility First
- WCAG AA compliance
- Large touch targets (72x72 dp preferred)
- High contrast UI for visually impaired users
- Screen reader support
- Clear, simple navigation

### Offline First
- All operations work without internet
- Local SQLite database as primary storage
- On-demand sync to Airtable
- Graceful handling of sync failures

### Security & Privacy
- GDPR compliant consent management
- Secure token storage (iOS Keychain/Android Keystore)
- HTTPS-only communication
- Data encryption at rest
- Minimal data retention

### Medical Device Standards
- Following IEC 62304 principles
- Comprehensive documentation
- Traceability of requirements
- Risk assessment and mitigation
- Quality assurance processes

---

## 👥 User Types

### Attendees
- Event participants
- Register with name, contact info, organization
- Provide consent for marketing and photos
- Check in/out for attendance tracking

### Volunteers
- Event helpers and staff
- Same registration process as attendees
- Marked with "Volunteer" role
- May have additional responsibilities

### Staff (App Operators)
- Charity employees operating the tablet
- Manage event details
- Trigger sync operations
- Export CSV reports
- Handle device setup

---

## 🔄 Current Phase: Airtable Integration Design

### ✅ Completed
- Project infrastructure setup
- Comprehensive documentation
- Dependencies installed
- Airtable integration approach defined
- Data models updated with new fields
- Security assessment completed

### 🔄 In Progress
- Finalizing Airtable setup
- Awaiting answers to integration questions
- Planning database schema implementation

### 📋 Next Steps
1. Get answers to outstanding questions
2. Create Airtable base with proposed schema
3. Generate access token for development
4. Resolve dependency conflicts
5. Begin UI development

---

## 📞 Key Contacts

**Development Team:** Augment Code  
**Client:** Power2Inspire Charity  
**Project Repository:** `/Users/willjackson/Documents/Work/power2inspire/event-crm-app`

---

## 🔗 Quick Links

- [View All Requirements](./01_PLANNING/REQUIREMENTS.md)
- [Technical Architecture](./02_TECHNICAL/ARCHITECTURE.md)
- [Airtable Integration Plan](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)
- [Current TODO List](./01_PLANNING/TODO.md)
- [Outstanding Questions](./03_INTEGRATION/INTEGRATION_DISCUSSION.md#outstanding-questions)

---

*This documentation is maintained in sync with the git repository and updated as the project evolves.*

