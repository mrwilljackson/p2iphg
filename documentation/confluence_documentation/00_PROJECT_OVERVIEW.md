# Power2Inspire Event CRM App - Project Overview

**Project Type:** NextJS Web Application
**Organization:** Power2Inspire (Charity)
**Purpose:** Event registration, volunteer coordination, and attendance tracking
**Status:** Implementation In Progress - Registration Form Complete
**Last Updated:** 2026-02-13

---

## 🎯 Project Mission

Build a web-based application for Power2Inspire charity events that enables:
- Quick and accessible attendee/volunteer registration
- Real-time attendance tracking for safety compliance
- Contact capture with GDPR-compliant consent management
- Direct integration with Airtable CRM for real-time data management

---

## 🌐 Application Overview

### Target Platform
- **Devices:** Tablets (primary), phones (secondary), desktop (tertiary)
- **Deployment:** Vercel (free tier, $0 hosting cost)
- **Usage Model:** Web browser access, kiosk-style at events
- **Connectivity:** Requires internet connection (direct Airtable integration)

### Core Features
1. **Event Management** - Multiple events with dropdown selection
2. **Registration** - Attendee and volunteer sign-up with V2 fields
3. **Attendance Tracking** - Check-in/check-out for fire drill compliance
4. **Contact Capture** - Email with marketing consent (no phone number)
5. **CSV Reporting** - Export event data for analysis
6. **Airtable Integration** - Direct real-time data synchronization

---

## 🏗️ Technical Stack

- **Framework:** NextJS 16.1.6 (App Router + Turbopack)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Components:** Shadcn/ui (accessible component library)
- **Forms:** React Hook Form 7
- **Validation:** Zod 3 (client + server)
- **Icons:** Lucide React
- **Fonts:** next/font (Roboto for headings)
- **Database:** Neon PostgreSQL (EU West London, GDPR compliant)
- **ORM:** Drizzle ORM with Drizzle Kit
- **Backend:** NextJS API Routes (serverless functions on Vercel)
- **Hosting:** Vercel (serverless, edge network)
- **Export:** CSV generation via API route

---

## 📚 Documentation Structure

### 1. Project Planning
- **[Requirements V2](./01_PLANNING/REQUIREMENTS.md)** - NextJS web application requirements
- **[Project Status](./01_PLANNING/PROJECT_STATUS.md)** - Current implementation status ⭐ **UPDATED 2026-02-13**
- **[TODO & Task Tracking](./01_PLANNING/TODO.md)** - Current tasks organized into phases

### 2. Technical Design
- **[NextJS Architecture](./02_TECHNICAL/ARCHITECTURE.md)** - Complete NextJS architecture with implementation status ⭐ **UPDATED 2026-02-13**
- **[Data Models](./02_TECHNICAL/DATA_MODELS.md)** - Entity definitions with Neon PostgreSQL schema

### 3. Integration Design
- **[Airtable Integration](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)** - Field mappings and API examples
- **[Integration Discussion](./03_INTEGRATION/INTEGRATION_DISCUSSION.md)** - Integration decisions and questions

### 4. Development Notes
- **[Data Requirements](./04_DEVELOPMENT/data_requirements.md)** - Development data requirements

---

## 🎨 Key Design Principles

### Accessibility First
- WCAG AA compliance (Lighthouse Accessibility score 100)
- Large touch targets (minimum 48x48 dp, prefer 72x72 dp)
- High contrast UI for visually impaired users
- Screen reader support (semantic HTML + ARIA labels)
- Keyboard navigation support
- Clear, simple navigation

### Real-Time Integration
- Direct Airtable integration (no offline sync complexity)
- Immediate data visibility across all devices
- Server-side API routes for security
- Graceful error handling with user-friendly messages
- Automatic retry for failed API calls

### Security & Privacy
- GDPR compliant consent management
- Airtable API keys stored server-side only (never exposed to browser)
- HTTPS-only communication (enforced by Vercel)
- Input validation (client-side + server-side with Zod)
- XSS prevention (React auto-escaping + CSP headers)
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

## 🔄 Current Phase: Implementation In Progress

### ✅ Completed (as of 2026-02-13)

