# Power2Inspire Event CRM App - Data Models

**Document Version:** 2.2
**Date:** 2026-04-16
**Status:** Current Implementation (NextJS Web App)

> ⚠️ **Note (2026-04-29):** The `syncStatus` and `airtableRecordId` fields documented below remain in the schema, but the **Neon → Airtable direct sync flow is deprecated**. CSV export is the supported post-event workflow. These fields are retained for historical records but are no longer actively populated by a live sync. See `AIRTABLE_INTEGRATION.md` for the canonical deprecation note.

## 1. Domain Entities

### 1.1 Event Entity

Represents a charitable event organized by Power2Inspire.

**Properties:**
- `id` (String, UUID): Unique identifier
- `name` (String, required): Event name
- `date` (DateTime, required): Event date and time
- `location` (String, optional): Event venue/address
- `description` (String, optional): Event details
- `status` (EventStatus, required): planned | active | completed | archived
- `createdAt` (DateTime, required): Record creation timestamp
- `modifiedAt` (DateTime, required): Last modification timestamp

**Business Rules:**
- Only one event can be "active" at a time
- Event date cannot be in the past when creating
- Event name must be 3-100 characters

**Example:**
```typescript
Event(
  id: 'evt_123abc',
  name: 'Community Wellness Day',
  date: DateTime(2026, 03, 15, 10, 0),
  location: 'Community Center, Main Street',
  description: 'Annual wellness event with health screenings',
  status: EventStatus.active,
  createdAt: DateTime.now(),
  modifiedAt: DateTime.now(),
)
```

---

### 1.2 Registration Entity

Represents a participant, volunteer, or group leader registration for an event.

**Properties:**
- `id` (String, UUID): Unique identifier
- `eventId` (String, required): Foreign key to Event
- `attendeeName` (String, required): First name / given name
- `attendeeSurname` (String, required): Last name / family name
- `email` (String, optional): Email address
- `organizationId` (String, optional): Foreign key to Organization (linked record in Airtable)
- `impairment` (String, optional): Disability or accessibility needs (dropdown: "Yes", "No", "Rather not say")
- `role` (RegistrationRole, required): Participant | Volunteer | Group
- `photoConsent` (bool, required): Consent for event photography
- `feedbackConsent` (bool, optional): Consent for post-event feedback
- `nextEventConsent` (bool, optional): Consent for next event information
- `groupSize` (int, optional): Number of participants in group (Group role only, required for disability/family groups)
- `impairedParticipants` (int, optional): Number of impaired participants in the group (Group role only, required for disability/family groups)
- `nonImpairedParticipants` (int, optional): Number of non-impaired participants in the group (Group role only, required for disability/family groups)
- `groupLeaderParticipating` (bool, optional): Whether group leader is participating in games (Group role only)
- `checkinTime` (DateTime, optional): Check-in timestamp
- `checkoutTime` (DateTime, optional): Check-out timestamp
- `organisationName` (String, optional): Organisation name captured at registration time (denormalised for resilience against org record changes)
- `syncStatus` (SyncStatus, optional): pending | synced | failed
- `airtableRecordId` (String, optional): Airtable record ID after sync
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Name must be 2-100 characters, letters/spaces/hyphens/apostrophes only
- Surname must be 2-100 characters, letters/spaces/hyphens/apostrophes only
- Email must be valid format if provided (max 255 characters)
- Email is required for Volunteer role (selected from pre-registered list)
- Phone field has been REMOVED in V2
- Impairment is a dropdown selection, not free text
- Organization is required for Group role
- For Group role with disability/family groups: groupSize, impairedParticipants, and nonImpairedParticipants are required
- groupSize must be >= 1, max 999
- impairedParticipants and nonImpairedParticipants must be >= 0, max 999
- Cannot check out before checking in
- Photo consent defaults to true (opt-out available)
- feedbackConsent and nextEventConsent default to false (opt-in required)
- marketingConsent field has been REMOVED and replaced with feedbackConsent and nextEventConsent

**Role-Specific Requirements:**

**Participant:**
- Required: attendeeName, attendeeSurname, photoConsent
- Optional: email, organizationId, impairment, feedbackConsent, nextEventConsent

