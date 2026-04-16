# Confluence Update Tracker

**Last Updated:** 2026-04-16
**Purpose:** Maps repo documentation to Confluence pages and tracks upload status

---

## Confluence Space

**URL:** https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I/pages/71925764/Project+Overview

**Space Structure:**

```
Power2Inspire Event CRM App/
├── Project Overview
├── 01_PLANNING/
│   ├── Project Status
│   ├── Requirements
│   └── TODO
├── 02_TECHNICAL/
│   ├── Architecture
│   ├── Data Models
│   └── Deployment Guide
├── 03_INTEGRATION/
│   ├── Airtable Integration
│   └── Integration Discussion
├── 05_DESIGN/
│   ├── Registration Form Fields
│   └── UI Wireframes (historical)
├── Event Setup Guide (NEW)
├── Registration Flow (NEW)
└── Data Export (NEW)
```

---

## Page Mapping

For pages with a **stakeholder version**, upload the `confluence_exports/` version to Confluence (written in non-technical, operational language). For pages without a stakeholder version, upload the developer version directly.

| Confluence Page | Repo Source (Developer) | Repo Source (Stakeholder) | Last Updated | Status |
|---|---|---|---|---|
| Project Overview | `confluence_documentation/00_PROJECT_OVERVIEW.md` | `confluence_exports/PROJECT_OVERVIEW.md` | 2026-04-16 | Ready for upload |
| Planning > Project Status | `confluence_documentation/01_PLANNING/PROJECT_STATUS.md` | — | 2026-04-16 | Ready for upload |
| Planning > Requirements | `confluence_documentation/01_PLANNING/REQUIREMENTS.md` | — | 2026-04-16 | Ready for upload |
| Planning > TODO | `confluence_documentation/01_PLANNING/TODO.md` | — | 2026-04-16 | Ready for upload |
| Technical > Architecture | `confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | — | 2026-04-16 | Ready for upload |
| Technical > Data Models | `confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | — | 2026-04-16 | Ready for upload |
| Technical > Deployment Guide | `confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md` | — | Unchanged | Current |
| Integration > Airtable Integration | `confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` | — | 2026-04-16 | Ready for upload |
| Integration > Integration Discussion | `confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md` | — | Unchanged | Review needed |
| Design > Registration Form Fields | `confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` | — | 2026-04-16 | Ready for upload |
| Design > UI Wireframes | `confluence_documentation/05_DESIGN/UI_WIREFRAMES.md` | — | Unchanged | Historical |
| Client Questions | `confluence_documentation/CLIENT_QUESTIONS.md` | — | 2026-04-16 | Ready for upload |
| **NEW:** Event Setup Guide | `software/nextjs/documentation/EVENT_SETUP_GUIDE.md` | `confluence_exports/EVENT_SETUP_GUIDE.md` | 2026-04-16 | New page — create in Confluence |
| **NEW:** Registration Flow | — | `confluence_exports/REGISTRATION_FLOW.md` | 2026-04-16 | New page — create in Confluence |
| **NEW:** Data Export | — | `confluence_exports/DATA_EXPORT.md` | 2026-04-16 | New page — create in Confluence |

---

## Upload Instructions

1. Log into Confluence
2. Navigate to the **Power2Inspire Event CRM App** space
3. For each page marked **"Ready for upload"**:
   - If a stakeholder version exists (see table above), copy content from the `confluence_exports/` file
   - Otherwise, copy content from the developer version
   - Paste and format in Confluence
   - Add the update date (2026-04-16)
   - Publish
4. For pages marked **"New page"**:
   - Create a new page in the appropriate location in the Confluence tree
   - Copy content from the stakeholder version
   - Publish

---

## Workflow Going Forward

1. All documentation changes happen in the **repo first**
2. Developer docs are updated in their canonical locations
3. If the page has a non-technical audience, update or create a stakeholder version in `documentation/confluence_exports/`
4. Update this tracker with the new date and status
5. Upload the changed pages to Confluence

**Source of truth:** The repo. Confluence is updated from the repo, not the other way around.

---

## Files Removed in This Update

The following files were deleted as part of the 2026-04-16 documentation update:

- `REORGANIZATION_SUMMARY.md` — historical, no longer needed
- `DOCUMENTATION_WORKFLOW.md` — superseded by this tracker
- `docs/registration-form-element-map.md` — content merged into `documentation/REGISTRATION_FORM_LOGIC.md`
