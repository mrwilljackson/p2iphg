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
 *
 * V2 Enhancement: Multi-Event Support
 * - Each event has its own set of organizations and volunteers
 * - Organizations and volunteers are linked to specific events via eventId
 * - This demonstrates how the system adapts to different events
 */

import { Event, Organization, Volunteer } from './types';

// ============================================================================
// Event Data
// ============================================================================

const MOCK_EVENTS: Event[] = [
  {
    id: 'evt_001',
    name: 'Leicester Tigers 2026',
    date: '2026-03-15',
    location: 'Leicester Sports Arena',
    description: 'PowerHouseGames event at Leicester Sports Arena',
    status: 'completed', // Changed from 'inactive' to 'completed' (valid EventStatus)
    airtableRecordId: 'recLEICESTER2026',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'evt_002',
    name: 'Manchester 2026',
    date: '2026-06-20',
    location: 'Manchester Arena',
    description: 'PowerHouseGames event at Manchester Arena',
    status: 'active', // Active event
    airtableRecordId: 'recMANCHESTER2026',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
];

// ============================================================================
// Organization Data (Event-Specific)
// ============================================================================

const MOCK_ORGANIZATIONS: Organization[] = [
  // Leicester Event Organizations
  {
    id: 'org_lei_000',
    eventId: 'evt_001',
    name: 'Family Group',
    isDisabilityGroup: true, // Fixed: Family groups need group-specific fields
    imageUrl: '/logos/family-group.png', // Placeholder - family icon
    contactFirstName: undefined,
    contactLastName: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    notes: 'For individual families attending together',
    airtableRecordId: 'recLEI_ORG000',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_001',
    eventId: 'evt_001',
    name: 'Next PLC',
    isDisabilityGroup: false,
    imageUrl: '/logos/next-plc.png', // Placeholder - will use actual logo
    contactFirstName: 'Rachel',
    contactLastName: 'Thompson',
    contactEmail: 'rachel.thompson@next.co.uk',
    contactPhone: '+44 116 284 5000',
    notes: 'Corporate sponsor and participant',
    airtableRecordId: 'recLEI_ORG001',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_002',
    eventId: 'evt_001',
    name: 'Leicester Tigers',
    isDisabilityGroup: false,
    imageUrl: '/logos/leicester-tigers.png', // Placeholder - will use actual logo
    contactFirstName: 'Tom',
    contactLastName: 'Harrison',
    contactEmail: 'tom.harrison@leicestertigers.com',
    contactPhone: '+44 116 217 1880',
    notes: 'Rugby club community engagement',
    airtableRecordId: 'recLEI_ORG002',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_003',
    eventId: 'evt_001',
    name: 'De Montfort University',
    isDisabilityGroup: false,
    imageUrl: '/logos/dmu.png', // Placeholder - will use actual logo
    contactFirstName: 'Dr. Sarah',
    contactLastName: 'Mitchell',
    contactEmail: 'sarah.mitchell@dmu.ac.uk',
    contactPhone: '+44 116 250 6070',
    notes: 'University sports science department',
    airtableRecordId: 'recLEI_ORG003',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'org_lei_004',
    eventId: 'evt_001',
    name: 'Glenfield SEN School',
    isDisabilityGroup: true, // SEN School - disability group
    imageUrl: '/logos/glenfield-sen.png', // Placeholder - will use actual logo
    contactFirstName: 'Helen',
    contactLastName: 'Davies',
    contactEmail: 'helen.davies@glenfield-sen.sch.uk',
    contactPhone: '+44 116 287 6555',
    notes: 'Special educational needs school',
    airtableRecordId: 'recLEI_ORG004',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },

  // Manchester Event Organizations
  {
    id: 'org_man_000',
    eventId: 'evt_002',
    name: 'Family Group',
    isDisabilityGroup: true, // Fixed: Family groups need group-specific fields
    imageUrl: '/logos/family-group.png', // Placeholder - family icon
    contactFirstName: undefined,
    contactLastName: undefined,
    contactEmail: undefined,
    contactPhone: undefined,
    notes: 'For individual families attending together',
    airtableRecordId: 'recMAN_ORG000',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_001',
    eventId: 'evt_002',
    name: 'Deloitte',
    isDisabilityGroup: false,
    imageUrl: '/logos/deloitte.png', // Placeholder - will use actual logo
    contactFirstName: 'Amanda',
    contactLastName: 'Roberts',
    contactEmail: 'amanda.roberts@deloitte.co.uk',
    contactPhone: '+44 161 455 8787',
    notes: 'Corporate sponsor and participant',
    airtableRecordId: 'recMAN_ORG001',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_002',
    eventId: 'evt_002',
    name: 'Siemens',
    isDisabilityGroup: false,
    imageUrl: '/logos/siemens.png', // Placeholder - will use actual logo
    contactFirstName: 'Mark',
    contactLastName: 'Anderson',
    contactEmail: 'mark.anderson@siemens.com',
    contactPhone: '+44 161 446 6400',
    notes: 'Engineering company community program',
    airtableRecordId: 'recMAN_ORG002',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_003',
    eventId: 'evt_002',
    name: 'Sale Sharks',
    isDisabilityGroup: false,
    imageUrl: '/logos/sale-sharks.png', // Placeholder - will use actual logo
    contactFirstName: 'Chris',
    contactLastName: 'Murphy',
    contactEmail: 'chris.murphy@salesharks.com',
    contactPhone: '+44 161 286 8888',
    notes: 'Rugby club community engagement',
    airtableRecordId: 'recMAN_ORG003',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_004',
    eventId: 'evt_002',
    name: 'University of Manchester',
    isDisabilityGroup: false,
    imageUrl: '/logos/uni-manchester.png', // Placeholder - will use actual logo
    contactFirstName: 'Prof. Lisa',
    contactLastName: 'Chen',
    contactEmail: 'lisa.chen@manchester.ac.uk',
    contactPhone: '+44 161 306 6000',
    notes: 'University sports and health department',
    airtableRecordId: 'recMAN_ORG004',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'org_man_005',
    eventId: 'evt_002',
    name: 'Hazel Grove Special School',
    isDisabilityGroup: true, // Special School - disability group
    imageUrl: '/logos/hazel-grove.png', // Placeholder - will use actual logo
    contactFirstName: 'Karen',
    contactLastName: 'Williams',
    contactEmail: 'karen.williams@hazelgrove-sen.sch.uk',
    contactPhone: '+44 161 483 3622',
    notes: 'Special educational needs school',
    airtableRecordId: 'recMAN_ORG005',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
];

// ============================================================================
// Volunteer Data (Event-Specific)
// ============================================================================

const MOCK_VOLUNTEERS: Volunteer[] = [
  // Leicester Event Volunteers
  {
    id: 'vol_lei_001',
    eventId: 'evt_001',
    email: 'sarah.jones@leicester.ac.uk',
    firstName: 'Sarah',
    lastName: 'Jones',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
    airtableRecordId: 'recLEI_VOL001',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vol_lei_002',
    eventId: 'evt_001',
    email: 'mike.patel@tigers.com',
    firstName: 'Mike',
    lastName: 'Patel',
    photoConsent: false,
    feedbackConsent: true,
    nextEventConsent: false,
    airtableRecordId: 'recLEI_VOL002',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'vol_lei_003',
    eventId: 'evt_001',
    email: 'emma.wilson@dmu.ac.uk',
    firstName: 'Emma',
    lastName: 'Wilson',
    photoConsent: true,
    feedbackConsent: false,
    nextEventConsent: true,
    airtableRecordId: 'recLEI_VOL003',
    createdAt: '2026-01-15T10:00:00Z',
    modifiedAt: '2026-01-15T10:00:00Z',
  },

  // Manchester Event Volunteers
  {
    id: 'vol_man_001',
    eventId: 'evt_002',
    email: 'james.brown@manchester.ac.uk',
    firstName: 'James',
    lastName: 'Brown',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: true,
    airtableRecordId: 'recMAN_VOL001',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'vol_man_002',
    eventId: 'evt_002',
    email: 'lucy.taylor@mufc.com',
    firstName: 'Lucy',
    lastName: 'Taylor',
    photoConsent: false,
    feedbackConsent: false,
    nextEventConsent: true,
    airtableRecordId: 'recMAN_VOL002',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: 'vol_man_003',
    eventId: 'evt_002',
    email: 'david.khan@mcfc.com',
    firstName: 'David',
    lastName: 'Khan',
    photoConsent: true,
    feedbackConsent: true,
    nextEventConsent: false,
    airtableRecordId: 'recMAN_VOL003',
    createdAt: '2026-01-20T10:00:00Z',
    modifiedAt: '2026-01-20T10:00:00Z',
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
   * Get all organizations for a specific event
   * In production, this would be pre-fetched from Airtable
   */
  static async getOrganizations(eventId?: string): Promise<Organization[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    if (eventId) {
      return MOCK_ORGANIZATIONS.filter(org => org.eventId === eventId);
    }
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
   * Search organizations by name for a specific event
   * Useful for the combobox search functionality
   */
  static async searchOrganizations(query: string, eventId?: string): Promise<Organization[]> {
    await new Promise(resolve => setTimeout(resolve, 50));

    let orgs = eventId
      ? MOCK_ORGANIZATIONS.filter(org => org.eventId === eventId)
      : MOCK_ORGANIZATIONS;

    if (!query) return orgs;

    const lowerQuery = query.toLowerCase();
    return orgs.filter(org =>
      org.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Check if an email address belongs to a registered volunteer for a specific event
   * In production, this would query the volunteer database
   */
  static async isRegisteredVolunteer(email: string, eventId?: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const volunteers = eventId
      ? MOCK_VOLUNTEERS.filter(v => v.eventId === eventId)
      : MOCK_VOLUNTEERS;
    return volunteers.some(v => v.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Get all registered volunteer emails for a specific event
   * Useful for admin/testing purposes
   */
  static async getVolunteerEmails(eventId?: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const volunteers = eventId
      ? MOCK_VOLUNTEERS.filter(v => v.eventId === eventId)
      : MOCK_VOLUNTEERS;
    return volunteers.map(v => v.email);
  }

  /**
   * Get volunteer details by email for a specific event
   * Returns null if volunteer not found
   */
  static async getVolunteerByEmail(email: string, eventId?: string): Promise<Volunteer | null> {
    await new Promise(resolve => setTimeout(resolve, 50));
    const volunteers = eventId
      ? MOCK_VOLUNTEERS.filter(v => v.eventId === eventId)
      : MOCK_VOLUNTEERS;
    return volunteers.find(v => v.email.toLowerCase() === email.toLowerCase()) || null;
  }

  /**
   * Get all registered volunteers for a specific event
   * Useful for admin/testing purposes
   */
  static async getAllVolunteers(eventId?: string): Promise<Volunteer[]> {
    await new Promise(resolve => setTimeout(resolve, 50));
    if (eventId) {
      return MOCK_VOLUNTEERS.filter(v => v.eventId === eventId);
    }
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

