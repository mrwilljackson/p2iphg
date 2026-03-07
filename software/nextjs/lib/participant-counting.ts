/**
 * Participant Counting Business Logic
 *
 * This module contains all business logic for calculating participant counts
 * across different group types and registration scenarios.
 *
 * Version: 2.0
 * Date: 2026-02-20
 *
 * BUSINESS RULES:
 *
 * 1. GROUP SIZE AND LEADER PARTICIPATION:
 *    - Group Size = number of participants from the organization (NOT including the leader)
 *    - Group Leader Participation:
 *      - If groupLeaderParticipating = true: Expected = groupSize + 1 (add the leader)
 *      - If groupLeaderParticipating = false: Expected = groupSize (leader not participating)
 *
 * 2. FAMILY & DISABILITY GROUPS:
 *    - Individual participants do NOT register separately
 *    - Count comes from group registration's groupSize field
 *    - Includes disabled and SEN students from group registration
 *    - Expected = Registered (same value, set at group level)
 *    - REPORTING: Use the group-level count (groupSize + leader if participating)
 *    - These groups do not track individual registrations
 *
 * 3. OTHER GROUP TYPES (Corporate, Sporting, Community, Educational, Other):
 *    - Group leader provides EXPECTED participant count (groupSize) during group registration
 *    - Individual participants from the group MUST register separately
 *    - We track BOTH during the event:
 *      a) Expected participants (groupSize + 1 if leader participating) - for planning
 *      b) Registered participants (actual individual registrations + 1 if leader participating) - for reporting
 *    - REPORTING: Use the REGISTERED count (actual individual registrations captured)
 *    - The expected number is for planning only; actual registrations are what matter for post-event reporting
 *
 * 4. INDIVIDUAL PARTICIPANTS (No Group):
 *    - Participants who register without a group affiliation
 *    - Counted separately from group participants
 *    - REPORTING: Use actual registration count
 *
 * REPORTING SUMMARY:
 * - Family/Disability Groups: Report group-level count (no individual registrations)
 * - All Other Groups: Report actual individual registrations captured (NOT expected count)
 * - Individual Participants: Report actual registration count
 */

import type { GroupType } from './types';

/**
 * Registration data structure for counting
 */
export interface RegistrationForCounting {
  id: string;
  role: 'Participant' | 'Volunteer' | 'Group';
  groupSize?: number | null;
  disabledStudents?: number | null;
  senStudents?: number | null;
  groupLeaderParticipating?: boolean | null;
  organizationId?: string | null;
  organizationName?: string | null;
  groupType?: GroupType | null;
  organizationAirtableRecordId?: string | null;
}

/**
 * Individual group details for display
 */
export interface GroupDetail {
  organizationId: string;
  organizationName: string;
  groupType: GroupType | null;
  expected: number;
  registered: number;
}

/**
 * Participant count results
 */
export interface ParticipantCounts {
  // Individual participants (no group affiliation)
  individualParticipants: number;

  // Group-based participants
  groupParticipants: {
    // Family & Disability groups (expected = actual)
    familyAndDisability: {
      expected: number;
      registered: number; // Same as expected for these groups
    };

    // Other groups (expected vs registered may differ)
    otherGroups: {
      expected: number;
      registered: number; // Actual individual registrations from group members
    };

    // Total across all groups
    total: {
      expected: number;
      registered: number;
    };
  };

  // Detailed list of all groups with their counts
  groupDetails: GroupDetail[];

  // Total participants (individual + group registered)
  totalParticipants: number;

  // Accessibility counts
  disabledStudents: number;
  senStudents: number;

  // Volunteer count
  volunteers: number;

  // Group breakdown by type
  groups: {
    total: number;
    registered: number; // Groups that have completed registration
    walkIns: number; // Groups without airtable_record_id (on-the-day signups)
    familyGroups: number;
    disabilityGroups: number;
    corporateGroups: number;
    sportingGroups: number;
    communityGroups: number;
    educationalGroups: number;
    otherGroups: number;
  };

  // Total registrations
  totalRegistrations: number;
}

/**
 * Determine if a group type uses expected-only counting
 * (Family and Disability groups don't have individual registrations)
 */
function isExpectedOnlyGroupType(groupType?: GroupType | null): boolean {
  return groupType === 'Family' || groupType === 'Disability';
}

/**
 * Organization data for counting expected groups
 */
export interface OrganizationForCounting {
  id: string;
  name: string;
  groupType: GroupType | null;
  airtableRecordId?: string | null;
  expectedGroupSize?: number | null; // Expected participant count for planning (before registration)
}

