# Power2Inspire Event CRM App - TODO List

**Last Updated:** 2026-02-11
**Project Status:** NextJS Architecture Complete - Ready for Implementation
**Current Version:** V2 (Based on existing Airtable form)
**Technology:** NextJS 14 + Vercel (Web Application)

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

### 3. Create NextJS architecture documentation
- [x] Document technology stack (NextJS, React, TypeScript, Tailwind, Shadcn/ui)
- [x] Design architecture diagrams and data flows
- [x] Define project structure and directory layout
- [x] Specify API routes (registrations, attendance, export, events, organizations)
- [x] Document security and authentication approach
- [x] Create TypeScript types and Zod validation schemas
- [x] Document Airtable integration strategy
- [x] Define deployment strategy for Vercel
- [x] Create testing strategy
- [x] Document accessibility implementation (WCAG AA)
- [x] Estimate timeline (10-15 days)

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

## 📋 Pending Tasks (NextJS Implementation)

### 7. Phase 1: Project Setup (1-2 days)
- [ ] Initialize NextJS 14 project with TypeScript
  - [ ] Run `npx create-next-app@latest event-crm-web --typescript --tailwind --app`
  - [ ] Configure TypeScript strict mode
  - [ ] Set up ESLint and Prettier
- [ ] Install dependencies
  - [ ] `npm install airtable zod react-hook-form @hookform/resolvers`
  - [ ] `npm install -D @types/node`
- [ ] Install and configure Shadcn/ui
  - [ ] Run `npx shadcn-ui@latest init`
  - [ ] Install components: button, input, radio-group, select, label, card
- [ ] Set up project structure
  - [ ] Create `lib/` directory (airtable.ts, validation.ts, types.ts, utils.ts)
  - [ ] Create `components/` directory (ui/, RegistrationForm.tsx, etc.)
  - [ ] Create `app/api/` routes structure
- [ ] Configure environment variables
  - [ ] Create `.env.local` with Airtable credentials
  - [ ] Create `.env.example` template
  - [ ] Add to `.gitignore`
- [ ] Set up Vercel deployment
  - [ ] Create `vercel.json` configuration
  - [ ] Connect GitHub repository to Vercel
  - [ ] Configure environment variables in Vercel dashboard

### 8. Phase 2: Core Features (4-6 days)
- [ ] Create TypeScript types and Zod schemas
  - [ ] Define Registration interface (V2 fields)
  - [ ] Define Event and Organization interfaces
  - [ ] Create Zod validation schemas for all forms
  - [ ] Export types from `lib/types.ts`
- [ ] Set up Airtable integration
  - [ ] Create Airtable client singleton in `lib/airtable.ts`
  - [ ] Test connection to Airtable base
  - [ ] Verify table access (Events, Organizations, Registrations)
- [ ] Build API routes
  - [ ] POST `/api/registrations` - Create new registration
  - [ ] GET `/api/events` - Fetch active events
  - [ ] GET `/api/organizations` - Fetch organizations for autocomplete
  - [ ] Add server-side Zod validation
  - [ ] Add error handling and logging
- [ ] Build registration forms (Based on Wireframe V2)
  - [ ] **Screen 1: Home Screen** (`app/page.tsx`)
    - [ ] Current event card display
    - [ ] "NEW REGISTRATION" button (navigate to /register)
    - [ ] "ATTENDANCE LIST" button (navigate to /attendance)
    - [ ] "ADMIN" button (navigate to /admin)
  - [ ] **Screen 2: Event Info Screen** (`app/event-info/page.tsx`)
    - [ ] Event details display
    - [ ] Expected counts
    - [ ] Back navigation
  - [ ] **Screen 3: Registration Type** (`app/register/page.tsx`)
    - [ ] Attendee card (navigate to /register/attendee)
    - [ ] Volunteer card (navigate to /register/volunteer)
  - [ ] **Screen 4 & 5: Registration Forms**
    - [ ] Create shared `RegistrationForm.tsx` component
    - [ ] Attendee form (`app/register/attendee/page.tsx`)
    - [ ] Volunteer form (`app/register/volunteer/page.tsx`)
    - [ ] Event dropdown (pre-selected, can change)
    - [ ] First Name field (required)
    - [ ] Last Name field (required)
    - [ ] Email field (required, email validation)
    - [ ] Organization autocomplete (required)
    - [ ] Impairment field (required, free text)
    - [ ] Photo consent radio buttons (orange wristband language)
    - [ ] Marketing consent radio buttons
    - [ ] React Hook Form integration
    - [ ] Client-side Zod validation
    - [ ] Submit handler (POST to /api/registrations)
    - [ ] Loading states and error handling
  - [ ] **Screen 6: Confirmation** (`app/confirmation/page.tsx`)
    - [ ] Success message
    - [ ] Registration details summary
    - [ ] "REGISTER ANOTHER" button
    - [ ] "HOME" button


