# UI Wireframes & Screen Flow

**Project:** Power2Inspire Event CRM App  
**Platform:** Flutter (Android/iOS Tablets)  
**Last Updated:** 2026-02-11  
**Status:** Draft

---

## 📱 Design Principles

### Accessibility Requirements
- **Touch Targets:** Minimum 72x72 dp (preferred), 48x48 dp (minimum)
- **Font Size:** Minimum 16sp for body text, 20sp+ for headings
- **Contrast:** WCAG AA compliant (4.5:1 for normal text)
- **Navigation:** Simple, linear flow with clear back buttons
- **Input:** Large, clearly labeled form fields

### User Context
- **Environment:** Noisy charity events
- **Users:** Attendees, volunteers, charity staff (varying tech literacy)
- **Device:** Shared tablet in kiosk mode
- **Connectivity:** Offline-first, sync on-demand

---

## 🗺️ Screen Map

### Total Screens: 8 Main Screens

1. **Home Screen** - Main menu
2. **Event Info Screen** - Current event details
3. **Registration Type Screen** - Choose Attendee or Volunteer
4. **Registration Form Screen** - Data capture
5. **Consent Screen** - Marketing and photo permissions
6. **Confirmation Screen** - Success message
7. **Attendance List Screen** - Check-in/out management
8. **Admin Menu Screen** - Staff functions (sync, export, settings)

---

## 🔄 User Flow Diagram

```
┌─────────────────┐
│   Home Screen   │
│   (Main Menu)   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐  ┌──────────────┐
│ Event  │  │ Registration │
│  Info  │  │     Type     │
└────────┘  └──────┬───────┘
                   │
              ┌────┴────┐
              │         │
              ▼         ▼
         ┌─────────┐ ┌──────────┐
         │Attendee │ │Volunteer │
         │  Form   │ │   Form   │
         └────┬────┘ └────┬─────┘
              │           │
              └─────┬─────┘
                    │
                    ▼
            ┌───────────────┐
            │    Consent    │
            │    Screen     │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │ Confirmation  │
            └───────────────┘
                    │
                    ▼
            (Return to Home)

    From Home:
         │
         ▼
    ┌──────────────┐
    │  Attendance  │
    │     List     │
    └──────────────┘
         │
         ▼
    ┌──────────────┐
    │ Admin Menu   │
    │ (Staff Only) │
    └──────────────┘
```

---

## 📄 Screen Wireframes

### Screen 1: Home Screen

**Purpose:** Main navigation hub  
**Access:** Public (no authentication)

```
┌─────────────────────────────────────────────┐
│  Power2Inspire Event CRM                    │
│  ═══════════════════════════════════════    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │     Welcome to [Event Name]        │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      📝 REGISTER                    │   │
│  │      (New Attendee/Volunteer)       │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      ℹ️  EVENT INFO                 │   │
│  │      (View Event Details)           │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      ✓  ATTENDANCE                  │   │
│  │      (Check In/Out)                 │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│  [⚙️ Admin] (bottom corner, small)         │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Large, centered buttons (minimum 72x72 dp)
- Event name displayed prominently
- Icons + text labels for clarity
- Admin button small and unobtrusive

**Actions:**
- Tap "REGISTER" → Registration Type Screen
- Tap "EVENT INFO" → Event Info Screen
- Tap "ATTENDANCE" → Attendance List Screen
- Tap "Admin" → Admin Menu (may require PIN)

---

### Screen 2: Event Info Screen

**Purpose:** Display current event details  
**Access:** Public

```
┌─────────────────────────────────────────────┐
│  ← Back          Event Information          │
│  ═══════════════════════════════════════    │
│                                             │
│  Event Name:                                │
│  [Community Health & Wellbeing Fair]        │
│                                             │
│  Date:                                      │
│  [Saturday, 15th February 2026]             │
│                                             │
│  Time:                                      │
│  [10:00 AM - 4:00 PM]                       │
│                                             │
│  Location:                                  │
│  [Community Centre, Main Hall]              │
│                                             │
│  Description:                               │
│  ┌─────────────────────────────────────┐   │
│  │ Join us for a day of health         │   │
│  │ activities, workshops, and          │   │
│  │ community connection...             │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Current Attendance: 47 people              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │      REGISTER FOR THIS EVENT        │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Clear back button (top left)
- Read-only event information
- Live attendance counter
- Call-to-action button to register

