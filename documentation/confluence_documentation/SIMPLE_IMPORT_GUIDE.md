# Simple Confluence Import Guide

**Method:** Copy-Paste Markdown  
**Time Required:** ~10 minutes  
**Last Updated:** 2026-02-11

---

## 🎯 Quick Overview

1. Create 4 parent pages (folders) in Confluence
2. Copy-paste markdown content into child pages
3. Set Project Overview as homepage
4. Done! ✅

---

## 📋 Step-by-Step Instructions

### Step 1: Create Parent Pages (Folders)

Go to your P2I space and create these **4 blank pages**:

1. Click **Create** button
2. Title: `1. Project Planning`
3. Leave blank, click **Publish**

Repeat for:
- `2. Technical Design`
- `3. Integration Design`
- `4. Development Notes`

---

### Step 2: Create Project Overview (Homepage)

1. Click **Create** → **Blank page**
2. Title: `Project Overview`
3. Open file: `documentation/confluence_import/00_PROJECT_OVERVIEW.md`
4. Copy all content (Cmd+A, Cmd+C)
5. Paste into Confluence editor (Cmd+V)
6. Click **Publish**
7. Go to **Space Settings** → **Overview** → **Set as homepage**

---

### Step 3: Import Planning Documents

**Navigate to:** `1. Project Planning` page

**Create 3 child pages:**

#### Requirements
- Click **Create** → **Child page**
- Title: `Requirements`
- Open: `01_PLANNING/REQUIREMENTS.md`
- Copy all → Paste → Publish

#### TODO & Task Tracking
- Click **Create** → **Child page**
- Title: `TODO & Task Tracking`
- Open: `01_PLANNING/TODO.md`
- Copy all → Paste → Publish

#### Project Status
- Click **Create** → **Child page**
- Title: `Project Status`
- Open: `01_PLANNING/PROJECT_STATUS.md`
- Copy all → Paste → Publish

---

### Step 4: Import Technical Documents

**Navigate to:** `2. Technical Design` page

**Create 2 child pages:**

#### Architecture
- Click **Create** → **Child page**
- Title: `Architecture`
- Open: `02_TECHNICAL/ARCHITECTURE.md`
- Copy all → Paste → Publish

#### Data Models
- Click **Create** → **Child page**
- Title: `Data Models`
- Open: `02_TECHNICAL/DATA_MODELS.md`
- Copy all → Paste → Publish

---

### Step 5: Import Integration Documents

**Navigate to:** `3. Integration Design` page

**Create 2 child pages:**

#### Airtable Integration
- Click **Create** → **Child page**
- Title: `Airtable Integration`
- Open: `03_INTEGRATION/AIRTABLE_INTEGRATION.md`
- Copy all → Paste → Publish

#### Integration Discussion & Decisions
- Click **Create** → **Child page**
- Title: `Integration Discussion & Decisions`
- Open: `03_INTEGRATION/INTEGRATION_DISCUSSION.md`
- Copy all → Paste → Publish

---

### Step 6: Import Development Notes

**Navigate to:** `4. Development Notes` page

**Create 1 child page:**

#### Data Requirements
- Click **Create** → **Child page**
- Title: `Data Requirements`
- Open: `04_DEVELOPMENT/data_requirements.md`
- Copy all → Paste → Publish

---

### Step 7: (Optional) Import Documentation Workflow

**At root level or under Planning:**

#### Documentation Workflow
- Click **Create** (at root or as child of Planning)
- Title: `Documentation Workflow`
- Open: `DOCUMENTATION_WORKFLOW.md`
- Copy all → Paste → Publish

---

## ✅ Final Structure

Your P2I space should look like:

```
P2I Space
│
├── 📄 Project Overview (Homepage)
│
├── 📁 1. Project Planning
│   ├── Requirements
│   ├── TODO & Task Tracking
│   └── Project Status
│
├── 📁 2. Technical Design
│   ├── Architecture
│   └── Data Models
│
├── 📁 3. Integration Design
│   ├── Airtable Integration
│   └── Integration Discussion & Decisions
│
└── 📁 4. Development Notes
    └── Data Requirements
```

---

## 💡 Tips

- **Formatting:** Confluence auto-formats markdown when you paste
- **Code Blocks:** Should preserve syntax highlighting
- **Tables:** Will convert automatically
- **Emojis:** Work perfectly
- **Links:** May need manual adjustment for internal links

---

## 🔄 Future Updates

When you update documentation:

1. Edit the markdown file in `documentation/`
2. Copy to `documentation/confluence_import/` folder
3. Copy-paste updated content into Confluence page
4. Publish

See `DOCUMENTATION_WORKFLOW.md` for the complete process.

---

## 📞 Confluence Space

**URL:** https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I  
**Space Key:** P2I  
**Space Name:** Power2Inspire Event CRM

---

**That's it!** Simple copy-paste, no complicated imports needed. 🚀

