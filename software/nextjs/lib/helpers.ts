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
 *  - Participant: show only orgs where openGroup === true; Individual org always last
 *  - Group:       show only orgs where openGroup === false
 *  - Volunteer / undefined: show all orgs except system-only Individual org
 *
 * Always includes "Family Group" placeholder for Group role.
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
    // Participants see only open groups (Individual org is open, so it passes through)
    filteredOrgs = filteredOrgs.filter(org => org.openGroup !== false);
  } else if (role === 'Group') {
    // Group leaders see only closed groups (Individual is open, so naturally excluded)
    filteredOrgs = filteredOrgs.filter(org => org.openGroup === false);
  } else {
    // Volunteer / undefined: show all real orgs, but exclude system-only Individual org
    filteredOrgs = filteredOrgs.filter(org => org.groupType !== 'Individual');
  }

  // Deduplicate by organization name (keep first occurrence)
  const uniqueOrgs = filteredOrgs.reduce((acc, org) => {
    if (!acc.some(existing => existing.name === org.name)) {
      acc.push(org);
    }
    return acc;
  }, [] as Organization[]);

  // For Participant role, split Individual-typed orgs to the bottom
  let mainOrgs = uniqueOrgs;
  let individualOrgs: Organization[] = [];
  if (role === 'Participant') {
    individualOrgs = uniqueOrgs.filter(org => org.groupType === 'Individual');
    mainOrgs = uniqueOrgs.filter(org => org.groupType !== 'Individual');
  }

  const toOptions = (orgs: Organization[]) =>
    orgs.map(org => ({ value: org.id!, label: org.name }));

  // Add "Family Group" placeholder only for Group role (on-the-day family group registrations)
  if (role === 'Group') {
    return [{ value: 'FAMILY_GROUP_PLACEHOLDER', label: 'Family Group' }, ...toOptions(mainOrgs)];
  }

  return [...toOptions(mainOrgs), ...toOptions(individualOrgs)];
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

