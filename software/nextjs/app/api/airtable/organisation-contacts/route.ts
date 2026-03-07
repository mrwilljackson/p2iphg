import { NextRequest, NextResponse } from 'next/server';
import { importMultipleOrganisationContactsToNeon } from '@/app/actions/airtable-import';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

interface AirtableOrganisationContact {
  id: string;
  fields: {
    'Organisation ID'?: string[];           // Linked record IDs to Organisations table
    'organisation_record_id (from Organisation ID)'?: string[]; // Org's airtable record ID (for linking)
    'Organisation Name (from Organisation ID)'?: string[];      // Org name (lookup)
    'airtable_event_id'?: string[];
    'Group Type'?: string;
    'Contact First Name'?: string;
    'Contact Last Name'?: string;
    'Contact Email'?: string;
    'Expected Group Size'?: number;
    'Record ID'?: number;
  };
  createdTime: string;
}

interface AirtableResponse {
  records: AirtableOrganisationContact[];
  offset?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching organisation contacts from Airtable...');

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json(
        { error: 'Airtable credentials not configured' },
        { status: 500 }
      );
    }

    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organisation_contacts`;
    console.log('📡 Fetching from URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch organisation contacts from Airtable', details: errorText },
        { status: response.status }
      );
    }

    const data: AirtableResponse = await response.json();
    console.log('✅ Fetched', data.records.length, 'organisation contacts from Airtable');

    // Log field names from first record for debugging
    if (data.records.length > 0) {
      console.log('📋 Organisation Contact fields:', Object.keys(data.records[0].fields));
      console.log('📋 First contact full record:', JSON.stringify(data.records[0].fields, null, 2));
    }

    const contacts = data.records.map(record => {
      // 'Organisation ID' is the linked record field — returns the org row's Airtable record.id
      // This matches organisations.airtableRecordId for cross-referencing
      const orgLinkedIds = record.fields['Organisation ID'];
      const organisationAirtableId = Array.isArray(orgLinkedIds) ? orgLinkedIds[0] : null;

      const eventIds = record.fields['airtable_event_id'];
      const eventAirtableId = Array.isArray(eventIds) ? eventIds[0] : null;

      const orgNames = record.fields['Organisation Name (from Organisation ID)'];
      const organisationName = Array.isArray(orgNames) ? orgNames[0] : null;

      return {
        airtableRecordId: record.id,
        organisationId: organisationAirtableId || null,
        organisationName: organisationName || null,
        airtableEventId: eventAirtableId || null,
        groupType: record.fields['Group Type'] || null,
        contactFirstName: record.fields['Contact First Name'] || null,
        contactLastName: record.fields['Contact Last Name'] || null,
        contactEmail: record.fields['Contact Email'] || null,
        contactPhone: null,  // Not present in Airtable
        expectedGroupSize: record.fields['Expected Group Size'] != null
          ? String(record.fields['Expected Group Size'])
          : null,
        notes: null,  // Not present in Airtable
      };
    });

    return NextResponse.json({
      success: true,
      count: contacts.length,
      contacts,
    });

  } catch (error) {
    console.error('Error fetching organisation contacts:', error);
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
    const { contactIds } = body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds array is required' },
        { status: 400 }
      );
    }

    const contactsToImport = [];
    const fetchErrors = [];

    for (const recordId of contactIds) {
      try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Organisation_contacts/${recordId}`;

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

        const record: AirtableOrganisationContact = await response.json();
        console.log('📋 Organisation Contact fields:', Object.keys(record.fields));
        console.log('📋 Full record:', JSON.stringify(record.fields, null, 2));

        // Use linked record field to get the org's real Airtable record.id
        const orgLinkedIds = record.fields['Organisation ID'];
        const organisationAirtableId = Array.isArray(orgLinkedIds) ? orgLinkedIds[0] : null;

        const eventIds = record.fields['airtable_event_id'];
        const eventAirtableId = Array.isArray(eventIds) ? eventIds[0] : null;

        contactsToImport.push({
          airtableRecordId: record.id,
          organisationId: organisationAirtableId || null,
          airtableEventId: eventAirtableId || null,
          groupType: record.fields['Group Type'] || null,
          contactFirstName: record.fields['Contact First Name'] || null,
          contactLastName: record.fields['Contact Last Name'] || null,
          contactEmail: record.fields['Contact Email'] || null,
          contactPhone: null,
          expectedGroupSize: record.fields['Expected Group Size'] != null
            ? String(record.fields['Expected Group Size'])
            : null,
          notes: null,
        });

      } catch (error) {
        fetchErrors.push({
          recordId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const importResults = await importMultipleOrganisationContactsToNeon(contactsToImport);

    return NextResponse.json({
      success: true,
      ...importResults,
      fetchErrors: fetchErrors.length > 0 ? fetchErrors : undefined,
    });

  } catch (error) {
    console.error('Error importing organisation contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

