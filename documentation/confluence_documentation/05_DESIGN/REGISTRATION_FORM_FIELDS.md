# Registration Form Fields by Role

**Document Version:** 1.0  
**Last Updated:** 2026-02-16  
**Status:** Current Implementation

---

## Overview

The PowerHouseGames registration form dynamically displays different fields based on the selected role. This document provides a comprehensive breakdown of all fields available for each role type.

---

## Role Types

The registration form supports three distinct roles:

1. **Participant** - Individual attendees participating in the games
2. **Volunteer** - Pre-registered volunteers helping at the event
3. **Group** - Group leaders/coordinators bringing teams of participants

---

## Field Breakdown by Role

### 1. PARTICIPANT ROLE

**Purpose:** For individual attendees registering to participate in the PowerHouseGames.

#### Field Order and Details:

1. **Organization / Group Name** (Optional)
   - **Type:** Combobox with custom entry
   - **Label:** "Your Group Name"
   - **Description:** Allows participant to select their organization or enter a custom name
   - **Options:** All organizations registered for the event + custom entry
   - **Required:** No

2. **Email Address** (Optional)
   - **Type:** Text input (email)
   - **Label:** "Your email:"
   - **Placeholder:** "your.email@example.com"
   - **Required:** No

3. **First Name** (Required)
   - **Type:** Text input
   - **Label:** "Your first name: *"
   - **Placeholder:** "Enter first name"
   - **Validation:** 2-100 characters, letters/spaces/hyphens/apostrophes only
   - **Required:** Yes

4. **Last Name** (Required)
   - **Type:** Text input
   - **Label:** "Your last name: *"
   - **Placeholder:** "Enter last name"
   - **Validation:** 2-100 characters, letters/spaces/hyphens/apostrophes only
   - **Required:** Yes

5. **Impairment Question** (Optional)
   - **Type:** Dropdown select
   - **Label:** "Do you consider yourself to be a disabled person, or to have a long‑term physical or mental health condition or impairment?"
   - **Options:**
     - "Yes"
     - "No"
     - "Rather not say"
   - **Layout:** Label on left, dropdown on right (side-by-side)
   - **Required:** No

6. **Feedback Consent** (Optional)
   - **Type:** Checkbox
   - **Label:** "I consent to being contacted for post-event feedback"
   - **Default:** Unchecked
   - **Required:** No

7. **Next Event Consent** (Optional)
   - **Type:** Checkbox
   - **Label:** "I would like to receive information about future PowerHouseGames events"
   - **Default:** Unchecked
   - **Required:** No

8. **Photo Consent** (Required)
   - **Type:** Radio buttons
   - **Label:** "Photo Consent"
   - **Options:**
     - "I consent to photos being taken"
     - "I do not consent to photos being taken"
   - **Default:** Consent given (true)
   - **Required:** Yes

---

### 2. VOLUNTEER ROLE

**Purpose:** For pre-registered volunteers who are helping at the event (not participating in games).

#### Field Order and Details:

1. **First Name** (Displayed but not editable)
   - **Type:** Display only (pre-populated from volunteer database)
   - **Label:** "Your first name: *"
   - **Note:** Automatically filled based on email selection
   - **Required:** Yes (pre-filled)

2. **Last Name** (Displayed but not editable)
   - **Type:** Display only (pre-populated from volunteer database)
   - **Label:** "Your last name: *"
   - **Note:** Automatically filled based on email selection
   - **Required:** Yes (pre-filled)

3. **Email Address** (Required)
   - **Type:** Dropdown select
   - **Label:** "Your email:"
   - **Options:** List of pre-registered volunteer emails + "⚠️ My email isn't listed here!"
   - **Layout:** Label on left, dropdown on right (side-by-side)
   - **Required:** Yes
   - **Special Behavior:** 
     - Selecting an email auto-populates first and last name
     - Selecting "not listed" shows alert to find P2I team member

4. **Volunteer Not Listed Alert** (Conditional)
   - **Trigger:** When "My email isn't listed here!" is selected
   - **Content:** Instructions to find P2I team member to add volunteer to system
   - **Action:** Includes participant check flow (option to register as participant instead)

5. **Impairment Question** (Optional)
   - **Type:** Dropdown select
   - **Label:** "Do you consider yourself to be a disabled person, or to have a long‑term physical or mental health condition or impairment?"
   - **Options:** "Yes", "No", "Rather not say"
   - **Layout:** Label on left, dropdown on right
   - **Required:** No
   - **Note:** Only visible if valid email is selected (not "NOT_LISTED")

6. **Feedback Consent** (Optional)
   - **Type:** Checkbox
   - **Label:** "I consent to being contacted for post-event feedback"
   - **Default:** Unchecked
   - **Required:** No
   - **Note:** Only visible if valid email is selected

7. **Next Event Consent** (Optional)
   - **Type:** Checkbox
   - **Label:** "I would like to receive information about future PowerHouseGames events"
   - **Default:** Unchecked
   - **Required:** No
   - **Note:** Only visible if valid email is selected

