# Documentation Consolidation — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Scope:** Consolidate all project documentation into two locations with clear ownership

---

## Context

After the 2026-04-16 documentation update (audit + rewrite), documentation is accurate but spread across 5 locations:

1. `documentation/confluence_documentation/` — 15+ files mirroring Confluence space
2. `documentation/confluence_exports/` — 4 stakeholder-friendly docs
3. `documentation/` root — 2 files (REGISTRATION_FORM_LOGIC, rules of use)
4. `software/nextjs/documentation/` — 8 developer reference docs + sample data
5. Root level — `TODO.md`, `CLAUDE.md`
6. `docs/` — `next-steps.md` + `superpowers/` (historical, untouched)

This creates confusion about where to find and maintain docs. The goal is two clear locations with no duplication.

## Decision: Two Locations

### 1. `software/nextjs/documentation/` — Technical documentation

Single source of truth for ALL technical and developer documentation. Lives next to the code it describes. Also serves as the source for Confluence "Developers" section (uploaded directly).

### 2. `documentation/confluence/` — Confluence stakeholder documentation

Non-technical, operational docs for the Confluence "Admin Users" section. Plus a tracker mapping all files to Confluence pages.

### Untouched

- `docs/superpowers/` — historical design artefacts, left as-is
- `CLAUDE.md` — updated to reflect new paths only

## Confluence Space Structure

```
Power2Inspire Event CRM App/
├── Developers/
│   ├── Architecture          ← from software/nextjs/documentation/ARCHITECTURE.md
│   ├── Data Models           ← from software/nextjs/documentation/DATA_MODELS.md
│   ├── Deployment Guide      ← from software/nextjs/documentation/DEPLOYMENT_GUIDE.md
│   ├── Requirements          ← from software/nextjs/documentation/REQUIREMENTS.md
│   ├── Project Status        ← from software/nextjs/documentation/PROJECT_STATUS.md
│   ├── TODO                  ← from software/nextjs/documentation/TODO.md
│   └── Airtable Integration  ← from software/nextjs/documentation/AIRTABLE_INTEGRATION.md
└── Admin Users/
    ├── Project Overview      ← from documentation/confluence/admin-users/PROJECT_OVERVIEW.md
    ├── Event Setup Guide     ← from documentation/confluence/admin-users/EVENT_SETUP_GUIDE.md
    ├── Registration Flow     ← from documentation/confluence/admin-users/REGISTRATION_FLOW.md
    ├── Data Export           ← from documentation/confluence/admin-users/DATA_EXPORT.md
    └── Rules of Use          ← from documentation/confluence/admin-users/RULES_OF_USE.md
```

## File Moves

### Into `software/nextjs/documentation/`

| Source | Destination | Notes |
|---|---|---|
| `documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | `ARCHITECTURE.md` | Already exists from yesterday |
| `documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | `DATA_MODELS.md` | Move |
| `documentation/confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md` | `DEPLOYMENT_GUIDE.md` | Move |
| `documentation/confluence_documentation/02_TECHNICAL/DUAL_ID_PATTERN.md` | `DUAL_ID_PATTERN.md` | Move |
| `documentation/confluence_documentation/02_TECHNICAL/FAMILY_GROUP_FEATURE.md` | `FAMILY_GROUP_FEATURE.md` | Move |
| `documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md` | `REQUIREMENTS.md` | Move |
| `documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md` | `PROJECT_STATUS.md` | Move |
| `documentation/confluence_documentation/01_PLANNING/TODO.md` | `TODO.md` | Move (replaces root TODO.md) |
| `documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` | `AIRTABLE_INTEGRATION.md` | Move |
| `documentation/REGISTRATION_FORM_LOGIC.md` | `REGISTRATION_FORM_LOGIC.md` | Move |
| `REGISTRATION_SYNC_FIELD_MAPPING.txt` | `AIRTABLE_FIELD_MAPPING.md` | Rename + convert to markdown |

### Into `documentation/confluence/admin-users/`

| Source | Destination |
|---|---|
| `documentation/confluence_exports/PROJECT_OVERVIEW.md` | `PROJECT_OVERVIEW.md` |
| `documentation/confluence_exports/EVENT_SETUP_GUIDE.md` | `EVENT_SETUP_GUIDE.md` |
| `documentation/confluence_exports/REGISTRATION_FLOW.md` | `REGISTRATION_FLOW.md` |
| `documentation/confluence_exports/DATA_EXPORT.md` | `DATA_EXPORT.md` |
| `documentation/rules of use.md` | `RULES_OF_USE.md` |

### Into `documentation/confluence/`

| Source | Destination | Notes |
|---|---|---|
| `documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md` | `CONFLUENCE_UPDATE_TRACKER.md` | Rewrite with new mappings |

## Files Deleted

| File | Reason |
|---|---|
| `documentation/confluence_documentation/00_PROJECT_OVERVIEW.md` | Developer version; stakeholder version exists |
| `documentation/confluence_documentation/SIMPLE_IMPORT_GUIDE.md` | Superseded by tracker |
| `documentation/confluence_documentation/CLIENT_QUESTIONS.md` | All questions resolved |
| `documentation/confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md` | Pre-build Flutter discussion |
| `documentation/confluence_documentation/04_DEVELOPMENT/data_requirements.md` | Superseded by DATA_MODELS |
| `documentation/confluence_documentation/05_DESIGN/AIRTABLE_FORM_ANALYSIS.md` | Pre-build analysis |
| `documentation/confluence_documentation/05_DESIGN/V2_CHANGES_SUMMARY.md` | Flutter→Next.js migration notes |
| `documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md` | Historical, UI diverged |
| `documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` | Merged into REGISTRATION_FORM_LOGIC |
| `TODO.md` (root) | Stale Feb 2026 copy |
| `docs/next-steps.md` | Items done or captured elsewhere |

## Directories Removed

After all moves, these directories will be empty and removed:
- `documentation/confluence_documentation/` (entire tree)
- `documentation/confluence_exports/`

## CLAUDE.md Update

Update documentation path references to point to `software/nextjs/documentation/` and `documentation/confluence/`.

## Execution

- One branch for all changes
- Commits grouped logically (moves, deletes, tracker rewrite, CLAUDE.md update)
- No content changes to docs — structure only (except tracker rewrite and AIRTABLE_FIELD_MAPPING format conversion)
