# Registration Form — Element Map

A reference for all data entry elements in the registration form (`components/registration-form.tsx`).
Use these names in planning docs, specs, and conversations to identify specific fields or groups of fields unambiguously.

---

## Naming Conventions

- **Sections** — groups of related fields, written in `SCREAMING_SNAKE_CASE`
- **Individual fields** — written as `section.field`
- Fields within a section share display lifecycle (same step, shown/hidden together by the same condition)

---

## Top Level: Role Selector

| ID | UI Label | Control type | Notes |
|---|---|---|---|
| `ROLE_SELECTOR` | "Registration Type" | Radio group | Always visible; hidden when role is pre-selected via QR code URL |

**Options:**
- `role.participant` — "I'm a Participant"
- `role.group` — "I am a Teacher, Parent or a Community Group Leader"
- `role.volunteer` — "I'm a Helper"

---

## IDENTITY Section

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

## ORG_PICKER Section

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

## GROUP_CONTACT_PICKER Section

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

## VOLUNTEER_PICKER Section

Volunteer-role only. Replaces ORG_PICKER and IDENTITY name fields.

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `volunteer.namePicker` | "Select your name" | Select dropdown | Volunteer ✓ only |

**Options:** pre-populated list of volunteers for the event, plus:
- `volunteer.notListed` — "⚠️ My name isn't listed here!" — triggers `ALERT_VOLUNTEER_NOT_LISTED`

> Selecting a volunteer pre-populates `identity.firstName`, `identity.lastName`, `identity.email`, and all three consent fields from stored preferences.

---

## IMPAIRMENT Section

Accessibility self-identification. Step 1 for Participant only.

| ID | UI Label | Control type | Role visibility |
|---|---|---|---|
| `impairment.status` | "Do you consider yourself to be a disabled person, or to have a long-term physical or mental health condition or impairment?" | Select dropdown | Participant ✓ · Group ✗ · Volunteer ✗ |

**Options:** Yes · No · Rather not say

---

## GROUP_LEADER Section

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

## GROUP_DETAILS Section

Group-role Step 2 (below `GROUP_LEADER`). Fields shown depend on whether the selected org is open or closed.

### For OPEN groups (`openGroup !== false`)

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.size.open` | "How many participants are in your group (not including yourself)?" | Number input | Open group selected + `additionalLeaderChoice` ≠ `leaderOnly` |

> This captures the expected count the leader is bringing. Participants will register individually on the day.

### For CLOSED groups (`openGroup === false`) including Family Group placeholder

| ID | UI Label | Control type | Condition |
|---|---|---|---|
| `group.size.closed` | "How many participants are you responsible for in your group" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |
| `group.disabledStudents` | "How many of your participants are disabled people, or have a long-term physical or mental health condition or impairment?" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |
| `group.senStudents` | "Do you have any special educational needs (SEN) or require additional learning support?" | Number input | Closed group selected + `additionalLeaderChoice` ≠ `leaderOnly` |

> `group.size.open` and `group.size.closed` both map to the `groupSize` database field — they have different labels but are the same underlying value.

---

## CONSENT Section

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

## Alert States

These are not data entry elements but replace the form when triggered, blocking further entry.

| ID | Trigger | Description |
|---|---|---|
| `ALERT_VOLUNTEER_NOT_LISTED` | `volunteer.notListed` selected | Prompts Volunteer to switch to Participant or speak to P2I staff |
| `ALERT_ORG_NOT_LISTED` | `org.picker.group.notListed` selected | Prompts Group leader to speak to P2I staff to register their group |

---

## Step Map by Role

### Participant (2 steps)

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `ORG_PICKER` (`org.picker.participant`) · `IDENTITY` · `IMPAIRMENT` |
| 2 | `CONSENT` |

### Group Leader (3 steps)

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `ORG_PICKER` (`org.picker.group`) · `GROUP_CONTACT_PICKER` (after org selected) · `IDENTITY` (via picker — not shown as separate fields) |
| 2 | `GROUP_LEADER` · `GROUP_DETAILS` (open or closed variant based on org) |
| 3 | `CONSENT` |

### Volunteer (1 step)

| Step | Sections shown |
|---|---|
| 1 | `ROLE_SELECTOR` · `VOLUNTEER_PICKER` · `IDENTITY` (`identity.email` only, after name selected) · `CONSENT` |

---

## Field × Role Visibility Matrix

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
| `group.disabledStudents` | – | closed group only | – |
| `group.senStudents` | – | closed group only | – |
| `consent.photo` | ✓ | ✓ | ✓ |
| `consent.feedback` | ✓ | ✓ | ✓ |
| `consent.nextEvent` | ✓ | ✓ | ✓ |
