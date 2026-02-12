/**
 * Power2Inspire Event CRM - TypeScript Type Definitions
 * Based on DATA_MODELS.md V2.0
 * Date: 2026-02-11
 */

// ============================================================================
// Enums
// ============================================================================

export type EventStatus = "active" | "completed" | "cancelled";
export type RegistrationRole = "Attendee" | "Volunteer" | "Teacher / Coordinator";
export type SyncStatus = "pending" | "synced" | "failed";

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Event Entity
 * Represents a charitable event organized by Power2Inspire
 */
export interface Event {
  id: string; // Airtable record ID
  name: string; // Event name (required)
  date: string; // ISO 8601 date string (required)
  location?: string; // Event venue/address (optional)
  description?: string; // Event details (optional)
  status: EventStatus; // active | completed | cancelled
  createdAt?: string; // ISO 8601 timestamp
  modifiedAt?: string; // ISO 8601 timestamp
}

/**
 * Registration Entity
 * Represents an attendee or volunteer registration for an event
 * 
 * V2 Changes:
 * - eventId, email, organizationId, impairment are now REQUIRED
 * - Phone field REMOVED (not needed)
 * - photoConsent: false = orange wristband (no photos)
 * - marketingConsent: false = no mailing list
 */
export interface Registration {
  id?: string; // Local UUID (optional for new records)
  eventId: string; // Airtable event record ID (REQUIRED)
  attendeeName: string; // First name (REQUIRED, 2-100 chars)
  attendeeSurname: string; // Last name (REQUIRED, 2-100 chars)
  email?: string; // Email address (OPTIONAL, valid format if provided)
  organizationId?: string; // Airtable organization record ID (OPTIONAL)
  impairment?: string; // Accessibility needs (OPTIONAL, free text)
  role: RegistrationRole; // "Attendee" | "Volunteer" | "Teacher / Coordinator" (REQUIRED)
  photoConsent: boolean; // true = yes, false = orange wristband (REQUIRED)
  marketingConsent: boolean; // true = yes, false = no emails (REQUIRED)
  checkinTime?: string; // ISO 8601 timestamp (optional)
  checkoutTime?: string; // ISO 8601 timestamp (optional)
  syncStatus?: SyncStatus; // pending | synced | failed (optional, for offline mode)
  airtableRecordId?: string; // Airtable record ID after creation (optional)
  createdAt?: string; // ISO 8601 timestamp (optional)
  modifiedAt?: string; // ISO 8601 timestamp (optional)
}

/**
 * Organization Entity
 * Represents an organization that attendees/volunteers may be affiliated with
 */
export interface Organization {
  id: string; // Airtable record ID
  name: string; // Organization name (REQUIRED, 2-200 chars)
  contactEmail?: string; // Primary contact email (optional)
  contactPhone?: string; // Primary contact phone (optional)
  notes?: string; // Additional information (optional)
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
  marketingConsent: boolean;
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
  checkinTime: string; // Formatted timestamp or empty
  checkoutTime: string; // Formatted timestamp or empty
  attendanceDuration: string; // Formatted duration or empty
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

