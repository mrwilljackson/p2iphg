"use server";

/**
 * Server Actions for Database Operations
 * 
 * These functions run on the server-side only and can be called from client components.
 * They provide a secure way to interact with the database without exposing credentials.
 */

import { DatabaseService } from './db-service';
import type { Event, Organization, Volunteer, Registration } from './types';
import type { ParticipantCounts } from './participant-counting';

/**
 * Get the current active event
 */
export async function getCurrentEvent(): Promise<Event | null> {
  return await DatabaseService.getCurrentEvent();
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  return await DatabaseService.getAllEvents();
}

/**
 * Set an event as the current active event
 * Sets the specified event to 'active' and all others to 'completed'
 */
export async function setCurrentEvent(eventId: string): Promise<Event> {
  return await DatabaseService.setCurrentEvent(eventId);
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  return await DatabaseService.getEventById(id);
}

/**
 * Get organizations for a specific event
 */
export async function getOrganizations(eventId: string): Promise<Organization[]> {
  return await DatabaseService.getOrganizations(eventId);
}

/**
 * Get volunteer emails for a specific event
 */
export async function getVolunteerEmails(eventId: string): Promise<string[]> {
  return await DatabaseService.getVolunteerEmails(eventId);
}

/**
 * Get volunteer by email for a specific event
 */
export async function getVolunteerByEmail(email: string, eventId: string): Promise<Volunteer | null> {
  return await DatabaseService.getVolunteerByEmail(email, eventId);
}

/**
 * Create a new registration
 */
export async function createRegistration(data: Omit<Registration, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Registration> {
  return await DatabaseService.createRegistration(data);
}

/**
 * Create a new organization (admin only)
 */
export async function createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Organization> {
  return await DatabaseService.createOrganization(data);
}

/**
 * Create a new volunteer (admin only)
 */
export async function createVolunteer(data: Omit<Volunteer, 'id' | 'createdAt' | 'modifiedAt'>): Promise<Volunteer> {
  return await DatabaseService.createVolunteer(data);
}

/**
 * Find or create a family group organization
 * Used when a Group leader selects "Family Group" and enters their surname
 */
export async function findOrCreateFamilyGroup(
  eventId: string,
  surname: string,
  contactEmail: string,
  contactFirstName: string,
  contactLastName: string
): Promise<Organization> {
  return await DatabaseService.findOrCreateFamilyGroup(
    eventId,
    surname,
    contactEmail,
    contactFirstName,
    contactLastName
  );
}

/**
 * Get all registrations for a specific event
 */
export async function getAllRegistrations(eventId: string): Promise<Registration[]> {
  return await DatabaseService.getAllRegistrations(eventId);
}

/**
 * Get a single registration by ID
 */
export async function getRegistrationById(id: string): Promise<Registration | null> {
  return await DatabaseService.getRegistrationById(id);
}

export async function getRegistrationsByOrganization(eventId: string, organizationId: string): Promise<Registration[]> {
  return await DatabaseService.getRegistrationsByOrganization(eventId, organizationId);
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  return await DatabaseService.getOrganizationById(id);
}

/**
 * Get all volunteers for a specific event
 */
export async function getAllVolunteers(eventId: string): Promise<Volunteer[]> {
  return await DatabaseService.getAllVolunteers(eventId);
}

/**
 * Get registration counts by role for a specific event
 * Returns detailed counts including group breakdowns and participant totals
 *
 * Business logic is handled by the participant-counting module.
 * See lib/participant-counting.ts for detailed counting rules.
 */
export async function getRegistrationCountsByRole(eventId: string): Promise<ParticipantCounts> {
  return await DatabaseService.getRegistrationCountsByRole(eventId);
}

