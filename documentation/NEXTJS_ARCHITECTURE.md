# NextJS Architecture - Power2Inspire Event CRM Web App

**Document Version:** 1.0  
**Date:** 2026-02-11  
**Status:** Architecture Design  
**Replaces:** Flutter offline-first mobile app approach

---

## Executive Summary

Following client review, the Power2Inspire Event CRM App will be built as a **NextJS web application** hosted on **Vercel** instead of a Flutter mobile app. This approach eliminates offline sync complexity while maintaining all V2 UI/UX specifications.

**Key Benefits:**
- ✅ 60% faster development (10-15 days vs 24-33 days)
- ✅ $0 hosting cost (Vercel free tier)
- ✅ No app store fees or approval delays
- ✅ Simpler architecture (direct Airtable integration)
- ✅ Works on any device (tablets, phones, desktop)
- ✅ All V2 wireframes and specifications remain valid

---

## 1. Technology Stack

### 1.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **NextJS** | 14.x (App Router) | React framework with server-side rendering |
| **React** | 18.x | UI component library |
| **TypeScript** | 5.x | Type safety and developer experience |
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **Shadcn/ui** | Latest | Accessible, customizable component library |
| **React Hook Form** | 7.x | Form state management and validation |
| **Zod** | 3.x | Schema validation (client + server) |

### 1.2 Backend (Serverless)
| Technology | Version | Purpose |
|------------|---------|---------|
| **NextJS API Routes** | 14.x | Serverless functions on Vercel |
| **Airtable.js** | 0.12.x | Official Airtable SDK |
| **CSV Writer** | npm package | CSV export generation |

### 1.3 Hosting & Deployment
| Service | Tier | Purpose |
|---------|------|---------|
| **Vercel** | Free (Hobby) | Hosting, CDN, serverless functions |
| **GitHub** | Free | Version control and CI/CD trigger |
| **Airtable** | Paid | Backend database |

---

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Devices                          │
│  (Tablets at events, Staff phones, Admin desktop)           │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│                  (Global CDN + HTTPS)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   NextJS Application                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Frontend (React Components)                         │  │
│  │  - Home Screen                                       │  │
│  │  - Registration Forms (Attendee/Volunteer)           │  │
│  │  - Attendance Tracking                               │  │
│  │  - Admin Dashboard                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (Serverless Functions)                   │  │
│  │  - POST /api/registrations                           │  │
│  │  - PATCH /api/attendance                             │  │
│  │  - GET /api/export                                   │  │
│  │  - GET /api/events                                   │  │
│  │  - GET /api/organizations                            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ Airtable API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      Airtable Base                           │
│  - Events Table                                              │
│  - Organizations Table                                       │
│  - Registrations Table                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

**Registration Flow:**
```
1. User fills form → 2. Client validation (Zod) → 3. Submit to API route
   ↓
4. Server validation (Zod) → 5. Write to Airtable → 6. Return success
   ↓
7. Show confirmation → 8. Redirect to home
```

**Attendance Flow:**
```
1. Load attendance list → 2. Fetch from Airtable → 3. Display in UI
   ↓
4. User clicks check-in → 5. API route updates Airtable → 6. Refresh list
```

---

## 3. Project Structure

### 3.1 Directory Layout

