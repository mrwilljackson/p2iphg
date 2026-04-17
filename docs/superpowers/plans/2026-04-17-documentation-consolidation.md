# Documentation Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all project documentation from 5 scattered locations into 2: `software/nextjs/documentation/` (technical) and `documentation/confluence/` (stakeholder).

**Architecture:** Pure file moves and deletes. No content changes except: converting REGISTRATION_SYNC_FIELD_MAPPING.txt to markdown, rewriting the Confluence tracker, and updating CLAUDE.md paths.

**Tech Stack:** Git, markdown.

**Spec:** `docs/superpowers/specs/2026-04-17-documentation-consolidation-design.md`

---

## Reference: Current State

```
Root:
  CLAUDE.md
  TODO.md                                          → DELETE (stale)

docs/:
  next-steps.md                                    → DELETE (stale)
  superpowers/                                     → UNTOUCHED

documentation/:
  REGISTRATION_FORM_LOGIC.md                       → MOVE to software/nextjs/documentation/
  rules of use.md                                  → MOVE to documentation/confluence/admin-users/RULES_OF_USE.md
  confluence_exports/PROJECT_OVERVIEW.md            → MOVE to documentation/confluence/admin-users/
  confluence_exports/EVENT_SETUP_GUIDE.md           → MOVE to documentation/confluence/admin-users/
  confluence_exports/REGISTRATION_FLOW.md           → MOVE to documentation/confluence/admin-users/
  confluence_exports/DATA_EXPORT.md                 → MOVE to documentation/confluence/admin-users/
  confluence_documentation/00_PROJECT_OVERVIEW.md   → DELETE (stakeholder version exists)
  confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md → MOVE to documentation/confluence/ (rewrite)
  confluence_documentation/SIMPLE_IMPORT_GUIDE.md   → DELETE
  confluence_documentation/CLIENT_QUESTIONS.md      → DELETE
  confluence_documentation/01_PLANNING/PROJECT_STATUS.md  → MOVE to software/nextjs/documentation/
  confluence_documentation/01_PLANNING/REQUIREMENTS.md    → MOVE to software/nextjs/documentation/
  confluence_documentation/01_PLANNING/TODO.md            → MOVE to software/nextjs/documentation/
  confluence_documentation/02_TECHNICAL/ARCHITECTURE.md   → MOVE to software/nextjs/documentation/
  confluence_documentation/02_TECHNICAL/DATA_MODELS.md    → MOVE to software/nextjs/documentation/
  confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md → MOVE to software/nextjs/documentation/
  confluence_documentation/02_TECHNICAL/DUAL_ID_PATTERN.md  → MOVE to software/nextjs/documentation/
  confluence_documentation/02_TECHNICAL/FAMILY_GROUP_FEATURE.md → MOVE to software/nextjs/documentation/
  confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md → MOVE to software/nextjs/documentation/
  confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md → DELETE
  confluence_documentation/04_DEVELOPMENT/data_requirements.md → DELETE
  confluence_documentation/05_DESIGN/AIRTABLE_FORM_ANALYSIS.md → DELETE
  confluence_documentation/05_DESIGN/V2_CHANGES_SUMMARY.md     → DELETE
  confluence_documentation/05_DESIGN/UI_WIREFRAMES.md          → DELETE
  confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md → DELETE

software/nextjs/documentation/:
  (existing files stay)
  REGISTRATION_SYNC_FIELD_MAPPING.txt              → RENAME to AIRTABLE_FIELD_MAPPING.md
```

---

## Tasks

### Task 1: Create branch and target directories

- [ ] **Step 1: Create feature branch**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git checkout -b docs/consolidate-documentation
```

- [ ] **Step 2: Create target directories**

```bash
mkdir -p documentation/confluence/admin-users
```

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence/admin-users
git commit --allow-empty -m "chore: create documentation/confluence/admin-users directory"
```

---

### Task 2: Move technical docs from confluence_documentation to software/nextjs/documentation

