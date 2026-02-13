# Power2Inspire Event CRM App - Requirements Specification V2

**Document Version:** 2.0
**Date:** 2026-02-11
**Project:** Event CRM Web Application for Power2Inspire Charity
**Technology:** NextJS 14 + Vercel (Web Application)

---

## 1. Executive Summary

The Power2Inspire Event CRM App is a **web-based application** designed to facilitate event management, attendee registration, volunteer coordination, and attendance tracking for a charitable organization. The application prioritizes accessibility, usability, and direct integration with Airtable for real-time data management.

**Key Changes from V1:**
- ✅ Web application (not mobile app) - accessible via browser on any device
- ✅ Direct Airtable integration (no offline sync complexity)
- ✅ Hosted on Vercel (free tier, $0 cost)
- ✅ Real-time data (no sync delays)
- ✅ Works on tablets, phones, and desktop

---

## 2. Stakeholders

- **Primary Users:** Event attendees, volunteers, charity staff
- **Organization:** Power2Inspire (Charity)
- **Device Access:** Charity-controlled tablets at events, staff phones/laptops
- **User Interaction Model:** Kiosk-style self-service registration via web browser
- **Technical Owner:** Power2Inspire IT/Admin team

---

## 3. Functional Requirements

### 3.1 Event Management
- **FR-001:** Support multiple events with dropdown selection
- **FR-002:** Pre-select current active event in registration forms
- **FR-003:** Event details managed in Airtable (name, date, location, status)
- **FR-004:** Fetch active events from Airtable on page load
- **FR-005:** Display current event information on home screen

### 3.2 Attendee Registration
- **FR-010:** Capture attendee information: **First Name, Last Name, Email, Organization, Impairment** (all required)
- **FR-011:** Select event from dropdown (pre-selected to current event, can change)
- **FR-012:** Record marketing consent via radio buttons (Yes/No - explicit choice required)
- **FR-013:** Record photo consent via radio buttons (Yes/No - explicit choice required)
- **FR-014:** Display orange wristband language for photo consent refusal
- **FR-015:** Assign role: Attendee or Volunteer
- **FR-016:** Validate all required fields before submission (client-side + server-side)
- **FR-017:** Submit registration directly to Airtable via API route
- **FR-018:** Display confirmation screen with registration details
- **FR-019:** ~~Phone number~~ - REMOVED (not required per V2 specifications)

### 3.3 Volunteer Registration
- **FR-020:** Same form as attendee registration with role = "Volunteer"
- **FR-021:** ~~Conditional fields TBD~~ - PENDING: Which 1-2 fields differ from attendee form?

### 3.4 Attendance Tracking
- **FR-030:** Real-time check-in functionality
- **FR-031:** Check-out functionality for safety compliance
- **FR-032:** Display current attendance statistics (checked in count, not checked in count)
- **FR-033:** Support fire drill/emergency evacuation reporting (list of currently checked-in people)
- **FR-034:** Track entry and exit timestamps (ISO 8601 format)
- **FR-035:** Search/filter attendance list by name or email
- **FR-036:** Filter by role (All, Attendees, Volunteers)
- **FR-037:** Visual distinction for checked-in attendees (green border)
- **FR-038:** Update Airtable immediately on check-in/out

### 3.5 Organization Management
- **FR-040:** Fetch organizations from Airtable for autocomplete
- **FR-041:** ~~Support adding new organizations~~ - PENDING: Dropdown only, free text, or autocomplete with add new?
- **FR-042:** Link registrations to organization records in Airtable

### 3.6 Reporting & Export
- **FR-050:** Generate CSV reports with V2 fields:
  - Event Name, First Name, Last Name, Email
  - Organization, Impairment, Role
  - Photo Consent, Marketing Consent
  - Check-in Time, Check-out Time, Attendance Duration
- **FR-051:** Export attendance statistics
- **FR-052:** Export volunteer participation data
- **FR-053:** Support date-range filtering for reports
- **FR-054:** Support event filtering for reports
- **FR-055:** Download CSV file to user's device
- **FR-056:** ~~Phone number~~ - REMOVED from CSV export

### 3.7 Data Integration
- **FR-060:** Direct write to Airtable on form submission (no offline storage)
- **FR-061:** Direct read from Airtable for attendance list
- **FR-062:** Real-time data (no sync delays)
- **FR-063:** Handle Airtable API errors gracefully with user-friendly messages
- **FR-064:** Retry failed API calls (max 3 attempts)
- **FR-065:** ~~Offline operation~~ - REMOVED (requires internet connection)
- **FR-066:** ~~Sync to Mailchimp~~ - DEFERRED (can be done via Airtable automation)
- **FR-067:** ~~Sync to Google Drive~~ - DEFERRED (can be done via Airtable automation)

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
- **NFR-034:** SQL injection prevention (N/A - no SQL database)
- **NFR-035:** XSS prevention (React auto-escaping + CSP headers)
- **NFR-036:** CORS configured for same-origin only
- **NFR-037:** Rate limiting on API routes (prevent abuse)

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
- **NFR-053:** Airtable API rate limit: 5 requests/second (handled by Vercel)

