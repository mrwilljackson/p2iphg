/**
 * Helper Functions
 * 
 * Utility functions that can be used on both client and server
 * These functions do NOT import database clients or server-only code
 */

import type { Organization, Event } from './types';
import type { ComboboxOption } from '@/components/ui/combobox';
import type { RegistrationType } from './field-visibility-config';

/**
 * Convert organizations to combobox options, filtered by role.
 *
 * Filtering rules:
 *  - Participant: show only orgs where openGroup === true
 *  - Group:       show all orgs (open and closed)
 *  - Volunteer / undefined: show all (no filtering)
 *
 * Always includes "Family Group" placeholder for Participant role.
 * Deduplicates organizations by name (keeps first occurrence).
 */
export function organizationsToOptions(
  organizations: Organization[],
  role?: RegistrationType,
): ComboboxOption[] {
  // Filter out any existing "Family Group" entries from the database
  let filteredOrgs = organizations.filter(org => org.name !== 'Family Group');

  // Apply role-based filtering
  if (role === 'Participant') {
    // Participants see only open groups
    filteredOrgs = filteredOrgs.filter(org => org.openGroup !== false);
  }
  // Group role: no filter — all orgs (open and closed) are shown
  // Volunteer / undefined: no filter

  // Deduplicate by organization name (keep first occurrence)
  const uniqueOrgs = filteredOrgs.reduce((acc, org) => {
    if (!acc.some(existing => existing.name === org.name)) {
      acc.push(org);
    }
    return acc;
  }, [] as Organization[]);

  // Convert organizations to options
  const orgOptions = uniqueOrgs.map((org) => ({
    value: org.id!,
    label: org.name,
  }));

  // Add "Family Group" placeholder only for Participant role (on-the-day family registrations)
  if (role === 'Participant' || !role) {
    const familyGroupOption: ComboboxOption = {
      value: 'FAMILY_GROUP_PLACEHOLDER',
      label: 'Family Group',
    };
    return [familyGroupOption, ...orgOptions];
  }

  return orgOptions;
}

/**
 * Convert events to combobox options
 */
export function eventsToOptions(events: Event[]): ComboboxOption[] {
  return events.map((event) => ({
    value: event.id!,
    label: event.name,
  }));
}