**Volunteer:**
- Required: email (from dropdown), attendeeName (auto-filled), attendeeSurname (auto-filled), photoConsent
- Optional: impairment, feedbackConsent, nextEventConsent
- Name fields are auto-populated from volunteer database based on email selection

**Group:**
- Required: organizationId, attendeeName, attendeeSurname, email, groupLeaderParticipating, photoConsent
- Optional: impairment, feedbackConsent, nextEventConsent
- Conditional Required (for disability/family groups): groupSize, impairedParticipants, nonImpairedParticipants
- Name and email fields may be auto-populated from organization contact details

**Computed Properties:**
- `fullName`: Returns "attendeeName attendeeSurname"
- `isCheckedIn`: Returns true if checkinTime is not null
- `isCheckedOut`: Returns true if checkoutTime is not null
- `attendanceDuration`: Returns duration between check-in and check-out

**Example (Participant):**
```typescript
{
  id: 'reg_456def',
  eventId: 'evt_001',
  attendeeName: 'Jane',
  attendeeSurname: 'Smith',
  email: 'jane.smith@example.com',
  organizationId: 'org_789xyz',
  impairment: 'Yes',
  role: 'Participant',
  photoConsent: true,
  feedbackConsent: true,
  nextEventConsent: false,
  checkinTime: null,
  checkoutTime: null,
  syncStatus: 'pending',
  createdAt: '2026-02-16T10:30:00Z',
  modifiedAt: '2026-02-16T10:30:00Z',
}
```

**Example (Group Leader - Disability Group):**
```typescript
{
  id: 'reg_789ghi',
  eventId: 'evt_001',
  attendeeName: 'Helen',
  attendeeSurname: 'Davies',
  email: 'helen.davies@glenfield.sch.uk',
  organizationId: 'org_leicester_glenfield',
  impairment: 'No',
  role: 'Group',
  photoConsent: true,
  feedbackConsent: true,
  nextEventConsent: true,
  groupSize: 25,
  impairedParticipants: 20,
  nonImpairedParticipants: 15,
  groupLeaderParticipating: false,
  checkinTime: null,
  checkoutTime: null,
  syncStatus: 'pending',
  createdAt: '2026-02-16T09:15:00Z',
  modifiedAt: '2026-02-16T09:15:00Z',
}
```

---

### 1.3 Organisation Entity

Represents an organisation that attendees/volunteers may be affiliated with. The implementation uses two tables: `organisations` (global master record, reusable across events) and `organisation_contacts` (one row per org-and-event pair, holds the event-specific contact details and group behaviour flags).

#### 1.3a organisations table

Global records — the same organisation row is reused across multiple events. Per-event scoping lives entirely on `organisation_contacts`, never on this table.

**Properties:**
- `id` (UUID, PK): Local unique identifier
- `name` (String, optional): Organisation name
- `groupType` (String, optional): Reporting category — Family | Disability | Corporate | Sporting | Community | Educational | Other (see section 2.5). **For reporting/Airtable sync only — never used for filtering.**
- `imageUrl` (String, optional): Organisation logo/image URL
- `airtableRecordId` (String, optional): Airtable record ID, retained as a reference field for re-import upserts
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

#### 1.3b organisation_contacts table

One row = one organisation's participation in one event. Holds the group leader contact details, the open/closed flag, expected size, and consent preferences for that specific (org, event) pair.

