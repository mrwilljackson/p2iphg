# Registration Form — Field & Logic Reference

> **Auto-generated reference** — Last updated: 2026-03-13
>
> Source files:
> - `components/registration-form.tsx` (UI & step logic)
> - `lib/field-visibility-config.ts` (field visibility per role)
> - `lib/validation.ts` (Zod schema + superRefine rules)
> - `lib/helpers.ts` (organisation-to-options conversion + role-based filtering)

---

## 1. Roles

| Value | Radio Label | Description |
|---|---|---|
| `Participant` | 👤 I'm a Participant | Individual attending the event |
| `Group` | 👨‍🏫 I am a Teacher, Parent or Community Group Leader | Leader registering one or more participants |
| `Volunteer` | 🙋 I'm a Helper | Helper / support staff (not participating in games) |

The role selector is hidden when a `?role=` query-param pre-selects the role via QR code.

---

## 2. Multi-Step Structure

| Role | Steps | Step Content |
|---|---|---|
| **Participant** | 2 | **Step 1:** Organisation, Email, First/Last Name, Impairment · **Step 2:** Consents |
| **Group** | 3 | **Step 1:** Organisation, Email, First/Last Name · **Step 2:** Leader participation, Group size/details · **Step 3:** Consents |
| **Volunteer** | 1 | Single page: Email (select), then consents (after email chosen) |

---

## 3. Field Visibility per Role

Controlled by `lib/field-visibility-config.ts`:

| Field | Participant | Group | Volunteer |
|---|:---:|:---:|:---:|
| `attendeeName` | ✅ | ✅ | ❌ |
| `attendeeSurname` | ✅ | ✅ | ❌ |
| `email` | ✅ | ✅ | ✅ |
| `organizationId` | ✅ | ✅ | ❌ |
| `impairment` | ✅ | ❌ | ❌ |
| `photoConsent` | ✅ | ✅ | ✅ |
| `feedbackConsent` | ✅ | ✅ | ✅ |
| `nextEventConsent` | ✅ | ✅ | ✅ |
| `groupSize` | ❌ | ✅ | ❌ |
| `impairedParticipants` | ❌ | ✅ | ❌ |
| `nonImpairedParticipants` | ❌ | ✅ | ❌ |

**Note:** `groupLeaderParticipating` is not in the visibility config — it is hard-coded to show only for the Group role on Step 2.

---

## 4. Validation Rules (Zod Schema)

### Always Required
| Field | Rule |
|---|---|
| `eventId` | Non-empty string (hidden, auto-populated) |
| `attendeeName` | 2–100 chars, letters/spaces/hyphens/apostrophes only |
| `attendeeSurname` | 2–100 chars, letters/spaces/hyphens/apostrophes only |
| `role` | One of `Participant`, `Volunteer`, `Group` |
| `photoConsent` | Boolean (radio) |

### Conditionally Required (superRefine)
| Field | Condition | Message |
|---|---|---|
| `organizationId` | Role is **Participant** or **Group** | "Please select your organisation or group" |

### Optional (schema-level)
| Field | Constraints |
|---|---|
| `email` | Valid email, max 255 chars (or empty string) |
| `impairment` | Max 500 chars (or empty string) |
| `feedbackConsent` | Boolean |
| `nextEventConsent` | Boolean |
| `groupSize` | Integer 1–999 |
| `impairedParticipants` | Integer 0–999 |
| `nonImpairedParticipants` | Integer 0–999 |
| `groupLeaderParticipating` | Boolean |

### Step-Level Validation (validateCurrentStep)
Fields validated when pressing "Next":

| Role | Step | Fields Validated |
|---|---|---|
| Participant | 1 | `organizationId`, `attendeeName`, `attendeeSurname`, `email`, `impairment` |
| Group | 1 | `organizationId`, `email`, `attendeeName`, `attendeeSurname` |
| Group | 2 (additional leader) | `groupLeaderParticipating` |
| Group | 2 (normal / additional participants) | `groupLeaderParticipating`, `groupSize`, `impairedParticipants`, `nonImpairedParticipants` |

---

## 5. Conditional UI Behaviours

### 5.1 Organisation Dropdown — Role-Based Filtering

The organisation dropdown is filtered by `groupType` (stored in the `organisations.group_type` database column) depending on the selected role. Filtering is applied in `lib/helpers.ts` → `organizationsToOptions()`.

