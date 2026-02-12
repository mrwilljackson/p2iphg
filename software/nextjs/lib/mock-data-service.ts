/**
 * Mock Data Service
 * 
 * Simulates a local database/datastore that would contain data
 * pre-fetched from Airtable. This allows us to test form pre-population
 * without setting up a real database.
 * 
 * In production, this would be replaced with actual calls to:
 * - Local SQLite/IndexedDB
 * - Airtable API
 * - Server-side data fetching
 */

import { Event, Organization } from './types';

// Mock Events Data
const MOCK_EVENTS: Event[] = [
  {
    id: 'evt_001',
    name: 'PowerHouseGames Spring 2026',
    date: '2026-03-15',
    location: 'London Sports Centre',
    status: 'active',
    airtableRecordId: 'recABC123',
  },
  {
    id: 'evt_002',
    name: 'PowerHouseGames Summer 2026',
    date: '2026-06-20',
    location: 'Manchester Arena',
    status: 'active',
    airtableRecordId: 'recDEF456',
  },
];

// Mock Organizations Data
const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: 'org_001',
    name: 'NHS Trust',
    airtableRecordId: 'recORG001',
  },
  {
    id: 'org_002',
    name: 'Local School',
    airtableRecordId: 'recORG002',
  },
  {
    id: 'org_003',
    name: 'Community Centre',
    airtableRecordId: 'recORG003',
  },
  {
    id: 'org_004',
    name: 'Sports Club',
    airtableRecordId: 'recORG004',
  },
  {
    id: 'org_005',
    name: 'Charity Organization',
    airtableRecordId: 'recORG005',
  },
    {
    id: 'org_006',
    name: 'University of Manchester',
    airtableRecordId: 'recORG006',
  },
];

/**
 * Mock Data Service
 * Simulates async data fetching from a local database
 */
export class MockDataService {
  /**
   * Get the current active event
   * In production, this would query the local database for today's event
   */
  static async getCurrentEvent(): Promise<Event | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Return the first active event
    return MOCK_EVENTS.find(e => e.status === 'active') || MOCK_EVENTS[0];
  }

  /**
   * Get all events
   */
  static async getAllEvents(): Promise<Event[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_EVENTS;
  }

  /**
   * Get all organizations
   * In production, this would be pre-fetched from Airtable
   */
  static async getOrganizations(): Promise<Organization[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return MOCK_ORGANIZATIONS;
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<Organization | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_ORGANIZATIONS.find(org => org.id === id) || null;
  }

  /**
   * Get event by ID
   */
  static async getEventById(id: string): Promise<Event | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_EVENTS.find(evt => evt.id === id) || null;
  }

  /**
   * Search organizations by name
   * Useful for the combobox search functionality
   */
  static async searchOrganizations(query: string): Promise<Organization[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    if (!query) return MOCK_ORGANIZATIONS;
    
    const lowerQuery = query.toLowerCase();
    return MOCK_ORGANIZATIONS.filter(org => 
      org.name.toLowerCase().includes(lowerQuery)
    );
  }
}

/**
 * Helper function to convert organizations to combobox options
 */
export function organizationsToOptions(organizations: Organization[]) {
  return organizations.map(org => ({
    value: org.id,
    label: org.name,
  }));
}

/**
 * Helper function to convert events to select options
 */
export function eventsToOptions(events: Event[]) {
  return events.map(evt => ({
    value: evt.id,
    label: `${evt.name} - ${evt.date}`,
  }));
}

