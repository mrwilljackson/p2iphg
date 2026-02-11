# Confluence HTML Import Instructions

**Updated:** 2026-02-11  
**Import Method:** HTML (Bulk Upload)

---

## 📁 HTML Files Ready for Import

All documentation has been converted to HTML format in:
```
documentation/confluence_import/html_export/
```

### Files List (Import in this order):

1. `00_PROJECT_OVERVIEW.html` → **Project Overview** (Homepage)
2. `01_REQUIREMENTS.html` → **Requirements** (under "1. Project Planning")
3. `02_TODO.html` → **TODO & Task Tracking** (under "1. Project Planning")
4. `03_PROJECT_STATUS.html` → **Project Status** (under "1. Project Planning")
5. `04_ARCHITECTURE.html` → **Architecture** (under "2. Technical Design")
6. `05_DATA_MODELS.html` → **Data Models** (under "2. Technical Design")
7. `06_AIRTABLE_INTEGRATION.html` → **Airtable Integration** (under "3. Integration Design")
8. `07_INTEGRATION_DISCUSSION.html` → **Integration Discussion** (under "3. Integration Design")
9. `08_data_requirements.html` → **Data Requirements** (under "4. Development Notes")
10. `09_DOCUMENTATION_WORKFLOW.html` → **Documentation Workflow** (root level or under Planning)

---

## 🚀 Import Method: HTML Upload

### Step 1: Create Parent Pages (Folders)

1. Go to your P2I space: https://mrwilljackson-projects.atlassian.net/wiki/spaces/P2I
2. Click **Create** button
3. Create these **blank parent pages**:
   - `1. Project Planning`
   - `2. Technical Design`
   - `3. Integration Design`
   - `4. Development Notes`
4. Just save them blank - we'll add child pages next

### Step 2: Import Project Overview (Homepage)

1. Click **Create** → **Blank page**
2. Title: `Project Overview`
3. In the editor, click **Insert** → **Other macros**
4. Search for **HTML** macro
5. Click **HTML** macro
6. Open `html_export/00_PROJECT_OVERVIEW.html` in a text editor
7. Copy the **entire content** (including `<html>` tags)
8. Paste into the HTML macro
9. Click **Save**
10. Go to **Space Settings** → **Overview** → Set as homepage

### Step 3: Import Planning Documents

For each file in the Planning section:

**Import Requirements:**
1. Navigate to `1. Project Planning` page
2. Click **Create** → **Child page**
3. Title: `Requirements`
4. Insert **HTML macro** (Insert → Other macros → HTML)
5. Copy content from `html_export/01_REQUIREMENTS.html`
6. Paste and save

**Import TODO:**
1. Navigate to `1. Project Planning` page
2. Click **Create** → **Child page**
3. Title: `TODO & Task Tracking`
4. Insert **HTML macro**
5. Copy content from `html_export/02_TODO.html`
6. Paste and save

**Import Project Status:**
1. Navigate to `1. Project Planning` page
2. Click **Create** → **Child page**
3. Title: `Project Status`
4. Insert **HTML macro**
5. Copy content from `html_export/03_PROJECT_STATUS.html`
6. Paste and save

### Step 4: Import Technical Documents

**Import Architecture:**
1. Navigate to `2. Technical Design` page
2. Click **Create** → **Child page**
3. Title: `Architecture`
4. Insert **HTML macro**
5. Copy content from `html_export/04_ARCHITECTURE.html`
6. Paste and save

**Import Data Models:**
1. Navigate to `2. Technical Design` page
2. Click **Create** → **Child page**
3. Title: `Data Models`
4. Insert **HTML macro**
5. Copy content from `html_export/05_DATA_MODELS.html`
6. Paste and save

### Step 5: Import Integration Documents

**Import Airtable Integration:**
1. Navigate to `3. Integration Design` page
2. Click **Create** → **Child page**
3. Title: `Airtable Integration`
4. Insert **HTML macro**
5. Copy content from `html_export/06_AIRTABLE_INTEGRATION.html`
6. Paste and save

**Import Integration Discussion:**
1. Navigate to `3. Integration Design` page
2. Click **Create** → **Child page**
3. Title: `Integration Discussion & Decisions`
4. Insert **HTML macro**
5. Copy content from `html_export/07_INTEGRATION_DISCUSSION.html`
6. Paste and save

### Step 6: Import Development Notes

**Import Data Requirements:**
1. Navigate to `4. Development Notes` page
2. Click **Create** → **Child page**
3. Title: `Data Requirements`
4. Insert **HTML macro**
5. Copy content from `html_export/08_data_requirements.html`
6. Paste and save

### Step 7: Import Documentation Workflow

**Import Workflow Guide:**
1. Click **Create** (at root level or under Planning)
2. Title: `Documentation Workflow`
3. Insert **HTML macro**
4. Copy content from `html_export/09_DOCUMENTATION_WORKFLOW.html`
5. Paste and save

---

## 🎨 Alternative: Copy-Paste Method

If the HTML macro doesn't work well, you can:

1. Open the HTML file in a web browser
2. Select all content (Cmd+A)
3. Copy (Cmd+C)
4. In Confluence editor, paste (Cmd+V)
5. Confluence will convert the HTML to its native format

This often works better than the HTML macro!

---

## ✅ Post-Import Checklist

- [ ] All 10 pages imported
- [ ] Parent-child relationships correct
- [ ] Project Overview set as homepage
- [ ] Code blocks formatted correctly
- [ ] Tables display properly
- [ ] Links work (may need manual fixing)
- [ ] Add page labels for organization

---

## 🔄 Future Updates

When you update documentation:

1. Edit the markdown file in `documentation/`
2. Regenerate HTML:
   ```bash
   cd documentation/confluence_import
   pandoc path/to/file.md -f markdown -t html -s -o html_export/filename.html
   ```
3. Copy-paste the new HTML into Confluence page

Or see `DOCUMENTATION_WORKFLOW.md` for the full process.

---

## 💡 Tips

- **HTML Macro:** May not render perfectly - try copy-paste from browser instead
- **Formatting:** Some markdown features may need manual adjustment
- **Code Blocks:** Should preserve syntax highlighting
- **Tables:** Usually convert well
- **Emojis:** Should work fine

---

**Ready to import?** Start with Step 1! 🚀

