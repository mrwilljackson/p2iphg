# Power2Inspire Event CRM App - Data Models

**Document Version:** 2.0
**Date:** 2026-02-16
**Status:** Current Implementation (NextJS Web App)

## 1. Domain Entities

### 1.1 Event Entity

Represents a charitable event organized by Power2Inspire.

**Properties:**
- `id` (String, UUID): Unique identifier
- `name` (String, required): Event name
- `date` (DateTime, required): Event date and time
- `location` (String, optional): Event venue/address
- `description` (String, optional): Event details
- `status` (EventStatus, required): active | completed | cancelled
- `createdAt` (DateTime, required): Record creation timestamp
- `modifiedAt` (DateTime, required): Last modification timestamp

**Business Rules:**
- Only one event can be "active" at a time
- Event date cannot be in the past when creating
- Event name must be 3-100 characters

**Example:**
```dart
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

Represents an attendee, volunteer, or group leader registration for an event.

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
- `disabledStudents` (int, optional): Number of disabled participants (Group role only, required for disability/family groups)
- `senStudents` (int, optional): Number of SEN participants (Group role only, required for disability/family groups)
- `groupLeaderParticipating` (bool, optional): Whether group leader is participating in games (Group role only)
- `checkinTime` (DateTime, optional): Check-in timestamp
- `checkoutTime` (DateTime, optional): Check-out timestamp
- `syncStatus` (SyncStatus, optional): pending | synced | failed
- `airtableRecordId` (String, optional): Airtable record ID after sync
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Attendee name must be 2-100 characters, letters/spaces/hyphens/apostrophes only
- Attendee surname must be 2-100 characters, letters/spaces/hyphens/apostrophes only
- Email must be valid format if provided (max 255 characters)
- Email is required for Volunteer role (selected from pre-registered list)
- Phone field has been REMOVED in V2
- Impairment is a dropdown selection, not free text
- Organization is required for Group role
- For Group role with disability/family groups: groupSize, disabledStudents, and senStudents are required
- groupSize must be >= 1, max 999
- disabledStudents and senStudents must be >= 0, max 999
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
- Conditional Required (for disability/family groups): groupSize, disabledStudents, senStudents
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
  disabledStudents: 20,
  senStudents: 15,
  groupLeaderParticipating: false,
  checkinTime: null,
  checkoutTime: null,
  syncStatus: 'pending',
  createdAt: '2026-02-16T09:15:00Z',
  modifiedAt: '2026-02-16T09:15:00Z',
}
```

---

### 1.3 Organization Entity

Represents an organization that attendees/volunteers may be affiliated with. Organizations are event-specific.

**Properties:**
- `id` (String, UUID): Unique identifier
- `eventId` (String, required): Foreign key to Event (organizations are event-specific)
- `name` (String, required): Organization name
- `isDisabilityGroup` (bool, optional): Whether organization is a disability group (triggers conditional fields)
- `imageUrl` (String, optional): Organization logo/image URL
- `contactFirstName` (String, optional): Contact person first name (for Group role auto-population)
- `contactLastName` (String, optional): Contact person last name (for Group role auto-population)
- `contactEmail` (String, optional): Contact person email (for Group role auto-population)
- `contactPhone` (String, optional): Contact person phone
- `notes` (String, optional): Additional information
- `airtableRecordId` (String, optional): Airtable record ID after sync
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Organization name must be 2-200 characters
- Organizations are linked to specific events via eventId
- Organizations can be pre-loaded from Airtable before event
- Organizations can be created by Event Admin during event
- isDisabilityGroup flag controls whether group-specific fields appear in registration form
- Contact person details (firstName, lastName, email) are used to auto-populate Group role registration form
- Family Group organizations do NOT have pre-set contact details (personalized per family)

**Organization Types:**

**Corporate/Institutional Organizations:**
- Examples: Next PLC, Leicester Tigers, De Montfort University, Deloitte, Siemens
- isDisabilityGroup: false
- Have contact person details for auto-population

