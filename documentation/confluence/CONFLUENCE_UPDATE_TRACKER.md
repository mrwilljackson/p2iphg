# Confluence Update Tracker

**Last Updated:** 2026-04-17
**Purpose:** Maps repo documentation to Confluence pages

---

## Confluence Space

**URL:** https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I/pages/71925764/Project+Overview

---

## Developers Section

Upload these files directly from `software/nextjs/documentation/` to the Confluence "Developers" section.

| Confluence Page | Source File | Last Updated |
|---|---|---|
| Architecture | `software/nextjs/documentation/ARCHITECTURE.md` | 2026-04-16 |
| Data Models | `software/nextjs/documentation/DATA_MODELS.md` | 2026-04-16 |
| Deployment Guide | `software/nextjs/documentation/DEPLOYMENT_GUIDE.md` | Unchanged |
| Requirements | `software/nextjs/documentation/REQUIREMENTS.md` | 2026-04-16 |
| Project Status | `software/nextjs/documentation/PROJECT_STATUS.md` | 2026-04-16 |
| TODO | `software/nextjs/documentation/TODO.md` | 2026-04-16 |
| Airtable Integration | `software/nextjs/documentation/AIRTABLE_INTEGRATION.md` | 2026-04-16 |

---

## Admin Users Section

Upload these files from `documentation/confluence/admin-users/` to the Confluence "Admin Users" section.

| Confluence Page | Source File | Last Updated |
|---|---|---|
| Project Overview | `documentation/confluence/admin-users/PROJECT_OVERVIEW.md` | 2026-04-16 |
| Event Setup Guide | `documentation/confluence/admin-users/EVENT_SETUP_GUIDE.md` | 2026-04-16 |
| Registration Flow | `documentation/confluence/admin-users/REGISTRATION_FLOW.md` | 2026-04-16 |
| Data Export | `documentation/confluence/admin-users/DATA_EXPORT.md` | 2026-04-16 |
| Rules of Use | `documentation/confluence/admin-users/RULES_OF_USE.md` | 2026-04-17 |

---

## Not on Confluence (developer-only reference)

These files in `software/nextjs/documentation/` are internal developer reference docs not uploaded to Confluence:

- `DUAL_ID_PATTERN.md`
- `FAMILY_GROUP_FEATURE.md`
- `PARTICIPANT_COUNTING_LOGIC.md`
- `ORGANISATION_TYPE_MAPPING.md`
- `REGISTRATION_FORM_LOGIC.md`
- `AIRTABLE_BASE_STRUCTURE.md`
- `AIRTABLE_IMPORT_SPECIFICATIONS.md`
- `AIRTABLE_SETUP_GUIDE.md`
- `AIRTABLE_FIELD_MAPPING.md`
- `POSTMAN_AIRTABLE_API_GUIDE.md`
- `EVENT_SETUP_GUIDE.md`
- `airtable-import/` (sample CSV data)

---

## Workflow

1. Update the source file in the repo
2. Commit and push
3. Update this tracker with the new date
4. Copy content to the corresponding Confluence page
5. Publish in Confluence

**Source of truth:** The repo. Confluence is updated from the repo, not the other way around.
