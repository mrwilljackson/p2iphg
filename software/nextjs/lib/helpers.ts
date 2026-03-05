/**
 * Helper Functions
 * 
 * Utility functions that can be used on both client and server
 * These functions do NOT import database clients or server-only code
 */

import type { Organization, Event } from './types';
import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * Convert organizations to combobox options
 * Always includes "Family Group" as a special option for on-the-day family registrations
 * Deduplicates organizations by name (keeps first occurrence)
 */
export function organizationsToOptions(organizations: Organization[]): ComboboxOption[] {
  // Filter out any existing "Family Group" entries from the database
  const filteredOrgs = organizations.filter(org => org.name !== 'Family Group');

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

  // Always add "Family Group" as a special option with a special ID
  // This allows families to register on the day without pre-existing database entry
  const familyGroupOption: ComboboxOption = {
    value: 'FAMILY_GROUP_PLACEHOLDER',
    label: 'Family Group',
  };

  // Add Family Group at the beginning of the list for easy access
  return [familyGroupOption, ...orgOptions];
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