**Files:**
- Move: `documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md` → `software/nextjs/documentation/ARCHITECTURE.md`
- Move: `documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md` → `software/nextjs/documentation/DATA_MODELS.md`
- Move: `documentation/confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md` → `software/nextjs/documentation/DEPLOYMENT_GUIDE.md`
- Move: `documentation/confluence_documentation/02_TECHNICAL/DUAL_ID_PATTERN.md` → `software/nextjs/documentation/DUAL_ID_PATTERN.md`
- Move: `documentation/confluence_documentation/02_TECHNICAL/FAMILY_GROUP_FEATURE.md` → `software/nextjs/documentation/FAMILY_GROUP_FEATURE.md`

- [ ] **Step 1: Move the 5 technical docs**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv documentation/confluence_documentation/02_TECHNICAL/ARCHITECTURE.md software/nextjs/documentation/ARCHITECTURE.md
git mv documentation/confluence_documentation/02_TECHNICAL/DATA_MODELS.md software/nextjs/documentation/DATA_MODELS.md
git mv documentation/confluence_documentation/02_TECHNICAL/DEPLOYMENT_GUIDE.md software/nextjs/documentation/DEPLOYMENT_GUIDE.md
git mv documentation/confluence_documentation/02_TECHNICAL/DUAL_ID_PATTERN.md software/nextjs/documentation/DUAL_ID_PATTERN.md
git mv documentation/confluence_documentation/02_TECHNICAL/FAMILY_GROUP_FEATURE.md software/nextjs/documentation/FAMILY_GROUP_FEATURE.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: move technical docs to software/nextjs/documentation/"
```

---

### Task 3: Move planning and integration docs to software/nextjs/documentation

**Files:**
- Move: `documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md` → `software/nextjs/documentation/REQUIREMENTS.md`
- Move: `documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md` → `software/nextjs/documentation/PROJECT_STATUS.md`
- Move: `documentation/confluence_documentation/01_PLANNING/TODO.md` → `software/nextjs/documentation/TODO.md`
- Move: `documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md` → `software/nextjs/documentation/AIRTABLE_INTEGRATION.md`

- [ ] **Step 1: Move the 4 docs**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv documentation/confluence_documentation/01_PLANNING/REQUIREMENTS.md software/nextjs/documentation/REQUIREMENTS.md
git mv documentation/confluence_documentation/01_PLANNING/PROJECT_STATUS.md software/nextjs/documentation/PROJECT_STATUS.md
git mv documentation/confluence_documentation/01_PLANNING/TODO.md software/nextjs/documentation/TODO.md
git mv documentation/confluence_documentation/03_INTEGRATION/AIRTABLE_INTEGRATION.md software/nextjs/documentation/AIRTABLE_INTEGRATION.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: move planning and integration docs to software/nextjs/documentation/"
```

---

### Task 4: Move REGISTRATION_FORM_LOGIC.md to software/nextjs/documentation

**Files:**
- Move: `documentation/REGISTRATION_FORM_LOGIC.md` → `software/nextjs/documentation/REGISTRATION_FORM_LOGIC.md`

- [ ] **Step 1: Move**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv documentation/REGISTRATION_FORM_LOGIC.md software/nextjs/documentation/REGISTRATION_FORM_LOGIC.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: move REGISTRATION_FORM_LOGIC to software/nextjs/documentation/"
```

---

### Task 5: Convert REGISTRATION_SYNC_FIELD_MAPPING.txt to markdown

**Files:**
- Rename: `software/nextjs/documentation/REGISTRATION_SYNC_FIELD_MAPPING.txt` → `software/nextjs/documentation/AIRTABLE_FIELD_MAPPING.md`

- [ ] **Step 1: Rename and convert format**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv software/nextjs/documentation/REGISTRATION_SYNC_FIELD_MAPPING.txt software/nextjs/documentation/AIRTABLE_FIELD_MAPPING.md
```

- [ ] **Step 2: Convert content to markdown**

Read the file and convert the plain-text table format to a proper markdown table. Keep all content — just change the formatting from ASCII art to markdown tables. Add a `# Airtable Field Mapping` heading and update the metadata at the top to use markdown formatting.

- [ ] **Step 3: Commit**

```bash
git add software/nextjs/documentation/AIRTABLE_FIELD_MAPPING.md
git commit -m "docs: rename and convert field mapping to markdown format"
```

---

