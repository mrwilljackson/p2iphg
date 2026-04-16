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
| — | Individual | Individual |

**Individual** is a system marker for participants without group affiliation. It is excluded from participant counting. The Individual org always appears last in the Participant dropdown.

## Organisation Filtering — `openGroup` is the Source of Truth

**Critical rule:** `openGroup` is the single source of truth for group behaviour. The `groupType` field is an administrative label for reporting only — it must **NEVER** be used for filtering, selection, or conditional logic within this application.

The `openGroup` boolean on `organisation_contacts` controls which organisations are available to each role:

- **`openGroup === true` (or `null`)**: Open group — Participants register individually; Group leader sets expected count
- **`openGroup === false`**: Closed group — Group leader registers on behalf of all members; no individual participant registrations

This filtering is implemented in `lib/helpers.ts`:
- `organizationsToOptions()` — filters for Participant and Group roles
- `groupOrgsToSections()` — organises Group leader dropdown

| Role | Filter Rule | Organisations Shown | Notes |
|---|---|---|---|
| **Participant** | Only `openGroup !== false` | Open-group organisations only; "Individual" org always last | Individual org is a system marker for participants without group affiliation |
| **Group** | Only `openGroup === false` | Closed-group organisations only | Only Disability and Family types are typically closed groups |
| **Volunteer** | — | Organisation field is hidden | No org selector |

- When the user switches role, the selected organisation is **cleared** automatically (the filtered lists don't overlap).
- The "Individual" option (value `INDIVIDUAL_PLACEHOLDER`) is a virtual option only shown for the Participant role; it marks participants with no group affiliation and is excluded from participant counting.
- Organisation selection is **required** for Participant and Group roles (enforced via Zod `superRefine`).

See `documentation/REGISTRATION_FORM_LOGIC.md` § 5.1 for the full behavioural reference.

## Counting Behaviour

Counting logic depends on `openGroup` status, not `groupType` (see `lib/participant-counting.ts`):

- **Closed groups** (`openGroup === false`): Counted at group level from `groupSize` (+ leader if participating). Individual registrations do not occur.
- **Open groups** (`openGroup !== false`): Group leaders provide an expected count, but individual participants must also register separately. Actual count = number of Participant registrations (not `groupSize`).

## Field Name Reference

| System | Field / Column | Notes |
|---|---|---|
| Airtable (Organisations table) | `Type` | Free text / single-select with 18 values |
| Neon (organisations table) | `group_type` | Text column, normalised to 7 categories |
| Drizzle schema | `groupType` | camelCase JS property → maps to `group_type` |
| TypeScript | `GroupType` | Union type in `lib/types.ts` |

