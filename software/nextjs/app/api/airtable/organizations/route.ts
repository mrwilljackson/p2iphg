import { NextRequest, NextResponse } from 'next/server';
import { importMultipleOrganizationsToNeon } from '@/app/actions/airtable-import';
import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableOrganization {
  id: string;
  fields: {
    'Organization Name': string;
    'Event': string[];  // Array of linked record IDs
    'Group Type'?: string;
    'Expected Group Size'?: number;
    'Contact First Name'?: string;
    'Contact Last Name'?: string;
    'Contact Email'?: string;
    'Contact Phone'?: string;
    'Notes'?: string;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableOrganization[];
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

    // Fetch all organizations from Airtable
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organizations`;
    
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
        { error: 'Failed to fetch organizations from Airtable', details: errorText },
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
    const organizations = data.records.map(record => {
      const eventAirtableId = record.fields['Event']?.[0] || null;
      const eventName = eventAirtableId 
        ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
        : 'No Event Assigned';
      
      return {
        airtableRecordId: record.id,
        eventAirtableId,
        eventName,
        name: record.fields['Organization Name'],
        groupType: record.fields['Group Type'] || 'Other',
        expectedGroupSize: record.fields['Expected Group Size'] || null,
        contactFirstName: record.fields['Contact First Name'] || null,
        contactLastName: record.fields['Contact Last Name'] || null,
        contactEmail: record.fields['Contact Email'] || null,
        contactPhone: record.fields['Contact Phone'] || null,
        notes: record.fields['Notes'] || null,
      };
    });

    return NextResponse.json({
      success: true,
      count: organizations.length,
      organizations,
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
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
    const { organizationIds } = body;

    if (!organizationIds || !Array.isArray(organizationIds) || organizationIds.length === 0) {
      return NextResponse.json(
        { error: 'organizationIds array is required' },
        { status: 400 }
      );
    }

    // Get all events from Neon to map Airtable IDs to names
    const allEvents = await db.select().from(events);
    const eventMap = new Map(
      allEvents.map(event => [event.airtableRecordId, event.name])
    );

    // Fetch the specific organizations from Airtable
    const organizationsToImport = [];
    const fetchErrors = [];

    for (const recordId of organizationIds) {
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organizations/${recordId}`;
        
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

        const record: AirtableOrganization = await response.json();

        // Prepare organization data for import
        const eventAirtableId = record.fields['Event']?.[0] || null;
        const eventName = eventAirtableId
          ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
          : 'No Event Assigned';

        const organizationData = {
          eventAirtableId,
          eventName,
          name: record.fields['Organization Name'],
          groupType: record.fields['Group Type'] || 'Other',
          expectedGroupSize: record.fields['Expected Group Size'] || null,
          contactFirstName: record.fields['Contact First Name'] || null,
          contactLastName: record.fields['Contact Last Name'] || null,
          contactEmail: record.fields['Contact Email'] || null,
          contactPhone: record.fields['Contact Phone'] || null,
          notes: record.fields['Notes'] || null,
          airtableRecordId: record.id,
        };

        organizationsToImport.push(organizationData);

      } catch (error) {
        fetchErrors.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Import to Neon
    const importResults = await importMultipleOrganizationsToNeon(organizationsToImport);

    return NextResponse.json({
      success: true,
      ...importResults,
      fetchErrors: fetchErrors.length > 0 ? fetchErrors : undefined,
    });

  } catch (error) {
    console.error('Error importing organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

