# Registration Form — Field & Logic Reference

> **Auto-generated reference** — Last updated: 2026-03-13
>
> Source files:
> - `components/registration-form.tsx` (UI & step logic)
> - `lib/field-visibility-config.ts` (field visibility per role)
> - `lib/validation.ts` (Zod schema + superRefine rules)

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
| `disabledStudents` | ❌ | ✅ | ❌ |
| `senStudents` | ❌ | ✅ | ❌ |

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
| `disabledStudents` | Integer 0–999 |
| `senStudents` | Integer 0–999 |
| `groupLeaderParticipating` | Boolean |

### Step-Level Validation (validateCurrentStep)
Fields validated when pressing "Next":

| Role | Step | Fields Validated |
|---|---|---|
| Participant | 1 | `organizationId`, `attendeeName`, `attendeeSurname`, `email`, `impairment` |
| Group | 1 | `organizationId`, `email`, `attendeeName`, `attendeeSurname` |
| Group | 2 (additional leader) | `groupLeaderParticipating` |
| Group | 2 (normal / additional participants) | `groupLeaderParticipating`, `groupSize`, `disabledStudents`, `senStudents` |

---

## 5. Conditional UI Behaviours

### 5.1 Organisation Field Differences by Role

| Aspect | Participant | Group |
|---|---|---|
| **Widget** | `Combobox` (searchable, allows custom entry) | `Select` dropdown |
| **Options** | All event orgs + "Family Group" placeholder | All event orgs + "⚠️ My organisation isn't listed here!" |
| **Required** | ✅ Yes | ✅ Yes |
| **Label** | "Your Group Name *" | "Your Organisation or Group Name: *" |

### 5.2 Organisation Selection Side-Effects (Group Role)
- Selecting an org with contact details **auto-populates** `attendeeName`, `attendeeSurname`, and `email`.
- Selecting **"NOT_LISTED"** shows the "Group Not Listed" alert and hides the rest of the form.

### 5.3 Family Group Placeholder (Participant Role)
- A "Family Group" option (`FAMILY_GROUP_PLACEHOLDER`) is always present.
- The label is personalised to `"{surname} Family Group"` when a surname is entered.
- On submit, a real `Organisation` record is created/found via `findOrCreateFamilyGroup()`.

### 5.4 Volunteer Email Selection
- Email field is a **Select dropdown** of pre-registered volunteer emails.
- Selecting an email **auto-populates** name and consent fields from the volunteer record.
- Selecting **"NOT_LISTED"** shows the Volunteer Not Listed alert with options to switch to Participant or speak to P2I staff.

### 5.5 Group — Existing Leader Detection (Multi-Leader Flow)
When a Group leader selects an organisation that already has a registered leader:
- An info panel shows existing leader names, group sizes, and total participants.
- Two radio options appear:
  - **"Register as additional leader only"** → sets `groupSize`, `disabledStudents`, `senStudents` to 0; skips group-size fields on Step 2.
  - **"Register additional participants"** → clears auto-set values; shows normal group-size fields.

### 5.6 Group — Disability/Family Conditional Fields
The variable `shouldShowImpairmentFields` is `true` when:
- `organizationId === "FAMILY_GROUP_PLACEHOLDER"`, OR
- Selected org's `groupType` is `'Disability'` or `'Family'`

When `shouldShowImpairmentFields` is `true` (and not additional-leader-only):
- **Step 2** shows `groupSize`, `disabledStudents`, and `senStudents` with disability-specific labels.
- A note appears for Disability groups: *"Please check your details are correct…"*

When `shouldShowImpairmentFields` is `false` (other group types):
- **Step 2** shows only `groupSize` with generic label: *"How many participants are in your group (not including yourself)?"*
- `disabledStudents` and `senStudents` fields are hidden.

### 5.7 Photo Consent Wording
| Role | Yes Text | No Text |
|---|---|---|
| Group | "Yes, the whole group including staff consents…" | "No. Those within the group will wear a coloured wristband…" |
| Others | "Yes, I consent…" | "No, I will wear an orange wristband…" |

### 5.8 Consent Fields (Volunteer Gating)
For Volunteers, consent fields (photo, feedback, next-event) are **only shown after** a valid email is selected (not empty, not "NOT_LISTED").

---

## 6. Hidden / Auto-Populated Fields

| Field | Source |
|---|---|
| `eventId` | Auto-set from `getCurrentEvent()` on page load |
| `role` | Set from `?role=` query param when present |
| Volunteer name/consents | Auto-populated from volunteer record on email selection |
| Group leader name/email | Auto-populated from organisation contact details |

