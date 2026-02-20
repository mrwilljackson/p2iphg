/**
 * Participant Counting Business Logic
 * 
 * This module contains all business logic for calculating participant counts
 * across different group types and registration scenarios.
 * 
 * Version: 1.0
 * Date: 2026-02-20
 * 
 * BUSINESS RULES:
 * 
 * 1. FAMILY & DISABILITY GROUPS:
 *    - Individual participants do NOT register separately
 *    - Count comes from group registration's groupSize field
 *    - Includes disabled and SEN students from group registration
 *    - Group leader participation is included in groupSize
 * 
 * 2. OTHER GROUP TYPES (Corporate, Sporting, Community, Educational, Other):
 *    - Group leader provides EXPECTED participant count (groupSize)
 *    - Individual participants from the group register separately
 *    - We track BOTH:
 *      a) Expected participants (from group registration)
 *      b) Registered participants (actual individual registrations from group members)
 *    - Group leader participation logic:
 *      - If groupLeaderParticipating = false: Subtract 1 from groupSize (leader counted but not participating)
 *      - If groupLeaderParticipating = true: Use groupSize as-is
 * 
 * 3. INDIVIDUAL PARTICIPANTS (No Group):
 *    - Participants who register without a group affiliation
 *    - Counted separately from group participants
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
 * Calculate participant counts from registration data
 * 
 * This is the main business logic function that implements all counting rules.
 */
export function calculateParticipantCounts(
  registrations: RegistrationForCounting[]
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
  let familyDisabilityExpected = 0;
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

  // Process each group registration
  for (const group of groupRegistrations) {
    const groupSize = group.groupSize || 0;
    const isExpectedOnly = isExpectedOnlyGroupType(group.groupType);

    // Calculate expected participants for this group
    let expectedCount = groupSize;

    // Apply group leader participation logic for non-expected-only groups
    if (!isExpectedOnly && group.groupLeaderParticipating === false) {
      // Leader is in groupSize but not participating
      expectedCount = Math.max(0, expectedCount - 1);
    }

    // Add to appropriate category
    if (isExpectedOnly) {
      // Family & Disability: Expected = Registered
      familyDisabilityExpected += expectedCount;
    } else {
      // Other groups: Track expected separately from registered
      otherGroupsExpected += expectedCount;
    }

    // Add disabled and SEN students to totals
    totalDisabledStudents += group.disabledStudents || 0;
    totalSenStudents += group.senStudents || 0;

    // Categorize group type
    switch (group.groupType) {
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
  }

  // Count registered participants from other groups
  otherGroupsRegistered = participantRegistrations.filter(
    r => r.organizationId && otherGroupOrgIds.has(r.organizationId)
  ).length;

  // Calculate totals
  const totalGroupExpected = familyDisabilityExpected + otherGroupsExpected;
  const totalGroupRegistered = familyDisabilityExpected + otherGroupsRegistered;
  const totalParticipants = individualParticipants + totalGroupRegistered;

  return {
    individualParticipants,

    groupParticipants: {
      familyAndDisability: {
        expected: familyDisabilityExpected,
        registered: familyDisabilityExpected, // Same for these groups
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

    totalParticipants,

    disabledStudents: totalDisabledStudents,
    senStudents: totalSenStudents,

    volunteers: volunteerRegistrations.length,

    groups: {
      total: groupRegistrations.length,
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

