# Power2Inspire Event CRM App - Requirements Specification V2

**Document Version:** 2.1
**Date:** 2026-04-16
**Last Updated:** 2026-04-16
**Project:** Event CRM Web Application for Power2Inspire Charity
**Technology:** Next.js 16 + Vercel (Web Application)

---

## 1. Executive Summary

The Power2Inspire Event CRM App is a **web-based application** designed to facilitate event management, participant registration, volunteer coordination, and attendance tracking for a charitable organization. The application prioritizes accessibility, usability, and direct integration with Airtable for real-time data management.

**Key Changes from V1:**
- ✅ Web application (not mobile app) - accessible via browser on any device
- ✅ Direct Airtable integration (no offline sync complexity)
- ✅ Hosted on Vercel (free tier, $0 cost)
- ✅ Real-time data (no sync delays)
- ✅ Works on tablets, phones, and desktop

---

## 2. Stakeholders

- **Primary Users:** Event participants, volunteers, group leaders, charity staff
- **Organization:** Power2Inspire (Charity)
- **Device Access:** Charity-controlled tablets at events, staff phones/laptops
- **User Interaction Model:** Kiosk-style self-service registration via web browser
- **Technical Owner:** Power2Inspire IT/Admin team

---

## 3. Functional Requirements

### 3.1 Event Management
- **FR-001:** Support multiple events with dropdown selection (IMPLEMENTED)
- **FR-002:** Pre-select current active event in registration forms (IMPLEMENTED)
- **FR-003:** Event details managed in Airtable (name, date, location, status) (IMPLEMENTED)
- **FR-004:** Fetch active events from Airtable on page load (IMPLEMENTED)
- **FR-005:** Display current event information on home screen (IMPLEMENTED)

### 3.2 Participant Registration
- **FR-010:** Capture participant information: **First Name, Last Name, Email, Organization, Impairment** (all required) (IMPLEMENTED)
- **FR-011:** Select event from dropdown (pre-selected to current event, can change) (IMPLEMENTED)
- **FR-012:** Record marketing consent via radio buttons (Yes/No - explicit choice required) (IMPLEMENTED)
- **FR-013:** Record photo consent via radio buttons (Yes/No - explicit choice required) (IMPLEMENTED)
- **FR-014:** Display orange wristband language for photo consent refusal (IMPLEMENTED)
- **FR-015:** Assign role: Participant, Volunteer, or Group (IMPLEMENTED)
- **FR-016:** Validate all required fields before submission (client-side + server-side) (IMPLEMENTED)
- **FR-017:** Submit registration to Neon Postgres via server actions; sync to Airtable post-event (IMPLEMENTED)
- **FR-018:** Display confirmation screen with registration details (IMPLEMENTED)
- **FR-019:** ~~Phone number~~ - REMOVED (not required per V2 specifications)

### 3.3 Volunteer Registration
- **FR-020:** Volunteer role uses same base form as Participant registration (IMPLEMENTED)
- **FR-021:** Volunteer identification by email lookup against the `volunteers` table pre-populated from Airtable (IMPLEMENTED)
- **FR-022:** On successful volunteer email match, auto-populate First Name and Last Name from the volunteers record (IMPLEMENTED)
- **FR-023:** Volunteer form captures consent fields only: photoConsent, feedbackConsent, nextEventConsent (IMPLEMENTED)
- **FR-024:** Volunteer form does not capture Organization or Impairment fields (IMPLEMENTED)

### 3.4 Group Registration
- **FR-025:** Group role is for group leaders registering on behalf of their organisation (IMPLEMENTED)
- **FR-026:** Group leader selects their organisation from the closed-group organisations list (`openGroup === false` on organisationContacts) (IMPLEMENTED)
- **FR-027:** Group leader enters groupSize: the number of participants in their group NOT including the leader themselves (IMPLEMENTED)
- **FR-028:** Group leader enters disabledStudents and senStudents counts for their group (IMPLEMENTED)
- **FR-029:** Group leader selects their contact record from a contact picker pre-populated from the organisationContacts table (IMPLEMENTED)
- **FR-030:** Group leader indicates whether they are personally participating via groupLeaderParticipating boolean (IMPLEMENTED)
- **FR-031:** Auto-detect group leader: when a Participant's email matches a group leader contact record, the system auto-sets groupLeaderParticipating=true and copies expectedGroupSize as the initial groupSize value (IMPLEMENTED)