**Properties:**
- `id` (UUID, PK): Unique identifier
- `organisationId` (UUID, required, NOT NULL): FK → `organisations.id` ON DELETE RESTRICT
- `eventId` (UUID, required, NOT NULL): FK → `events.id` ON DELETE CASCADE
- `openGroup` (Boolean, required, default: true): **Whether this group is visible to individual Participants at this event.** `true` = open group (participants register individually); `false` = closed group (group leader registers on behalf of all members). This is the single source of truth for organisation filtering — see section 9.
- `photoConsent` (Boolean, required, default: true): Group leader's photo consent preference (pre-populated on Group registration form)
- `feedbackConsent` (Boolean, required, default: false): Group leader's feedback survey consent preference
- `nextEventConsent` (Boolean, required, default: false): Group leader's next event info consent preference
- `contactFirstName` (String, optional): Contact person first name (for Group role auto-population)
- `contactLastName` (String, optional): Contact person last name (for Group role auto-population)
- `contactEmail` (String, optional): Contact person email (for Group role auto-population)
- `contactPhone` (String, optional): Contact person phone
- `expectedGroupSize` (String, optional): Expected number of participants (pre-event planning)
- `notes` (String, optional): Additional information
- `airtableRecordId` (String, optional): Airtable record ID for this contact record (reference field for re-import upserts)
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Organisation name must be 2-200 characters
- Organisations are global; an org's participation in a specific event is represented by an `organisation_contacts` row with `organisationId` and `eventId` UUID FKs
- Organisations can be pre-loaded from Airtable before the event
- Organisations can be created by Event Admin during the event
- `openGroup` on `organisation_contacts` (not `groupType` on `organisations`) controls whether participants can see and select the organisation — see section 9
- Contact person details (firstName, lastName, email) auto-populate the Group role registration form
- Family Group organisations do NOT have pre-set contact details (personalised per family)

**Organisation Types (by groupType):**

**Corporate/Institutional:**
- Examples: Next PLC, Leicester Tigers, De Montfort University, Deloitte, Siemens
- `openGroup`: typically true

**Disability/SEN:**
- Examples: Glenfield SEN School, Hazel Grove Special School
- Trigger additional fields in Group registration: groupSize, impairedParticipants, nonImpairedParticipants
- `openGroup`: typically false (closed group)

**Family Groups:**
- `groupType`: Family
- `openGroup`: false
- No pre-set contact details — each family provides their own

**Example (organisations row):**
```typescript
{
  id: 'org-uuid-local',
  name: 'Next PLC',
  groupType: 'Corporate',
  imageUrl: null,
  airtableRecordId: 'recXXXXXXXXXXXXXX',
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: '2026-01-15T10:00:00Z',
}
```

**Example (organisation_contacts row — open group):**
```typescript
{
  id: 'uuid-contact',
  organisationId: 'org-uuid-local',     // FK → organisations.id
  eventId: 'event-uuid-local',          // FK → events.id
  openGroup: true,
  photoConsent: true,
  feedbackConsent: false,
  nextEventConsent: false,
  contactFirstName: 'Rachel',
  contactLastName: 'Thompson',
  contactEmail: 'rachel.thompson@next.co.uk',
  contactPhone: null,
  expectedGroupSize: '20',
  notes: 'Corporate sponsor and participant',
  airtableRecordId: 'recCONTACTXXXXXXXX',
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: '2026-01-15T10:00:00Z',
}
```

**Example (organisation_contacts row — closed group / disability):**
```typescript
{
  id: 'uuid-contact-2',
  organisationId: 'glenfield-org-uuid', // FK → organisations.id
  eventId: 'event-uuid-local',          // FK → events.id
  openGroup: false,
  photoConsent: true,
  feedbackConsent: true,
  nextEventConsent: true,
  contactFirstName: 'Helen',
  contactLastName: 'Davies',
  contactEmail: 'helen.davies@glenfield.sch.uk',
  contactPhone: null,
  expectedGroupSize: '25',
  notes: 'Special educational needs school',
  airtableRecordId: 'recCONTACT2XXXXXXX',
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: '2026-01-15T10:00:00Z',
}
```

---

### 1.4 Volunteer Entity

Represents a pre-registered volunteer for an event. Volunteers are event-specific.

**Properties:**
- `id` (String, UUID): Unique identifier
- `eventId` (String, required): Foreign key to Event (volunteers are event-specific)
- `firstName` (String, required): Volunteer first name
- `lastName` (String, required): Volunteer last name
- `email` (String, required): Volunteer email (unique per event)
- `photoConsent` (bool, required): Photo consent preference (default: true)
- `feedbackConsent` (bool, required): Feedback survey consent (default: false)
- `nextEventConsent` (bool, required): Next event info consent (default: false)
- `airtableRecordId` (String, optional): Airtable record ID after sync
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Volunteers are pre-registered before the event (loaded from Airtable or added by P2I Admin)
- Email must be unique per event
- Volunteers are linked to specific events via eventId
- When a volunteer registers at the event, their name and consent preferences are auto-populated from this entity
- Volunteers can be added by P2I Admin during event if not pre-registered
- Consent fields are pre-set during volunteer registration and auto-populate the registration form

