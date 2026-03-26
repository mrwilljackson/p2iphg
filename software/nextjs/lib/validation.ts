/**
 * Power2Inspire Event CRM - Zod Validation Schemas
 * Based on DATA_MODELS.md V2.0 and REQUIREMENTS_V2.md
 * Date: 2026-02-11
 */

import { z } from "zod";

// ============================================================================
// Enum Schemas
// ============================================================================

export const eventStatusSchema = z.enum(["active", "completed", "cancelled", "archived"]);

export const registrationRoleSchema = z.enum(["Participant", "Volunteer", "Group"]);

export const syncStatusSchema = z.enum(["pending", "synced", "failed"]);

// ============================================================================
// Entity Schemas
// ============================================================================

/**
 * Event Schema
 * Validates event data from Airtable or API
 */
export const eventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .max(100, "Event name must be at most 100 characters"),
  date: z.string().datetime("Invalid date format"),
  location: z.string().optional(),
  description: z.string().optional(),
  status: eventStatusSchema,
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

/**
 * Organization Schema
 * Validates organization data from Airtable or API
 * V2: Added event-specific fields and contact person details
 * V5: Replaced isDisabilityGroup with groupType enum for better classification
 */
export const organizationSchema = z.object({
  id: z.string().min(1, "Organization ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(200, "Organization name must be at most 200 characters"),
  groupType: z.enum(['Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other']).optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  contactFirstName: z.string().optional().or(z.literal("")),
  contactLastName: z.string().optional().or(z.literal("")),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  airtableRecordId: z.string().optional().or(z.literal("")),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

/**
 * Registration Form Schema
 * Validates registration form data from client
 *
 * V3 Requirements (Updated for conditional Group fields):
 * - eventId is REQUIRED
 * - attendeeName, attendeeSurname are REQUIRED
 * - email, organizationId, impairment are OPTIONAL (depends on role)
 * - Phone field REMOVED
 * - photoConsent is boolean (radio buttons)
 * - feedbackConsent and nextEventConsent are optional booleans (checkboxes)
 * - Group fields (groupSize, disabledStudents, senStudents, groupLeaderParticipating) are OPTIONAL
 *   They are only shown and required for disability groups and family groups
 * - role includes "Participant", "Volunteer", "Group"
 */
export const registrationFormSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  attendeeName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name must be at most 100 characters"),
  attendeeSurname: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name must be at most 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters")
    .optional()
    .or(z.literal("")),
  organizationId: z
    .string()
    .optional()
    .or(z.literal("")),
  impairment: z
    .string()
    .max(500, "Accessibility needs must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  role: registrationRoleSchema,
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean().optional(),
  nextEventConsent: z.boolean().optional(),
  // Group specific fields (optional - only required when visible for disability groups/family groups)
  groupSize: z
    .number()
    .int("Must be a whole number")
    .min(0, "Group size cannot be negative")
    .max(999, "Group size must be at most 999")
    .optional(),
  disabledStudents: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(999, "Disabled students must be at most 999")
    .optional(),
  senStudents: z
    .number()
    .int("Must be a whole number")
    .min(0, "Cannot be negative")
    .max(999, "SEN students must be at most 999")
    .optional(),
  groupLeaderParticipating: z.boolean().optional(), // Whether group leader is participating in games (Group role only)
}).superRefine((data, ctx) => {
  // organizationId is required when role is "Group" or "Participant"
  if ((data.role === "Group" || data.role === "Participant") && (!data.organizationId || data.organizationId.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please select your organisation or group",
      path: ["organizationId"],
    });
  }
});

/**
 * Registration Schema (Full)
 * Validates complete registration data including auto-generated fields
 */
export const registrationSchema = registrationFormSchema.extend({
  id: z.string().uuid().optional(),
  syncStatus: syncStatusSchema.optional(),
  airtableRecordId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

/**
 * Volunteer Schema
 * Validates volunteer data from Airtable or API
 */
export const volunteerSchema = z.object({
  id: z.string().min(1, "Volunteer ID is required"),
  eventId: z.string().min(1, "Event ID is required"),
  email: z.string().email("Invalid email format"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean(),
  nextEventConsent: z.boolean(),
  airtableRecordId: z.string().optional().or(z.literal("")),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

/**
 * Attendance Update Schema
 * Validates check-in/check-out requests
 */
export const attendanceUpdateSchema = z.object({
  registrationId: z.string().min(1, "Registration ID is required"),
  action: z.enum(["checkin", "checkout"]),
  timestamp: z.string().datetime().optional(),
});

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Create Registration Request Schema
 * For POST /api/registrations
 */
export const createRegistrationRequestSchema = registrationFormSchema;

/**
 * Update Attendance Request Schema
 * For POST /api/attendance
 */
export const updateAttendanceRequestSchema = attendanceUpdateSchema;

/**
 * Export CSV Request Schema
 * For GET /api/export (query parameters)
 */
export const exportCSVRequestSchema = z.object({
  eventId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ============================================================================
// Admin Form Schemas (P2I Admin CRUD)
// ============================================================================

/**
 * Admin Event Form Schema
 * Used for create and edit forms in the P2I admin section
 */
export const adminEventFormSchema = z.object({
  name: z
    .string()
    .min(3, "Event name must be at least 3 characters")
    .max(100, "Event name must be at most 100 characters"),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  airtableRecordId: z.string().optional().or(z.literal("")),
});

export type AdminEventFormData = z.infer<typeof adminEventFormSchema>;

/**
 * Admin Organisation Form Schema
 * Used for create and edit forms in the P2I admin section
 */
export const adminOrgFormSchema = z.object({
  name: z
    .string()
    .min(2, "Organisation name must be at least 2 characters")
    .max(200, "Organisation name must be at most 200 characters"),
  openGroup: z.boolean(),
  groupType: z.enum([
    'Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'
  ]),
  contactFirstName: z.string().optional().or(z.literal("")),
  contactLastName: z.string().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  airtableRecordId: z.string().optional().or(z.literal("")),
});

export type AdminOrgFormData = z.infer<typeof adminOrgFormSchema>;

/**
 * Admin Org Record Form Schema
 * For the organisations-table-only CRUD page (P2I admin)
 */
export const adminOrgRecordFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200, "Name must be at most 200 characters"),
  groupType: z.enum([
    'Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'
  ]),
  airtableRecordId: z.string().optional().or(z.literal("")),
});
export type AdminOrgRecordFormData = z.infer<typeof adminOrgRecordFormSchema>;

/**
 * Admin Group Leader Form Schema
 * For the organisation_contacts CRUD page (P2I admin)
 */
export const adminGroupLeaderFormSchema = z.object({
  orgId: z.string().min(1, "Please select an organisation"),
  openGroup: z.boolean(),
  expectedGroupSize: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1")
    .optional()
    .nullable(),
  contactFirstName: z.string().optional().or(z.literal("")),
  contactLastName: z.string().optional().or(z.literal("")),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean(),
  nextEventConsent: z.boolean(),
  airtableRecordId: z.string().optional().or(z.literal("")),
});
export type AdminGroupLeaderFormData = z.infer<typeof adminGroupLeaderFormSchema>;

/**
 * Admin Helper (Volunteer) Form Schema
 * For the volunteers CRUD page (P2I admin) — referred to as "Helpers" in the UI
 */
export const adminHelperFormSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be at most 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be at most 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email must be at most 255 characters"),
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean(),
  nextEventConsent: z.boolean(),
  airtableRecordId: z.string().optional().or(z.literal("")),
});
export type AdminHelperFormData = z.infer<typeof adminHelperFormSchema>;

// ============================================================================
// Type Inference
// ============================================================================

export type EventSchemaType = z.infer<typeof eventSchema>;
export type OrganizationSchemaType = z.infer<typeof organizationSchema>;
export type VolunteerSchemaType = z.infer<typeof volunteerSchema>;
export type RegistrationFormSchemaType = z.infer<typeof registrationFormSchema>;
export type RegistrationSchemaType = z.infer<typeof registrationSchema>;
export type AttendanceUpdateSchemaType = z.infer<typeof attendanceUpdateSchema>;

