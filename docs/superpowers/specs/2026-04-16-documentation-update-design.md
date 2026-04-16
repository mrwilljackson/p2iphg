# Documentation Update — Design Spec

**Date:** 2026-04-16
**Status:** Approved
**Scope:** Full audit, rewrite, consolidation, and Confluence sync of all project documentation

---

## Context

Project documentation was last updated on 2026-02-13. Since then, ~100 commits have landed covering:

- Event summary generation and archival workflow
- Individual participant registration (with `Individual` org type)
- P2I admin navigation overhaul (shared `P2iAdminNav`, manage-events as landing page)
- HelpTip component system
- Auto-detect group leaders registering as Participants
- Group dropdown filtering (hide fully-registered orgs, hide registered volunteers)
- Closed-org scoping fixes (case-insensitive email, event-scoped queries)
- Participant counting refactors
- CSV export replacing live Airtable sync

Documentation across 4 locations is now materially stale, incomplete, and partially redundant.

## Key Decision: Airtable Integration Scope

- **Airtable import** (Airtable -> Neon) still exists and is documented
- **Live sync to Airtable** (`syncRegistrationsToAirtable()`) is dead/deprecated — no longer part of the active system
- **CSV export** is the only way data leaves the system for manual Airtable import
- All references to live Airtable sync must be corrected across every doc

## Source of Truth

- **Repo is the single source of truth** for all documentation
- **Confluence is updated from the repo**, not the other way around
- Developer docs live in their canonical repo locations
- Stakeholder-friendly versions live in `documentation/confluence_exports/` and are manually uploaded to Confluence

## Confluence Audience

Confluence serves non-technical stakeholders (wider Power2Inspire team) and external clients. Stakeholder versions use operational/accessible language, not developer jargon.

Confluence space: https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I/pages/71925764/Project+Overview

---

## Audit Scope

### In Scope

| Location | Files | Purpose |
|---|---|---|
| `documentation/confluence_documentation/` | 13 files | Maps 1:1 to Confluence pages |
| `software/nextjs/documentation/` | 8 files | Developer reference (Airtable, setup, field mapping) |
| `documentation/` root | 2 files | Registration logic, rules of use |
| `docs/` root | 2 files | Next steps, form element map |

### Out of Scope

- `CLAUDE.md` — maintained separately
- `docs/superpowers/specs/` — point-in-time design artefacts, not living docs
- `docs/superpowers/plans/` — point-in-time implementation plans
- `docs/superpowers/completed/` — feature change summaries

### Audit Categories

Each document section is categorised as:

| Category | Action |
|---|---|
| **Stale** | Content contradicts current code. Rewrite affected sections. |
| **Incomplete** | Feature exists but isn't documented. Add missing content. |
| **Redundant** | Same topic in multiple places. Consolidate to one canonical home. |
| **Stakeholder-facing** | Needs a non-technical version in `confluence_exports/`. |
| **Accurate** | Still correct. No action. |

---

## Consolidation Plan

| Topic | Current locations | Canonical home | Others |
|---|---|---|---|
| Airtable import setup | `software/nextjs/documentation/AIRTABLE_*` (4 files), `confluence_documentation/03_INTEGRATION/` | `software/nextjs/documentation/` | Confluence version in `confluence_exports/`; integration folder simplified |
| Data models / schema | `confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | `confluence_documentation/02_TECHNICAL/DATA_MODELS.md` | CLAUDE.md keeps lightweight summary |
| Registration form logic | `documentation/REGISTRATION_FORM_LOGIC.md`, `docs/registration-form-element-map.md`, `confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md` | `documentation/REGISTRATION_FORM_LOGIC.md` (merge element map in) | `REGISTRATION_FORM_FIELDS.md` updated to match; element map file removed |
| Architecture | `confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | `confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` | CLAUDE.md keeps summary |
| Participant counting | `software/nextjs/documentation/PARTICIPANT_COUNTING_LOGIC.md` | `software/nextjs/documentation/PARTICIPANT_COUNTING_LOGIC.md` | CLAUDE.md keeps summary |