**Disability Organizations:**
- Examples: Glenfield SEN School, Hazel Grove Special School
- isDisabilityGroup: true
- Have contact person details for auto-population
- Trigger additional fields in Group registration: groupSize, disabledStudents, senStudents
- Show instructional note to verify contact details

**Family Groups:**
- Special organization type for individual families
- isDisabilityGroup: true (to show group-specific fields)
- Do NOT have pre-set contact details
- Each family enters their own details

**Example (Corporate Organization):**
```typescript
{
  id: 'org_leicester_next',
  eventId: 'evt_001',
  name: 'Next PLC',
  isDisabilityGroup: false,
  imageUrl: null,
  contactFirstName: 'Rachel',
  contactLastName: 'Thompson',
  contactEmail: 'rachel.thompson@next.co.uk',
  contactPhone: null,
  notes: 'Corporate sponsor and participant',
  airtableRecordId: null,
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: '2026-01-15T10:00:00Z',
}
```

**Example (Disability Organization):**
```typescript
{
  id: 'org_leicester_glenfield',
  eventId: 'evt_001',
  name: 'Glenfield SEN School',
  isDisabilityGroup: true,
  imageUrl: null,
  contactFirstName: 'Helen',
  contactLastName: 'Davies',
  contactEmail: 'helen.davies@glenfield.sch.uk',
  contactPhone: null,
  notes: 'Special educational needs school',
  airtableRecordId: null,
  createdAt: '2026-01-15T10:00:00Z',
  modifiedAt: '2026-01-15T10:00:00Z',
}
```

**Example (Family Group):**
```typescript
{
  id: 'org_family_group',
  eventId: 'evt_001',
  name: 'Family Group',
  isDisabilityGroup: true,
  imageUrl: null,
  contactFirstName: null,  // No pre-set contact details
  contactLastName: null,
  contactEmail: null,
  contactPhone: null,
  notes: 'For individual families attending together',
  airtableRecordId: null,
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
- `airtableRecordId` (String, optional): Airtable record ID after sync
- `createdAt` (DateTime, optional): Record creation timestamp
- `modifiedAt` (DateTime, optional): Last modification timestamp

**Business Rules:**
- Volunteers are pre-registered before the event (loaded from Airtable or added by P2I Admin)
- Email must be unique per event
- Volunteers are linked to specific events via eventId
- When a volunteer registers at the event, their name is auto-populated from this entity
- Volunteers can be added by P2I Admin during event if not pre-registered

**Example:**
```typescript
{
  id: 'vol_001',
  eventId: 'evt_001',
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@volunteer.org',
  airtableRecordId: 'rec_abc123',
  createdAt: '2026-01-20T14:00:00Z',
  modifiedAt: '2026-01-20T14:00:00Z',
}
```

---

### 1.5 SyncLog Entity

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
```dart
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
  active = "active",      // Currently ongoing or upcoming
  completed = "completed",   // Event has finished
  cancelled = "cancelled",   // Event was cancelled
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
- `disabledStudents` (Number): Number of disabled participants (Group role only)
- `senStudents` (Number): Number of SEN participants (Group role only)
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

- **Disabled Students:**
  - Type: Integer
  - Minimum: 0
  - Maximum: 999
  - Required for: Disability/Family groups in Group role

- **SEN Students:**
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

## 8. Version History

### V2.0 Changes (2026-02-16)

**Major Changes:**
1. **Three Registration Roles**: Changed from 2 roles (attendee, volunteer) to 3 roles (Participant, Volunteer, Group)
2. **Event-Specific Data**: Organizations and Volunteers now linked to specific events via `eventId`
3. **Volunteer Entity**: New entity for pre-registered volunteers
4. **Organization Enhancements**:
   - Added `isDisabilityGroup` flag
   - Added contact person fields (firstName, lastName, email) for auto-population
   - Added `imageUrl` for organization logos
5. **Group-Specific Fields**: Added `groupSize`, `disabledStudents`, `senStudents` for Group role
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

