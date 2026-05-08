# Participant Counting and Reporting Logic

**Version:** 3.1
**Date:** 2026-03-13
**Status:** Active

## Overview

This document defines the business logic for counting and reporting participants across different group types in the Power2Inspire Event CRM system.

The system supports two scenarios:
1. **Active Events:** Organizations register and participate, counts come from actual registrations
2. **Future Events:** Organizations are pre-registered with expected participant counts for planning purposes

## Key Concepts

### Group Size
- **Definition:** The number of participants from an organization (NOT including the group leader)
- **Set by:** Group leader during group registration
- **Example:** If a group leader enters "5" as group size, this means 5 members from their organization

### Expected Group Size
- **Definition:** The expected number of participants from a pre-registered organization (for planning purposes)
- **Set by:** P2I Admin when pre-registering organizations for future events
- **Database Field:** `expected_group_size` in the `organizations` table
- **Usage:** Used to calculate expected participant counts for future events before actual registrations occur
- **Example:** If Leicester Tigers event is in the future and Cambridge Uni Boat Club has `expected_group_size = 20`, the system will show 20 expected participants from that organization

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

### 3. Individual Participants

**Registration Process:**
- Individuals register as Participant role
- **Organisation is required** — participants select from open-group organisations (`openGroup !== false` on the contact row for the active event), or the virtual "Family Group" placeholder
- The dropdown excludes closed-group organisations (those are reserved for the Group role, where the leader registers on behalf of all members)
- No group leader involved

**Counting:**
- Count = Number of individual `role='Participant'` registrations

**Reporting:**
- **Use:** Actual registration count
- **Source:** Count of `role='Participant'` registrations

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

## Future Event Planning

### Expected Participant Counts for Future Events

For events that haven't started yet (future events), the system can calculate expected participant counts based on pre-registered organizations.

**How it works:**

1. **Pre-Registration:** P2I Admin adds organizations to a future event with `expected_group_size` values
2. **Organization Classification:**
   - Organizations with `airtable_record_id` = Pre-registered (expected to attend)
   - Organizations without `airtable_record_id` = Walk-ins/on-the-day signups (not expected)
3. **Expected Count Calculation:**
   - System sums up `expected_group_size` from all pre-registered organizations that haven't registered yet
   - Family/Disability groups: `expected_group_size` → `familyDisabilityExpected`
   - Other groups: `expected_group_size` → `otherGroupsExpected`

**Example:**
```
Leicester Tigers Event (Future Event - No Registrations Yet)

Pre-registered Organizations:
- Cambridge Uni Boat Club (Educational): expected_group_size = 20
- Smith Family (Family): expected_group_size = 5
- Manchester Rovers (Sporting): expected_group_size = 15

P2I Admin Dashboard Shows:
- Participants: 0 registered, (40 expected)
- Groups: 0 registered, (3 expected)

Breakdown:
- Family/Disability Expected: 5
- Other Groups Expected: 35 (20 + 15)
- Total Expected: 40
```

**Important Notes:**
- Once an organization completes registration, their actual `groupSize` is used instead of `expected_group_size`
- `expected_group_size` is only used for organizations that haven't registered yet
- This allows planning and capacity management before the event starts

---

## Group Counting Logic

### Expected Groups vs Registered Groups vs Walk-in Groups

The system tracks three types of group counts:

1. **Expected Groups (Total):**
   - All organizations with `airtable_record_id` for the event
   - Includes both registered and not-yet-registered organizations
   - Used for planning and capacity management

2. **Registered Groups:**
   - Organizations that have completed group registration (have a registration entry)
   - Shown in bold on dashboards

3. **Walk-in Groups:**
   - Organizations without `airtable_record_id` (created on-the-day)
   - Not counted in "expected" but counted in "registered" once they register
   - Shown in blue text on dashboards

**Dashboard Display:**
```
Groups Card:
5 (bold - registered groups)
(4 expected) (greyed out - pre-registered organizations)
+ 1 walk-in (blue - on-the-day signup)
```

---

## Version History

**Version 3.1 (2026-03-13):**
- Updated individual participant section — organisation is now required for Participant role
- Clarified that Participant dropdown excludes Disability/Family orgs (role-based filtering)

**Version 3.0 (2026-02-23):**
- Added `expected_group_size` field to organizations table
- Implemented expected participant counting for future events
- Added documentation for pre-registration and planning features
- Added group counting logic (expected vs registered vs walk-in)

**Version 2.0 (2026-02-20):**
- Clarified reporting distinction between Family/Disability and Other groups
- Documented that Other groups report actual registrations, not expected
- Fixed group leader participation counting logic

**Version 1.0 (2026-02-11):**
- Initial documentation of participant counting logic

