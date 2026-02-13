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

import { Event, Organization, Volunteer } from './types';

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
    id: 'org_000',
    name: 'Family Group',
    airtableRecordId: 'recORG000',
  },
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

// Mock Volunteer Data
// These are pre-registered volunteers with their details
const MOCK_VOLUNTEERS: Volunteer[] = [
  {
    email: 'sarah.jones@gmail.com',
    firstName: 'Sarah',
    lastName: 'Jones',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
  },
  {
    email: 'mike.thompson@hotmail.com',
    firstName: 'Mike',
    lastName: 'Thompson',
    photoConsent: true,
    feedbackConsent: false,
    nextEventConsent: true,
  },
  {
    email: 'emma.wilson@yahoo.co.uk',
    firstName: 'Emma',
    lastName: 'Wilson',
    photoConsent: false,
    feedbackConsent: true,
    nextEventConsent: false,
  },
  {
    email: 'james.brown@gmail.com',
    firstName: 'James',
    lastName: 'Brown',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
  },
  {
    email: 'lucy.davies@outlook.com',
    firstName: 'Lucy',
    lastName: 'Davies',
    photoConsent: false,
    feedbackConsent: false,
    nextEventConsent: true,
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

  /**
   * Check if an email address belongs to a registered volunteer
   * In production, this would query the volunteer database
   */
  static async isRegisteredVolunteer(email: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_VOLUNTEERS.some(v => v.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Get all registered volunteer emails
   * Useful for admin/testing purposes
   */
  static async getVolunteerEmails(): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_VOLUNTEERS.map(v => v.email);
  }

  /**
   * Get volunteer details by email
   * Returns null if volunteer not found
   */
  static async getVolunteerByEmail(email: string): Promise<Volunteer | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return MOCK_VOLUNTEERS.find(v => v.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Get all registered volunteers
   * Useful for admin/testing purposes
   */
  static async getAllVolunteers(): Promise<Volunteer[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    return [...MOCK_VOLUNTEERS];
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

