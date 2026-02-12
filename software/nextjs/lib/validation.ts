/**
 * Power2Inspire Event CRM - Zod Validation Schemas
 * Based on DATA_MODELS.md V2.0 and REQUIREMENTS_V2.md
 * Date: 2026-02-11
 */

import { z } from "zod";

// ============================================================================
// Enum Schemas
// ============================================================================

export const eventStatusSchema = z.enum(["active", "completed", "cancelled"]);

export const registrationRoleSchema = z.enum(["Attendee", "Volunteer", "Teacher / Coordinator"]);

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
 */
export const organizationSchema = z.object({
  id: z.string().min(1, "Organization ID is required"),
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(200, "Organization name must be at most 200 characters"),
  contactEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  modifiedAt: z.string().datetime().optional(),
});

/**
 * Registration Form Schema
 * Validates registration form data from client
 *
 * V2 Requirements:
 * - eventId, email, organizationId, impairment are REQUIRED
 * - Phone field REMOVED
 * - photoConsent is boolean (radio buttons)
 * - feedbackConsent and nextEventConsent are optional booleans (checkboxes)
 * - Teacher/Coordinator role requires groupSize and senStudents fields
 */
export const registrationFormSchema = z.object({
  eventId: z.string().min(1, "Event is required"),
  attendeeName: z
    .string()
    .min(2, "First name must be at least 2 characters")
    .max(100, "First name must be at most 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  attendeeSurname: z
    .string()
    .min(2, "Last name must be at least 2 characters")
    .max(100, "Last name must be at most 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
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
  // Teacher/Coordinator specific fields
  groupSize: z
    .number()
    .int("Must be a whole number")
    .min(1, "Group size must be at least 1")
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
}).refine(
  (data) => {
    // If role is Teacher/Coordinator, groupSize, disabledStudents, and senStudents are required
    if (data.role === "Teacher / Coordinator") {
      return data.groupSize !== undefined && data.disabledStudents !== undefined && data.senStudents !== undefined;
    }
    return true;
  },
  {
    message: "Group size and SEN students are required for Teacher / Coordinator role",
    path: ["groupSize"],
  }
);

/**
 * Registration Schema (Full)
 * Validates complete registration data including auto-generated fields
 */
export const registrationSchema = registrationFormSchema.extend({
  id: z.string().uuid().optional(),
  checkinTime: z.string().datetime().optional(),
  checkoutTime: z.string().datetime().optional(),
  syncStatus: syncStatusSchema.optional(),
  airtableRecordId: z.string().optional(),
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
// Type Inference
// ============================================================================

export type EventSchemaType = z.infer<typeof eventSchema>;
export type OrganizationSchemaType = z.infer<typeof organizationSchema>;
export type RegistrationFormSchemaType = z.infer<typeof registrationFormSchema>;
export type RegistrationSchemaType = z.infer<typeof registrationSchema>;
export type AttendanceUpdateSchemaType = z.infer<typeof attendanceUpdateSchema>;