| Role | Filter Rule | Organisations Shown |
|---|---|---|
| **Participant** | Exclude `groupType` = `'Disability'` or `'Family'` | Corporate, Sporting, Community, Educational, Other + "Family Group" placeholder |
| **Group** | Include **only** `groupType` = `'Disability'` or `'Family'` | Disability and Family organisations only |
| **Volunteer** | N/A (org field hidden) | — |

When the user switches role, the selected organisation is **cleared** automatically since the previous selection may not exist in the new filtered list.

### 5.2 Organisation Field Differences by Role

| Aspect | Participant | Group |
|---|---|---|
| **Widget** | `Combobox` (searchable, allows custom entry) | `Select` dropdown |
| **Options** | Filtered non-Disability/Family orgs + "Family Group" placeholder | Filtered Disability/Family orgs + "⚠️ My organisation isn't listed here!" |
| **Required** | ✅ Yes | ✅ Yes |
| **Label** | "Your Group Name *" | "Your Organisation or Group Name: *" |

### 5.3 Organisation Selection Side-Effects (Group Role)
- Selecting an org with contact details **auto-populates** `attendeeName`, `attendeeSurname`, and `email`.
- Selecting **"NOT_LISTED"** shows the "Group Not Listed" alert and hides the rest of the form.

### 5.4 Family Group Placeholder (Participant Role Only)
- The "Family Group" option (`FAMILY_GROUP_PLACEHOLDER`) is shown **only** for the Participant role.
- The label is personalised to `"{surname} Family Group"` when a surname is entered.
- On submit, a real `Organisation` record is created/found via `findOrCreateFamilyGroup()`.

### 5.5 Volunteer Email Selection
- Email field is a **Select dropdown** of pre-registered volunteer emails.
- Selecting an email **auto-populates** name and consent fields from the volunteer record.
- Selecting **"NOT_LISTED"** shows the Volunteer Not Listed alert with options to switch to Participant or speak to P2I staff.

### 5.6 Group — Existing Leader Detection (Multi-Leader Flow)
When a Group leader selects an organisation that already has a registered leader:
- An info panel shows existing leader names, group sizes, and total participants.
- Two radio options appear:
  - **"Register as additional leader only"** → sets `groupSize`, `impairedParticipants`, `nonImpairedParticipants` to 0; skips group-size fields on Step 2.
  - **"Register additional participants"** → clears auto-set values; shows normal group-size fields.

### 5.7 Group — Disability/Family Conditional Fields
The variable `shouldShowImpairmentFields` is `true` when:
- `organizationId === "FAMILY_GROUP_PLACEHOLDER"`, OR
- Selected org's `groupType` is `'Disability'` or `'Family'`

When `shouldShowImpairmentFields` is `true` (and not additional-leader-only):
- **Step 2** shows `groupSize`, `impairedParticipants`, and `nonImpairedParticipants` with disability-specific labels.
- A note appears for Disability groups: *"Please check your details are correct…"*

When `shouldShowImpairmentFields` is `false` (other group types):
- **Step 2** shows only `groupSize` with generic label: *"How many participants are in your group (not including yourself)?"*
- `impairedParticipants` and `nonImpairedParticipants` fields are hidden.

### 5.8 Photo Consent Wording
| Role | Yes Text | No Text |
|---|---|---|
| Group | "Yes, the whole group including staff consents…" | "No. Those within the group will wear a coloured wristband…" |
| Others | "Yes, I consent…" | "No, I will wear an orange wristband…" |

### 5.9 Consent Fields (Volunteer Gating)
For Volunteers, consent fields (photo, feedback, next-event) are **only shown after** a valid email is selected (not empty, not "NOT_LISTED").

---

## 6. Hidden / Auto-Populated Fields

| Field | Source |
|---|---|
| `eventId` | Auto-set from `getCurrentEvent()` on page load |
| `role` | Set from `?role=` query param when present |
| Volunteer name/consents | Auto-populated from volunteer record on email selection |
| Group leader name/email | Auto-populated from organisation contact details |

---

## 7. Smart Filtering

### 7.1 Group Organisation Dropdown — Already-Registered Leaders Hidden

Organisations that already have a registered group leader for the current event are removed from the Group role organisation dropdown. This prevents duplicate leader registrations and keeps the picker clean on event day.

