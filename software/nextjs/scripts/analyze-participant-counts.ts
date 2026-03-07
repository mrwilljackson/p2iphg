/**
 * Diagnostic Script: Analyze Participant Counts
 *
 * This script queries the database and shows step-by-step how participant counts are calculated
 * for the current event, including group breakdowns and deduplication logic.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') });

import { db } from '../lib/db/client';
import { registrations, organisations as organizations, events } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

async function analyzeParticipantCounts() {
  console.log('\n🔍 PARTICIPANT COUNT ANALYSIS\n');
  console.log('='.repeat(100));

  // Get current event
  const currentEvent = await db
    .select()
    .from(events)
    .where(eq(events.status, 'active'))
    .limit(1);

  if (currentEvent.length === 0) {
    console.log('❌ No active event found');
    return;
  }

  const event = currentEvent[0];
  console.log(`\n📅 EVENT: ${event.name}`);
  console.log(`   Date: ${event.date}`);
  console.log(`   Location: ${event.location}`);
  console.log('='.repeat(100));

  // Get all registrations with organization details
  const allRegistrations = await db
    .select({
      id: registrations.id,
      attendeeName: registrations.attendeeName,
      attendeeSurname: registrations.attendeeSurname,
      role: registrations.role,
      groupSize: registrations.groupSize,
      disabledStudents: registrations.disabledStudents,
      senStudents: registrations.senStudents,
      groupLeaderParticipating: registrations.groupLeaderParticipating,
      organizationId: registrations.organizationId,
      organizationName: organizations.name,
      groupType: organizations.groupType,
    })
    .from(registrations)
    .leftJoin(organizations, eq(registrations.organizationId, organizations.id))
    .where(eq(registrations.eventId, event.id));

  console.log(`\n📊 TOTAL REGISTRATIONS: ${allRegistrations.length}`);
  console.log('='.repeat(100));

  // STEP 1: Identify Corporate Groups
  console.log('\n📋 STEP 1: IDENTIFY CORPORATE GROUPS');
  console.log('-'.repeat(100));

  const corporateGroupOrgIds = new Set(
    allRegistrations
      .filter(r => r.role === 'Group' && r.groupType === 'Corporate')
      .map(r => r.organizationId)
      .filter(id => id != null)
  );

  if (corporateGroupOrgIds.size > 0) {
    console.log(`\n✅ Found ${corporateGroupOrgIds.size} corporate group(s):`);
    allRegistrations
      .filter(r => r.role === 'Group' && r.groupType === 'Corporate')
      .forEach(r => {
        console.log(`   - ${r.organizationName} (ID: ${r.organizationId})`);
      });
  } else {
    console.log('\n⚪ No corporate groups found');
  }

  // STEP 2: Count Individual Participants (excluding corporate group members)
  console.log('\n\n📋 STEP 2: COUNT INDIVIDUAL PARTICIPANTS');
  console.log('-'.repeat(100));
  
  const individualParticipantRegs = allRegistrations.filter(r => r.role === 'Participant');
  const excludedIndividuals = individualParticipantRegs.filter(r => 
    r.organizationId && corporateGroupOrgIds.has(r.organizationId)
  );
  const countedIndividuals = individualParticipantRegs.filter(r => 
    !r.organizationId || !corporateGroupOrgIds.has(r.organizationId)
  );

  console.log(`\n   Total Individual Registrations: ${individualParticipantRegs.length}`);
  
  if (excludedIndividuals.length > 0) {
    console.log(`\n   ❌ EXCLUDED (Corporate Group Members - Avoid Double Counting):`);
    console.log('   ' + '─'.repeat(96));
    console.log('   Name                    | Organization');
    console.log('   ' + '─'.repeat(96));
    excludedIndividuals.forEach(r => {
      console.log(`   ${(r.attendeeName + ' ' + r.attendeeSurname).padEnd(23)} | ${r.organizationName || 'N/A'}`);
    });
  }

  console.log(`\n   ✅ COUNTED Individual Participants: ${countedIndividuals.length}`);
  if (countedIndividuals.length > 0) {
    console.log('   ' + '─'.repeat(96));
    console.log('   Name                    | Organization');
    console.log('   ' + '─'.repeat(96));
    countedIndividuals.forEach(r => {
      console.log(`   ${(r.attendeeName + ' ' + r.attendeeSurname).padEnd(23)} | ${r.organizationName || 'None'}`);
    });
  }

  // STEP 3: Process Group Registrations
  console.log('\n\n📋 STEP 3: PROCESS GROUP REGISTRATIONS');
  console.log('-'.repeat(100));

  const groupRegistrations = allRegistrations.filter(r => r.role === 'Group');
  
  let groupParticipants = 0;
  let familyGroupsCount = 0;
  let disabilityGroupsCount = 0;
  let corporateGroupsCount = 0;
  let otherGroupsCount = 0;
  let totalDisabledStudents = 0;
  let totalSenStudents = 0;

  console.log('\n   Group Details:');
  console.log('   ' + '─'.repeat(96));
  console.log('   Organization            | Type       | Size | Leader? | Disabled | SEN | Final Count');
  console.log('   ' + '─'.repeat(96));

  for (const group of groupRegistrations) {
    let groupCount = group.groupSize || 0;
    const leaderParticipating = group.groupLeaderParticipating;

    // Subtract 1 if leader is NOT participating (leader is in groupSize but doesn't participate)
    if (leaderParticipating === false) {
      groupCount -= 1;
    }

    groupParticipants += groupCount;
    totalDisabledStudents += group.disabledStudents || 0;
    totalSenStudents += group.senStudents || 0;

    // Categorize group type using groupType field
    const groupTypeValue = group.groupType || 'Other';
    switch (groupTypeValue) {
      case 'Family':
        familyGroupsCount++;
        break;
      case 'Disability':
        disabilityGroupsCount++;
        break;
      case 'Corporate':
        corporateGroupsCount++;
        break;
      default:
        otherGroupsCount++;
    }

    const orgName = (group.organizationName || 'Unknown').substring(0, 23).padEnd(23);
    const size = String(group.groupSize || 0).padStart(4);
    const leader = leaderParticipating === true ? 'Yes' : leaderParticipating === false ? 'No ' : 'N/A';
    const disabled = String(group.disabledStudents || 0).padStart(8);
    const sen = String(group.senStudents || 0).padStart(3);
    const final = String(groupCount).padStart(11);

    console.log(`   ${orgName} | ${groupTypeValue.padEnd(10)} | ${size} | ${leader}     | ${disabled} | ${sen} | ${final}`);
  }

  // STEP 4: Calculate Totals
  console.log('\n\n📋 STEP 4: CALCULATE TOTALS');
  console.log('-'.repeat(100));

  const volunteersCount = allRegistrations.filter(r => r.role === 'Volunteer').length;
  const totalParticipants = countedIndividuals.length + groupParticipants;

  console.log('\n   FINAL COUNTS:');
  console.log('   ' + '═'.repeat(96));
  console.log(`   Individual Participants:        ${countedIndividuals.length.toString().padStart(5)}`);
  console.log(`   Group Participants:             ${groupParticipants.toString().padStart(5)}`);
  console.log('   ' + '─'.repeat(96));
  console.log(`   TOTAL PARTICIPANTS:             ${totalParticipants.toString().padStart(5)} ✅`);
  console.log('   ' + '═'.repeat(96));
  console.log(`   Volunteers:                     ${volunteersCount.toString().padStart(5)}`);
  console.log('   ' + '─'.repeat(96));
  console.log(`   TOTAL REGISTRATIONS:            ${allRegistrations.length.toString().padStart(5)}`);
  console.log('   ' + '═'.repeat(96));

  console.log('\n   GROUP BREAKDOWN:');
  console.log('   ' + '─'.repeat(96));
  console.log(`   Total Groups:                   ${groupRegistrations.length.toString().padStart(5)}`);
  console.log(`     - Family Groups:              ${familyGroupsCount.toString().padStart(5)}`);
  console.log(`     - Disability Groups:          ${disabilityGroupsCount.toString().padStart(5)}`);
  console.log(`     - Corporate Groups:           ${corporateGroupsCount.toString().padStart(5)}`);
  console.log(`     - Other Groups:               ${otherGroupsCount.toString().padStart(5)}`);

  console.log('\n   ACCESSIBILITY:');
  console.log('   ' + '─'.repeat(96));
  console.log(`   Disabled Students:              ${totalDisabledStudents.toString().padStart(5)}`);
  console.log(`   SEN Students:                   ${totalSenStudents.toString().padStart(5)}`);
  console.log(`   Total Accessibility Needs:      ${(totalDisabledStudents + totalSenStudents).toString().padStart(5)}`);

  console.log('\n' + '='.repeat(100));
  console.log('✅ Analysis Complete!\n');
}

// Run the analysis
analyzeParticipantCounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

