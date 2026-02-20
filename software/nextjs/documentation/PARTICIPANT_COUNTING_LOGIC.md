# Participant Counting and Reporting Logic

**Version:** 2.0  
**Date:** 2026-02-20  
**Status:** Active

## Overview

This document defines the business logic for counting and reporting participants across different group types in the Power2Inspire Event CRM system.

## Key Concepts

### Group Size
- **Definition:** The number of participants from an organization (NOT including the group leader)
- **Set by:** Group leader during group registration
- **Example:** If a group leader enters "5" as group size, this means 5 members from their organization

### Group Leader Participation
- **Question:** "Will you participate in the event?"
- **If YES (participating = true):** Total expected = Group Size + 1 (the leader)
- **If NO (participating = false):** Total expected = Group Size (leader not participating)

## Group Type Categories

### 1. Family & Disability Groups

**Registration Process:**
- Group leader registers the group with a group size
- Individual participants do NOT register separately
- Count is set at the group level only

**Counting:**
- Expected = Group Size + 1 (if leader participating) OR Group Size (if leader not participating)
- Registered = Expected (same value, no individual tracking)

**Reporting:**
- **Use:** Group-level count
- **Source:** `groupSize` field from group registration
- **Note:** No individual registrations are captured for these groups

**Example:**
```
Smith Family Group
- Group Size: 4 (4 family members)
- Leader Participating: YES
- Expected: 5 (4 members + 1 leader)
- Registered: 5 (same as expected)
- REPORT: 5 participants
```

---

### 2. Other Group Types (Corporate, Sporting, Community, Educational, Other)

**Registration Process:**
1. Group leader registers the group with an EXPECTED participant count
2. Individual participants from the group MUST complete individual registrations
3. System tracks both expected and actual registrations

**Counting:**
- **Expected:** Group Size + 1 (if leader participating) OR Group Size (if leader not participating)
  - Used for planning and tracking registration progress during the event
- **Registered:** Count of actual individual registrations + 1 (if leader participating and has registered)
  - Used for post-event reporting

**Reporting:**
- **Use:** REGISTERED count (actual individual registrations captured)
- **Source:** Count of individual `role='Participant'` registrations + group leader (if participating)
- **Note:** Expected number is for planning only; actual registrations are what matter for reporting

**Example:**
```
Cambridge Uni Boat Club (Educational)
- Group Size: 5 (5 expected members)
- Leader Participating: YES
- Expected: 6 (5 members + 1 leader) - for planning
- Registered: 2 (Billy Boat as leader + Brenda Boat as participant) - for reporting
- REPORT: 2 participants (actual registrations captured)
- Status: 4 more registrations needed
```

---

### 3. Individual Participants (No Group Affiliation)

**Registration Process:**
- Individuals register directly without selecting a group
- No group leader involved

**Counting:**
- Count = Number of individual registrations

**Reporting:**
- **Use:** Actual registration count
- **Source:** Count of `role='Participant'` registrations with no `organizationId`

---

## Reporting Summary

### Post-Event Reporting

When generating reports after an event, use the following counts:

| Group Type | Report Count | Source |
|------------|--------------|--------|
| Family | Group-level count | `groupSize` + leader (if participating) |
| Disability | Group-level count | `groupSize` + leader (if participating) |
| Corporate | Actual registrations | Individual registrations + leader (if participating) |
| Sporting | Actual registrations | Individual registrations + leader (if participating) |
| Community | Actual registrations | Individual registrations + leader (if participating) |
| Educational | Actual registrations | Individual registrations + leader (if participating) |
| Other | Actual registrations | Individual registrations + leader (if participating) |
| Individual | Actual registrations | Individual registrations (no group) |

### During-Event Dashboard

The Event Admin Dashboard shows:
- **Expected:** For planning and tracking registration progress
- **Registered:** Actual registrations captured so far

For Family/Disability groups: Expected = Registered (always)  
For Other groups: Expected vs Registered may differ (track progress)

---

## Implementation

### Code Location
- **Business Logic:** `software/nextjs/lib/participant-counting.ts`
- **Database Service:** `software/nextjs/lib/db-service.ts`
- **UI Display:** `software/nextjs/app/admin/event/page.tsx`

### Key Functions
- `calculateParticipantCounts()` - Main counting logic
- `isExpectedOnlyGroupType()` - Determines if group uses group-level counting

---

## Version History

**Version 2.0 (2026-02-20):**
- Clarified reporting distinction between Family/Disability and Other groups
- Documented that Other groups report actual registrations, not expected
- Fixed group leader participation counting logic

**Version 1.0 (2026-02-11):**
- Initial documentation of participant counting logic