- The check is performed at form load and on each org-picker render.
- An org is hidden from the "Arriving now" (open group) section once a Group registration with a matching `organizationId` exists for the current event.
- Closed-group orgs are always listed in the "Groups" section regardless of registration status (leaders may register additional participants).

### 7.2 Volunteer Name Picker — Already-Registered Volunteers Hidden

Volunteers who have already registered for the current event are hidden from the volunteer name select dropdown. This prevents a volunteer registering twice.

- The already-registered check uses the `volunteers` table joined against existing `registrations` for the event.

### 7.3 Closed-Group Contact Queries — Event-Scoped and Case-Insensitive

When the form fetches contacts for a closed-group organisation:

- Queries are scoped by `organisationContacts.eventId` (UUID FK to `events.id`) matching the current event, so contacts from past events do not appear.
- Already-registered contact matching uses **case-insensitive email comparison** to avoid missed matches caused by capitalisation differences between stored contact email and the email entered at registration.

---

## 8. Auto-Detect Group Leaders

When a **Participant** submits the registration form, the system checks whether the participant's email matches a group leader contact stored in `organisation_contacts` for their selected organisation and event.

If a match is found:

- `groupLeaderParticipating` is automatically set to `true` on the registration record.
- `expectedGroupSize` is copied from the matching `organisationContacts` record into the registration.

This means the participant count for closed groups remains accurate even when the group leader registers as a Participant rather than explicitly selecting the Group role. The detection happens server-side during `createRegistration()` and requires no extra input from the registrant.

---

## Appendix A — Form Element Map

A reference for all data entry elements in `components/registration-form.tsx`. Use these IDs in planning docs, specs, and conversations to identify specific fields unambiguously.

### Naming Conventions

- **Sections** — groups of related fields, written in `SCREAMING_SNAKE_CASE`
- **Individual fields** — written as `section.field`
- Fields within a section share display lifecycle (same step, shown/hidden together by the same condition)

---

### Top Level: Role Selector

| ID | UI Label | Control type | Notes |
|---|---|---|---|
| `ROLE_SELECTOR` | "Registration Type" | Radio group | Always visible; hidden when role is pre-selected via QR code URL |

**Options:**
- `role.participant` — "I'm a Participant"
- `role.group` — "I am a Teacher, Parent or a Community Group Leader"
- `role.volunteer` — "I'm a Helper"

---

### IDENTITY Section

Fields that identify the registrant personally. Shown on Step 1 for Participant and Volunteer; for Group role, populated via `GROUP_CONTACT_PICKER` (see below).

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `identity.firstName` | "Your first name" | Text input | Participant ✓ · Group — via picker · Volunteer ✗ |
| `identity.lastName` | "Your last name" | Text input | Participant ✓ · Group — via picker · Volunteer ✗ |
| `identity.email` | "Your email" | Email input | Participant ✓ · Group — via picker · Volunteer ✓ |

> For Volunteer role, `identity.email` is shown only after a volunteer has been selected from `VOLUNTEER_PICKER`.
> For Group role, all three IDENTITY fields are driven by `GROUP_CONTACT_PICKER`:
> — Known contact selected → fields pre-populated silently; not shown as separate visible entry boxes on Step 1
> — New contact selected → fields appear as editable inputs inside `group.contactPicker.newContact`

---

### ORG_PICKER Section

Organisation selection. Rendered differently per role.

| ID | UI Label | Control type | Role visibility | Notes |
|---|---|---|---|---|
| `org.picker.participant` | "Your Group Name" | Searchable combobox | Participant ✓ · Group ✗ · Volunteer ✗ | Open groups only; allows free-text custom entry |
| `org.picker.group` | "Your Organisation or Group Name" | Select dropdown (sectioned) | Participant ✗ · Group ✓ · Volunteer ✗ | Two sections: open groups ("Arriving now") + closed groups ("Groups"); open groups disappear after leader registers; includes Family Group placeholder |

**Org picker sub-items (Group role only):**

| ID | Description |
|---|---|
| `org.picker.group.openSection` | "Arriving now" — unregistered open-group orgs; removed once leader has checked in |
| `org.picker.group.closedSection` | "Groups" — closed-group orgs; always visible |
| `org.picker.group.familyGroup` | "Family Group" / "[Surname] Family Group" — on-the-day family group placeholder, always at top of closed section |
| `org.picker.group.notListed` | "⚠️ My organisation isn't listed here!" — triggers `ALERT_ORG_NOT_LISTED` |

---