### 9. Phase 3: Attendance & Admin Features (2-3 days)
- [ ] Build attendance tracking (Screen 7: `app/attendance/page.tsx`)
  - [ ] Create API route: PATCH `/api/attendance` (check-in/out)
  - [ ] Fetch all registrations from Airtable
  - [ ] Search functionality (filter by name or email)
  - [ ] Filter tabs (All, Attendees, Volunteers)
  - [ ] Stats display (Checked In count, Not Checked In count)
  - [ ] Attendance list items:
    - [ ] Name, email, check-in status
    - [ ] CHECK IN button (green) or CHECK OUT button (orange)
    - [ ] Visual distinction for checked-in (green border)
  - [ ] Check-in functionality:
    - [ ] Record timestamp (ISO 8601)
    - [ ] Update Airtable via API route
    - [ ] Optimistic UI update
  - [ ] Check-out functionality:
    - [ ] Record timestamp (ISO 8601)
    - [ ] Calculate duration
    - [ ] Update Airtable via API route
- [ ] Build admin menu (Screen 8: `app/admin/page.tsx`)
  - [ ] Export CSV Report card
  - [ ] Stats summary (total registrations, checked in, etc.)
  - [ ] Settings card (future)
- [ ] Create CSV export functionality
  - [ ] Create API route: GET `/api/export`
  - [ ] Generate CSV with V2 fields:
    - [ ] Event Name, First Name, Last Name, Email
    - [ ] Organization, Impairment, Role
    - [ ] Photo Consent, Marketing Consent
    - [ ] Check-in Time, Check-out Time, Duration
  - [ ] Add date range filtering
  - [ ] Add event filtering
  - [ ] Return CSV file download
  - [ ] Test with 500+ records

### 10. Phase 4: Polish & Testing (3-4 days)
- [ ] Responsive design
  - [ ] Test on tablet (iPad, Android tablet)
  - [ ] Test on phone (iOS, Android)
  - [ ] Test on desktop
  - [ ] Optimize for landscape and portrait
  - [ ] Match styling from interactive wireframe V2
- [ ] Accessibility (WCAG AA compliance)
  - [ ] Minimum 48x48 dp touch targets (prefer 72x72 dp)
  - [ ] High contrast colors (4.5:1 minimum)
  - [ ] Keyboard navigation (all interactive elements)
  - [ ] Screen reader labels (ARIA attributes)
  - [ ] Focus indicators (visible focus states)
  - [ ] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] Performance optimization
  - [ ] Lazy load attendance list
  - [ ] Debounce organization autocomplete
  - [ ] Optimize images
  - [ ] Enable Vercel Edge caching
  - [ ] Test Lighthouse score (aim for 90+)
- [ ] Cross-browser testing
  - [ ] Safari (iOS/macOS)
  - [ ] Chrome (Android/desktop)
  - [ ] Firefox (desktop)
  - [ ] Edge (desktop)
- [ ] Error handling
  - [ ] Network errors (offline, timeout)
  - [ ] Validation errors (clear messages)
  - [ ] Airtable API errors
  - [ ] Loading states for all async operations
- [ ] Testing
  - [ ] Unit tests for validation schemas
  - [ ] Integration tests for API routes
  - [ ] E2E tests for critical flows (registration, attendance)
  - [ ] Manual testing on real devices

### 11. Deployment to Vercel
- [ ] Configure Vercel project
  - [ ] Connect GitHub repository
  - [ ] Set up environment variables (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)
  - [ ] Configure build settings
  - [ ] Set up custom domain (if needed)