---

## Per-Document Changes

### HIGH PRIORITY — Confluence-mapped, known drift

**`00_PROJECT_OVERVIEW.md`**
- Update completed features list (event summary, individual participant, HelpTip, P2I admin nav, auto-detect group leaders)
- Correct data flow — CSV export, not Airtable sync
- Update current project phase/status

**`02_TECHNICAL/ARCHITECTURE.md`**
- New components: `P2iAdminNav`, `HelpTip`, event summary modal
- New routes/flows: manage-events as P2I login landing
- Remove Airtable sync references, add CSV export flow
- `Individual` org type as system concept

**`02_TECHNICAL/DATA_MODELS.md`**
- `GroupType` union includes `Individual`
- Schema changes from last 2 months
- `openGroup` boolean as filtering source of truth (not `groupType`)

**`01_PLANNING/PROJECT_STATUS.md`**
- Bulk update — features moved from planned to completed

**`01_PLANNING/TODO.md`**
- Reconcile against completed work

**`01_PLANNING/REQUIREMENTS.md`**
- Mark implemented requirements

**`03_INTEGRATION/AIRTABLE_INTEGRATION.md`**
- Remove sync-to-Airtable section
- Replace with CSV export description
- Verify import field mappings

### MEDIUM PRIORITY — Developer reference

**`software/nextjs/documentation/PARTICIPANT_COUNTING_LOGIC.md`**
- Verify against current `lib/participant-counting.ts`
- Individual org exclusion from counts

**`software/nextjs/documentation/ORGANISATION_TYPE_MAPPING.md`**
- `Individual` type added
- `openGroup` as filtering truth

**`software/nextjs/documentation/EVENT_SETUP_GUIDE.md`**
- P2I admin flow changes (login -> manage-events, new nav, new buttons)

**`documentation/REGISTRATION_FORM_LOGIC.md`**
- Auto-detect group leaders as Participants
- Closed-org scoping fix
- Hide fully-registered orgs from Group dropdown
- Hide already-registered volunteers

### LOW PRIORITY — Historical/design

**`05_DESIGN/UI_WIREFRAMES.md`** — Mark as historical
**`05_DESIGN/REGISTRATION_FORM_FIELDS.md`** — Merge with/point to `REGISTRATION_FORM_LOGIC.md`
**`CLIENT_QUESTIONS.md`** — Review for outdated answers
**`CONFLUENCE_UPDATE_TRACKER.md`** — Rewritten as final step

### Stakeholder Versions (`documentation/confluence_exports/`)

New non-technical versions for Confluence upload:
- **Project Overview** — executive summary
- **Event Setup Guide** — operational step-by-step for event organisers
- **Registration Flow** — attendee/admin perspective
- **Data Export** — how to get data out (CSV) for Airtable import

---

## Execution Phases

### Phase 1: Audit & Flag
- Read each doc alongside current codebase
- Produce concrete diff list per document
- This becomes the implementation task list

### Phase 2: Fix Developer Docs
- Work through docs in priority order (high -> medium -> low)
- Correct stale sections against current code
- Remove dead content (Airtable sync references)
- Add content for undocumented features
- Commit per doc or per logical group

### Phase 3: Consolidate
- Merge `docs/registration-form-element-map.md` into `REGISTRATION_FORM_LOGIC.md`
- Simplify `03_INTEGRATION/` for import-only + CSV export
- Remove or redirect redundant files

### Phase 4: Create Stakeholder Versions
- Write `documentation/confluence_exports/` versions
- Non-technical tone, operational focus ("how to use" not "how it works")

### Phase 5: Update Tracker & Handoff
- Rewrite `CONFLUENCE_UPDATE_TRACKER.md` with new state of every page
- Map each `confluence_exports/` file to its Confluence page
- Clear instructions for manual Confluence upload

### Delivery
- One branch for all doc work
- Commits grouped logically
- No code changes — docs only
