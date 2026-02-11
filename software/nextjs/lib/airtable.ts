/**
 * Power2Inspire Event CRM - Airtable Client
 * Singleton client for Airtable API integration
 * Based on AIRTABLE_INTEGRATION.md V2.0
 * Date: 2026-02-11
 */

import Airtable from "airtable";

// ============================================================================
// Environment Variables Validation
// ============================================================================

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error("AIRTABLE_API_KEY environment variable is required");
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error("AIRTABLE_BASE_ID environment variable is required");
}

// ============================================================================
// Airtable Client Configuration
// ============================================================================

/**
 * Initialize Airtable client with API key
 * This runs once when the module is first imported
 */
const airtableClient = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
});

/**
 * Get the Airtable base instance
 */
const base = airtableClient.base(process.env.AIRTABLE_BASE_ID);

// ============================================================================
// Table References
// ============================================================================

/**
 * Airtable table references
 * 
 * Table Names (must match Airtable base):
 * - Registrations: Main registration records
 * - Events: Event records
 * - Organizations: Organization records
 */
export const tables = {
  registrations: base("Registrations"),
  events: base("Events"),
  organizations: base("Organizations"),
} as const;

// ============================================================================
// Field Name Mappings
// ============================================================================

/**
 * Airtable field names for Registrations table
 * Based on AIRTABLE_INTEGRATION.md V2.0 Section 5
 */
export const AIRTABLE_FIELDS = {
  // Registrations table
  REGISTRATION: {
    FIRST_NAME: "First Name",
    LAST_NAME: "Last Name",
    EMAIL: "Email",
    ORGANIZATION: "Organization", // Linked record to Organizations table
    IMPAIRMENT: "Do you have an impairment",
    PHOTO_CONSENT: "Photography Consent",
    MARKETING_CONSENT: "Marketing Consent",
    EVENT: "Event", // Linked record to Events table
    ROLE: "Role",
    CHECKIN_TIME: "Check-in Time",
    CHECKOUT_TIME: "Check-out Time",
    APP_RECORD_ID: "App Record ID", // For bidirectional sync
  },
  // Events table
  EVENT: {
    EVENT_NAME: "Event Name",
    EVENT_DATE: "Event Date",
    LOCATION: "Location",
    STATUS: "Status",
  },
  // Organizations table
  ORGANIZATION: {
    ORGANIZATION_NAME: "Organization Name",
    CONTACT_EMAIL: "Contact Email",
    CONTACT_PHONE: "Contact Phone",
    NOTES: "Notes",
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert boolean to Airtable checkbox value
 * Airtable checkboxes: true = checked, false/undefined = unchecked
 */
export function booleanToCheckbox(value: boolean): boolean | undefined {
  return value ? true : undefined;
}

/**
 * Convert Airtable checkbox value to boolean
 * Airtable checkboxes: true = checked, false/undefined = unchecked
 */
export function checkboxToBoolean(value: boolean | undefined): boolean {
  return value === true;
}

/**
 * Get linked record ID from Airtable array
 * Airtable linked records are returned as arrays of IDs
 */
export function getLinkedRecordId(linkedRecords: string[] | undefined): string | undefined {
  return linkedRecords?.[0];
}

/**
 * Create linked record array for Airtable
 * Airtable linked records must be sent as arrays of IDs
 */
export function createLinkedRecord(recordId: string): string[] {
  return [recordId];
}

// ============================================================================
// Export
// ============================================================================

/**
 * Export the base instance for direct access if needed
 */
export { base };

/**
 * Export the Airtable client for advanced usage
 */
export { airtableClient };