### GROUP_CONTACT_PICKER Section

Group-role Step 1 only. Appears below `org.picker.group` once an org has been selected (not shown for `org.picker.group.familyGroup`). Presents all known contacts for the selected org as a radio list, with a mandatory "new contact" option always last.

Data is fetched from `organisation_contacts` on org selection. Contacts whose `contactEmail` matches an existing Group registration email for this event + org are hidden (already checked in).

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.contactPicker` | (no top-level label; context is implied by the org already selected) | Radio group | Group role + org selected in `org.picker.group` (not `familyGroup`) |
| `group.contactPicker.knownContact` | "[First] [Last] · [email]" | Radio option — read-only text display | One per unregistered known contact; hidden if `contactEmail` matches an existing Group reg |
| `group.contactPicker.newContact` | "Register as a new contact" | Radio option — reveals inline entry fields | Always present as the last option |
| `group.contactPicker.newContact.firstName` | "First name" | Text input | Visible only when `group.contactPicker.newContact` selected |
| `group.contactPicker.newContact.lastName` | "Last name" | Text input | Visible only when `group.contactPicker.newContact` selected |
| `group.contactPicker.newContact.email` | "Email" | Email input | Visible only when `group.contactPicker.newContact` selected |

**Behaviour on selection:**

| Selection | IDENTITY fields | `consent.*` pre-fill | `contactId` for post-submit sync |
|---|---|---|---|
| `group.contactPicker.knownContact` | Pre-populated silently from contact record; not shown as editable boxes on Step 1 | Pre-filled from contact record | Known — `updateGroupLeaderConsents` runs on submit |
| `group.contactPicker.newContact` | Entered via inline fields within the option | Defaults (photo ✓, feedback ✗, next ✗) | None — consent sync skipped |

**Edge cases:**
- If all known contacts are already registered: only `group.contactPicker.newContact` appears, with a note: "All registered contacts for this organisation have already checked in."
- If the org has only one contact: that contact is still shown as the first radio option (not auto-selected silently), followed by `group.contactPicker.newContact`.
- `org.picker.group.familyGroup`: no contact picker shown — family groups are created on-the-day and have no pre-existing contacts to display.
- A new contact registering via `group.contactPicker.newContact` will not cause the org to disappear from `org.picker.group.openSection`, because the system cannot confirm whether the intended pre-registered contact has arrived. The org remains visible until a known contact's email is matched.

---

### VOLUNTEER_PICKER Section

Volunteer-role only. Replaces ORG_PICKER and IDENTITY name fields.

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `volunteer.namePicker` | "Select your name" | Select dropdown | Volunteer ✓ only |

**Options:** pre-populated list of volunteers for the event, plus:
- `volunteer.notListed` — "⚠️ My name isn't listed here!" — triggers `ALERT_VOLUNTEER_NOT_LISTED`

> Selecting a volunteer pre-populates `identity.firstName`, `identity.lastName`, `identity.email`, and all three consent fields from stored preferences.

---

### IMPAIRMENT Section

Accessibility self-identification. Step 1 for Participant only.

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `impairment.status` | "Do you consider yourself to be a disabled person, or to have a long-term physical or mental health condition or impairment?" | Select dropdown | Participant ✓ · Group ✗ · Volunteer ✗ |

**Options:** Yes · No · Rather not say

---

### GROUP_LEADER Section

Group-role Step 2. Covers leader participation decision and the conditional existing-leader notice.

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.leaderParticipating` | "Will you be participating in the games?" | Radio group | Group role always |
| `group.existingLeaderNotice` | "(info banner) [Org] already has a group registration" | Info panel | Group role + org already has a Group registration |
| `group.additionalLeaderChoice` | (inside the notice) "What would you like to do?" | Radio group | Visible only within `group.existingLeaderNotice` |

**`group.leaderParticipating` options:**
- `leaderParticipating.yes` — "I will be joining in the games as a participant"
- `leaderParticipating.no` — "I will not be taking part in the games"

**`group.additionalLeaderChoice` options (within existing-leader notice):**
- `additionalLeaderChoice.leaderOnly` — "Register as additional leader only" (sets groupSize = 0)
- `additionalLeaderChoice.additionalParticipants` — "Register additional participants"

---

### GROUP_DETAILS Section

Group-role Step 2 (below `GROUP_LEADER`). Fields shown depend on whether the selected org is open or closed.