**Phase 1: Setup & Infrastructure (COMPLETE)**
- ✅ NextJS 16.1.6 project initialized with App Router and Turbopack
- ✅ TypeScript 5.x configured
- ✅ Tailwind CSS 4.x installed and configured
- ✅ Shadcn/ui components installed (button, input, label, select, radio-group, form, checkbox, command, popover, dialog)
- ✅ React Hook Form 7.x + Zod 3.x validation setup
- ✅ Vercel deployment configured and live at: https://p2iphg-ewodz4p4i-mrwilljackson-com.vercel.app
- ✅ GitHub repository connected for CI/CD
- ✅ Environment variables configured (.env.local)
- ✅ Neon PostgreSQL database setup (EU West London region, GDPR compliant)
- ✅ Drizzle ORM configured with schema and migrations
- ✅ Database schema created (events, organizations, registrations tables)

**Phase 2: Registration Form (COMPLETE)**
- ✅ Generic registration form component built
- ✅ Three registration types implemented (Attendee, Volunteer, Teacher/Coordinator)
- ✅ All V2 required fields implemented
- ✅ Conditional fields for Teacher/Coordinator (groupSize, senStudents, disabledStudents)
- ✅ Client-side validation with Zod schema
- ✅ Form state management with React Hook Form
- ✅ Mock data service for testing

**UI/UX Enhancements (COMPLETE)**
- ✅ Event header component with P2I logo and event details
- ✅ Roboto font applied to headings (matches P2I website)
- ✅ Responsive layout (mobile-first, tablet-optimized)
- ✅ Fully clickable selection boxes using native `<label>` wrapper pattern
- ✅ Hover effects on all interactive elements
- ✅ Lime green submit button (matches P2I logo) with purple click effect
- ✅ Horizontal field layouts for email, organization, and impairment
- ✅ Visual separators between form sections
- ✅ Gradient background for modern look
- ✅ Photo consent defaults to "Yes" (opt-out model)

### 🚧 In Progress / Pending

**API Routes (NOT STARTED)**
- [ ] POST /api/admin/seed - Seed database with mock data
- [ ] GET /api/events/current - Get current active event
- [ ] GET /api/organizations - Get all organizations
- [ ] POST /api/registrations - Submit registration to Neon database
- [ ] POST /api/admin/fetch-airtable - Fetch data from Airtable to Neon
- [ ] POST /api/admin/sync-airtable - Sync registrations from Neon to Airtable
- [ ] POST /api/admin/wipe-database - Clear all data from Neon

**Admin Dashboard (NOT STARTED)**
- [ ] Pre-event: "Fetch from Airtable" button
- [ ] During event: Live registration count display
- [ ] Post-event: "Sync to Airtable" button
- [ ] Post-event: "Wipe Database" button

**Attendance Tracking (NOT STARTED)**
- [ ] Attendance list screen
- [ ] Check-in/out functionality

**Airtable Integration (NOT STARTED)**
- [ ] Airtable API key configuration
- [ ] Fetch service (Airtable → Neon)
- [ ] Sync service (Neon → Airtable)

### 📋 Next Steps
1. Build API routes to connect form to database
2. Create admin dashboard for event management
3. Implement Airtable sync functionality
4. Build attendance tracking features
5. Testing and production deployment

---

## 📞 Key Contacts

**Development Team:** Augment Code  
**Client:** Power2Inspire Charity  
**Project Repository:** `/Users/willjackson/Documents/Work/power2inspire/event-crm-app`

---

## 🔗 Quick Links

- [Project Status](./01_PLANNING/PROJECT_STATUS.md) ⭐ **UPDATED 2026-02-13**
- [NextJS Architecture](./02_TECHNICAL/ARCHITECTURE.md) ⭐ **UPDATED 2026-02-13**
- [Requirements](./01_PLANNING/REQUIREMENTS.md)
- [Data Models](./02_TECHNICAL/DATA_MODELS.md)
- [Airtable Integration](./03_INTEGRATION/AIRTABLE_INTEGRATION.md)
- [TODO & Task Tracking](./01_PLANNING/TODO.md)

---

*This documentation is maintained in sync with the git repository and updated as the project evolves.*

