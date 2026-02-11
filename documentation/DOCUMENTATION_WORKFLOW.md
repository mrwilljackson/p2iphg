# Documentation Workflow

**Purpose:** This document explains how to maintain documentation in both Git and Confluence.  
**Last Updated:** 2026-02-11

---

## 📁 Documentation Structure

### Primary Source (Git Repository)
```
documentation/
├── REQUIREMENTS.md              ← Edit these files
├── ARCHITECTURE.md              ← Primary source of truth
├── DATA_MODELS.md               ← Version controlled in git
├── AIRTABLE_INTEGRATION.md
├── INTEGRATION_DISCUSSION.md
├── TODO.md
├── PROJECT_STATUS.md
├── data_requirements.md
└── DOCUMENTATION_WORKFLOW.md    ← This file
```

### Confluence Staging Area
```
documentation/confluence_import/
├── 00_PROJECT_OVERVIEW.md       ← Generated/copied for Confluence
├── IMPORT_INSTRUCTIONS.md       ← Import guide
├── 01_PLANNING/                 ← Organized folders
├── 02_TECHNICAL/
├── 03_INTEGRATION/
└── 04_DEVELOPMENT/
```

---

## 🔄 Workflow: Making Documentation Changes

### Step 1: Edit Primary Source Files
**Always edit files in the root `documentation/` folder first.**

```bash
# Example: Update requirements
vim documentation/REQUIREMENTS.md

# Or use your preferred editor
code documentation/REQUIREMENTS.md
```

### Step 2: Commit Changes to Git
```bash
# Stage the changes
git add documentation/REQUIREMENTS.md

# Commit with descriptive message
git commit -m "Update requirements: Add new field for accessibility tracking"

# Push to remote (if applicable)
git push
```

### Step 3: Update Confluence Staging Area
**Only when you want to sync to Confluence:**

```bash
# Copy updated file to appropriate folder
cp documentation/REQUIREMENTS.md documentation/confluence_import/01_PLANNING/

# Commit the staging area update
git add documentation/confluence_import/
git commit -m "Update Confluence staging: Requirements changes"
```

### Step 4: Import to Confluence
1. Go to your P2I Confluence space
2. Navigate to the appropriate page (e.g., "Requirements" under "1. Project Planning")
3. Click **Edit**
4. Click **⋯** (more options) → **Import** → **Markdown**
5. Upload the updated file from `confluence_import/`
6. Review and **Publish**

---

## 📋 When to Update Confluence

**Update Confluence when:**
- ✅ Major design decisions are made
- ✅ Requirements change significantly
- ✅ Architecture is updated
- ✅ Integration approach changes
- ✅ Milestones are reached
- ✅ You want to share updates with stakeholders

**Don't need to update Confluence for:**
- ❌ Minor typo fixes
- ❌ Small wording changes
- ❌ Work-in-progress notes
- ❌ Daily TODO updates

---

## 🎯 Quick Reference Commands

### Update a Single Document
```bash
# 1. Edit the primary source
vim documentation/REQUIREMENTS.md

# 2. Commit to git
git add documentation/REQUIREMENTS.md
git commit -m "Update requirements"

# 3. Copy to Confluence staging (when ready)
cp documentation/REQUIREMENTS.md documentation/confluence_import/01_PLANNING/

# 4. Commit staging update
git add documentation/confluence_import/
git commit -m "Sync Confluence staging: Requirements"

# 5. Import to Confluence (manual step in browser)
```

### Update Multiple Documents
```bash
# 1. Edit multiple files
vim documentation/ARCHITECTURE.md
vim documentation/DATA_MODELS.md

# 2. Commit all changes
git add documentation/
git commit -m "Update architecture and data models"

# 3. Sync to Confluence staging
cp documentation/ARCHITECTURE.md documentation/confluence_import/02_TECHNICAL/
cp documentation/DATA_MODELS.md documentation/confluence_import/02_TECHNICAL/

# 4. Commit staging
git add documentation/confluence_import/
git commit -m "Sync Confluence staging: Architecture and data models"

# 5. Import to Confluence (manual step in browser)
```

### Regenerate Entire Confluence Import
```bash
# If you want to refresh everything:
rm -rf documentation/confluence_import/01_PLANNING/*
rm -rf documentation/confluence_import/02_TECHNICAL/*
rm -rf documentation/confluence_import/03_INTEGRATION/*
rm -rf documentation/confluence_import/04_DEVELOPMENT/*

# Copy all files
cp documentation/REQUIREMENTS.md documentation/confluence_import/01_PLANNING/
cp documentation/TODO.md documentation/confluence_import/01_PLANNING/
cp documentation/PROJECT_STATUS.md documentation/confluence_import/01_PLANNING/
cp documentation/ARCHITECTURE.md documentation/confluence_import/02_TECHNICAL/
cp documentation/DATA_MODELS.md documentation/confluence_import/02_TECHNICAL/
cp documentation/AIRTABLE_INTEGRATION.md documentation/confluence_import/03_INTEGRATION/
cp documentation/INTEGRATION_DISCUSSION.md documentation/confluence_import/03_INTEGRATION/
cp documentation/data_requirements.md documentation/confluence_import/04_DEVELOPMENT/

# Commit
git add documentation/confluence_import/
git commit -m "Regenerate Confluence staging area"
```

---

## 🗺️ File Mapping: Git → Confluence

| Primary Source (Git) | Confluence Folder | Confluence Page Title |
|---------------------|-------------------|----------------------|
| `REQUIREMENTS.md` | `01_PLANNING/` | Requirements |
| `TODO.md` | `01_PLANNING/` | TODO & Task Tracking |
| `PROJECT_STATUS.md` | `01_PLANNING/` | Project Status |
| `ARCHITECTURE.md` | `02_TECHNICAL/` | Architecture |
| `DATA_MODELS.md` | `02_TECHNICAL/` | Data Models |
| `AIRTABLE_INTEGRATION.md` | `03_INTEGRATION/` | Airtable Integration |
| `INTEGRATION_DISCUSSION.md` | `03_INTEGRATION/` | Integration Discussion & Decisions |
| `data_requirements.md` | `04_DEVELOPMENT/` | Data Requirements |

---

## ✅ Best Practices

### 1. **Git is the Source of Truth**
- Always edit files in `documentation/` first
- Never edit only in Confluence
- If you edit in Confluence, copy changes back to git

### 2. **Commit Often**
- Commit changes to git after each significant edit
- Use descriptive commit messages
- Don't wait to batch multiple unrelated changes

### 3. **Sync Strategically**
- Update Confluence staging when changes are significant
- Don't sync every tiny change
- Batch related updates together

### 4. **Document Changes**
- Update the "Last Updated" date in files
- Add notes about what changed
- Reference related commits or issues

### 5. **Review Before Import**
- Check markdown formatting before importing to Confluence
- Verify code blocks have language specified
- Ensure tables are properly formatted

---

## 🔗 Confluence Space Details

**Space:** P2I (Power2Inspire Event CRM)  
**URL:** https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I  
**Homepage:** Project Overview  

---

## 📞 Need Help?

- **Import Issues:** See `confluence_import/IMPORT_INSTRUCTIONS.md`
- **Git Issues:** Check git documentation or ask for help
- **Confluence Formatting:** Confluence supports most markdown, but some features may differ

---

## 🎓 Remember

> **"Git is the source of truth. Confluence is the presentation layer."**

Always edit in git first, then sync to Confluence when ready to share with stakeholders.

---

*This workflow ensures documentation stays synchronized while maintaining git as the authoritative source.*