**For OPEN groups (`openGroup !== false`)**

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.size.open` | "How many participants are in your group (not including yourself)?" | Number input | Open group selected + `additionalLeaderChoice` ≠ `leaderOnly` |

> This captures the expected count the leader is bringing. Participants will register individually on the day.

**For CLOSED groups (`openGroup === false`) including Family Group placeholder**

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.size.closed` | "How many participants are you responsible for in your group" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |
| `group.impairedParticipants` | "How many of your participants are disabled people, or have a long-term physical or mental health condition or impairment?" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |
| `group.nonImpairedParticipants` | "Do you have any special educational needs (SEN) or require additional learning support?" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |

> `group.size.open` and `group.size.closed` both map to the `groupSize` database field — they have different labels but are the same underlying value.

---

### CONSENT Section

Shown on the final step for all roles (Step 2 for Participant, Step 3 for Group, Step 1 for Volunteer).

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `consent.photo` | "Consent to photography" | Radio group | Participant ✓ · Group ✓ · Volunteer ✓ |
| `consent.feedback` | "To ask for your honest feedback after today's event? (4 minute online survey)" | Checkbox | Participant ✓ · Group ✓ · Volunteer ✓ |
| `consent.nextEvent` | "To share info about our next event?" | Checkbox | Participant ✓ · Group ✓ · Volunteer ✓ |

**`consent.photo` options:**
- `photoConsent.yes` — consent granted (wording varies by role: individual vs whole-group)
- `photoConsent.no` — declined; orange wristband issued

---

### Alert States

These are not data entry elements but replace the form when triggered, blocking further entry.

| ID | Trigger | Description |
|---|---|---|
| `ALERT_VOLUNTEER_NOT_LISTED` | `volunteer.notListed` selected | Prompts Volunteer to switch to Participant or speak to P2I staff |
| `ALERT_ORG_NOT_LISTED` | `org.picker.group.notListed` selected | Prompts Group leader to speak to P2I staff to register their group |

---

### Step Map by Role

**Participant (2 steps)**

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `ORG_PICKER` (`org.picker.participant`) · `IDENTITY` · `IMPAIRMENT` |
| 2 | `CONSENT` |

**Group Leader (3 steps)**

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `ORG_PICKER` (`org.picker.group`) · `GROUP_CONTACT_PICKER` (after org selected) · `IDENTITY` (via picker — not shown as separate fields) |
| 2 | `GROUP_LEADER` · `GROUP_DETAILS` (open or closed variant based on org) |
| 3 | `CONSENT` |

**Volunteer (1 step)**

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `VOLUNTEER_PICKER` · `IDENTITY` (`identity.email` only, after name selected) · `CONSENT` |

---

### Field × Role Visibility Matrix

| Field ID | Participant | Group | Volunteer |
|---|---|---|---|
| `ROLE_SELECTOR` | ✓ | ✓ | ✓ |
| `org.picker.participant` | ✓ | – | – |
| `org.picker.group` | – | ✓ | – |
| `volunteer.namePicker` | – | – | ✓ |
| `group.contactPicker` | – | ✓ after org selected | – |
| `group.contactPicker.knownContact` | – | per unregistered contact | – |
| `group.contactPicker.newContact` | – | ✓ always last | – |
| `group.contactPicker.newContact.firstName` | – | when newContact selected | – |
| `group.contactPicker.newContact.lastName` | – | when newContact selected | – |
| `group.contactPicker.newContact.email` | – | when newContact selected | – |
| `identity.firstName` | ✓ direct entry | via picker (hidden on Step 1) | – |
| `identity.lastName` | ✓ direct entry | via picker (hidden on Step 1) | – |
| `identity.email` | ✓ direct entry | via picker (hidden on Step 1) | ✓ after name selected |
| `impairment.status` | ✓ | – | – |
| `group.leaderParticipating` | – | ✓ | – |
| `group.existingLeaderNotice` | – | conditional | – |
| `group.additionalLeaderChoice` | – | conditional | – |
| `group.size.open` | – | open group only | – |
| `group.size.closed` | – | closed group only | – |
| `group.impairedParticipants` | – | closed group only | – |
| `group.nonImpairedParticipants` | – | closed group only | – |
| `consent.photo` | ✓ | ✓ | ✓ |
| `consent.feedback` | ✓ | ✓ | ✓ |
| `consent.nextEvent` | ✓ | ✓ | ✓ |