```
event-crm-web/
├── app/                          # NextJS 14 App Router
│   ├── layout.tsx                # Root layout (global styles, fonts)
│   ├── page.tsx                  # Home screen (Screen 1)
│   ├── event-info/
│   │   └── page.tsx              # Event info screen (Screen 2)
│   ├── register/
│   │   ├── page.tsx              # Registration type selection (Screen 3)
│   │   ├── attendee/
│   │   │   └── page.tsx          # Attendee form (Screen 4)
│   │   └── volunteer/
│   │       └── page.tsx          # Volunteer form (Screen 5)
│   ├── confirmation/
│   │   └── page.tsx              # Confirmation screen (Screen 6)
│   ├── attendance/
│   │   └── page.tsx              # Attendance list (Screen 7)
│   ├── admin/
│   │   └── page.tsx              # Admin menu (Screen 8)
│   └── api/
│       ├── registrations/
│       │   └── route.ts          # POST new registration
│       ├── attendance/
│       │   └── route.ts          # PATCH check-in/out
│       ├── export/
│       │   └── route.ts          # GET CSV export
│       ├── events/
│       │   └── route.ts          # GET active events
│       └── organizations/
│           └── route.ts          # GET organizations
├── components/
│   ├── ui/                       # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── radio-group.tsx
│   │   └── ...
│   ├── RegistrationForm.tsx      # Shared form component
│   ├── ConsentRadioGroup.tsx     # Photo + marketing consent
│   ├── EventDropdown.tsx         # Event selection
│   ├── OrganizationAutocomplete.tsx
│   ├── AttendanceList.tsx
│   ├── AttendanceListItem.tsx
│   └── StatsCard.tsx
├── lib/
│   ├── airtable.ts               # Airtable client singleton
│   ├── validation.ts             # Zod schemas
│   ├── types.ts                  # TypeScript types
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # App constants
├── public/
│   ├── logo.svg
│   └── ...
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Example env file
├── next.config.js                # NextJS configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── vercel.json                   # Vercel deployment config
```

---

## 4. API Routes Specification

### 4.1 POST /api/registrations
**Purpose:** Create new registration in Airtable

**Request Body:**
```typescript
{
  eventId: string;              // Airtable event record ID
  attendeeName: string;         // First name
  attendeeSurname: string;      // Last name
  email: string;                // Email address
  organizationId: string;       // Airtable organization record ID
  impairment: string;           // Accessibility needs
  role: "Attendee" | "Volunteer";
  photoConsent: boolean;        // false = orange wristband
  marketingConsent: boolean;    // false = no mailing list
}
```

**Response:**
```typescript
{
  success: true;
  recordId: string;             // Airtable record ID
  message: "Registration created successfully";
}
```

**Error Response:**
```typescript
{
  success: false;
  error: string;
  details?: any;
}
```

### 4.2 PATCH /api/attendance
**Purpose:** Update check-in or check-out time for a registration

**Request Body:**
```typescript
{
  recordId: string;             // Airtable record ID
  action: "checkin" | "checkout";
  timestamp: string;            // ISO 8601 format
}
```

**Response:**
```typescript
{
  success: true;
  message: "Check-in recorded successfully";
}
```

### 4.3 GET /api/export
**Purpose:** Generate CSV export of registrations

**Query Parameters:**
```typescript
{
  eventId?: string;             // Optional: filter by event
  startDate?: string;           // Optional: filter by date range
  endDate?: string;
}
```

**Response:**
- Content-Type: `text/csv`
- Filename: `registrations-{date}.csv`

**CSV Columns:**
- Event Name, First Name, Last Name, Email, Organization, Impairment, Role, Photo Consent, Marketing Consent, Check-in Time, Check-out Time, Registration Time

### 4.4 GET /api/events
**Purpose:** Fetch active events for dropdown

**Response:**
```typescript
{
  events: Array<{
    id: string;                 // Airtable record ID
    name: string;               // Event name
    date: string;               // Event date
    isActive: boolean;          // Currently active
  }>;
}
```

### 4.5 GET /api/organizations
**Purpose:** Fetch organizations for autocomplete

**Query Parameters:**
```typescript
{
  search?: string;              // Optional: filter by name
}
```

**Response:**
```typescript
{
  organizations: Array<{
    id: string;                 // Airtable record ID
    name: string;               // Organization name
  }>;
}
```

---

## 5. Security & Authentication

### 5.1 Environment Variables
All sensitive data stored in Vercel environment variables:

```bash
# .env.local (never committed to git)
AIRTABLE_API_KEY=keyXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://event-crm.vercel.app
```

### 5.2 API Route Security
- ✅ Airtable token **never exposed** to browser
- ✅ All Airtable calls happen server-side only
- ✅ API routes validate all inputs with Zod
- ✅ HTTPS enforced by Vercel
- ✅ CORS configured for same-origin only

