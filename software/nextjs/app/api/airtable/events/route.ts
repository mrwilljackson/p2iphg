import { NextRequest, NextResponse } from 'next/server';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableEvent {
  id: string; // Airtable Record ID
  createdTime: string;
  fields: {
    'Event Name': string;
    'Event Date': string;
    'Location'?: string;
    'Description'?: string;
    'Status'?: string;
  };
}

interface AirtableResponse {
  records: AirtableEvent[];
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

    // Fetch all events from Airtable
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Airtable API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch events from Airtable', details: errorText },
        { status: response.status }
      );
    }

    const data: AirtableResponse = await response.json();

    // Filter for future events only
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const futureEvents = data.records
      .filter(record => {
        const eventDate = record.fields['Event Date'];
        if (!eventDate) return false;
        
        const date = new Date(eventDate);
        return date >= today;
      })
      .map(record => ({
        airtableRecordId: record.id,
        name: record.fields['Event Name'],
        date: record.fields['Event Date'],
        location: record.fields['Location'] || null,
        description: record.fields['Description'] || null,
        status: record.fields['Status'] || 'planned',
      }));

    // Sort by date (earliest first)
    futureEvents.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({
      success: true,
      count: futureEvents.length,
      events: futureEvents,
    });

  } catch (error) {
    console.error('Error fetching events from Airtable:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST endpoint to import selected events to Neon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventIds } = body; // Array of Airtable Record IDs to import

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'No event IDs provided' },
        { status: 400 }
      );
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      );
    }

    // Fetch the specific events from Airtable
    const importedEvents = [];
    const errors = [];

    for (const recordId of eventIds) {
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Events/${recordId}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          errors.push({ recordId, error: `Failed to fetch: ${response.statusText}` });
          continue;
        }

        const record: AirtableEvent = await response.json();

        // Import to Neon database using server action
        // We'll need to create this action
        const eventData = {
          name: record.fields['Event Name'],
          date: record.fields['Event Date'],
          location: record.fields['Location'] || undefined,
          description: record.fields['Description'] || undefined,
          status: (record.fields['Status'] || 'planned') as 'planned' | 'active' | 'completed' | 'cancelled',
          airtableRecordId: record.id,
        };

        // TODO: Call server action to create event in Neon
        // For now, we'll return the data
        importedEvents.push(eventData);

      } catch (error) {
        errors.push({ 
          recordId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedEvents.length,
      events: importedEvents,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error importing events:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