**Example:**
```typescript
{
  id: 'vol_001',
  eventId: 'evt_001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@volunteer.org',
  photoConsent: true,
  feedbackConsent: true,
  nextEventConsent: true,
  airtableRecordId: 'rec_abc123',
  createdAt: '2026-01-20T14:00:00Z',
  modifiedAt: '2026-01-20T14:00:00Z',
}
```

---

### 1.5 EventSummary Entity

Represents a point-in-time snapshot generated when a P2I admin archives a completed event. The summary persists after the event's participant and organisation data has been cleared from the database.

**Properties:**
- `id` (UUID, PK): Unique identifier
- `eventId` (UUID, required, unique FK → events): The archived event this summary belongs to
- `eventName` (String, required): Event name captured at archive time
- `eventDate` (String, required): Event date (ISO 8601) captured at archive time
- `eventLocation` (String, optional): Event venue captured at archive time
- `eventDescription` (String, optional): Event description captured at archive time
- `eventAirtableRecordId` (String, optional): Airtable record ID of the event
- `participantCount` (Integer, required, default: 0): Number of Participant registrations
- `volunteerCount` (Integer, required, default: 0): Number of Volunteer registrations
- `groupCount` (Integer, required, default: 0): Number of Group registrations
- `totalHeadcount` (Integer, required, default: 0): Total computed headcount (accounts for closed-group sizes)
- `photoConsentCount` (Integer, required, default: 0): Number of attendees who gave photo consent
- `feedbackConsentCount` (Integer, required, default: 0): Number of attendees who gave feedback consent
- `nextEventConsentCount` (Integer, required, default: 0): Number of attendees who gave next-event consent
- `orgBreakdown` (String, required, default: '[]'): JSON array of `{ orgName: string, headcount: number }` objects
- `eventSequenceNumber` (Integer, required): Human-readable sequence number assigned by P2I admin at archive time
- `adminNotes` (String, optional): Free-text notes entered by P2I admin at archive time
- `createdAt` (DateTime, optional): Timestamp when the summary was generated

**Business Rules:**
- One summary per event (`eventId` is unique)
- Summary is created when the event is archived; event data is cleared immediately after
- All event metadata fields are copied from the event record at archive time to survive the data clear
- `orgBreakdown` is stored as serialised JSON text
- `eventSequenceNumber` is required and assigned manually by the P2I admin (not auto-incremented)

**Example:**
```typescript
{
  id: 'uuid-summary-001',
  eventId: 'uuid-evt-001',
  eventName: 'Community Wellness Day 2026',
  eventDate: '2026-03-15',
  eventLocation: 'Community Center, Main Street',
  eventDescription: 'Annual wellness event with health screenings',
  eventAirtableRecordId: 'recEVENTXXXXXXXXXX',
  participantCount: 142,
  volunteerCount: 18,
  groupCount: 12,
  totalHeadcount: 310,
  photoConsentCount: 295,
  feedbackConsentCount: 210,
  nextEventConsentCount: 185,
  orgBreakdown: '[{"orgName":"Next PLC","headcount":45},{"orgName":"Glenfield SEN School","headcount":26}]',
  eventSequenceNumber: 7,
  adminNotes: 'Excellent turnout. Venue was slightly too small.',
  createdAt: '2026-03-20T14:30:00Z',
}
```

---

### 1.6 SyncLog Entity

Tracks synchronization attempts to external systems.

**Properties:**
- `id` (String, UUID): Unique identifier
- `entityType` (String, required): Type of entity (event, registration)
- `entityId` (String, required): ID of the synced entity
- `syncTarget` (SyncTarget, required): airtable | mailchimp | googleDrive
- `status` (SyncStatus, required): pending | synced | failed
- `errorMessage` (String, optional): Error details if failed
- `timestamp` (DateTime, required): Sync attempt timestamp
- `retryCount` (int, required): Number of retry attempts

**Business Rules:**
- Maximum 3 retry attempts before manual intervention required
- Error messages should not contain sensitive data
- Successful syncs cannot be retried