### 3.5 Organisation Management
- **FR-040:** Organisations imported from Airtable, stored in Neon Postgres (IMPLEMENTED)
- **FR-041:** Organisation selection uses a role-based filtered dropdown (IMPLEMENTED)
  - Participants see only open-group organisations (`openGroup !== false` on organisationContacts)
  - Group leaders see only closed-group organisations (`openGroup === false` on organisationContacts)
  - The `openGroup` boolean on `organisationContacts` is the single source of truth for filtering — `groupType` is never used for filtering logic
- **FR-042:** An "Individual" pseudo-organisation option is available for unaffiliated participants who do not belong to any group (IMPLEMENTED)
- **FR-043:** Link registrations to organisation records via organisationId (IMPLEMENTED)

### 3.6 Attendance Tracking
- **FR-050:** Real-time check-in functionality (IMPLEMENTED)
- **FR-051:** Check-out functionality for safety compliance (IMPLEMENTED)
- **FR-052:** Display current attendance statistics (checked in count, not checked in count) (IMPLEMENTED)
- **FR-053:** Support fire drill/emergency evacuation reporting (list of currently checked-in people) (IMPLEMENTED)
- **FR-054:** Track entry and exit timestamps (ISO 8601 format) (IMPLEMENTED)
- **FR-055:** Search/filter attendance list by name or email (IMPLEMENTED)
- **FR-056:** Filter by role (All, Participants, Volunteers, Groups) (IMPLEMENTED)
- **FR-057:** Visual distinction for checked-in participants (green border) (IMPLEMENTED)
- **FR-058:** Update Neon Postgres immediately on check-in/out; sync to Airtable post-event (IMPLEMENTED)

### 3.7 Reporting & Export
- **FR-060:** Generate CSV reports with fields:
  - Event Name, First Name, Last Name, Email
  - Organization, Impairment, Role
  - Photo Consent, Marketing Consent
  - Check-in Time, Check-out Time, Attendance Duration
  - groupSize, disabledStudents, senStudents, groupLeaderParticipating (for Group registrations)
- **FR-061:** Export attendance statistics (IMPLEMENTED)
- **FR-062:** Export volunteer participation data (IMPLEMENTED)
- **FR-063:** Support date-range filtering for reports (IMPLEMENTED)
- **FR-064:** Support event filtering for reports (IMPLEMENTED)
- **FR-065:** Download CSV file to user's device (IMPLEMENTED)
- **FR-066:** ~~Phone number~~ - REMOVED from CSV export

### 3.8 Data Integration
- **FR-070:** Registrations written to Neon Postgres on form submission; synced to Airtable post-event in batches (IMPLEMENTED)
- **FR-071:** Read from Neon Postgres for attendance list and reporting (IMPLEMENTED)
- **FR-072:** Organisations and volunteers imported from Airtable via admin import screen (IMPLEMENTED)
- **FR-073:** Handle API errors gracefully with user-friendly messages (IMPLEMENTED)
- **FR-074:** Airtable sync runs in batches of 10 with 250ms delays to respect rate limits (IMPLEMENTED)
- **FR-075:** ~~Offline operation~~ - REMOVED (requires internet connection)
- **FR-076:** ~~Sync to Mailchimp~~ - DEFERRED (can be done via Airtable automation)
- **FR-077:** ~~Sync to Google Drive~~ - DEFERRED (can be done via Airtable automation)

---

## 4. Non-Functional Requirements

### 4.1 Platform Support
- **NFR-001:** Support modern web browsers (Chrome, Safari, Firefox, Edge)
- **NFR-002:** Responsive design for tablets (10-13 inch screens) - PRIMARY
- **NFR-003:** Responsive design for phones (4-7 inch screens) - SECONDARY
- **NFR-004:** Responsive design for desktop (laptop/desktop monitors) - TERTIARY
- **NFR-005:** Optimize for landscape and portrait orientations
- **NFR-006:** ~~Android/iOS native apps~~ - REMOVED (web-only)