### Task 6: Move stakeholder docs to documentation/confluence/admin-users

**Files:**
- Move: `documentation/confluence_exports/PROJECT_OVERVIEW.md` → `documentation/confluence/admin-users/PROJECT_OVERVIEW.md`
- Move: `documentation/confluence_exports/EVENT_SETUP_GUIDE.md` → `documentation/confluence/admin-users/EVENT_SETUP_GUIDE.md`
- Move: `documentation/confluence_exports/REGISTRATION_FLOW.md` → `documentation/confluence/admin-users/REGISTRATION_FLOW.md`
- Move: `documentation/confluence_exports/DATA_EXPORT.md` → `documentation/confluence/admin-users/DATA_EXPORT.md`
- Move: `documentation/rules of use.md` → `documentation/confluence/admin-users/RULES_OF_USE.md`

- [ ] **Step 1: Move the 5 docs**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv documentation/confluence_exports/PROJECT_OVERVIEW.md documentation/confluence/admin-users/PROJECT_OVERVIEW.md
git mv documentation/confluence_exports/EVENT_SETUP_GUIDE.md documentation/confluence/admin-users/EVENT_SETUP_GUIDE.md
git mv documentation/confluence_exports/REGISTRATION_FLOW.md documentation/confluence/admin-users/REGISTRATION_FLOW.md
git mv documentation/confluence_exports/DATA_EXPORT.md documentation/confluence/admin-users/DATA_EXPORT.md
git mv "documentation/rules of use.md" documentation/confluence/admin-users/RULES_OF_USE.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: move stakeholder docs to documentation/confluence/admin-users/"
```

---

### Task 7: Delete stale and obsolete files

**Files to delete:**
- `documentation/confluence_documentation/00_PROJECT_OVERVIEW.md`
- `documentation/confluence_documentation/SIMPLE_IMPORT_GUIDE.md`
- `documentation/confluence_documentation/CLIENT_QUESTIONS.md`
- `documentation/confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md`
- `documentation/confluence_documentation/04_DEVELOPMENT/data_requirements.md`
- `documentation/confluence_documentation/05_DESIGN/AIRTABLE_FORM_ANALYSIS.md`
- `documentation/confluence_documentation/05_DESIGN/V2_CHANGES_SUMMARY.md`
- `documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md`
- `documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md`
- `TODO.md` (root)
- `docs/next-steps.md`

- [ ] **Step 1: Delete all stale files**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git rm documentation/confluence_documentation/00_PROJECT_OVERVIEW.md
git rm documentation/confluence_documentation/SIMPLE_IMPORT_GUIDE.md
git rm documentation/confluence_documentation/CLIENT_QUESTIONS.md
git rm documentation/confluence_documentation/03_INTEGRATION/INTEGRATION_DISCUSSION.md
git rm documentation/confluence_documentation/04_DEVELOPMENT/data_requirements.md
git rm documentation/confluence_documentation/05_DESIGN/AIRTABLE_FORM_ANALYSIS.md
git rm documentation/confluence_documentation/05_DESIGN/V2_CHANGES_SUMMARY.md
git rm documentation/confluence_documentation/05_DESIGN/UI_WIREFRAMES.md
git rm documentation/confluence_documentation/05_DESIGN/REGISTRATION_FORM_FIELDS.md
git rm TODO.md
git rm docs/next-steps.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: delete stale and obsolete documentation files"
```

---

### Task 8: Move and rewrite Confluence tracker

**Files:**
- Move: `documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md` → `documentation/confluence/CONFLUENCE_UPDATE_TRACKER.md`

- [ ] **Step 1: Move the file**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
git mv documentation/confluence_documentation/CONFLUENCE_UPDATE_TRACKER.md documentation/confluence/CONFLUENCE_UPDATE_TRACKER.md
```

- [ ] **Step 2: Rewrite the tracker**

Replace the entire content with:

```markdown
# Confluence Update Tracker

**Last Updated:** 2026-04-17
**Purpose:** Maps repo documentation to Confluence pages

---

## Confluence Space

**URL:** https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I/pages/71925764/Project+Overview

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

## Admin Users Section

Upload these files from `documentation/confluence/admin-users/` to the Confluence "Admin Users" section.

