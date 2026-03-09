/**
 * Debug script for Cambridge Uni Boat Club registration count issue
 *
 * This script will:
 * 1. Find Cambridge Uni Boat Club organization
 * 2. Show all registrations for that organization
 * 3. Show the counting logic step-by-step
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/client';
import { registrations, organisations as organizations, events } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function debugCambridgeBoatClub() {
  console.log('\n=== DEBUGGING CAMBRIDGE UNI BOAT CLUB ===\n');

  // 1. Find the current event
  const currentEvent = await db
    .select()
    .from(events)
    .orderBy(events.date)
    .limit(1);

  if (currentEvent.length === 0) {
    console.log('❌ No events found in database');
    return;
  }

  console.log('📅 Current Event:', currentEvent[0].name, '(', currentEvent[0].date, ')');
  console.log('Event ID:', currentEvent[0].id);

  // 2. Find Cambridge Uni Boat Club organization
  // organisations table links via airtableEventId (text), not a UUID eventId
  const cambridgeOrg = currentEvent[0].airtableRecordId
    ? await db
        .select()
        .from(organizations)
        .where(eq(organizations.airtableEventId, currentEvent[0].airtableRecordId))
    : await db.select().from(organizations);

  const cambridge = cambridgeOrg.find(org => org.name?.toLowerCase().includes('cambridge'));

  if (!cambridge) {
    console.log('\n❌ Cambridge Uni Boat Club not found');
    console.log('Available organizations:');
    cambridgeOrg.forEach(org => console.log('  -', org.name));
    return;
  }

  console.log('\n🏛️ Organization Found:');
  console.log('  Name:', cambridge.name);
  console.log('  ID:', cambridge.id);
  console.log('  Group Type:', cambridge.groupType);

  // 3. Find all registrations for Cambridge Uni Boat Club
  const allRegs = await db
    .select()
    .from(registrations)
    .where(eq(registrations.eventId, currentEvent[0].id));

  const cambridgeRegs = allRegs.filter(reg => reg.organizationId === cambridge.id);

  console.log('\n📋 All Registrations for Cambridge Uni Boat Club:');
  console.log('Total registrations:', cambridgeRegs.length);

  cambridgeRegs.forEach((reg, index) => {
    console.log(`\n  Registration ${index + 1}:`);
    console.log('    Name:', reg.attendeeName, reg.attendeeSurname);
    console.log('    Email:', reg.email);
    console.log('    Role:', reg.role);
    console.log('    Organization ID:', reg.organizationId);
    console.log('    Group Size:', reg.groupSize);
    console.log('    Group Leader Participating:', reg.groupLeaderParticipating);
  });

  // 4. Show counting logic
  console.log('\n🔢 COUNTING LOGIC:');
  console.log('  Group Type:', cambridge.groupType);
  
  const isExpectedOnly = cambridge.groupType === 'Family' || cambridge.groupType === 'Disability';
  console.log('  Is Expected-Only Group (Family/Disability)?', isExpectedOnly);

  const groupReg = cambridgeRegs.find(reg => reg.role === 'Group');
  if (groupReg) {
    console.log('\n  Group Registration Found:');
    console.log('    Group Size:', groupReg.groupSize);
    console.log('    Group Leader Participating:', groupReg.groupLeaderParticipating);
    
    let expectedCount = groupReg.groupSize || 0;
    if (!isExpectedOnly && groupReg.groupLeaderParticipating === false) {
      expectedCount = Math.max(0, expectedCount - 1);
      console.log('    Expected Count (after leader adjustment):', expectedCount);
    } else {
      console.log('    Expected Count:', expectedCount);
    }
  }

  const participantRegs = cambridgeRegs.filter(reg => reg.role === 'Participant');
  console.log('\n  Participant Registrations (role=Participant):');
  console.log('    Count:', participantRegs.length);
  participantRegs.forEach(reg => {
    console.log('      -', reg.attendeeName, reg.attendeeSurname);
  });

  console.log('\n✅ EXPECTED DISPLAY:');
  if (groupReg) {
    let expectedCount = groupReg.groupSize || 0;
    if (!isExpectedOnly && groupReg.groupLeaderParticipating === false) {
      expectedCount = Math.max(0, expectedCount - 1);
    }
    console.log('  Expected:', expectedCount);
  }
  console.log('  Registered:', participantRegs.length);

  console.log('\n=== END DEBUG ===\n');
  process.exit(0);
}

debugCambridgeBoatClub().catch(console.error);

