# Organisation Type Mapping

## Overview

Airtable uses a granular `Type` field on the **Organisations** table with 18 possible values. For dashboard reporting and participant counting, these are consolidated into **7 categories** stored in the Neon `group_type` column.

The mapping is implemented in `app/actions/airtable-import.ts` via the `normalizeGroupType()` function.

## Mapping Table

| Airtable `Type` | Neon `group_type` | Dashboard Category |
|---|---|---|
| Family | Family | Family |
| Disability | Disability | Disability |
| Business | Corporate | Corporate |
| Corporate Partner | Corporate | Corporate |
| Sports Body | Sporting | Sporting |
| Sports Club | Sporting | Sporting |
| Competitor | Sporting | Sporting |
| Community Group | Community | Community |
| Social Groups and Events | Community | Community |
| Education Body | Educational | Educational |
| Charity | Other | Other |
| Estate Agents | Other | Other |
| Funder | Other | Other |
| Government | Other | Other |
| Health | Other | Other |
| HR | Other | Other |
| Media and News | Other | Other |
| Supplier | Other | Other |

## Registration Form — Role-Based Filtering

The `groupType` value also controls **which organisations appear in the registration form dropdown**, depending on the user's selected role. This filtering is implemented in `lib/helpers.ts` → `organizationsToOptions()`.

| Role | Filter Rule | Organisations Shown |
|---|---|---|
| **Participant** | Exclude `Disability` and `Family` | Corporate, Sporting, Community, Educational, Other + virtual "Family Group" placeholder |
| **Group** | Include **only** `Disability` and `Family` | Disability and Family organisations only |
| **Volunteer** | Organisation field is hidden | — |

- When the user switches role, the selected organisation is **cleared** automatically (the filtered lists don't overlap).
- The "Family Group" placeholder (value `FAMILY_GROUP_PLACEHOLDER`) is a virtual option only shown for the Participant role; it triggers on-the-day family group creation.
- Organisation selection is **required** for both Participant and Group roles (enforced via Zod `superRefine`).

See `documentation/REGISTRATION_FORM_LOGIC.md` § 5.1 for the full behavioural reference.

## Counting Behaviour

The 7 dashboard categories have different counting logic (see `lib/participant-counting.ts`):

- **Family & Disability**: "Expected-only" groups — participants are counted at group level from `expectedGroupSize`. Individual registrations are not tracked.
- **All other types** (Corporate, Sporting, Community, Educational, Other): Group leaders provide an expected count, but individual participants must also register separately. Both expected and registered counts are tracked.

## Field Name Reference

| System | Field / Column | Notes |
|---|---|---|
| Airtable (Organisations table) | `Type` | Free text / single-select with 18 values |
| Neon (organisations table) | `group_type` | Text column, normalised to 7 categories |
| Drizzle schema | `groupType` | camelCase JS property → maps to `group_type` |
| TypeScript | `GroupType` | Union type in `lib/types.ts` |

