import { NextRequest, NextResponse } from 'next/server';
import { importMultipleVolunteersToNeon } from '@/app/actions/airtable-import';
import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableVolunteer {
  id: string;
  fields: {
    'Event Name': string[];  // Array of linked record IDs (this is the linked field)
    'Email': string;
    'First Name': string;
    'Last Name': string;
    'Photo Consent': boolean;
    'Feedback Consent': boolean;
    'Next Event Consent': boolean;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableVolunteer[];
  offset?: string;
}

export async function GET(request: NextRequest) {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Volunteers`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Airtable API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch volunteers from Airtable' },
        { status: response.status }
      );
    }

    const data: AirtableResponse = await response.json();

    // Get all events from Neon to map Airtable IDs to names
    const allEvents = await db.select().from(events);
    const eventMap = new Map(
      allEvents.map(event => [event.airtableRecordId, event.name])
    );

    // Transform Airtable records to our format
    const volunteers = data.records.map(record => {
      const eventAirtableId = record.fields['Event Name']?.[0] || null;
      const eventName = eventAirtableId
        ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
        : 'No Event Assigned';

      return {
        airtableRecordId: record.id,
        eventAirtableId,
        eventName,
        email: record.fields['Email'],
        firstName: record.fields['First Name'],
        lastName: record.fields['Last Name'],
        photoConsent: record.fields['Photo Consent'] || false,
        feedbackConsent: record.fields['Feedback Consent'] || false,
        nextEventConsent: record.fields['Next Event Consent'] || false,
      };
    });

    return NextResponse.json({
      success: true,
      count: volunteers.length,
      volunteers,
    });

  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { volunteerIds } = body;

    if (!volunteerIds || !Array.isArray(volunteerIds) || volunteerIds.length === 0) {
      return NextResponse.json(
        { error: 'volunteerIds array is required' },
        { status: 400 }
      );
    }

    // Get all events from Neon to map Airtable IDs to names
    const allEvents = await db.select().from(events);
    const eventMap = new Map(
      allEvents.map(event => [event.airtableRecordId, event.name])
    );

    // Fetch the specific volunteers from Airtable
    const volunteersToImport = [];
    const fetchErrors = [];

    for (const recordId of volunteerIds) {
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Volunteers/${recordId}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          fetchErrors.push({ recordId, error: `Failed to fetch: ${response.statusText}` });
          continue;
        }

        const record: AirtableVolunteer = await response.json();

        // Prepare volunteer data for import
        const eventAirtableId = record.fields['Event Name']?.[0] || null;
        const eventName = eventAirtableId
          ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
          : 'No Event Assigned';

        const volunteerData = {
          eventAirtableId,
          eventName,
          email: record.fields['Email'],
          firstName: record.fields['First Name'],
          lastName: record.fields['Last Name'],
          photoConsent: record.fields['Photo Consent'] || false,
          feedbackConsent: record.fields['Feedback Consent'] || false,
          nextEventConsent: record.fields['Next Event Consent'] || false,
          airtableRecordId: record.id,
        };

        volunteersToImport.push(volunteerData);

      } catch (error) {
        fetchErrors.push({ 
          recordId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Import all fetched volunteers to Neon database
    const importResults = await importMultipleVolunteersToNeon(volunteersToImport);

    return NextResponse.json({
      success: true,
      fetched: volunteersToImport.length,
      created: importResults.created,
      updated: importResults.updated,
      failed: importResults.failed,
      fetchErrors: fetchErrors.length > 0 ? fetchErrors : undefined,
      importErrors: importResults.errors.length > 0 ? importResults.errors : undefined,
    });

  } catch (error) {
    console.error('Error importing volunteers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

