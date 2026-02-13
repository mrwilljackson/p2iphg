# Existing Airtable Form Analysis

## Overview

This document compares the **existing Airtable form** currently used for PowerHouseGames (PHG) volunteer signup with the **wireframes** we created for the new Flutter app.

**Existing Form URL:** https://airtable.com/appIeSZKJnzKfqKea/shreia8ATAOeunxD2

---

## Current Form Structure

### Form Title
**"Online PHG sign up"**

### Fields (in order)

1. **PowerHouseGames**
   - Type: Unknown (shows "Add to PowerHouseGames field" button)
   - Purpose: Likely links the registration to the specific event

2. **First Name**
   - Type: Text input
   - Required: Likely yes

3. **Last Name**
   - Type: Text input
   - Required: Likely yes

4. **Email**
   - Type: Email input
   - Required: Likely yes

5. **Consent to photography**
   - Type: Radio buttons (single choice)
   - Options:
     - "Yes, I consent to the use of photographs as specified"
     - "No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way"
   - Note: Mentions physical implementation detail (orange wristband)

6. **I would like to receive emails about Power2Inspire's work**
   - Type: Radio buttons (single choice)
   - Options:
     - "Yes, I would like to hear from Power2Inspire"
     - "No, please don't add me to the mailing list"

### Submit Button
- Standard "Submit" button at bottom

---

## Comparison with Wireframes

### ✅ Fields in BOTH (Common)

| Field | Existing Form | Wireframes | Notes |
|-------|---------------|------------|-------|
| First Name | ✅ Text input | ✅ Text input | Same |
| Last Name | ✅ Text input | ✅ Text input (as "Surname") | Same concept |
| Email | ✅ Email input | ✅ Email input | Same |
| Photo Consent | ✅ Radio buttons | ✅ Checkbox | **Different UI control** |
| Marketing Consent | ✅ Radio buttons | ✅ Checkbox | **Different UI control** |

### ➕ Fields in EXISTING FORM ONLY

| Field | Type | Purpose |
|-------|------|---------|
| PowerHouseGames | Button/Link field | Links registration to specific event |

### ➕ Fields in WIREFRAMES ONLY

| Field | Type | Purpose |
|-------|------|---------|
| Organization | Text input with autocomplete | Capture attendee's organization |
| Accessibility Needs | Text input | Capture impairment/accessibility requirements |
| Phone Number | Tel input | Alternative contact method |
| Registration Type | Screen/Choice | Distinguish Attendee vs Volunteer |

---

## Key Differences

### 1. **Consent UI Pattern**
- **Existing:** Radio buttons (binary yes/no choice)
- **Wireframes:** Checkboxes (opt-in only)
- **Impact:** Radio buttons force a choice; checkboxes allow skipping

### 2. **Event Selection**
- **Existing:** "PowerHouseGames" field (appears to be a linked record or button)
- **Wireframes:** Event info shown on separate screen, not in form
- **Impact:** Need to understand how event selection works

### 3. **Scope**
- **Existing:** Volunteer signup only (form title: "Online PHG sign up")
- **Wireframes:** Both attendees AND volunteers
- **Impact:** Wireframes are more comprehensive

### 4. **Additional Data**
- **Existing:** Minimal data capture (4 fields + 2 consents)
- **Wireframes:** More comprehensive (6 fields + 2 consents)
- **Impact:** Wireframes capture more useful information

### 5. **Orange Wristband**
- **Existing:** Explicitly mentions "orange wristband" in photo consent
- **Wireframes:** Generic photo consent text
- **Impact:** Shows physical implementation detail used at events

---

## Questions for Power2Inspire

1. **Is the "PowerHouseGames" field essential?**
   - How does this work in the current form?
   - Should the app automatically link to the current event?

2. **Radio buttons vs Checkboxes for consent?**
   - Do you prefer forcing a choice (radio) or allowing opt-in (checkbox)?
   - Current form forces users to explicitly say yes or no

3. **Should we keep the "orange wristband" language?**
   - Is this a standard practice at all events?
   - Should this be configurable per event?

4. **Are the additional fields needed?**
   - Organization
   - Accessibility Needs
   - Phone Number
   - Or should we start simpler and match the existing form?

5. **Attendee vs Volunteer distinction?**
   - Current form is volunteer-only
   - Should attendees use a different form/flow?
   - Or should one form handle both?

