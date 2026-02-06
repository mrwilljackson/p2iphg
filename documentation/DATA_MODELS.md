# Power2Inspire Event CRM App - Data Models

**Document Version:** 1.0  
**Date:** 2026-02-06

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

Represents an attendee or volunteer registration for an event.

**Properties:**
- `id` (String, UUID): Unique identifier
- `eventId` (String, required): Foreign key to Event
- `name` (String, required): Full name
- `organization` (String, optional): Organization/company name
- `email` (String, optional): Email address
- `phone` (String, optional): Phone number
- `role` (RegistrationRole, required): attendee | volunteer
- `marketingConsent` (bool, required): Opt-in for marketing communications
- `photoConsent` (bool, required): Consent for event photography
- `checkinTime` (DateTime, optional): Check-in timestamp
- `checkoutTime` (DateTime, optional): Check-out timestamp
- `syncStatus` (SyncStatus, required): pending | synced | failed
- `createdAt` (DateTime, required): Record creation timestamp
- `modifiedAt` (DateTime, required): Last modification timestamp

**Business Rules:**
- Name must be 2-100 characters
- Email must be valid format if provided
- Phone must be valid format if provided
- At least one contact method (email or phone) should be provided
- Cannot check out before checking in
- Marketing consent defaults to false (opt-in required)

**Computed Properties:**
- `isCheckedIn`: Returns true if checkinTime is not null
- `isCheckedOut`: Returns true if checkoutTime is not null
- `attendanceDuration`: Returns duration between check-in and check-out

**Example:**
```dart
Registration(
  id: 'reg_456def',
  eventId: 'evt_123abc',
  name: 'Jane Smith',
  organization: 'Local Community Group',
  email: 'jane.smith@example.com',
  phone: '+44 7700 900123',
  role: RegistrationRole.attendee,
  marketingConsent: true,
  photoConsent: false,
  checkinTime: DateTime(2026, 03, 15, 10, 30),
  checkoutTime: null,
  syncStatus: SyncStatus.pending,
  createdAt: DateTime.now(),
  modifiedAt: DateTime.now(),
)
```

---

### 1.3 SyncLog Entity

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
```dart
enum EventStatus {
  active,      // Currently ongoing or upcoming
  completed,   // Event has finished
  cancelled,   // Event was cancelled
}
```

### 2.2 RegistrationRole Enum
```dart
enum RegistrationRole {
  attendee,    // Event participant
  volunteer,   // Event helper/staff
}
```

### 2.3 SyncStatus Enum
```dart
enum SyncStatus {
  pending,     // Not yet synced
  synced,      // Successfully synced
  failed,      // Sync failed, needs retry
}
```

### 2.4 SyncTarget Enum
```dart
enum SyncTarget {
  airtable,    // Airtable CRM
  mailchimp,   // Mailchimp marketing platform
  googleDrive, // Google Drive backup
}
```

---

## 3. Data Transfer Objects (DTOs)

### 3.1 CSV Export DTO

Used for generating CSV reports.

**Properties:**
- `name` (String): Attendee/volunteer name
- `organization` (String): Organization name
- `email` (String): Email address
- `role` (String): attendee | volunteer
- `marketingConsent` (String): yes | no
- `photoConsent` (String): yes | no
- `checkinTime` (String): ISO 8601 formatted timestamp
- `checkoutTime` (String): ISO 8601 formatted timestamp

---

## 4. Validation Rules

### 4.1 Email Validation
- Format: RFC 5322 compliant
- Maximum length: 254 characters
- Example: `user@example.com`

### 4.2 Phone Validation
- Format: E.164 international format preferred
- Minimum length: 10 digits
- Maximum length: 15 digits
- Example: `+44 7700 900123`

### 4.3 Name Validation
- Minimum length: 2 characters
- Maximum length: 100 characters
- Allowed characters: Letters, spaces, hyphens, apostrophes
- Example: `Mary O'Brien-Smith`

---

## 5. Database Indexes

For optimal query performance:

```sql
-- Events
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(date);

-- Registrations
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_sync_status ON registrations(sync_status);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_checkin ON registrations(checkin_time);

-- Sync Logs
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp);
```