### 4.7 Usability
- **NFR-060:** Intuitive navigation (max 3 clicks to any feature)

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
- **C-011:** Must maintain V2 field requirements (Event, Email, Organization, Impairment all required)
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
- **A-020:** Organization list is pre-populated in Airtable
- **A-021:** Event details are created in Airtable before event day
- **A-022:** Duplicate registrations are acceptable (no deduplication required)
- **A-023:** Data retention follows GDPR guidelines (to be confirmed by charity)

---

## 7. Dependencies

### 7.1 External Services
- **D-001:** Airtable API availability and uptime
- **D-002:** Vercel platform availability and uptime
- **D-003:** npm package ecosystem (React, NextJS, Zod, etc.)
- **D-004:** GitHub for version control and deployment triggers

### 7.2 Third-Party Libraries
- **D-010:** NextJS 14 (App Router)
- **D-011:** React 18
- **D-012:** TypeScript 5
- **D-013:** Tailwind CSS 3
- **D-014:** Shadcn/ui component library
- **D-015:** React Hook Form 7
- **D-016:** Zod 3 (validation)
- **D-017:** Airtable.js 0.12

### 7.3 Data Dependencies
- **D-020:** Airtable base with V2 schema (Events, Organizations, Registrations tables)
- **D-021:** Organization data pre-populated in Airtable
- **D-022:** Event data created before event day

---

## 8. Outstanding Questions

### 8.1 High Priority (Must Answer Before Development)
1. **Organization Field Implementation:**
   - Option A: Dropdown only (select from existing organizations)
   - Option B: Free text only (type any organization name)
   - **Option C: Autocomplete with ability to add new** (RECOMMENDED)
   - **Decision:** TBD

2. **Conditional Fields for Attendee vs Volunteer:**
   - Current wireframe shows identical forms for both roles
   - **Question:** Which 1-2 fields should be different between Attendee and Volunteer forms?
   - **Decision:** TBD

### 8.2 Medium Priority (Can Be Decided During Development)
3. **Admin Authentication:**
   - Should admin features (attendance tracking, CSV export) require password protection?
   - Or rely on physical device security only?
   - **Decision:** TBD

4. **Mailchimp Integration:**
   - Direct from app or via Airtable automation?
   - **Recommendation:** Airtable automation (simpler)
   - **Decision:** TBD

5. **Google Drive Backup:**
   - Direct from app or via Airtable automation?
   - **Recommendation:** Airtable automation (simpler)
   - **Decision:** TBD

### 8.3 Low Priority (Nice to Have)
6. **Multi-language Support:**
   - English only or support additional languages?
   - **Decision:** TBD (default: English only)

7. **PWA Features:**
   - Add Progressive Web App features (install to home screen, offline support)?
   - **Decision:** TBD (default: no)

---

## 9. Acceptance Criteria

### 9.1 Functional Acceptance
- ✅ All 8 screens from wireframe V2 are functional
- ✅ Registration form validates all required fields (Event, First Name, Last Name, Email, Organization, Impairment)
- ✅ Consent radio buttons work correctly (force explicit Yes/No choice)
- ✅ Orange wristband language displays when photo consent = No
- ✅ Event dropdown pre-selects current event
- ✅ Organization field works as specified (TBD: dropdown/autocomplete/free text)
- ✅ Registrations save to Airtable successfully
- ✅ Attendance tracking (check-in/out) updates Airtable in real-time
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
- ✅ End-to-end registration flow tested (Attendee + Volunteer)
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
| 2.0 | 2026-02-11 | Development Team | Updated for NextJS web application approach after client review |

### Key Changes in V2:
- Changed from Flutter mobile app to NextJS web application
- Removed offline operation requirements (requires internet)
- Removed mobile app platform requirements (Android/iOS)
- Added web browser support requirements
- Removed phone number field (not required)
- Maintained all V2 field requirements (Event, Email, Organization, Impairment all required)
- Maintained consent radio button requirements
- Maintained orange wristband language
- Updated timeline from 24-33 days to 10-15 days
- Updated hosting from app stores to Vercel ($0 cost)

---

**Document End**

*This requirements specification was created on 2026-02-11 to document the NextJS web application approach for the Power2Inspire Event CRM App.*
- **NFR-065:** Error messages with clear next steps

### 4.8 Maintainability
- **NFR-070:** TypeScript for type safety
- **NFR-071:** Zod schemas for validation (single source of truth)
- **NFR-072:** Component-based architecture (React)
- **NFR-073:** Separation of concerns (UI, API routes, business logic)
- **NFR-074:** Comprehensive documentation
- **NFR-075:** Git version control
- **NFR-076:** Automated deployment (Vercel)