**Example:**
```typescript
SyncLog(
  id: 'sync_789ghi',
  entityType: 'registration',
  entityId: 'reg_456def',
  syncTarget: SyncTarget.airtable,
  status: SyncStatus.synced,
  errorMessage: null,
  timestamp: DateTime.now(),
  retryCount: 0,
)
```

---

## 2. Value Objects

### 2.1 EventStatus Enum
```typescript
enum EventStatus {
  planned = "planned",      // Future event, not yet active
  active = "active",        // Currently ongoing or upcoming
  completed = "completed",  // Event has finished; registration data still present
  archived = "archived",    // Event whose participant/organisation data has been cleared; eventSummary snapshot exists
}
```

### 2.2 RegistrationRole Enum
```typescript
enum RegistrationRole {
  Participant = "Participant",  // Individual event participant
  Volunteer = "Volunteer",      // Pre-registered event helper/staff
  Group = "Group",              // Group leader/coordinator bringing team
}
```

**Role Descriptions:**
- **Participant**: Individual attendees participating in the games
- **Volunteer**: Pre-registered volunteers helping at the event (not participating in games)
- **Group**: Group leaders/coordinators bringing teams of participants (may or may not participate themselves)

### 2.3 SyncStatus Enum
```typescript
enum SyncStatus {
  pending = "pending",     // Not yet synced
  synced = "synced",      // Successfully synced
  failed = "failed",      // Sync failed, needs retry
}
```

### 2.4 SyncTarget Enum
```typescript
enum SyncTarget {
  airtable = "airtable",    // Airtable CRM
  mailchimp = "mailchimp",   // Mailchimp marketing platform (deprecated)
  googleDrive = "googleDrive", // Google Drive backup (deprecated)
}
```

**Note:** In V2, only Airtable sync is actively used. Mailchimp and Google Drive targets are deprecated.

### 2.5 GroupType Union

```typescript
type GroupType =
  | 'Family'
  | 'Disability'
  | 'Corporate'
  | 'Sporting'
  | 'Community'
  | 'Educational'
  | 'Other'
  | 'Individual';
```

**Type Descriptions:**
- **Family** – Family groups attending together
- **Disability** – Disability/SEN organisations (triggers group-specific fields)
- **Corporate** – Corporate sponsors and workplace teams
- **Sporting** – Sports clubs and teams
- **Community** – Community organisations
- **Educational** – Schools and universities
- **Other** – Uncategorised organisations
- **Individual** – System marker for participants with no group affiliation. **Excluded from all participant counting logic.** Not selectable by the user; assigned automatically.

**Important:** `groupType` is an administrative label used for external reporting and Airtable sync only. It must never be used for filtering, selection, or conditional logic within the application. See section 9 (Organisation Filtering) for the correct approach.

---

## 3. Data Transfer Objects (DTOs)

### 3.1 CSV Export DTO

Used for generating CSV reports for post-event analysis and Airtable sync.

**Properties:**
- `attendeeName` (String): First name
- `attendeeSurname` (String): Last name
- `email` (String): Email address
- `organization` (String): Organization name (looked up from organizationId)
- `impairment` (String): Impairment status ("Yes", "No", "Rather not say")
- `role` (String): Participant | Volunteer | Group
- `photoConsent` (String): yes | no
- `feedbackConsent` (String): yes | no
- `nextEventConsent` (String): yes | no
- `groupSize` (Number): Number of participants in group (Group role only)
- `impairedParticipants` (Number): Number of impaired participants in the group (Group role only)
- `nonImpairedParticipants` (Number): Number of non-impaired participants in the group (Group role only)
- `groupLeaderParticipating` (String): yes | no (Group role only)
- `checkinTime` (String): ISO 8601 formatted timestamp
- `checkoutTime` (String): ISO 8601 formatted timestamp

**Removed Fields (from V1):**
- `phone` - Phone field removed in V2
- `marketingConsent` - Replaced with feedbackConsent and nextEventConsent

---

## 4. Validation Rules

### 4.1 Email Validation
- Format: RFC 5322 compliant
- Maximum length: 255 characters
- Example: `user@example.com`
- Required for: Volunteer role
- Optional for: Participant and Group roles

