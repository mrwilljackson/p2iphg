# Confluence Import Instructions

This folder contains all documentation organized for import into your Confluence P2I space.

---

## 📁 Folder Structure

```
confluence_import/
│
├── 00_PROJECT_OVERVIEW.md          # Main landing page (import as homepage)
│
├── 01_PLANNING/                    # Project Planning folder
│   ├── REQUIREMENTS.md
│   ├── TODO.md
│   └── PROJECT_STATUS.md
│
├── 02_TECHNICAL/                   # Technical Design folder
│   ├── ARCHITECTURE.md
│   └── DATA_MODELS.md
│
├── 03_INTEGRATION/                 # Integration Design folder
│   ├── AIRTABLE_INTEGRATION.md
│   └── INTEGRATION_DISCUSSION.md
│
└── 04_DEVELOPMENT/                 # Development Notes folder
    └── data_requirements.md
```

---

## 🚀 Import Method 1: Confluence Markdown Import (Recommended)

### Step 1: Create Parent Pages (Folders)

1. Go to your P2I space: https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I
2. Click **Create** button (top right)
3. Create these **parent pages** (these act as folders):
   - `1. Project Planning`
   - `2. Technical Design`
   - `3. Integration Design`
   - `4. Development Notes`
4. Leave them blank for now - just create the pages

### Step 2: Import the Overview Page

1. Click **Create** → **Blank page**
2. Title it: `Project Overview`
3. Click the **⋯** (more options) → **Import**
4. Select **Markdown**
5. Upload: `00_PROJECT_OVERVIEW.md`
6. Click **Import**
7. **Set as homepage:** Go to Space Settings → Overview → Set this page as homepage

### Step 3: Import Planning Documents

For each file in `01_PLANNING/`:

1. Navigate to the `1. Project Planning` page
2. Click **Create** → **Child page**
3. Click **⋯** → **Import** → **Markdown**
4. Upload the file:
   - `REQUIREMENTS.md` → Title: "Requirements"
   - `TODO.md` → Title: "TODO & Task Tracking"
   - `PROJECT_STATUS.md` → Title: "Project Status"

### Step 4: Import Technical Documents

For each file in `02_TECHNICAL/`:

1. Navigate to the `2. Technical Design` page
2. Click **Create** → **Child page**
3. Click **⋯** → **Import** → **Markdown**
4. Upload the file:
   - `ARCHITECTURE.md` → Title: "Architecture"
   - `DATA_MODELS.md` → Title: "Data Models"

### Step 5: Import Integration Documents

For each file in `03_INTEGRATION/`:

1. Navigate to the `3. Integration Design` page
2. Click **Create** → **Child page**
3. Click **⋯** → **Import** → **Markdown**
4. Upload the file:
   - `AIRTABLE_INTEGRATION.md` → Title: "Airtable Integration"
   - `INTEGRATION_DISCUSSION.md` → Title: "Integration Discussion & Decisions"

### Step 6: Import Development Notes

For the file in `04_DEVELOPMENT/`:

1. Navigate to the `4. Development Notes` page
2. Click **Create** → **Child page**
3. Click **⋯** → **Import** → **Markdown**
4. Upload: `data_requirements.md` → Title: "Data Requirements"

---

## 🚀 Import Method 2: Manual Copy-Paste

If the import feature doesn't work well:

1. Create the same page structure manually
2. Open each `.md` file in a text editor
3. Copy the content
4. Paste into Confluence editor
5. Confluence will auto-format most markdown

---

## 📋 Final Page Hierarchy

After import, your P2I space should look like:

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

## ✅ Post-Import Checklist

After importing:

- [ ] Verify all pages imported correctly
- [ ] Check that parent-child relationships are correct
- [ ] Review formatting (especially code blocks and tables)
- [ ] Set Project Overview as space homepage
- [ ] Add labels to pages for easy filtering (e.g., "requirements", "technical", "integration")
- [ ] Update space description
- [ ] Add any team members who need access

---

## 🔄 Keeping Documentation in Sync

Going forward:

1. **Primary Source:** Git repository (`documentation/` folder)
2. **Confluence:** Updated manually or via import when major changes occur
3. **Frequency:** Update Confluence after significant milestones or design decisions

---

## 💡 Tips

- **Code Blocks:** Confluence supports syntax highlighting - make sure language is specified
- **Tables:** Should import correctly from markdown
- **Links:** Internal links may need to be updated to point to Confluence pages
- **Images:** If you add images later, upload them to Confluence attachments
- **Emojis:** Confluence supports emojis - they should import fine

---

## ❓ Need Help?

If you encounter issues during import:
1. Check that the markdown file is valid
2. Try the manual copy-paste method
3. Confluence has a "Markdown" macro you can use for raw markdown content

---

**Ready to import?** Start with Method 1, Step 1! 🚀

