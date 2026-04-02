/**
 * Power2Inspire Event CRM - TypeScript Type Definitions
 * Based on DATA_MODELS.md V2.0
 * Date: 2026-02-11
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Event Status
 * - 'planned': Future events that are not yet active
 * - 'active': The current active event (only one at a time)
 * - 'completed': Past events that have finished
 * - 'archived': Events whose participant/organisation data has been cleared
 */
export type EventStatus = "planned" | "active" | "completed" | "archived";
export type RegistrationRole = "Participant" | "Volunteer" | "Group";
export type SyncStatus = "pending" | "synced" | "failed";

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Event Entity
 * Represents a charitable event organized by Power2Inspire
 */
export interface Event {
  id: string; // Local ID
  name: string; // Event name (required)
  date: string; // ISO 8601 date string (required)
  location?: string; // Event venue/address (optional)
  description?: string; // Event details (optional)
  status: EventStatus; // planned | active | completed
  airtableRecordId?: string; // Airtable record ID (optional)
  createdAt?: string; // ISO 8601 timestamp
  modifiedAt?: string; // ISO 8601 timestamp
}

/**
 * Registration Entity
 * Represents a participant, volunteer, or group leader registration for an event
 *
 * V2 Changes:
 * - eventId, email, organizationId, impairment are now REQUIRED
 * - Phone field REMOVED (not needed)
 * - photoConsent: false = orange wristband (no photos)
 * - feedbackConsent: optional checkbox for post-event feedback
 * - nextEventConsent: optional checkbox for next event info
 * - Group role includes groupSize, disabledStudents, and senStudents
 * V3 Changes:
 * - Added groupLeaderParticipating field for Group role
 */
export interface Registration {
  id?: string; // Local UUID (optional for new records)
  eventId: string; // Airtable event record ID (REQUIRED)
  attendeeName: string; // First name (REQUIRED, 2-100 chars)
  attendeeSurname: string; // Last name (REQUIRED, 2-100 chars)
  email?: string; // Email address (OPTIONAL, valid format if provided)
  organizationId?: string; // Airtable organization record ID (OPTIONAL)
  organizationName?: string; // Organization name (populated from JOIN, read-only)
  impairment?: string; // Accessibility needs (OPTIONAL, free text)
  role: RegistrationRole; // "Participant" | "Volunteer" | "Group" (REQUIRED)
  photoConsent: boolean; // true = yes, false = orange wristband (REQUIRED)
  feedbackConsent?: boolean; // true = yes to post-event feedback (OPTIONAL)
  nextEventConsent?: boolean; // true = yes to next event info (OPTIONAL)
  groupSize?: number; // Number of participants in group (REQUIRED for Group)
  impairedParticipants?: number; // Number of impaired participants (REQUIRED for closed Group)
  nonImpairedParticipants?: number; // Number of non-impaired participants (REQUIRED for closed Group)
  groupLeaderParticipating?: boolean; // Whether group leader is participating in games (Group role only)
  organisationName?: string; // Organisation name stored at registration time (persisted DB column)
  syncStatus?: SyncStatus; // pending | synced | failed (optional, for offline mode)
  airtableRecordId?: string; // Airtable record ID after creation (optional)
  createdAt?: string; // ISO 8601 timestamp (optional)
  modifiedAt?: string; // ISO 8601 timestamp (optional)
}

/**
 * Group Type Classification
 * Used for reporting and analytics purposes
 */
export type GroupType = 'Family' | 'Disability' | 'Corporate' | 'Sporting' | 'Community' | 'Educational' | 'Other' | 'Individual';

/**
 * Organization Entity
 * Represents an organization that attendees/volunteers may be affiliated with
 * V2: Added eventId to support event-specific organizations
 * V3: Added imageUrl for organization logos
 * V4: Added contact person details (firstName, lastName, contactEmail) for Group role pre-population
 * V5: Replaced isDisabilityGroup and isCorporateGroup with groupType enum for better classification
 */
export interface Organization {
  id: string; // Local ID
  eventId: string; // Event ID this organization is registered for
  name: string; // Organization name (REQUIRED, 2-200 chars)
  groupType?: GroupType; // Classification for reporting: Family, Disability, Corporate, Sporting, Community, Educational, Other (default: Other)
  openGroup: boolean; // If true, visible in Participant dropdown; if false, Group role only
  expectedGroupSize?: number; // Expected number of participants (for planning before actual registration)
  imageUrl?: string; // URL to organization logo/image (optional)
  contactId?: string; // organisation_contacts.id — used to sync consents back after registration
  contactFirstName?: string; // Contact person first name (optional)
  contactLastName?: string; // Contact person last name (optional)
  contactEmail?: string; // Contact person email (optional)
  contactPhone?: string; // Primary contact phone (optional)
  photoConsent?: boolean; // Group leader's photo consent preference
  feedbackConsent?: boolean; // Group leader's feedback consent preference
  nextEventConsent?: boolean; // Group leader's next event consent preference
  notes?: string; // Additional information (optional)
  airtableRecordId?: string; // Airtable record ID (optional)
  createdAt?: string; // ISO 8601 timestamp
  modifiedAt?: string; // ISO 8601 timestamp
}

