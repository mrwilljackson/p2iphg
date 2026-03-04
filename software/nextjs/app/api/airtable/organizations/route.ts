import { NextRequest, NextResponse } from 'next/server';
import { importMultipleOrganizationsToNeon } from '@/app/actions/airtable-import';
import { db } from '@/lib/db/client';
import { events } from '@/lib/db/schema';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableOrganization {
  id: string;
  fields: {
    'Organisation Name': string;  // UK spelling in Airtable
    'Event': string[];  // Array of linked record IDs (for display)
    'airtable_event_id'?: string | string[];  // Can be text field (string) or linked record (array)
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
    console.log('🔍 Fetching organizations from Airtable...');

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.error('❌ Airtable credentials not configured');
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      );
    }

    // Fetch all organizations from Airtable (UK spelling: Organisations)
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organisations`;
    console.log('📡 Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch organizations from Airtable', details: errorText },
        { status: response.status }
      );
    }

    const data: AirtableResponse = await response.json();
    console.log('✅ Fetched', data.records.length, 'organizations from Airtable');

    // Get all events from Neon to map Airtable IDs to names
    const allEvents = await db.select().from(events);
    console.log('📊 Found', allEvents.length, 'events in Neon database');
    const eventMap = new Map(
      allEvents.map(event => [event.airtableRecordId, event.name])
    );

    // Transform Airtable records to our format
    const organizations = data.records.map(record => {
      // Use the airtable_event_id field for matching (preferred)
      // Handle both string (text field) and array (linked record field)
      let eventAirtableId = record.fields['airtable_event_id'];
      if (Array.isArray(eventAirtableId)) {
        eventAirtableId = eventAirtableId[0]; // Extract first element if array
      }
      // Fallback to Event linked field if airtable_event_id not present
      if (!eventAirtableId) {
        eventAirtableId = record.fields['Event']?.[0] || null;
      }

      const eventName = eventAirtableId
        ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
        : 'No Event Assigned';

      return {
        airtableRecordId: record.id,
        eventAirtableId,
        eventName,
        name: record.fields['Organisation Name'],  // UK spelling
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
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organisations/${recordId}`;
        
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

        // Debug: Log the actual fields from Airtable
        console.log('📋 Organization fields from Airtable:', Object.keys(record.fields));
        console.log('📋 Full record:', JSON.stringify(record.fields, null, 2));

        // Prepare organization data for import
        // Use the airtable_event_id field for matching (preferred)
        // Handle both string (text field) and array (linked record field)
        let eventAirtableId = record.fields['airtable_event_id'];
        if (Array.isArray(eventAirtableId)) {
          eventAirtableId = eventAirtableId[0]; // Extract first element if array
        }
        // Fallback to Event linked field if airtable_event_id not present
        if (!eventAirtableId) {
          eventAirtableId = record.fields['Event']?.[0] || null;
        }

        const eventName = eventAirtableId
          ? (eventMap.get(eventAirtableId) || `Unknown Event (${eventAirtableId})`)
          : 'No Event Assigned';

        const organizationData = {
          eventAirtableId,
          eventName,
          name: record.fields['Organisation Name'],  // UK spelling
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

