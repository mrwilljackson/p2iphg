# Power2Inspire Event CRM App - Project Overview

**Project Type:** NextJS Web Application
**Organization:** Power2Inspire (Charity)
**Purpose:** Event registration, volunteer coordination, and attendance tracking
**Status:** NextJS Architecture Complete - Ready for Implementation
**Last Updated:** 2026-02-11

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

- **Framework:** NextJS 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3
- **Components:** Shadcn/ui (accessible component library)
- **Forms:** React Hook Form 7
- **Validation:** Zod 3 (client + server)
- **Backend:** Airtable (direct REST API access via serverless functions)
- **Hosting:** Vercel (serverless, edge network)
- **Export:** CSV generation via API route

---

## 📚 Documentation Structure

### 1. Project Planning
- **[Requirements V2](../REQUIREMENTS_V2.md)** - NextJS web application requirements (359 lines)
- **[Requirements V1](./01_PLANNING/REQUIREMENTS.md)** - Original Flutter requirements (archived)
- **[TODO & Task Tracking](../TODO.md)** - Current tasks organized into 4 phases (10-15 days)
- **[V2 Changes Summary](../V2_CHANGES_SUMMARY.md)** - Summary of all V2 changes for stakeholders

### 2. Technical Design
- **[NextJS Architecture](../NEXTJS_ARCHITECTURE.md)** - Complete NextJS architecture (596 lines)
- **[Architecture V1](./02_TECHNICAL/ARCHITECTURE.md)** - Original Flutter architecture (archived)
- **[Data Models V2](../DATA_MODELS.md)** - V2 entity definitions with required fields
- **[UI Wireframes V2](../UI_WIREFRAMES_V2.md)** - Complete wireframe specifications (552 lines)
- **[Interactive Wireframe V2](../wireframes/interactive-wireframe-v2.html)** - Clickable prototype

### 3. Integration Design
- **[Airtable Integration V2](../AIRTABLE_INTEGRATION.md)** - V2 field mappings and API examples
- **[Vercel Deployment Guide](../VERCEL_DEPLOYMENT_GUIDE.md)** - Step-by-step deployment (150 lines)

### 4. Development Notes
- **[Existing Form Analysis](../EXISTING_FORM_ANALYSIS.md)** - Analysis of PowerHouseGames form
- **[Confluence Upload Guide](../CONFLUENCE_UPLOAD_GUIDE.md)** - How to upload docs to Confluence

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

## 🔄 Current Phase: NextJS Architecture Complete - Ready for Implementation

### ✅ Completed
- ✅ Project infrastructure setup (git repository)
- ✅ Comprehensive V2 documentation (requirements, architecture, wireframes)
- ✅ NextJS architecture document (596 lines)
- ✅ Vercel deployment configuration (vercel.json, .env.example, .vercelignore)
- ✅ Vercel deployment guide (150 lines)
- ✅ Requirements V2 specification (359 lines)
- ✅ Data models updated with V2 fields (Event, Email, Organization, Impairment all required)
- ✅ Airtable integration approach defined (direct API access via serverless functions)
- ✅ Security assessment completed (server-side API keys, HTTPS, validation)
- ✅ All V2 documentation aligned (TODO.md, V2_CHANGES_SUMMARY.md updated)

### 🔄 Outstanding Questions (Need Answers Before Development)
1. **HIGH PRIORITY:** Organization field implementation (dropdown/autocomplete/free text)
2. **HIGH PRIORITY:** Conditional fields for Attendee vs Volunteer (which 1-2 fields differ)
3. **MEDIUM:** Admin authentication (password protect admin features?)
4. **MEDIUM:** Mailchimp integration (direct or via Airtable automation)
5. **MEDIUM:** Google Drive backup (direct or via Airtable automation)

### 📋 Next Steps
1. Get answers to 2 high-priority questions
2. Create Airtable base with V2 schema (Events, Organizations, Registrations tables)
3. Generate Airtable access token for development
4. Initialize NextJS project (`npx create-next-app@latest`)
5. Install dependencies (Airtable.js, Zod, React Hook Form, Shadcn/ui)
6. Begin NextJS development (4 phases, 10-15 days total)
7. Deploy to Vercel production

---

## 📞 Key Contacts

**Development Team:** Augment Code  
**Client:** Power2Inspire Charity  
**Project Repository:** `/Users/willjackson/Documents/Work/power2inspire/event-crm-app`

---

## 🔗 Quick Links

- [Requirements V2 (NextJS)](../REQUIREMENTS_V2.md)
- [NextJS Architecture](../NEXTJS_ARCHITECTURE.md)
- [Airtable Integration V2](../AIRTABLE_INTEGRATION.md)
- [Current TODO List](../TODO.md)
- [V2 Changes Summary](../V2_CHANGES_SUMMARY.md)
- [Vercel Deployment Guide](../VERCEL_DEPLOYMENT_GUIDE.md)
- [Interactive Wireframe V2](../wireframes/interactive-wireframe-v2.html)

---

*This documentation is maintained in sync with the git repository and updated as the project evolves.*

