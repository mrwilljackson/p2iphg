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
 */
export function organizationsToOptions(organizations: Organization[]): ComboboxOption[] {
  return organizations.map((org) => ({
    value: org.id!,
    label: org.name,
  }));
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