### 4.2 Accessibility (WCAG AA Compliance)
- **NFR-010:** Large touch targets (minimum 48x48 dp, prefer 72x72 dp)
- **NFR-011:** High contrast UI elements (4.5:1 minimum for text)
- **NFR-012:** Screen reader compatibility (semantic HTML + ARIA labels)
- **NFR-013:** Keyboard navigation support (all interactive elements accessible)
- **NFR-014:** Visible focus indicators
- **NFR-015:** Support for system font scaling
- **NFR-016:** Color not used as sole indicator of state

### 4.3 Performance
- **NFR-020:** Page load time < 2 seconds on 3G connection
- **NFR-021:** Form submission response < 1 second
- **NFR-022:** Attendance list load time < 3 seconds for 500 registrations
- **NFR-023:** Search/filter response < 500ms
- **NFR-024:** Lighthouse score: Performance 90+, Accessibility 100
- **NFR-025:** ~~Offline operation~~ - REMOVED (requires internet)

### 4.4 Security
- **NFR-030:** HTTPS-only (enforced by Vercel)
- **NFR-031:** Airtable API key stored server-side only (never exposed to browser)
- **NFR-032:** Environment variables for all secrets
- **NFR-033:** Input validation (client-side + server-side)
- **NFR-034:** XSS prevention (React auto-escaping + CSP headers)
- **NFR-035:** CORS configured for same-origin only
- **NFR-036:** Rate limiting on API routes (prevent abuse)

### 4.5 Reliability
- **NFR-040:** 99.9% uptime (Vercel SLA)
- **NFR-041:** Graceful error handling with user-friendly messages
- **NFR-042:** Automatic retry for failed API calls (max 3 attempts)
- **NFR-043:** Error logging for debugging
- **NFR-044:** ~~Offline data persistence~~ - REMOVED

### 4.6 Scalability
- **NFR-050:** Support 500+ registrations per event
- **NFR-051:** Support 10+ concurrent users
- **NFR-052:** Serverless functions scale automatically (Vercel)
- **NFR-053:** Airtable API rate limit: 5 requests/second (handled with batching and delays)

### 4.7 Usability
- **NFR-060:** Intuitive navigation (max 3 clicks to any feature)
- **NFR-065:** Error messages with clear next steps

### 4.8 Maintainability
- **NFR-070:** TypeScript for type safety (IMPLEMENTED)
- **NFR-071:** Zod schemas for validation (single source of truth) (IMPLEMENTED)
- **NFR-072:** Component-based architecture (React) (IMPLEMENTED)
- **NFR-073:** Separation of concerns (UI, server actions, database service, business logic) (IMPLEMENTED)
- **NFR-074:** Comprehensive documentation
- **NFR-075:** Git version control (IMPLEMENTED)
- **NFR-076:** Automated deployment (Vercel) (IMPLEMENTED)

---

## 5. Constraints

### 5.1 Technical Constraints
- **C-001:** Requires internet connectivity (no offline mode)
- **C-002:** Airtable API rate limit: 5 requests/second
- **C-003:** Vercel free tier limits: 100 GB bandwidth/month, 100 GB-hours serverless execution/month
- **C-004:** Browser compatibility: Modern browsers only (last 2 versions)
- **C-005:** No native mobile app features (push notifications, background sync, etc.)

### 5.2 Business Constraints
- **C-010:** Must use existing Airtable base structure (V2 schema)
- **C-011:** Must maintain V2 field requirements (Event, Email, Organization, Impairment all required for Participants)
- **C-012:** Must use radio buttons for consents (not checkboxes)
- **C-013:** Must display orange wristband language for photo consent refusal
- **C-014:** Budget: $0 hosting cost (Vercel free tier)

### 5.3 Timeline Constraints
- **C-020:** Development timeline: 10-15 days (4 phases)
- **C-021:** Must reuse V2 UI/UX specifications (wireframes, forms, validation)

---

## 6. Assumptions

### 6.1 Infrastructure Assumptions
- **A-001:** Events have reliable WiFi or cellular internet connectivity
- **A-002:** Tablets/devices have modern web browsers installed
- **A-003:** Airtable base already exists with V2 schema
- **A-004:** Airtable API access token can be generated by charity admin
- **A-005:** Vercel deployment can be managed by developer or charity IT team

