import { db } from '../lib/db/client';
import { registrations, events, organisations } from '../lib/db/schema';
import { eq, or, isNull } from 'drizzle-orm';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

async function main() {
  console.log('API Key set:', !!AIRTABLE_API_KEY);
  console.log('Base ID:', AIRTABLE_BASE_ID);

  // Get one registration
  const regs = await db.select().from(registrations).limit(1);
  if (regs.length === 0) {
    console.log('No registrations found');
    process.exit(0);
  }

  const reg = regs[0];
  console.log('\n=== REGISTRATION ===');
  console.log(JSON.stringify(reg, null, 2));

  // Get event
  const evts = await db.select().from(events).where(eq(events.id, reg.eventId));
  const eventAirtableId = evts[0]?.airtableRecordId;
  console.log('\nEvent Airtable ID:', eventAirtableId);



  // Get org name if exists
  let orgName: string | null = null;
  if (reg.organizationId) {
    const orgs = await db.select().from(organisations).where(eq(organisations.id, reg.organizationId));
    orgName = orgs[0]?.name ?? null;
    console.log('Org Name:', orgName);
  }

  // Build fields — "Record ID" is autoNumber (computed), do NOT send it
  const fields: Record<string, unknown> = {
    "First Name": reg.attendeeName,
    "Last Name": reg.attendeeSurname,
    "Role": reg.role,
  };

  if (eventAirtableId) fields["Event"] = [eventAirtableId];
  if (orgName) fields["Organisation"] = orgName; // singleLineText
  if (reg.email) fields["Email"] = reg.email;
  // Impairment is checkbox: "Yes" → true, else omit
  if (reg.impairment && reg.impairment.toLowerCase() === "yes") fields["Impairment"] = true;
  if (reg.photoConsent) fields["Photo Consent"] = true;
  if (reg.feedbackConsent) fields["Feedback Consent"] = true;
  if (reg.nextEventConsent) fields["Next Event Consent"] = true;

  if (reg.role === "Group") {
    if (reg.groupSize != null) fields["Group Size"] = reg.groupSize;
    if (reg.disabledStudents != null) fields["Disabled Students"] = reg.disabledStudents;
    if (reg.senStudents != null) fields["SEN Students"] = reg.senStudents;
    if (reg.groupLeaderParticipating) fields["Leader Participating"] = true;
  }

  console.log('\n=== FIELDS TO SEND ===');
  console.log(JSON.stringify(fields, null, 2));

  // Try to create
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Registrations`;
  console.log('\nPOSTing to:', url);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }] }),
  });

  console.log('Status:', response.status, response.statusText);
  const body = await response.text();
  console.log('Response:', body);

  process.exit(0);
}

main();