### 5.3 Data Validation
**Client-Side (Browser):**
- React Hook Form + Zod validation
- Immediate feedback to user
- Prevents invalid submissions

**Server-Side (API Routes):**
- Zod schema validation on all inputs
- Sanitize data before Airtable write
- Return detailed error messages

---

## 6. Data Models (TypeScript)

### 6.1 Registration Type
```typescript
// lib/types.ts
export interface Registration {
  id?: string;                  // Airtable record ID (optional for new)
  eventId: string;              // Link to Events table
  attendeeName: string;         // First name
  attendeeSurname: string;      // Last name
  email: string;                // Email address
  organizationId: string;       // Link to Organizations table
  impairment: string;           // Accessibility needs
  role: "Attendee" | "Volunteer";
  photoConsent: boolean;        // false = orange wristband
  marketingConsent: boolean;    // false = no mailing list
  checkinTime?: string;         // ISO 8601 timestamp
  checkoutTime?: string;        // ISO 8601 timestamp
  createdAt?: string;           // Auto-generated by Airtable
}
```

### 6.2 Validation Schemas
```typescript
// lib/validation.ts
import { z } from "zod";

export const registrationSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  attendeeName: z.string().min(1, "First name is required"),
  attendeeSurname: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  organizationId: z.string().min(1, "Organization is required"),
  impairment: z.string().min(1, "Please specify accessibility needs"),
  role: z.enum(["Attendee", "Volunteer"]),
  photoConsent: z.boolean(),
  marketingConsent: z.boolean(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
```

---

## 7. Airtable Integration

### 7.1 Client Singleton
```typescript
// lib/airtable.ts
import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID!);

export const tables = {
  registrations: base("Registrations"),
  events: base("Events"),
  organizations: base("Organizations"),
};
```

### 7.2 Field Mappings
Maps TypeScript types to Airtable field names (from V2 documentation):

| App Field | Airtable Field | Type |
|-----------|----------------|------|
| eventId | Event | Link to Events |
| attendeeName | First Name | Single line text |
| attendeeSurname | Last Name | Single line text |
| email | Email | Email |
| organizationId | Organization | Link to Organizations |
| impairment | Do you have an impairment | Single line text |
| role | Role | Single select |
| photoConsent | Photo Consent | Checkbox |
| marketingConsent | Marketing Consent | Checkbox |
| checkinTime | Check-in Time | Date/time |
| checkoutTime | Check-out Time | Date/time |

---

## 8. Deployment Strategy