### 6.2 User Assumptions
- **A-010:** Users are comfortable with web forms
- **A-011:** Users have basic tablet/touchscreen experience
- **A-012:** Charity staff can provide basic tech support at events
- **A-013:** Users understand consent language (photo + marketing)

### 6.3 Data Assumptions
- **A-020:** Organisation list is pre-populated from Airtable before event day
- **A-021:** Event details are created in Airtable before event day
- **A-022:** Volunteer list is imported from Airtable before event day
- **A-023:** Duplicate registrations are acceptable (no deduplication required)
- **A-024:** Data retention follows GDPR guidelines (to be confirmed by charity)

---

## 7. Dependencies

### 7.1 External Services
- **D-001:** Airtable API availability and uptime
- **D-002:** Vercel platform availability and uptime
- **D-003:** npm package ecosystem (React, Next.js, Zod, etc.)
- **D-004:** GitHub for version control and deployment triggers
- **D-005:** Neon serverless PostgreSQL availability and uptime

### 7.2 Third-Party Libraries
- **D-010:** Next.js 16 (App Router) (IMPLEMENTED)
- **D-011:** React 19 (IMPLEMENTED)
- **D-012:** TypeScript 5 (IMPLEMENTED)
- **D-013:** Tailwind CSS 4 (IMPLEMENTED)
- **D-014:** Shadcn/ui component library (Radix) (IMPLEMENTED)
- **D-015:** React Hook Form 7 (IMPLEMENTED)
- **D-016:** Zod 4 (validation) (IMPLEMENTED)
- **D-017:** Airtable.js 0.12 (IMPLEMENTED)
- **D-018:** Drizzle ORM + Neon serverless driver (IMPLEMENTED)

### 7.3 Data Dependencies
- **D-020:** Airtable base with V2 schema (Events, Organizations, Registrations tables)
- **D-021:** Organisation data pre-populated via Airtable import
- **D-022:** Event data created before event day
- **D-023:** Volunteer data imported from Airtable before event day

---

## 8. Outstanding Questions

### 8.1 Resolved Items (Previously TBD)

1. **Organisation Field Implementation — RESOLVED**
   - Decision: Role-based filtered dropdown. Participants see open-group organisations (`openGroup !== false`). Group leaders see closed-group organisations (`openGroup === false`). An "Individual" option is available for unaffiliated participants.
   - The `openGroup` boolean on `organisationContacts` is the single source of truth. `groupType` is never used for filtering.

2. **Conditional Fields for Participant vs Volunteer — RESOLVED**
   - Volunteers are identified by email lookup against the pre-populated `volunteers` table.
   - Volunteer form captures: photoConsent, feedbackConsent, nextEventConsent only.
   - Volunteer form does not show Organization or Impairment fields.
   - First Name and Last Name are auto-populated from the matched volunteer record.

3. **Admin Authentication — RESOLVED**
   - Client-side sessionStorage check: `adminAuth = "event"` for event admin, `adminAuth = "p2i"` for P2I admin.
   - No server-side session or JWT. Physical device security supplements this.

### 8.2 Medium Priority (Deferred)
4. **Mailchimp Integration:**
   - Decision: Deferred — handled via Airtable automation

5. **Google Drive Backup:**
   - Decision: Deferred — handled via Airtable automation

### 8.3 Low Priority (Nice to Have)
6. **Multi-language Support:**
   - Decision: English only (default)

7. **PWA Features:**
   - Decision: Not implemented (default: no)

---

## 9. Acceptance Criteria

### 9.1 Functional Acceptance
- ✅ Registration form validates all required fields (Event, First Name, Last Name, Email, Organization, Impairment for Participants)
- ✅ Consent radio buttons work correctly (force explicit Yes/No choice)
- ✅ Orange wristband language displays when photo consent = No
- ✅ Event dropdown pre-selects current event
- ✅ Organisation dropdown filters by role: Participants see open-group orgs; Group leaders see closed-group orgs
- ✅ Volunteer email lookup auto-populates name and consent fields
- ✅ Group registration captures groupSize, disabledStudents, senStudents, groupLeaderParticipating
- ✅ Registrations save to Neon Postgres successfully; sync to Airtable post-event
- ✅ Attendance tracking (check-in/out) updates Neon Postgres in real-time
- ✅ CSV export generates correct fields (V2 specification, no phone number)
- ✅ Search/filter works on attendance list