- [ ] Deploy to production
  - [ ] Merge to main branch
  - [ ] Verify automatic deployment
  - [ ] Test production URL
  - [ ] Verify environment variables are working
- [ ] Set up preview deployments
  - [ ] Test preview URLs for feature branches
  - [ ] Configure preview environment variables
- [ ] Monitor and optimize
  - [ ] Set up Vercel Analytics
  - [ ] Monitor serverless function performance
  - [ ] Check error logs
  - [ ] Optimize cold start times

### 12. Documentation & Handoff
- [ ] Update README.md with:
  - [ ] Project overview
  - [ ] Setup instructions
  - [ ] Environment variables guide
  - [ ] Deployment instructions
  - [ ] Testing instructions
- [ ] Create user guide
  - [ ] How to register attendees/volunteers
  - [ ] How to track attendance
  - [ ] How to export CSV reports
  - [ ] Troubleshooting common issues
- [ ] Create admin guide
  - [ ] How to manage events in Airtable
  - [ ] How to manage organizations in Airtable
  - [ ] How to access and interpret data
  - [ ] How to update environment variables
- [ ] Training session
  - [ ] Walk through all features
  - [ ] Demonstrate on real tablets
  - [ ] Answer questions
  - [ ] Provide support contact info

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
- [x] **Technology Stack:** NextJS + Vercel (approved by client)
- [ ] Add authentication for admin features? (password protect admin menu)
- [ ] Support multiple languages? (i18n)
- [ ] Add PWA features? (install to home screen, offline support)

---

## 📝 Notes

- Project is currently in **NextJS Architecture Complete - Ready for Implementation** phase
- **Version 2.0** specifications based on existing PowerHouseGames Airtable volunteer signup form
- **Technology:** NextJS 14 + Vercel (web application, not Flutter mobile app)
- **Timeline:** 10-15 days (60% faster than Flutter approach)
- **Hosting:** Vercel free tier ($0 cost)
- Data model updated to V2 with required fields (eventId, email, organization, impairment)
- Phone field removed from V2 (not needed)
- Consent fields use radio buttons (not checkboxes) to force explicit choice
- Orange wristband language preserved for photo consent refusal
- Event dropdown with pre-selection to current event
- All documentation is version controlled in git
- Airtable base needs to be created with V2 schema (updated field names)
- Interactive HTML wireframe V2 available for stakeholder review and can be used as styling reference
- All core documentation aligned: NEXTJS_ARCHITECTURE.md, UI_WIREFRAMES_V2.md, DATA_MODELS.md V2, AIRTABLE_INTEGRATION.md V2

---

## 🎯 Next Immediate Steps

1. **Get answers** to remaining questions:
   - Organization field implementation (dropdown/autocomplete/free text)
   - Conditional fields for Attendee vs Volunteer (1-2 fields difference)
   - Airtable workspace details and access
   - Token management process
2. **Create Airtable base** with V2 schema:
   - Events table (with Event Name, Event Date, Location, Status)
   - Organizations table (with Organization Name)
   - Registrations table (with V2 field names: First Name, Last Name, Email, Organization, Do you have an impairment, Photo Consent, Marketing Consent)
3. **Generate access token** for development and testing
4. **Import organization data** (if provided by charity)
5. **Set up Vercel deployment**:
   - Connect GitHub repository to Vercel
   - Configure environment variables (AIRTABLE_API_KEY, AIRTABLE_BASE_ID)
   - Test preview deployments
6. **Initialize NextJS project**:
   - Run `npx create-next-app@latest event-crm-web --typescript --tailwind --app`
   - Install dependencies (Airtable.js, Zod, React Hook Form, Shadcn/ui)
   - Set up project structure (lib/, components/, app/api/)
7. **Begin NextJS development** based on Wireframe V2:
   - Create TypeScript types and Zod schemas
   - Build API routes (registrations, events, organizations, attendance, export)
   - Build React components for all 8 screens
   - Implement consent radio buttons with exact text
8. **Test end-to-end flow** with actual Airtable base
9. **Deploy to production** on Vercel