8. **Photo Consent** (Required)
   - **Type:** Radio buttons
   - **Label:** "Photo Consent"
   - **Options:**
     - "I consent to photos being taken"
     - "I do not consent to photos being taken"
   - **Default:** Consent given (true)
   - **Required:** Yes

---

### 3. GROUP ROLE

**Purpose:** For group leaders/coordinators registering on behalf of a team of participants.

#### Field Order and Details:

1. **Organization Name** (Required)
   - **Type:** Dropdown select
   - **Label:** "Your Organisation or Group Name:"
   - **Options:** All organizations registered for the event + "⚠️ My organisation isn't listed here!"
   - **Required:** Yes
   - **Special Behavior:**
     - Selecting an organization with contact details auto-populates name and email fields
     - Selecting "not listed" shows alert to find P2I team member

2. **Email Address** (Optional)
   - **Type:** Text input (email)
   - **Label:** "Your email:"
   - **Placeholder:** "your.email@example.com"
   - **Required:** No
   - **Auto-population:** Pre-filled if organization has contact email on file

3. **First Name** (Required)
   - **Type:** Text input
   - **Label:** "Your first name: *"
   - **Placeholder:** "Enter first name"
   - **Validation:** 2-100 characters, letters/spaces/hyphens/apostrophes only
   - **Required:** Yes
   - **Auto-population:** Pre-filled if organization has contact first name on file

4. **Last Name** (Required)
   - **Type:** Text input
   - **Label:** "Your last name: *"
   - **Placeholder:** "Enter last name"
   - **Validation:** 2-100 characters, letters/spaces/hyphens/apostrophes only
   - **Required:** Yes
   - **Auto-population:** Pre-filled if organization has contact last name on file

5. **Instructional Note** (Conditional - Disability Organizations Only)
   - **Trigger:** Only shown when a disability organization is selected (excludes Family Group)
   - **Content:** "ℹ️ **Please check your details are correct - sometimes other staff attend on behalf of the original organiser!**"
   - **Style:** Blue informational text
   - **Position:** Below first name and last name fields, spanning full width

6. **Group Leader Participation** (Required for Group)
   - **Type:** Radio buttons
   - **Label:** "Will you be participating in the games?"
   - **Options:**
     - "I will be joining in the games as a participant" (value: true)
     - "I will not be taking part in the games" (value: false)
   - **Required:** Yes (for Group role)
   - **Purpose:** Differentiates between group leaders who participate vs. those who only coordinate

7. **Organization Not Listed Alert** (Conditional)
   - **Trigger:** When "My organisation isn't listed here!" is selected
   - **Content:** Instructions to speak to P2I team member to add organization
   - **Icon:** 🏢 Building icon
   - **Action:** Provides clear guidance to find staff with P2I badge

8. **Impairment Question** (Optional)
   - **Type:** Dropdown select
   - **Label:** "Do you consider yourself to be a disabled person, or to have a long‑term physical or mental health condition or impairment?"
   - **Options:** "Yes", "No", "Rather not say"
   - **Layout:** Label on left, dropdown on right
   - **Required:** No

9. **Feedback Consent** (Optional)
   - **Type:** Checkbox
   - **Label:** "I consent to being contacted for post-event feedback"
   - **Default:** Unchecked
   - **Required:** No

10. **Next Event Consent** (Optional)
    - **Type:** Checkbox
    - **Label:** "I would like to receive information about future PowerHouseGames events"
    - **Default:** Unchecked
    - **Required:** No

---

#### Group-Specific Fields (Conditional - Only for Disability Groups and Family Groups)

The following fields only appear when the selected organization is marked as a disability group (`isDisabilityGroup: true`) or is "Family Group":

11. **Group Size** (Required for Disability/Family Groups)
    - **Type:** Number input
    - **Label:** "How many participants are you responsible for in your group *"
    - **Placeholder:** "e.g., 25"
    - **Validation:** Integer, minimum 1, maximum 999
    - **Required:** Yes (when visible)

12. **Disabled Students** (Required for Disability/Family Groups)
    - **Type:** Number input
    - **Label:** "How many of your participants are disabled people, or to have a long‑term physical or mental health condition or impairment? *"
    - **Placeholder:** "e.g., 5"
    - **Validation:** Integer, minimum 0, maximum 999
    - **Required:** Yes (when visible)

13. **SEN Students** (Required for Disability/Family Groups)
    - **Type:** Number input
    - **Label:** "How many of your participants have Special Educational Needs (SEN)? *"
    - **Placeholder:** "e.g., 3"
    - **Validation:** Integer, minimum 0, maximum 999
    - **Required:** Yes (when visible)

---

14. **Photo Consent** (Required)
    - **Type:** Radio buttons
    - **Label:** "Photo Consent"
    - **Options:**
      - "I consent to photos being taken"
      - "I do not consent to photos being taken"
    - **Default:** Consent given (true)
    - **Required:** Yes

---

## Conditional Logic Summary

### Field Visibility Rules