### 9.2 Non-Functional Acceptance
- ✅ WCAG AA compliance verified (Lighthouse Accessibility score 100)
- ✅ Touch targets minimum 48x48 dp (prefer 72x72 dp)
- ✅ Page load time < 2 seconds on 3G
- ✅ Form submission response < 1 second
- ✅ Lighthouse Performance score 90+
- ✅ Works on tablets (primary), phones (secondary), desktop (tertiary)
- ✅ Responsive design for landscape and portrait
- ✅ All API keys stored server-side only (never exposed to browser)
- ✅ HTTPS enforced (Vercel automatic)

### 9.3 Testing Acceptance
- ✅ Manual testing on multiple devices (tablet, phone, desktop)
- ✅ Manual testing on multiple browsers (Chrome, Safari, Firefox, Edge)
- ✅ End-to-end registration flow tested (Participant, Volunteer, Group)
- ✅ End-to-end attendance flow tested (check-in → check-out)
- ✅ CSV export tested with 100+ registrations
- ✅ Error handling tested (network errors, validation errors, API errors)
- ✅ Accessibility tested with screen reader

### 9.4 Deployment Acceptance
- ✅ Deployed to Vercel production
- ✅ Environment variables configured correctly
- ✅ Custom domain configured (if applicable)
- ✅ SSL certificate active (automatic via Vercel)
- ✅ Deployment guide documented (VERCEL_DEPLOYMENT_GUIDE.md)

### 9.5 Documentation Acceptance
- ✅ User guide created (how to register, check-in/out, export CSV)
- ✅ Admin guide created (how to manage events, organizations, access Airtable)
- ✅ Technical documentation complete (architecture, API routes, data models)
- ✅ Deployment guide complete (Vercel setup, environment variables)

---

## 10. Success Metrics

### 10.1 User Experience Metrics
- **M-001:** Registration completion rate > 95%
- **M-002:** Average registration time < 2 minutes
- **M-003:** User error rate < 5% (validation errors)
- **M-004:** Positive feedback from charity staff

### 10.2 Technical Metrics
- **M-010:** Uptime > 99.9% (Vercel SLA)
- **M-011:** API error rate < 1%
- **M-012:** Page load time < 2 seconds (95th percentile)
- **M-013:** Lighthouse scores: Performance 90+, Accessibility 100

### 10.3 Business Metrics
- **M-020:** Hosting cost = $0 (Vercel free tier)
- **M-021:** Development time = 10-15 days (vs 24-33 days for Flutter)
- **M-022:** Zero app store fees (vs $25 + $99/year for mobile apps)
- **M-023:** Works on all devices (tablets, phones, desktop)

---

## 11. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-06 | Development Team | Initial requirements for Flutter offline-first mobile app |
| 2.0 | 2026-02-11 | Development Team | Updated for Next.js web application approach after client review |
| 2.1 | 2026-04-16 | Development Team | Resolved all TBD items; added Group role requirements (FR-025–FR-031); updated technology to Next.js 16 / React 19 / Zod 4 / Tailwind 4 / Drizzle + Neon; renamed "Attendee" to "Participant" throughout; marked implemented requirements; fixed section ordering |

### Key Changes in V2.1:
- Updated technology stack: Next.js 16, React 19, Zod 4, Tailwind CSS 4, added Drizzle ORM + Neon PostgreSQL
- Resolved TBD: organisation field uses role-based `openGroup` filtering (not `groupType`)
- Resolved TBD: volunteer form uses email lookup, auto-populates name, captures consent fields only
- Resolved TBD: admin authentication uses client-side sessionStorage
- Added Group role requirements (FR-025–FR-031) including groupSize, disabledStudents, senStudents, groupLeaderParticipating, contact picker, and auto-detect logic
- Renamed "Attendee" to "Participant" throughout
- Marked all implemented requirements with (IMPLEMENTED) status
- Corrected data integration: Neon Postgres is primary store; Airtable sync is post-event

---

**Document End**

*This requirements specification was last updated on 2026-04-16 to reflect the implemented state of the Next.js 16 application.*