**Actions:**
- Tap "Back" → Home Screen
- Tap "REGISTER" → Registration Type Screen

---

### Screen 3: Registration Type Screen

**Purpose:** Choose between Attendee or Volunteer  
**Access:** Public

```
┌─────────────────────────────────────────────┐
│  ← Back       How are you joining us?       │
│  ═══════════════════════════════════════    │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         👤 ATTENDEE                 │   │
│  │                                     │   │
│  │    I'm here to participate          │   │
│  │    in the event                     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │         🙋 VOLUNTEER                │   │
│  │                                     │   │
│  │    I'm here to help run             │   │
│  │    the event                        │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Two large, equal-sized buttons
- Clear icons and descriptions
- Simple binary choice

**Actions:**
- Tap "ATTENDEE" → Registration Form (role = attendee)
- Tap "VOLUNTEER" → Registration Form (role = volunteer)
- Tap "Back" → Home Screen

---

### Screen 4: Registration Form Screen

**Purpose:** Capture attendee/volunteer information
**Access:** Public
**Note:** Same form for both attendees and volunteers

```
┌─────────────────────────────────────────────┐
│  ← Back      Register as [Attendee/Vol]     │
│  ═══════════════════════════════════════    │
│                                             │
│  First Name: *                              │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Last Name: *                               │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Organization: (optional)                   │
│  ┌─────────────────────────────────────┐   │
│  │ [Autocomplete dropdown]             │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Accessibility Needs: (optional)            │
│  ┌─────────────────────────────────────┐   │
│  │ e.g., wheelchair user, hearing aid  │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Email Address:                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Phone Number:                              │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  * At least one contact method required    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │           CONTINUE                  │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Large input fields (minimum 48dp height)
- Clear labels above each field
- Required fields marked with *
- Organization autocomplete from pre-loaded list
- Validation on Continue button press

**Validation Rules:**
- First Name: Required, 2-50 characters
- Last Name: Required, 2-50 characters
- Organization: Optional, autocomplete or free text
- Accessibility Needs: Optional, free text
- Email: Valid email format OR phone required
- Phone: Valid phone format OR email required

**Actions:**
- Tap "CONTINUE" → Validate → Consent Screen
- Tap "Back" → Registration Type Screen
- Validation errors shown inline below fields

---

### Screen 5: Consent Screen

**Purpose:** Capture marketing and photo consent
**Access:** Public

```
┌─────────────────────────────────────────────┐
│  ← Back         Permissions                 │
│  ═══════════════════════════════════════    │
│                                             │
│  We'd like to keep in touch and share       │
│  photos from our events.                    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │  ☐  Marketing Communications        │   │
│  │                                     │   │
│  │     I agree to receive updates,     │   │
│  │     newsletters, and information    │   │
│  │     about future events from        │   │
│  │     Power2Inspire via email.        │   │
│  │                                     │   │
│  │     You can unsubscribe anytime.    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │  ☐  Photo & Video Consent           │   │
│  │                                     │   │
│  │     I agree to be photographed      │   │
│  │     or filmed at this event, and    │   │
│  │     for these images to be used     │   │
│  │     in Power2Inspire's marketing    │   │
│  │     materials and social media.     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Both permissions are optional.             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │        COMPLETE REGISTRATION        │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Large checkboxes (minimum 48x48 dp)
- Clear, readable consent text
- Emphasis that both are optional
- Large submit button

**Actions:**
- Tap checkboxes to toggle consent
- Tap "COMPLETE REGISTRATION" → Save to database → Confirmation Screen
- Tap "Back" → Registration Form Screen (data preserved)

---

### Screen 6: Confirmation Screen

**Purpose:** Confirm successful registration
**Access:** Public

```
┌─────────────────────────────────────────────┐
│                                             │
│  ═══════════════════════════════════════    │
│                                             │
│              ✓                              │
│                                             │
│      Registration Complete!                 │
│                                             │
│                                             │
│  Thank you, [First Name]!                   │
│                                             │
│  You're registered as an [Attendee/Vol]     │
│  for [Event Name].                          │
│                                             │
│                                             │
│  Please check in at the registration        │
│  desk when you arrive.                      │
│                                             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │         DONE                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│                                             │
│  Automatically returning to home in 5s...   │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Large success icon/checkmark
- Personalized message with name
- Clear next steps
- Auto-redirect timer