| Confluence Page | Source File | Last Updated |
|---|---|---|
| Project Overview | `documentation/confluence/admin-users/PROJECT_OVERVIEW.md` | 2026-04-16 |
| Event Setup Guide | `documentation/confluence/admin-users/EVENT_SETUP_GUIDE.md` | 2026-04-16 |
| Registration Flow | `documentation/confluence/admin-users/REGISTRATION_FLOW.md` | 2026-04-16 |
| Data Export | `documentation/confluence/admin-users/DATA_EXPORT.md` | 2026-04-16 |
| Rules of Use | `documentation/confluence/admin-users/RULES_OF_USE.md` | 2026-04-17 |

## Not on Confluence (developer-only reference)

These files in `software/nextjs/documentation/` are internal developer docs not uploaded to Confluence:

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

## Workflow

1. Update the source file in the repo
2. Commit and push
3. Update this tracker with the new date
4. Copy content to the corresponding Confluence page
5. Publish in Confluence

**Source of truth:** The repo. Confluence is updated from the repo, not the other way around.
```

- [ ] **Step 3: Commit**

```bash
git add documentation/confluence/CONFLUENCE_UPDATE_TRACKER.md
git commit -m "docs: move and rewrite Confluence tracker with new file mapping"
```

---

### Task 9: Remove empty directories from confluence_documentation

After all moves and deletes, the `documentation/confluence_documentation/` tree should be empty. Git doesn't track empty directories, but verify and clean up.

- [ ] **Step 1: Verify the directory is empty and remove any remnants**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
find documentation/confluence_documentation -type f 2>/dev/null
find documentation/confluence_exports -type f 2>/dev/null
```

Both commands should return no results. If any files remain, they were missed — investigate and move or delete them.

- [ ] **Step 2: Remove empty directories from disk**

```bash
rm -rf documentation/confluence_documentation
rm -rf documentation/confluence_exports
```

- [ ] **Step 3: Verify clean state**

```bash
git status
```

Should show clean working tree (empty dirs don't show in git).

---

### Task 10: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Read CLAUDE.md**

Read the file to find all documentation path references.

- [ ] **Step 2: Update documentation references**

Find and update these references:
- Any reference to `documentation/confluence_documentation/` paths → `software/nextjs/documentation/` or `documentation/confluence/admin-users/`
- Any reference to `documentation/REGISTRATION_FORM_LOGIC.md` → `software/nextjs/documentation/REGISTRATION_FORM_LOGIC.md`
- The "Architecture Overview" section references like "lib/db/schema.ts" are fine (they're relative to the working directory `software/nextjs/`)

Specifically, if CLAUDE.md references docs by full path from repo root, update those paths. If it only references files by their location within `software/nextjs/`, those are likely fine.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md documentation paths for new structure"
```

---

### Task 11: Final verification

- [ ] **Step 1: Verify target structure**

```bash
cd /Users/willjackson/Documents/Work/power2inspire/event-crm-app
echo "=== software/nextjs/documentation/ ===" && ls software/nextjs/documentation/ && echo "" && echo "=== documentation/confluence/ ===" && find documentation/confluence -type f | sort && echo "" && echo "=== documentation/ root ===" && ls documentation/
```

Expected output should show:
- `software/nextjs/documentation/` with ~20 files
- `documentation/confluence/` with tracker + admin-users/ with 5 files
- `documentation/` root containing only `confluence/`

- [ ] **Step 2: Verify no stale references**

```bash
grep -r "confluence_documentation" software/nextjs/ CLAUDE.md documentation/ --include="*.md" 2>/dev/null
grep -r "confluence_exports" software/nextjs/ CLAUDE.md documentation/ --include="*.md" 2>/dev/null
```

Both should return no results (or only results inside `docs/superpowers/` which is historical).

- [ ] **Step 3: Check branch diff**

```bash
git log --oneline docs/consolidate-documentation ^master
git diff master --stat
```

Verify all moves and deletes are accounted for.

- [ ] **Step 4: Fix any issues found and commit**

```bash
git add -A
git commit -m "docs: fix any remaining references to old documentation paths"
```

Only commit if there are actual changes to make.
