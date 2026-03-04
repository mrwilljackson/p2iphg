"use server";

import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

