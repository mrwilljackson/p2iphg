# Power2Inspire Event CRM App - V2 Changes Summary

**Document Version:** 1.0
**Date:** 2026-02-11
**Status:** Ready for Stakeholder Review
**Purpose:** Summary of all changes from initial design to V2 specifications

---

## Executive Summary

The Power2Inspire Event CRM App specifications have been updated to **Version 2.0** based on analysis of the existing PowerHouseGames (PHG) volunteer signup Airtable form. Following client review, the project will be built as a **NextJS web application** hosted on **Vercel** instead of a Flutter mobile app, eliminating offline sync complexity while maintaining all V2 UI/UX specifications.

**Key Outcomes:**
- ✅ All V2 UI/UX specifications remain valid and will be implemented in React
- ✅ 60% faster development (10-15 days vs 24-33 days)
- ✅ $0 hosting cost on Vercel free tier
- ✅ Direct Airtable integration (no offline sync needed)
- ✅ Works on any device (tablets, phones, desktop)

---

## 1. What Changed and Why

### 1.1 Analysis Process
- **Date:** 2026-02-11
- **Source:** Existing PowerHouseGames volunteer signup form (https://airtable.com/appIeSZKJnzKfqKea/shreia8ATAOeunxD2)
- **Method:** Browser automation analysis + stakeholder feedback
- **Result:** V2 specifications that match existing proven workflows

### 1.2 Key Decisions Made
1. **Event Selection:** Dropdown with pre-selection to current event (can be changed)
2. **Consent Pattern:** Radio buttons (not checkboxes) to force explicit yes/no choice
3. **Required Fields:** Event, First Name, Last Name, Email, Organization, Impairment all required
4. **Phone Field:** Removed (not needed per user requirements)
5. **Orange Wristband:** Preserved exact language for photo consent refusal
6. **Form Structure:** Single form for both Attendee and Volunteer (1-2 conditional fields TBD)

---

## 2. Field Changes Summary

### 2.1 Fields Made REQUIRED (were optional in V1)
| Field | V1 Status | V2 Status | Reason |
|-------|-----------|-----------|--------|
| Event | Required | **Required (emphasized)** | Must know which event for registration |
| Email | Optional | **Required** | Matches existing form, needed for contact |
| Organization | Optional | **Required** | Matches existing form, important for reporting |
| Impairment | Optional | **Required** | Matches existing form, critical for accessibility |

### 2.2 Fields REMOVED
| Field | V1 Status | V2 Status | Reason |
|-------|-----------|-----------|--------|
| Phone | Optional | **REMOVED** | Not in existing form, not needed per user |

### 2.3 Fields RENAMED
| V1 Name | V2 Name | Reason |
|---------|---------|--------|
| Attendee Name | **First Name** | Matches existing Airtable form |
| Attendee Surname | **Last Name** | Matches existing Airtable form |
| Impairment | **Do you have an impairment** | Matches existing form question text |

### 2.4 Fields ADDED
| Field | Type | Purpose |
|-------|------|---------|
| App Record ID | String (UUID) | Bidirectional sync tracking between app and Airtable |
| airtableRecordId | String | Store Airtable's auto-generated record ID after sync |

---

## 3. User Interface Changes

### 3.1 Screen Count
- **V1:** 9 screens (including separate consent screen)
- **V2:** 8 screens (consents moved to registration forms)

### 3.2 Registration Form Changes

**Event Selection:**
- **V1:** Not specified
- **V2:** Dropdown with pre-selected current event, can change to other events

**Organization Field:**
- **V1:** Simple text input or dropdown
- **V2:** Autocomplete with datalist (can select existing or type new)
- **Outstanding Question:** Confirm autocomplete approach vs dropdown-only

**Consent Fields:**
- **V1:** Checkboxes on separate screen
- **V2:** Radio buttons on registration form (same screen as other fields)

**Photo Consent Text:**
```
○ Yes, I consent to the use of photographs as specified
○ No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way
```

**Marketing Consent Text:**
```
○ Yes, I would like to hear from Power2Inspire
○ No, please don't add me to the mailing list
```

### 3.3 Complete Screen List (V2)
1. **Home Screen** - Event card with three main buttons
2. **Event Info Screen** - Event details and statistics
3. **Registration Type Screen** - Choose Attendee or Volunteer
4. **Registration Form (Attendee)** - All fields including consents
5. **Registration Form (Volunteer)** - All fields including consents
6. **Confirmation Screen** - Success message and summary
7. **Attendance List Screen** - Search, filter, check-in/out
8. **Admin Menu Screen** - Sync, export, settings

---

## 4. Data Model Changes

### 4.1 Registration Entity (V2)
```
Registration {
  id: String (UUID)
  eventId: String (required) - Airtable event record ID
  attendeeName: String (required) - First name
  attendeeSurname: String (required) - Last name
  email: String (required) - Email address
  organizationId: String (required) - Airtable organization record ID
  impairment: String (required) - Free text accessibility needs
  role: String (required) - "Attendee" or "Volunteer"
  photoConsent: Boolean (required) - false = orange wristband
  marketingConsent: Boolean (required) - false = no mailing list
  checkinTime: DateTime (optional)
  checkoutTime: DateTime (optional)
  airtableRecordId: String (optional) - Populated after sync
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Key Changes:**
- ✅ eventId now required
- ✅ email now required
- ✅ organizationId now required
- ✅ impairment now required
- ❌ phone removed
- ✅ airtableRecordId added for sync tracking

---

## 5. Airtable Integration Changes

### 5.1 Registrations Table Schema (V2)

| Airtable Field Name | Type | Required | Notes |
|---------------------|------|----------|-------|
| Registration ID | Auto Number | Yes | Auto-generated |

### 5.2 Field Mapping (App ↔ Airtable)

| App Field | Airtable Field | Conversion |
|-----------|----------------|------------|
| `id` | `App Record ID` | Direct string |
| `eventId` | `Event` | String → Link (record ID) |
| `attendeeName` | `First Name` | Direct string |
| `attendeeSurname` | `Last Name` | Direct string |
| `email` | `Email` | Direct string |
| `organizationId` | `Organization` | String → Link (record ID) |
| `impairment` | `Do you have an impairment` | Direct string |
| `role` | `Role` | Direct string |
| `photoConsent` | `Photo Consent` | Boolean → Checkbox |
| `marketingConsent` | `Marketing Consent` | Boolean → Checkbox |
| `checkinTime` | `Check-in Time` | DateTime → ISO 8601 |
| `checkoutTime` | `Check-out Time` | DateTime → ISO 8601 |
| `airtableRecordId` | `Registration ID` | Stored after creation |

**Consent Conversion:**
- App stores: `true` or `false`
- Airtable stores: checked or unchecked
- `false` in app = unchecked in Airtable = orange wristband / no mailing list

### 5.3 Example API Payload (V2)

**Create Registration (POST):**
```json
{
  "fields": {
    "Event": ["recABC123XYZ"],
    "First Name": "Jane",
    "Last Name": "Smith",
    "Email": "jane.smith@example.com",
    "Organization": ["recORG456DEF"],
    "Do you have an impairment": "Wheelchair user",
    "Role": "Attendee",
    "Photo Consent": false,
    "Marketing Consent": true,
    "App Record ID": "reg_456def"
  }
}
```

---

## 6. CSV Export Changes

### 6.1 Export Fields (V2)

| Field Name | Source | Notes |
|------------|--------|-------|
| Event Name | Looked up from eventId | **NEW** - Added in V2 |
| First Name | attendeeName | Renamed from "Attendee Name" |
| Last Name | attendeeSurname | Renamed from "Attendee Surname" |
| Email | email | Now always present (required) |
| Organization | Looked up from organizationId | Now always present (required) |
| Do you have an impairment | impairment | Now always present (required) |
| Role | role | Attendee or Volunteer |
| Photo Consent | photoConsent | Yes/No (No = orange wristband) |
| Marketing Consent | marketingConsent | Yes/No (No = no mailing list) |
| Check-in Time | checkinTime | ISO 8601 format |
| Check-out Time | checkoutTime | ISO 8601 format |
| Attendance Duration | Calculated | Hours:Minutes format |
| ~~Phone~~ | ~~phone~~ | **REMOVED** in V2 |

---

## 7. Outstanding Questions for Power2Inspire

### 7.1 Answered Questions ✅
1. ✅ **Impairment Field Format:** Free text, required
2. ✅ **Consent Text:** Matches existing Airtable form exactly
3. ✅ **Event Selection:** Dropdown with pre-selection to current event

### 7.2 Remaining Questions ❓

**High Priority:**
1. **Organization Field Implementation:** Should organizations be:
   - Pre-loaded dropdown only (select from existing list)?
   - Free text only (type any organization name)?
   - **Autocomplete with ability to add new** (current implementation in wireframe)?

2. **Conditional Fields:** Which 1-2 fields should be different between Attendee and Volunteer forms?
   - Current wireframe has identical forms for both
   - Need to know which fields to show/hide based on registration type

**Medium Priority:**
3. **Airtable Workspace:** Do you have an Airtable workspace set up? What plan level?
4. **Organization List:** Do you have an existing list of organizations to import?
5. **Token Management:** Who will generate and manage access tokens? Rotation schedule?
6. **Mailchimp Sync:** Should we sync to Mailchimp from Airtable or directly from app?
7. **Data Retention:** How long to keep event data? GDPR retention policy?

**Low Priority:**
8. **Branding:** Logo, color scheme, and branding guidelines?
9. **Testing Devices:** What specific tablet models will be used?
10. **Sync Timing:** When should sync occur? (end of event, daily, manual only)

---

## 8. Documentation Status

### 8.1 Updated Documents (V2)

| Document | Version | Status | Last Updated |
|----------|---------|--------|--------------|
| EXISTING_FORM_ANALYSIS.md | 1.0 | ✅ Complete | 2026-02-11 |
| UI_WIREFRAMES_V2.md | 2.0 | ✅ Complete | 2026-02-11 |
| interactive-wireframe-v2.html | 2.0 | ✅ Complete | 2026-02-11 |
| DATA_MODELS.md | 2.0 | ✅ Complete | 2026-02-11 |
| AIRTABLE_INTEGRATION.md | 2.0 | ✅ Complete | 2026-02-11 |
| TODO.md | 2.0 | ✅ Complete | 2026-02-11 |
| V2_CHANGES_SUMMARY.md | 1.0 | ✅ Complete | 2026-02-11 |

### 8.2 Original Documents (Still Valid)

| Document | Version | Status | Notes |
|----------|---------|--------|-------|
| REQUIREMENTS.md | 1.0 | ✅ Valid | Core requirements unchanged |
| ARCHITECTURE.md | 1.0 | ✅ Valid | Architecture unchanged |
| PROJECT_STATUS.md | 1.0 | 📝 Needs update | Update to reflect V2 completion |
| INTEGRATION_DISCUSSION.md | 1.0 | 📝 Needs update | Some questions answered |

---

## 9. Implementation Readiness

### 9.1 Ready to Start ✅
- ✅ Complete V2 wireframes with all 8 screens
- ✅ Interactive HTML prototype for stakeholder review
- ✅ Data models fully specified with validation rules
- ✅ Airtable integration with complete field mappings
- ✅ API payload examples for all operations
- ✅ CSV export specification
- ✅ Comprehensive task list in TODO.md

### 9.2 Blockers ⚠️
- ❓ Organization field implementation approach (dropdown/autocomplete/free text)
- ❓ Conditional fields for Attendee vs Volunteer
- ❓ Airtable workspace access and token generation

### 9.3 Next Steps 🎯
1. **Get answers** to 2 high-priority questions (organization field, conditional fields)
2. **Create Airtable base** with V2 schema
3. **Generate access token** for development
4. **Begin Flutter implementation** starting with Home Screen
5. **Test with stakeholders** using interactive wireframe V2

---

## 10. Benefits of V2 Approach

### 10.1 Alignment with Existing Workflows
- ✅ Matches proven PowerHouseGames volunteer signup form
- ✅ Familiar field names and structure for Power2Inspire staff
- ✅ Preserves important language (orange wristband, consent text)
- ✅ Reduces training time for staff already using Airtable form

### 10.2 Enhanced Functionality
- ✅ Offline-first operation (works without internet)
- ✅ Attendance tracking (check-in/out for fire drill compliance)
- ✅ CSV export for reporting
- ✅ Sync to Airtable for centralized data management
- ✅ Event dropdown allows managing multiple events from one app

### 10.3 Improved Data Quality
- ✅ More required fields ensure complete registrations
- ✅ Radio buttons force explicit consent choices (not just opt-in)
- ✅ Email validation ensures valid contact information
- ✅ Organization tracking for better reporting

---

## 11. Migration Path

### 11.1 From Current Airtable Form to Mobile App

**Phase 1: Parallel Operation**
- Continue using existing Airtable form for online registrations
- Use new mobile app for on-site registrations at events
- Both write to same Airtable base

**Phase 2: Mobile-First**
- Primary registration method is mobile app at events
- Airtable form available as backup/online option
- All data syncs to central Airtable base

**Phase 3: Full Migration (Optional)**
- Mobile app is sole registration method at events
- Airtable form retired or used only for pre-registration
- Historical data preserved in Airtable

### 11.2 Data Compatibility
- ✅ V2 field names match existing Airtable form
- ✅ No data loss - all existing fields preserved
- ✅ New fields (App Record ID) are optional in Airtable
- ✅ Existing Airtable automations continue to work

---

## 12. Risk Assessment

### 12.1 Low Risk ✅
- Field name changes (cosmetic only, no data loss)
- Adding required fields (improves data quality)
- Radio buttons vs checkboxes (better UX, explicit choice)
- Removing phone field (not used in existing form)

### 12.2 Medium Risk ⚠️
- Organization field implementation (needs clarification)
- Conditional fields (needs specification)
- Airtable base setup (needs access and planning)

### 12.3 Mitigation Strategies
- ✅ Interactive wireframe for stakeholder review before coding
- ✅ All changes documented and version controlled
- ✅ Parallel operation during migration
- ✅ Comprehensive testing plan in TODO.md

---

## 13. Timeline Estimate

### 13.1 Remaining Work (After Questions Answered)

**NextJS Web Application Timeline:**

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Setup** | NextJS project, Vercel, Airtable token | 1-2 days |
| **Core Features** | Registration forms, consent radio buttons, validation | 4-6 days |
| **Attendance & Admin** | Attendance tracking, check-in/out, CSV export | 2-3 days |
| **Polish & Testing** | Responsive design, accessibility, testing | 3-4 days |
| **TOTAL** | | **10-15 days** |

**Benefits vs Flutter Approach:**
- ✅ 60% faster development (10-15 days vs 24-33 days)
- ✅ No offline sync complexity (removed 4-5 days)
- ✅ No mobile database setup (removed 3-4 days)
- ✅ No app store deployment (removed 2-3 days)
- ✅ Simpler architecture = faster iteration

*Note: Assumes full-time development, may vary based on resource availability*

---

## 14. Approval Checklist

Before proceeding with NextJS development, please confirm:

- [ ] V2 field changes are acceptable (required fields, removed phone, renamed fields)
- [ ] Consent radio button approach is acceptable (vs checkboxes)
- [ ] Orange wristband language is correct and must be preserved
- [ ] Event dropdown approach is acceptable (pre-selected, can change)
- [ ] 8-screen user flow matches expected workflow
- [ ] Interactive wireframe V2 accurately represents desired web app
- [ ] **ANSWER:** Organization field implementation (dropdown/autocomplete/free text)
- [ ] **ANSWER:** Conditional fields for Attendee vs Volunteer (which 1-2 fields differ)
- [ ] Airtable workspace access can be provided
- [ ] Access token can be generated for development
- [ ] NextJS web app approach is acceptable (vs Flutter mobile app)
- [ ] Timeline estimate is acceptable (10-15 days)

---

## 15. Contact and Next Steps

### 15.1 For Questions or Feedback
- Review interactive wireframe: `documentation/wireframes/interactive-wireframe-v2.html`
- Review detailed wireframes: `documentation/UI_WIREFRAMES_V2.md`
- Review data models: `documentation/DATA_MODELS.md`
- Review Airtable integration: `documentation/AIRTABLE_INTEGRATION.md`

### 15.2 To Proceed
1. Answer 2 high-priority questions (organization field, conditional fields)
2. Provide Airtable workspace access
3. Approve V2 specifications
4. Review NextJS architecture document (`documentation/NEXTJS_ARCHITECTURE.md`)
5. Begin NextJS development

---

**Document End**

*This summary was generated on 2026-02-11 to document all changes from initial design to V2 specifications based on the existing PowerHouseGames volunteer signup Airtable form. Updated to reflect NextJS web application approach instead of Flutter mobile app.*
| Organization | Link to Organizations | **Yes** | Now required |
| Do you have an impairment | Long Text | **Yes** | Now required, free text |
| Role | Single Select | Yes | "Attendee" or "Volunteer" |
| Photo Consent | Checkbox | **Yes** | Unchecked = orange wristband |
| Marketing Consent | Checkbox | **Yes** | Unchecked = no mailing list |
| Check-in Time | Date & Time | No | Updated during attendance |
| Check-out Time | Date & Time | No | Updated during attendance |
| App Record ID | Single Line Text | No | Local UUID for sync |
| Created At | Created Time | Yes | Auto-generated |
| Modified At | Last Modified Time | Yes | Auto-generated |


