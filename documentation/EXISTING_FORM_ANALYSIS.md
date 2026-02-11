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

## Next Steps

1. **User Decision:** Which option (A, B, or C) aligns with your needs?
2. **Update Wireframes:** Modify based on chosen approach
3. **Clarify Event Selection:** Understand how PowerHouseGames field works
4. **Consent Pattern:** Decide on radio buttons vs checkboxes
5. **Update Data Models:** Align with final field list

---

*Document created: 2026-02-11*  
*Based on: https://airtable.com/appIeSZKJnzKfqKea/shreia8ATAOeunxD2*