| Field | Participant | Volunteer | Group |
|-------|------------|-----------|-------|
| Organization | ✅ (Combobox) | ❌ | ✅ (Dropdown) |
| Email | ✅ | ✅ (Dropdown) | ✅ |
| First Name | ✅ | ✅ (Auto-filled) | ✅ (Auto-filled) |
| Last Name | ✅ | ✅ (Auto-filled) | ✅ (Auto-filled) |
| Group Leader Participation | ❌ | ❌ | ✅ |
| Impairment | ✅ | ✅* | ✅ |
| Feedback Consent | ✅ | ✅* | ✅ |
| Next Event Consent | ✅ | ✅* | ✅ |
| Photo Consent | ✅ | ✅ | ✅ |
| Group Size | ❌ | ❌ | ✅** |
| Disabled Students | ❌ | ❌ | ✅** |
| SEN Students | ❌ | ❌ | ✅** |

**Legend:**
- ✅ = Always visible
- ❌ = Never visible
- ✅* = Only visible when valid email is selected (not "NOT_LISTED")
- ✅** = Only visible for disability groups and family groups

---

## Special Behaviors and Alerts

### 1. Volunteer Email Not Listed
**Trigger:** Volunteer selects "⚠️ My email isn't listed here!"

**Alert Content:**
- 👋 Icon
- Message: "We don't have you registered as a volunteer yet"
- Instructions to find P2I team member
- **Participant Check Flow:** Offers option to register as participant instead

### 2. Organization Not Listed (Group Role)
**Trigger:** Group leader selects "⚠️ My organisation isn't listed here!"

**Alert Content:**
- 🏢 Icon
- Message: "Your organisation isn't currently registered for this event"
- Instructions to speak to P2I team member
- Guidance to look for staff with P2I badge

### 3. Disability Organization Instructional Note
**Trigger:** Group role + disability organization selected (excludes Family Group)

**Note Content:**
- ℹ️ Icon
- Message: "**Please check your details are correct - sometimes other staff attend on behalf of the original organiser!**"
- Style: Blue informational text
- Position: Below name fields, full width

---

## Auto-Population Logic

### Group Role - Organization Contact Details
When a group leader selects an organization that has contact details on file:

1. **Email field** auto-populates with `contactEmail`
2. **First Name field** auto-populates with `contactFirstName`
3. **Last Name field** auto-populates with `contactLastName`

**Note:** Users can still manually edit these fields after auto-population.

**Organizations with Contact Details:**
- All corporate/institutional organizations (e.g., Next PLC, Leicester Tigers, De Montfort University)
- All disability organizations (e.g., Glenfield SEN School, Hazel Grove Special School)
- Family Group does NOT have pre-set contact details (personalized per family)

### Volunteer Role - Email Selection
When a volunteer selects their email from the dropdown:

1. **First Name field** auto-populates from volunteer database
2. **Last Name field** auto-populates from volunteer database
3. Fields become display-only (not editable)

---

## Form Validation Rules

### Required Fields by Role

**Participant:**
- First Name
- Last Name
- Photo Consent

**Volunteer:**
- Email (from dropdown)
- First Name (auto-filled)
- Last Name (auto-filled)
- Photo Consent

**Group:**
- Organization
- First Name
- Last Name
- Group Leader Participation
- Photo Consent
- **If Disability/Family Group:**
  - Group Size
  - Disabled Students
  - SEN Students

### Field-Specific Validation

**Name Fields (First Name, Last Name):**
- Minimum: 2 characters
- Maximum: 100 characters
- Allowed characters: Letters, spaces, hyphens, apostrophes
- Pattern: `^[a-zA-Z\s'-]+$`

**Email:**
- Must be valid email format
- Maximum: 255 characters

**Number Fields (Group Size, Disabled Students, SEN Students):**
- Must be whole numbers (integers)
- Group Size: Minimum 1, Maximum 999
- Disabled Students: Minimum 0, Maximum 999
- SEN Students: Minimum 0, Maximum 999

---

## UI Layout Patterns

### Side-by-Side Fields
The following field pairs appear side-by-side on larger screens:

1. **Participant Role:**
   - Organization (left) + Email (right)
   - First Name (left) + Last Name (right)

2. **Group Role:**
   - Organization (left) + Email (right)
   - First Name (left) + Last Name (right)

3. **Volunteer Role:**
   - First Name (left) + Last Name (right)
   - Email uses special layout: Label (left) + Dropdown (right)

### Full-Width Fields
- Impairment dropdown (label left, select right)
- All consent checkboxes
- Photo consent radio buttons
- Group-specific number inputs
- All alerts and instructional notes

---

## Color Coding

The form uses consistent color coding for different elements:

- **Blue (#3b82f6)** - Informational notes and participant-related elements
- **Purple (#a855f7)** - Group-related buttons and elements
- **Lime Green (#84cc16)** - Volunteer-related buttons and elements
- **Orange (#f97316)** - Alerts, warnings, and admin functions

---

## Technical Implementation

**Configuration File:** `software/nextjs/lib/field-visibility-config.ts`

**Form Component:** `software/nextjs/components/registration-form.tsx`

**Type Definitions:** `software/nextjs/lib/types.ts`

**Validation Schema:** `software/nextjs/lib/validation.ts`

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-16 | Initial documentation of all form fields by role | AI Assistant |

---

**End of Document**