**Actions:**
- Tap "DONE" → Home Screen
- Auto-redirect after 5 seconds → Home Screen

---

### Screen 7: Attendance List Screen

**Purpose:** Check in/out attendees and volunteers
**Access:** Public (but typically staff-operated)

```
┌─────────────────────────────────────────────┐
│  ← Back         Attendance                  │
│  ═══════════════════════════════════════    │
│                                             │
│  Search:                                    │
│  ┌─────────────────────────────────────┐   │
│  │ 🔍 Search by name or email...       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Filter: [All] [Checked In] [Checked Out]   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ John Smith (Attendee)               │   │
│  │ john@email.com                      │   │
│  │ ✓ Checked in: 10:15 AM              │   │
│  │ [CHECK OUT]                         │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Jane Doe (Volunteer)                │   │
│  │ jane@email.com                      │   │
│  │ Not checked in                      │   │
│  │ [CHECK IN]                          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ Bob Wilson (Attendee)               │   │
│  │ bob@email.com                       │   │
│  │ ✓ Checked in: 11:30 AM              │   │
│  │ ✓ Checked out: 2:45 PM              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Total: 47 registered | 32 checked in       │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Search bar at top
- Filter tabs for status
- List of registrations with status
- Check in/out buttons
- Summary statistics at bottom

**Actions:**
- Type in search → Filter list in real-time
- Tap filter tabs → Show filtered results
- Tap "CHECK IN" → Record check-in time → Update display
- Tap "CHECK OUT" → Record check-out time → Update display
- Tap "Back" → Home Screen

---

### Screen 8: Admin Menu Screen

**Purpose:** Staff functions for sync, export, and settings
**Access:** Staff only (may require PIN)

```
┌─────────────────────────────────────────────┐
│  ← Back          Admin Menu                 │
│  ═══════════════════════════════════════    │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      🔄 SYNC TO AIRTABLE            │   │
│  │      Upload pending registrations   │   │
│  │                                     │   │
│  │      Last sync: 2 hours ago         │   │
│  │      Pending: 12 records            │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      📊 EXPORT CSV                  │   │
│  │      Download event data            │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      ⚙️  SETTINGS                   │   │
│  │      Configure app settings         │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │      ℹ️  ABOUT                      │   │
│  │      App version and info           │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Elements:**
- Large admin function buttons
- Sync status information
- Pending records count

**Actions:**
- Tap "SYNC TO AIRTABLE" → Show progress → Sync data → Show result
- Tap "EXPORT CSV" → Generate CSV → Share/save file
- Tap "SETTINGS" → Settings Screen (TBD)
- Tap "ABOUT" → About Screen (TBD)
- Tap "Back" → Home Screen

---

## 📊 Summary

### Screen Count
- **8 main screens** defined
- **2 additional screens** referenced (Settings, About) - to be designed later

### Navigation Depth
- **Maximum depth:** 4 levels (Home → Register → Form → Consent → Confirmation)
- **Average depth:** 2-3 levels
- **Back button:** Available on all screens except Home

### Key Features
- ✅ **Accessibility:** All touch targets 72x72 dp, high contrast, clear labels
- ✅ **Offline-first:** All screens work without internet
- ✅ **Simple flow:** Linear registration process, no complex branching
- ✅ **Clear feedback:** Confirmation screens, status indicators, validation messages
- ✅ **Staff functions:** Separated into Admin Menu, requires authentication

### Next Steps
1. **Review wireframes** with stakeholders
2. **Create component library** (buttons, inputs, cards)
3. **Design color scheme** and typography
4. **Add error state wireframes** (validation, network errors)
5. **Add loading state wireframes** (sync in progress, data loading)
6. **Create Settings screen** wireframe
7. **Create About screen** wireframe
8. **Build interactive prototype** (optional)
9. **Begin Flutter implementation**

---

## 📝 Notes

- All wireframes are ASCII art for easy version control and documentation
- Actual implementation will use Flutter Material Design components
- Color scheme and branding to be defined in separate design document
- Responsive design considerations for different tablet sizes to be added
- Error handling and edge cases to be documented separately

---

**Status:** Ready for stakeholder review and Flutter implementation planning