/**
 * Calculate participant counts from registration data
 *
 * This is the main business logic function that implements all counting rules.
 *
 * @param registrations - All registrations for the event
 * @param allOrganizations - All organizations for the event (to count expected groups)
 */
export function calculateParticipantCounts(
  registrations: RegistrationForCounting[],
  allOrganizations?: OrganizationForCounting[]
): ParticipantCounts {
  // Separate registrations by role
  const groupRegistrations = registrations.filter(r => r.role === 'Group');
  const volunteerRegistrations = registrations.filter(r => r.role === 'Volunteer');
  const participantRegistrations = registrations.filter(r => r.role === 'Participant');
  
  // Get organization IDs for groups that track individual registrations
  const otherGroupOrgIds = new Set(
    groupRegistrations
      .filter(r => !isExpectedOnlyGroupType(r.groupType))
      .map(r => r.organizationId)
      .filter(id => id != null)
  );
  
  // Count individual participants (no group affiliation)
  const individualParticipants = participantRegistrations.filter(
    r => !r.organizationId || !otherGroupOrgIds.has(r.organizationId)
  ).length;
  
  // Initialize counters
  let familyDisabilityExpected = 0; // Expected from organizations with expectedGroupSize (not yet registered)
  let familyDisabilityRegistered = 0; // Registered from actual group registrations
  let otherGroupsExpected = 0;
  let otherGroupsRegistered = 0;

  let totalDisabledStudents = 0;
  let totalSenStudents = 0;

  let familyGroupsCount = 0;
  let disabilityGroupsCount = 0;
  let corporateGroupsCount = 0;
  let sportingGroupsCount = 0;
  let communityGroupsCount = 0;
  let educationalGroupsCount = 0;
  let otherGroupsCount = 0;

  let walkInGroupsCount = 0; // Groups without airtable_record_id

  // Array to store detailed group information
  const groupDetails: GroupDetail[] = [];

  // Aggregate group registrations by organizationId
  // Multiple leaders from the same org should be combined into one entry
  const orgGroupMap = new Map<string, {
    organizationId: string;
    organizationName: string;
    groupType: GroupType | null;
    totalGroupSize: number;
    totalDisabled: number;
    totalSen: number;
    leaderCount: number;
    participatingLeaderCount: number;
    hasAirtableRecord: boolean;
  }>();

  for (const group of groupRegistrations) {
    const orgId = group.organizationId || `unknown-${group.id}`;
    const existing = orgGroupMap.get(orgId);

    if (existing) {
      // Additional leader for same org — aggregate their numbers
      existing.totalGroupSize += group.groupSize || 0;
      existing.totalDisabled += group.disabledStudents || 0;
      existing.totalSen += group.senStudents || 0;
      existing.leaderCount += 1;
      if (group.groupLeaderParticipating === true) {
        existing.participatingLeaderCount += 1;
      }
      if (group.organizationAirtableRecordId) {
        existing.hasAirtableRecord = true;
      }
    } else {
      orgGroupMap.set(orgId, {
        organizationId: orgId,
        organizationName: group.organizationName || '',
        groupType: group.groupType || null,
        totalGroupSize: group.groupSize || 0,
        totalDisabled: group.disabledStudents || 0,
        totalSen: group.senStudents || 0,
        leaderCount: 1,
        participatingLeaderCount: group.groupLeaderParticipating === true ? 1 : 0,
        hasAirtableRecord: !!group.organizationAirtableRecordId,
      });
    }
  }

  // Process each aggregated organization group
  for (const [, orgGroup] of orgGroupMap) {
    const isExpectedOnly = isExpectedOnlyGroupType(orgGroup.groupType);

    // Expected = total group size across all leaders + number of participating leaders
    const expectedCount = orgGroup.totalGroupSize + orgGroup.participatingLeaderCount;

    // Add to appropriate category
    if (isExpectedOnly) {
      familyDisabilityExpected += expectedCount;
      familyDisabilityRegistered += expectedCount;
    } else {
      otherGroupsExpected += expectedCount;
    }

    // Add disabled and SEN students to totals
    totalDisabledStudents += orgGroup.totalDisabled;
    totalSenStudents += orgGroup.totalSen;

    // Check if this is a walk-in (no airtable_record_id on any leader)
    if (!orgGroup.hasAirtableRecord) {
      walkInGroupsCount++;
    }

    // Categorize group type (once per org, not per leader)
    switch (orgGroup.groupType) {
      case 'Family':
        familyGroupsCount++;
        break;
      case 'Disability':
        disabilityGroupsCount++;
        break;
      case 'Corporate':
        corporateGroupsCount++;
        break;
      case 'Sporting':
        sportingGroupsCount++;
        break;
      case 'Community':
        communityGroupsCount++;
        break;
      case 'Educational':
        educationalGroupsCount++;
        break;
      default:
        otherGroupsCount++;
    }

    // Calculate registered count for this org
    let registeredCount = expectedCount; // Default for Family/Disability
    if (!isExpectedOnly && orgGroup.organizationId) {
      // For other groups, count actual individual registrations
      registeredCount = participantRegistrations.filter(
        r => r.organizationId === orgGroup.organizationId
      ).length;

      // Add participating leaders to registered count
      registeredCount += orgGroup.participatingLeaderCount;

      // Add this org's registered count to the total for other groups
      otherGroupsRegistered += registeredCount;
    }

    // Add to group details array (one row per org)
    // Always add — use fallback name if org name is missing to avoid silent counting gaps
    groupDetails.push({
      organizationId: orgGroup.organizationId,
      organizationName: orgGroup.organizationName || 'Unknown Group',
      groupType: orgGroup.groupType,
      expected: expectedCount,
      registered: registeredCount,
    });
  }

  // Add organizations that haven't registered yet (expected groups)
  if (allOrganizations) {
    const registeredOrgIds = new Set(groupRegistrations.map(r => r.organizationId).filter(id => id != null));

    for (const org of allOrganizations) {
      // Skip if this organization already has a group registration
      if (registeredOrgIds.has(org.id)) {
        continue;
      }

      // Count this as an expected group
      switch (org.groupType) {
        case 'Family':
          familyGroupsCount++;
          break;
        case 'Disability':
          disabilityGroupsCount++;
          break;
        case 'Corporate':
          corporateGroupsCount++;
          break;
        case 'Sporting':
          sportingGroupsCount++;
          break;
        case 'Community':
          communityGroupsCount++;
          break;
        case 'Educational':
          educationalGroupsCount++;
          break;
        case 'Other':
          otherGroupsCount++;
          break;
      }

      // Add expected participants from this organization (if expectedGroupSize is set)
      // This is used for future events where organizations are pre-registered but haven't completed registration yet
      // IMPORTANT: This only adds to EXPECTED count, NOT registered count (they haven't registered yet)
      if (org.expectedGroupSize && org.expectedGroupSize > 0) {
        const isExpectedOnly = isExpectedOnlyGroupType(org.groupType);

        if (isExpectedOnly) {
          // Family/Disability groups: expected participants come from expectedGroupSize
          // NOTE: This does NOT add to familyDisabilityRegistered - only to expected
          familyDisabilityExpected += org.expectedGroupSize;
        } else {
          // Other groups: expected participants come from expectedGroupSize
          otherGroupsExpected += org.expectedGroupSize;
        }

        // Add to group details array for display
        groupDetails.push({
          organizationId: org.id,
          organizationName: org.name,
          groupType: org.groupType,
          expected: org.expectedGroupSize,
          registered: 0, // Not registered yet
        });
      }
    }
  }

  // Calculate totals
  const totalGroupExpected = familyDisabilityExpected + otherGroupsExpected;
  const totalGroupRegistered = familyDisabilityRegistered + otherGroupsRegistered;
  const totalParticipants = individualParticipants + totalGroupRegistered;

  // Calculate total groups (registered + expected but not registered)
  const totalGroups = allOrganizations ? allOrganizations.length : groupRegistrations.length;

  return {
    individualParticipants,

    groupParticipants: {
      familyAndDisability: {
        expected: familyDisabilityExpected,
        registered: familyDisabilityRegistered, // Only from actual group registrations
      },
      otherGroups: {
        expected: otherGroupsExpected,
        registered: otherGroupsRegistered,
      },
      total: {
        expected: totalGroupExpected,
        registered: totalGroupRegistered,
      },
    },

    groupDetails, // Detailed list of all groups

    totalParticipants,

    disabledStudents: totalDisabledStudents,
    senStudents: totalSenStudents,

    volunteers: volunteerRegistrations.length,

    groups: {
      total: totalGroups,
      registered: groupRegistrations.length,
      walkIns: walkInGroupsCount,
      familyGroups: familyGroupsCount,
      disabilityGroups: disabilityGroupsCount,
      corporateGroups: corporateGroupsCount,
      sportingGroups: sportingGroupsCount,
      communityGroups: communityGroupsCount,
      educationalGroups: educationalGroupsCount,
      otherGroups: otherGroupsCount,
    },

    totalRegistrations: registrations.length,
  };
}