### 8.1 Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["lhr1"]
}
```

### 8.2 Deployment Workflow
1. **Development:** Push to feature branch → Vercel creates preview deployment
2. **Testing:** Test preview URL → Verify functionality
3. **Production:** Merge to `main` → Vercel auto-deploys to production
4. **Rollback:** One-click rollback in Vercel dashboard

### 8.3 Environment Variables Setup
1. Go to Vercel project settings
2. Add environment variables:
   - `AIRTABLE_API_KEY` (production + preview)
   - `AIRTABLE_BASE_ID` (production + preview)
   - `NEXT_PUBLIC_APP_URL` (production + preview)
3. Redeploy to apply changes

---

## 9. Testing Strategy

### 9.1 Unit Tests
- **Tool:** Jest + React Testing Library
- **Coverage:** Components, validation schemas, utility functions
- **Run:** `npm test`

### 9.2 Integration Tests
- **Tool:** Playwright
- **Coverage:** Full user flows (registration, attendance, export)
- **Run:** `npm run test:e2e`

### 9.3 Manual Testing Checklist
- [ ] Registration form validation (all fields)
- [ ] Consent radio buttons (orange wristband language)
- [ ] Event dropdown (pre-selection works)
- [ ] Organization autocomplete
- [ ] Attendance check-in/out
- [ ] CSV export
- [ ] Responsive design (tablet, phone, desktop)
- [ ] Accessibility (keyboard navigation, screen reader)

---

## 10. Performance Optimization

### 10.1 NextJS Features
- ✅ **Server-Side Rendering (SSR):** Fast initial page load
- ✅ **Static Generation:** Pre-render home page
- ✅ **Image Optimization:** Automatic image compression
- ✅ **Code Splitting:** Load only needed JavaScript
- ✅ **Edge Caching:** Vercel CDN caches static assets

### 10.2 Optimization Techniques
- **Lazy Loading:** Load attendance list on demand
- **Debouncing:** Organization autocomplete search
- **Memoization:** Cache event/organization lists
- **Compression:** Gzip/Brotli enabled by Vercel

---

## 11. Accessibility Implementation

### 11.1 WCAG AA Compliance
- ✅ **Color Contrast:** 4.5:1 minimum for text
- ✅ **Touch Targets:** 48x48 dp minimum (72x72 dp preferred)
- ✅ **Keyboard Navigation:** All interactive elements accessible
- ✅ **Screen Reader:** Semantic HTML + ARIA labels
- ✅ **Focus Indicators:** Visible focus states

### 11.2 Shadcn/ui Benefits
- Pre-built accessible components
- ARIA attributes included
- Keyboard navigation built-in
- Focus management handled

---

## 12. Migration from V2 Flutter Specs

### 12.1 What Stays the Same
✅ All 8 screens (UI/UX unchanged)
✅ Registration form fields
✅ Consent radio buttons
✅ Orange wristband language
✅ Event dropdown with pre-selection
✅ Organization autocomplete
✅ Attendance tracking
✅ CSV export
✅ Airtable field mappings
✅ Validation rules

### 12.2 What Changes
❌ Remove: Flutter, Dart, SQLite, offline sync
✅ Add: NextJS, React, Vercel, direct Airtable integration
✅ Benefit: 60% faster development, $0 hosting, simpler architecture

---

## 13. Development Timeline

### Phase 1: Setup (1-2 days)
- [ ] Initialize NextJS project
- [ ] Install dependencies (Tailwind, Shadcn/ui, Airtable.js, Zod)
- [ ] Set up TypeScript types
- [ ] Configure Vercel deployment
- [ ] Set up environment variables

### Phase 2: Core Features (4-6 days)
- [ ] Build registration forms (Attendee + Volunteer)
- [ ] Implement consent radio groups
- [ ] Create event dropdown
- [ ] Build organization autocomplete
- [ ] Implement API routes (POST /api/registrations)
- [ ] Add form validation (client + server)

### Phase 3: Attendance & Admin (2-3 days)
- [ ] Build attendance list screen
- [ ] Implement check-in/out functionality
- [ ] Create admin menu
- [ ] Build CSV export

### Phase 4: Polish & Testing (3-4 days)
- [ ] Responsive design (tablet, phone, desktop)
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] User acceptance testing

**Total Estimate:** 10-15 days

---

## 14. Outstanding Questions (from V2)

These questions still need answers before development:

1. **Organization Field Implementation:**
   - Pre-loaded dropdown only?
   - Free text only?
   - **Autocomplete with ability to add new?** (recommended)

2. **Conditional Fields:**
   - Which 1-2 fields should differ between Attendee and Volunteer forms?
   - Current wireframe has identical forms

---

## 15. Next Steps

### Immediate Actions:
1. ✅ Review this architecture document
2. ✅ Answer 2 outstanding questions
3. ✅ Update V2 documentation to reflect NextJS approach
4. ✅ Set up Vercel deployment configuration
5. ✅ Initialize NextJS project structure

### Development Sequence:
1. Create NextJS project with TypeScript + Tailwind
2. Install Shadcn/ui and configure theme
3. Set up Airtable client and environment variables
4. Build registration forms (reuse V2 wireframe HTML/CSS)
5. Implement API routes
6. Add attendance tracking
7. Build admin features
8. Test and deploy to Vercel

---

**Document End**

*This architecture document replaces the Flutter offline-first approach with a simpler NextJS web application hosted on Vercel. All V2 UI/UX specifications remain valid and will be implemented in React components.*