/**
 * OrgRecord — organisations table entity (admin view)
 * Used by the P2I admin organisations CRUD page.
 * Unlike Organization, this is orgs-table-only with no joined contact data.
 */
export interface OrgRecord {
  id: string;
  name: string;
  groupType: string;

  airtableRecordId?: string;
  airtableEventId?: string;
  createdAt?: string;
  modifiedAt?: string;
}

/**
 * GroupLeader — organisation_contacts joined with organisations (admin view)
 * Used by the P2I admin group leaders CRUD page.
 */
export interface GroupLeader {
  id: string;                      // organisation_contacts.id
  orgId: string;                   // organisations.id (UUID)
  organisationAirtableId: string;  // organisations.airtableRecordId (FK link field)
  orgName: string;
  openGroup: boolean;
  groupType: string;
  expectedGroupSize?: number;      // organisation_contacts.expected_group_size
  contactFirstName?: string;
  contactLastName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  photoConsent?: boolean;
  feedbackConsent?: boolean;
  nextEventConsent?: boolean;
  airtableRecordId?: string;       // organisation_contacts.airtableRecordId
  airtableEventId?: string;
}

/**
 * A contact option for the Group leader contact picker.
 * Returned by getOrgContactsForEvent — one entry per organisation_contacts row.
 */
export interface OrgContactOption {
  contactId: string;        // organisation_contacts.id (UUID)
  firstName: string;
  lastName: string;
  email: string | null;
  photoConsent: boolean;
  feedbackConsent: boolean;
  nextEventConsent: boolean;
  alreadyRegistered: boolean; // true if email matches an existing Group reg for this event + org
}

/**
 * Volunteer Entity
 * Represents a pre-registered volunteer with their details
 * V2: Added eventId to support event-specific volunteers
 * V3: Added id, airtableRecordId, and timestamp fields for database persistence
 */
export interface Volunteer {
  id: string; // Local UUID
  eventId: string; // Event ID this volunteer is registered for
  email: string; // Volunteer email (unique identifier per event)
  firstName: string; // First name
  lastName: string; // Last name
  photoConsent: boolean; // Photo consent preference
  feedbackConsent: boolean; // Feedback survey consent
  nextEventConsent: boolean; // Next event info consent
  airtableRecordId?: string; // Airtable record ID (optional)
  createdAt?: string; // ISO 8601 timestamp
  modifiedAt?: string; // ISO 8601 timestamp
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Registration Form Data (for client-side forms)
 * Excludes auto-generated fields
 */
export interface RegistrationFormData {
  eventId: string;
  attendeeName: string;
  attendeeSurname: string;
  email?: string;
  organizationId?: string;
  impairment?: string;
  role: RegistrationRole;
  photoConsent: boolean;
  feedbackConsent?: boolean; // Optional: consent for post-event feedback
  nextEventConsent?: boolean; // Optional: consent for next event info
  groupSize?: number; // Required for Group
  impairedParticipants?: number; // Required for closed Group
  nonImpairedParticipants?: number; // Required for closed Group
  groupLeaderParticipating?: boolean; // Optional: whether group leader is participating in games (Group role only)
}

/**
 * Attendance Update Request
 * For check-in/check-out operations
 */
export interface AttendanceUpdate {
  registrationId: string; // Airtable record ID
  action: "checkin" | "checkout";
  timestamp?: string; // ISO 8601 timestamp (defaults to now)
}

/**
 * CSV Export Row
 * For exporting registration data to CSV
 */
export interface CSVExportRow {
  eventName: string;
  attendeeName: string;
  attendeeSurname: string;
  email: string;
  organization: string;
  impairment: string;
  role: RegistrationRole;
  photoConsent: string; // "Yes" | "No (Orange Wristband)"
  marketingConsent: string; // "Yes" | "No"
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * API Response (union type)
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Event Summary Types
// ============================================================================

/**
 * Read-only preview of computed event counts (returned before saving).
 */
export interface EventSummaryPreview {
  participantCount: number;
  volunteerCount: number;
  groupCount: number;
  participatingLeaderCount: number;
  totalHeadcount: number;
  photoConsentCount: number;
  feedbackConsentCount: number;
  nextEventConsentCount: number;
  orgBreakdown: { orgName: string; headcount: number }[];
}

/**
 * Saved event summary — persisted snapshot plus admin-entered fields.
 */
export interface EventSummary extends EventSummaryPreview {
  id: string;
  eventId: string;
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDescription: string | null;
  eventAirtableRecordId: string | null;
  eventSequenceNumber: number;
  adminNotes: string | null;
  createdAt: string;
}