### 4.2 Name Validation
- Minimum length: 2 characters
- Maximum length: 100 characters
- Allowed characters: Letters, spaces, hyphens, apostrophes
- Pattern: `^[a-zA-Z\s'-]+$`
- Example: `Mary O'Brien-Smith`
- Required for: All roles

### 4.3 Number Field Validation (Group Role)
- **Group Size:**
  - Type: Integer
  - Minimum: 1
  - Maximum: 999
  - Required for: Disability/Family groups in Group role

- **Impaired Participants:**
  - Type: Integer
  - Minimum: 0
  - Maximum: 999
  - Required for: Disability/Family groups in Group role

- **Non-Impaired Participants:**
  - Type: Integer
  - Minimum: 0
  - Maximum: 999
  - Required for: Disability/Family groups in Group role

### 4.4 Impairment Field
- Type: Dropdown selection (not free text)
- Options: "Yes", "No", "Rather not say"
- Optional for all roles

### 4.5 Consent Fields
- **Photo Consent:**
  - Type: Boolean (radio buttons)
  - Default: true (opt-out available)
  - Required for: All roles

- **Feedback Consent:**
  - Type: Boolean (checkbox)
  - Default: false (opt-in required)
  - Optional for: All roles

- **Next Event Consent:**
  - Type: Boolean (checkbox)
  - Default: false (opt-in required)
  - Optional for: All roles

### 4.6 Group Leader Participation
- Type: Boolean (radio buttons)
- Options: "I will be joining in the games as a participant" (true) | "I will not be taking part in the games" (false)
- Required for: Group role only

---

## 5. Database Indexes

For optimal query performance in Neon PostgreSQL:

```sql
-- Events
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);

-- Registrations
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_role ON registrations(role);
CREATE INDEX idx_registrations_sync_status ON registrations(sync_status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_organization_id ON registrations(organization_id);
CREATE INDEX idx_registrations_checkin ON registrations(checkin_time);

-- Organizations
CREATE INDEX idx_organizations_event_id ON organizations(event_id);
CREATE INDEX idx_organizations_name ON organizations(name);
CREATE INDEX idx_organizations_is_disability_group ON organizations(is_disability_group);

-- Volunteers
CREATE INDEX idx_volunteers_event_id ON volunteers(event_id);
CREATE INDEX idx_volunteers_email ON volunteers(email);

-- Sync Logs
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp);
```

---

## 6. Data Relationships

### Entity Relationship Diagram (Conceptual)

```
Event (1) ──────< (Many) Registration
  │
  ├──────< (Many) Organization
  │
  └──────< (Many) Volunteer

Organization (1) ──────< (Many) Registration
```

### Relationship Details:

**Event → Registration (One-to-Many)**
- One event can have many registrations
- Each registration belongs to exactly one event
- Foreign key: `Registration.eventId → Event.id`

**Event → Organization (One-to-Many)**
- One event can have many organizations
- Each organization is linked to exactly one event
- Foreign key: `Organization.eventId → Event.id`

**Event → Volunteer (One-to-Many)**
- One event can have many pre-registered volunteers
- Each volunteer is linked to exactly one event
- Foreign key: `Volunteer.eventId → Event.id`

**Organization → Registration (One-to-Many)**
- One organization can have many registrations
- Each registration can optionally belong to one organization
- Foreign key: `Registration.organizationId → Organization.id` (optional)

---

## 7. Data Flow and Lifecycle

### Pre-Event Phase
1. **Event Creation**: P2I Admin creates event in Airtable
2. **Data Import**: Event, Organizations, and Volunteers imported from Airtable to Neon PostgreSQL
3. **System Ready**: Registration form becomes available with pre-loaded data

### During Event Phase
1. **Registration**: Attendees/Volunteers/Groups register via web form
2. **Data Storage**: Registrations stored in Neon PostgreSQL with `syncStatus: pending`
3. **Admin Actions**: Event Admin can add organizations and volunteers on-the-fly
4. **Check-in/Check-out**: Attendance tracked with timestamps

### Post-Event Phase
1. **Data Sync**: All registrations synced back to Airtable
2. **CSV Export**: Event data exported for analysis
3. **Database Wipe**: Neon PostgreSQL database cleared for next event
4. **Airtable Archive**: All data preserved in Airtable as source of truth

