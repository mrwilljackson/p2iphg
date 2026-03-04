"use server";

import { db } from "@/lib/db/client";
import { events, volunteers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface ImportEventData {
  name: string;
  date: string;
  location?: string;
  description?: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  airtableRecordId: string;
}

export async function importEventToNeon(eventData: ImportEventData) {
  try {
    console.log('Importing event with data:', JSON.stringify(eventData, null, 2));

    // Check if event already exists by airtableRecordId
    const existingEvent = await db
      .select()
      .from(events)
      .where(eq(events.airtableRecordId, eventData.airtableRecordId))
      .limit(1);

    if (existingEvent.length > 0) {
      // Event already exists - update it
      const [updatedEvent] = await db
        .update(events)
        .set({
          name: eventData.name,
          date: eventData.date,
          location: eventData.location || null,
          description: eventData.description || null,
          status: eventData.status,
          modifiedAt: new Date(),
        })
        .where(eq(events.airtableRecordId, eventData.airtableRecordId))
        .returning();

      return {
        success: true,
        action: 'updated',
        event: updatedEvent,
      };
    } else {
      // Event doesn't exist - create it
      const [newEvent] = await db
        .insert(events)
        .values({
          name: eventData.name,
          date: eventData.date,
          location: eventData.location || null,
          description: eventData.description || null,
          status: eventData.status,
          airtableRecordId: eventData.airtableRecordId,
        })
        .returning();

      console.log('Created event:', JSON.stringify(newEvent, null, 2));

      return {
        success: true,
        action: 'created',
        event: newEvent,
      };
    }
  } catch (error) {
    console.error('Error importing event to Neon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function importMultipleEventsToNeon(eventsData: ImportEventData[]) {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ eventName: string; error: string }>,
  };

  for (const eventData of eventsData) {
    const result = await importEventToNeon(eventData);
    
    if (result.success) {
      if (result.action === 'created') {
        results.created++;
      } else if (result.action === 'updated') {
        results.updated++;
      }
    } else {
      results.failed++;
      results.errors.push({
        eventName: eventData.name,
        error: result.error || 'Unknown error',
      });
    }
  }

  return results;
}

// ============================================================================
// VOLUNTEERS IMPORT
// ============================================================================

interface ImportVolunteerData {
  eventAirtableId: string | null;
  eventName: string;
  email: string;
  firstName: string;
  lastName: string;
  photoConsent: boolean;
  feedbackConsent: boolean;
  nextEventConsent: boolean;
  airtableRecordId: string;
}

export async function importVolunteerToNeon(volunteerData: ImportVolunteerData) {
  try {
    console.log('Importing volunteer with data:', JSON.stringify(volunteerData, null, 2));

    // First, find the event by Airtable Record ID (preferred) or name (fallback)
    let eventRecords;

    if (volunteerData.eventAirtableId) {
      // Try to find event by Airtable Record ID (most reliable)
      console.log(`Looking for event by Airtable ID: "${volunteerData.eventAirtableId}"`);
      eventRecords = await db
        .select()
        .from(events)
        .where(eq(events.airtableRecordId, volunteerData.eventAirtableId))
        .limit(1);

      console.log(`Found ${eventRecords.length} event(s) by Airtable ID`);
      if (eventRecords.length > 0) {
        console.log('Matched event:', JSON.stringify(eventRecords[0], null, 2));
      }
    }

    // Fallback to name matching if no Airtable ID or not found
    if (!eventRecords || eventRecords.length === 0) {
      console.log(`Looking for event by name: "${volunteerData.eventName}"`);
      eventRecords = await db
        .select()
        .from(events)
        .where(eq(events.name, volunteerData.eventName))
        .limit(1);

      console.log(`Found ${eventRecords.length} event(s) by name`);
      if (eventRecords.length > 0) {
        console.log('Matched event:', JSON.stringify(eventRecords[0], null, 2));
      }
    }

    if (eventRecords.length === 0) {
      // Get all events to help debug
      const allEvents = await db
        .select({ name: events.name, airtableRecordId: events.airtableRecordId })
        .from(events);
      const availableEvents = allEvents
        .map(e => `"${e.name}" (${e.airtableRecordId || 'no ID'})`)
        .join(', ');

      return {
        success: false,
        error: `Event not found: "${volunteerData.eventName}" (Airtable ID: ${volunteerData.eventAirtableId || 'none'}). Available events: ${availableEvents || 'none'}`,
      };
    }

    const eventId = eventRecords[0].id;

    // Check if volunteer already exists by airtableRecordId
    const existingVolunteer = await db
      .select()
      .from(volunteers)
      .where(eq(volunteers.airtableRecordId, volunteerData.airtableRecordId))
      .limit(1);

    if (existingVolunteer.length > 0) {
      // Volunteer already exists - update it
      const [updatedVolunteer] = await db
        .update(volunteers)
        .set({
          eventId,
          email: volunteerData.email,
          firstName: volunteerData.firstName,
          lastName: volunteerData.lastName,
          photoConsent: volunteerData.photoConsent,
          feedbackConsent: volunteerData.feedbackConsent,
          nextEventConsent: volunteerData.nextEventConsent,
          modifiedAt: new Date(),
        })
        .where(eq(volunteers.airtableRecordId, volunteerData.airtableRecordId))
        .returning();

      return {
        success: true,
        action: 'updated',
        volunteer: updatedVolunteer,
      };
    } else {
      // Volunteer doesn't exist - create it
      const [newVolunteer] = await db
        .insert(volunteers)
        .values({
          eventId,
          email: volunteerData.email,
          firstName: volunteerData.firstName,
          lastName: volunteerData.lastName,
          photoConsent: volunteerData.photoConsent,
          feedbackConsent: volunteerData.feedbackConsent,
          nextEventConsent: volunteerData.nextEventConsent,
          airtableRecordId: volunteerData.airtableRecordId,
        })
        .returning();

      return {
        success: true,
        action: 'created',
        volunteer: newVolunteer,
      };
    }
  } catch (error) {
    console.error('Error importing volunteer to Neon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function importMultipleVolunteersToNeon(volunteersData: ImportVolunteerData[]) {
  const results = {
    created: 0,
    updated: 0,
    failed: 0,
    errors: [] as Array<{ volunteerName: string; error: string }>,
  };

  for (const volunteerData of volunteersData) {
    const result = await importVolunteerToNeon(volunteerData);

    if (result.success) {
      if (result.action === 'created') {
        results.created++;
      } else if (result.action === 'updated') {
        results.updated++;
      }
    } else {
      results.failed++;
      results.errors.push({
        volunteerName: `${volunteerData.firstName} ${volunteerData.lastName}`,
        error: result.error || 'Unknown error',
      });
    }
  }

  return results;
}

