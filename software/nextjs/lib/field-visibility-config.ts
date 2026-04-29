/**
 * Field Visibility Configuration
 *
 * This file controls which form fields are visible for each registration type.
 * Simply set a field to `true` to show it, or `false` to hide it.
 */

export type RegistrationType = "Participant" | "Volunteer" | "Group";

export type FieldName =
  | "attendeeName"
  | "attendeeSurname"
  | "email"
  | "organizationId"
  | "impairment"
  | "photoConsent"
  | "feedbackConsent"
  | "nextEventConsent"
  | "groupSize"
  | "impairedParticipants"
  | "nonImpairedParticipants";

/**
 * Field visibility configuration for each registration type
 *
 * To show/hide a field for a specific registration type:
 * 1. Find the registration type (Participant, Volunteer, or Group)
 * 2. Set the field to `true` (visible) or `false` (hidden)
 *
 * Example: To hide email for Volunteers, set:
 *   Volunteer: { email: false, ... }
 */
export const fieldVisibilityConfig: Record<RegistrationType, Record<FieldName, boolean>> = {
  "Participant": {
    // Personal Details
    attendeeName: true,
    attendeeSurname: true,
    email: true,  // TEST: Hide email for participants
    organizationId: true,  // TEST: Hide organization for participants
    impairment: true,

    // Consent Fields
    photoConsent: true,
    feedbackConsent: true,  // TEST: Hide feedback consent for participants
    nextEventConsent: true,

    // Group Details (typically hidden for Participants)
    groupSize: false,
    impairedParticipants: false,
    nonImpairedParticipants: false,
  },

  "Volunteer": {
    // Personal Details
    attendeeName: false,
    attendeeSurname: false,
    email: true,
    organizationId: false,
    impairment: false,

    // Consent Fields
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,

    // Group Details (typically hidden for Volunteers)
    groupSize: false,
    impairedParticipants: false,
    nonImpairedParticipants: false,
  },

  "Group": {
    // Personal Details
    attendeeName: true,
    attendeeSurname: true,
    email: true,
    organizationId: true,
    impairment: false,

    // Consent Fields
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,

    // Group Details (visible for Group leaders)
    groupSize: true,
    impairedParticipants: true,
    nonImpairedParticipants: true,
  },
};

/**
 * Helper function to check if a field should be visible for a given registration type
 * 
 * @param fieldName - The name of the field to check
 * @param registrationType - The current registration type
 * @returns true if the field should be visible, false otherwise
 */
export function isFieldVisible(
  fieldName: FieldName,
  registrationType: RegistrationType
): boolean {
  return fieldVisibilityConfig[registrationType][fieldName];
}

/**
 * Helper function to get all visible fields for a registration type
 * 
 * @param registrationType - The registration type
 * @returns Array of field names that should be visible
 */
export function getVisibleFields(registrationType: RegistrationType): FieldName[] {
  return Object.entries(fieldVisibilityConfig[registrationType])
    .filter(([_, isVisible]) => isVisible)
    .map(([fieldName]) => fieldName as FieldName);
}

/**
 * Helper function to get all hidden fields for a registration type
 *
 * @param registrationType - The registration type
 * @returns Array of field names that should be hidden
 */
export function getHiddenFields(registrationType: RegistrationType): FieldName[] {
  return Object.entries(fieldVisibilityConfig[registrationType])
    .filter(([_, isVisible]) => !isVisible)
    .map(([fieldName]) => fieldName as FieldName);
}