---

## 9. Organisation Filtering

### Rule: Use `openGroup`, Never `groupType`

**`groupType` is an administrative label for external reporting systems only. It must never be used for filtering, selection, or any conditional logic within this application.**

The single source of truth for group behaviour is the `openGroup` boolean on the `organisation_contacts` table:

| `openGroup` value | Meaning |
|---|---|
| `true` (or not set) | **Open group** — participants register individually; group leader registers separately to set expected count |
| `false` | **Closed group** — group leader registers on behalf of all members; no individual participant registrations |

### Filtering by Registration Role

Implemented in `lib/helpers.ts`:

- **Participants** — see only organisations where `openGroup !== false` (open groups only)
- **Group leaders** — see all organisations (open and closed); open groups listed first, closed groups at the bottom
- **Volunteers / undefined** — no filter applied

### Why `openGroup` Lives on `organisation_contacts`

`openGroup` is stored on `organisation_contacts` (not `organisations`) because the same organisation may be open at one event and closed at another. This makes the flag event-specific rather than a permanent attribute of the organisation.

### Rationale

`groupType` values such as `'Disability'` or `'Family'` are normalised from 18 Airtable values for Airtable sync and reporting dashboards. They carry no reliable behavioural meaning within the app — a Disability group might be open at one event, a Corporate group might be closed at another. Always use `openGroup` for any branching logic.

See also: `lib/helpers.ts` → `organizationsToOptions()` and `groupOrgsToSections()`.

---

## 8. Version History

### V2.2 Changes (2026-04-16)

1. **EventStatus Enum**: Corrected to match schema — replaced `cancelled` with `planned` and `archived`
2. **GroupType Union (section 2.5)**: New section documenting all 8 values including `Individual` (system marker, excluded from counting)
3. **Registration Entity**: Added `organisationName` field (denormalised org name captured at registration time)
4. **Organisation Entity (section 1.3)**: Rewrote to document actual two-table structure (`organisations` + `organisation_contacts`); added `openGroup`, `photoConsent`, `feedbackConsent`, `nextEventConsent` fields on `organisation_contacts`
5. **EventSummary Entity (section 1.5)**: New table — point-in-time snapshot created when an event is archived
6. **Organisation Filtering (section 9)**: New section explaining `openGroup` as the source of truth; `groupType` is for reporting only

### V2.1 Changes (2026-02-18)

**Minor Updates:**
1. **Volunteer Entity**: Added consent fields (`photoConsent`, `feedbackConsent`, `nextEventConsent`)
   - These fields are pre-set during volunteer registration
   - Auto-populate the registration form when volunteer selects their email
2. **Documentation Alignment**: Updated Volunteer entity documentation to match implementation

### V2.0 Changes (2026-02-16)

**Major Changes:**
1. **Three Registration Roles**: Changed from 2 roles (attendee, volunteer) to 3 roles (Participant, Volunteer, Group)
2. **Event-Specific Data**: Organizations and Volunteers now linked to specific events via `eventId`
3. **Volunteer Entity**: New entity for pre-registered volunteers
4. **Organization Enhancements**:
   - Added `isDisabilityGroup` flag
   - Added contact person fields (firstName, lastName, email) for auto-population
   - Added `imageUrl` for organization logos
5. **Group-Specific Fields**: Added `groupSize`, `impairedParticipants`, `nonImpairedParticipants` for Group role
6. **Group Leader Participation**: Added `groupLeaderParticipating` boolean field
7. **Consent Fields**: Replaced `marketingConsent` with `feedbackConsent` and `nextEventConsent`
8. **Removed Fields**: Removed `phone` field from Registration entity
9. **Impairment Field**: Changed from free text to dropdown selection ("Yes", "No", "Rather not say")

**Technical Changes:**
- Migrated from Flutter/Dart to NextJS/TypeScript
- Changed from SQLite to Neon PostgreSQL
- Updated all code examples from Dart to TypeScript
- Added new indexes for Organizations and Volunteers tables

### V1.0 (2026-02-06)
- Initial data model documentation
- Flutter/Dart implementation
- SQLite database
- Two roles: attendee and volunteer

---

**End of Document**