---

## Recommendations

### Option A: **Match Existing Form (Minimal)**
Start with the exact same fields as the current form:
- First Name
- Last Name
- Email
- Photo Consent (radio buttons)
- Marketing Consent (radio buttons)
- Event selection (automatic based on active event)

**Pros:** Familiar to users, quick to build, proven to work  
**Cons:** Missing useful data (phone, organization, accessibility)

### Option B: **Enhanced Form (Wireframes)**
Use the comprehensive wireframes we created:
- All fields from Option A
- Plus: Organization, Accessibility Needs, Phone Number
- Plus: Attendee/Volunteer distinction

**Pros:** More complete data, better for future needs  
**Cons:** More complex, longer form, may reduce completion rate

### Option C: **Hybrid Approach**
Start with existing form fields, add optional fields:
- Required: First Name, Last Name, Email, Consents
- Optional: Phone, Organization, Accessibility Needs

**Pros:** Balance between simplicity and completeness  
**Cons:** Need to decide which fields are truly optional

---

## ✅ DECISIONS MADE (2026-02-11)

### 1. **PowerHouseGames/Event Field: YES - ESSENTIAL**
- **Decision:** Event ID is required to tie registration to specific event in Airtable
- **Implementation:** Pulldown/dropdown selector
- **Default:** Pre-selected to current active event
- **User can change:** Yes (dropdown allows selection of other events if needed)

### 2. **Consent Pattern: RADIO BUTTONS**
- **Decision:** Keep current format with two radio buttons (yes/no)
- **Rationale:** Forces explicit choice, matches existing form
- **Fields affected:** Photo consent, Marketing consent

### 3. **Orange Wristband Language: YES - KEEP IT**
- **Decision:** Always use the same language mentioning orange wristband
- **Text:** "No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way"
- **Rationale:** Standard practice at all events

### 4. **Additional Fields**
- ✅ **Organization: YES - REQUIRED**
  - Type: Pulldown OR free text (to be decided)
  - Purpose: Capture attendee's organization

- ✅ **Impairment: YES - REQUIRED** (renamed from "Accessibility Needs")
  - Type: Free text input
  - Label: "Do you have an impairment"
  - Purpose: Capture accessibility requirements

- ❌ **Phone Number: NO - REMOVE**
  - Not needed in the app

### 5. **Attendee vs Volunteer: SAME FORM WITH CONDITIONAL FIELDS**
- **Decision:** Use same basic form for both
- **Implementation:** Show/hide 1-2 fields based on registration type
- **To be defined:** Which specific fields differ between Attendee and Volunteer

---

## 📋 Final Field List

### Required Fields (All Registrations)
1. **Event** - Dropdown (pre-selected to current event)
2. **First Name** - Text input
3. **Last Name** - Text input
4. **Email** - Email input
5. **Organization** - Dropdown or free text
6. **Do you have an impairment** - Text input
7. **Photo Consent** - Radio buttons (Yes with consent text / No with orange wristband text)
8. **Marketing Consent** - Radio buttons (Yes / No)

### Conditional Fields
- **To be defined:** 1-2 fields that show for Volunteer but not Attendee (or vice versa)

### Removed Fields
- ❌ Phone Number (not needed)

---

## 🎯 Next Steps

1. ✅ **Decisions documented** - Complete
2. ⏳ **Update wireframes** - In progress
3. ⏳ **Define conditional field rules** - Which fields differ for Attendee vs Volunteer?
4. ⏳ **Update data models** - Align with final field list
5. ⏳ **Clarify organization field** - Dropdown with predefined list OR free text?

---

## ❓ Outstanding Questions

1. **Organization field type:**
   - Option A: Dropdown with predefined list of organizations (like existing form)
   - Option B: Free text input (user types anything)
   - Option C: Autocomplete (type to search predefined list, can add new)
   - **Which do you prefer?**

2. **Conditional fields for Attendee vs Volunteer:**
   - **Which 1-2 fields should be different?**
   - Examples: Role/Position, T-shirt size, Availability, Special skills, etc.
   - **Or should all fields be the same for both?**

---

*Document created: 2026-02-11*
*Updated with decisions: 2026-02-11*
*Based on: https://airtable.com/appIeSZKJnzKfqKea/shreia8ATAOeunxD2*

