# Power2Inspire Event CRM - Client Questions & Decisions Required

**Date Created:** 2026-02-13  
**Status:** Awaiting Client Response  
**Project Phase:** API Routes & Database Integration

---

## Purpose

This document captures key decisions and questions that require client input before proceeding with the next development phase. Please review each section and provide your answers/preferences.

---

## 1. Admin Dashboard & Access Control

### Question 1.1: Admin Authentication
**Context:** The admin dashboard will provide access to sensitive functions like:
- Fetching data from Airtable to the database (pre-event setup)
- Syncing registrations from database to Airtable (post-event)
- Wiping the database clean (post-event cleanup)
- Viewing live registration statistics

**Question:** How should we protect access to the admin dashboard?

**Options:**
- [ ] **Option A:** Password protection (simple password entry screen)
- [ ] **Option B:** Physical device security only (no password, rely on tablet being in staff possession)
- [ ] **Option C:** PIN code (4-6 digit PIN)
- [ ] **Option D:** Email-based magic link (send login link to authorized email)

**Your Decision:**  
_[Please select one option and explain any specific requirements]_

---

### Question 1.2: Admin User Roles
**Context:** We need to determine who should have access to admin functions.

**Question:** Who will be using the admin dashboard?

**Options:**
- [ ] Single admin user (one person manages everything)
- [ ] Multiple staff members (several people can access admin functions)
- [ ] Role-based access (different permissions for different staff)

**Your Decision:**  
_[Please describe who will use the admin dashboard and what they need to do]_

---

## 2. Event Management Workflow

### Question 2.1: Pre-Event Data Setup
**Context:** Before each event, we need to load event details and organization data into the database.

**Question:** How will event data be prepared before the event?

**Current Plan:**
1. Admin clicks "Fetch from Airtable" button in admin dashboard
2. System pulls latest events and organizations from Airtable
3. Data is stored in Neon database for fast access during event

**Questions for you:**
- Is this workflow acceptable?  
  _[Yes / No / Needs modification]_

- How far in advance will event data be available in Airtable?  
  _[e.g., "1 week before event", "1 day before", etc.]_

- Should the system automatically select the "current" event based on date, or should admin manually select which event is active?  
  _[Automatic / Manual selection]_

**Your Answers:**  
_[Please provide your responses]_

---

### Question 2.2: Post-Event Data Sync
**Context:** After the event, all registrations need to be synced back to Airtable for long-term storage.

**Question:** What is the post-event workflow?

**Current Plan:**
1. Event ends
2. Admin clicks "Sync to Airtable" button
3. All registrations are uploaded to Airtable
4. Admin verifies sync was successful
5. Admin clicks "Wipe Database" button to clear temporary data

**Questions for you:**
- Is this workflow acceptable?  
  _[Yes / No / Needs modification]_

- Should the system prevent database wipe until sync is confirmed successful?  
  _[Yes / No]_

- Do you want a backup/export option before wiping the database?  
  _[Yes - CSV export / Yes - JSON export / No backup needed]_

**Your Answers:**  
_[Please provide your responses]_

---

## 3. Airtable Configuration

### Question 3.1: Airtable Access
**Context:** The application needs API access to your Airtable base.

**Question:** Who will provide the Airtable API credentials?

**What we need:**
- Airtable API Key (personal access token)
- Airtable Base ID

**Questions for you:**
- Do you have admin access to generate an Airtable API key?  
  _[Yes / No / Need help]_

- Should we schedule a session to set this up together?  
  _[Yes / No / I can do it myself]_

**Your Answers:**  
_[Please provide your responses]_

---

### Question 3.2: Airtable Base Structure
**Context:** We need to confirm the Airtable base structure matches our expectations.

**Question:** Is your Airtable base already set up with the V2 schema?

**Expected Tables:**
- Events (with fields: Event Name, Date, Location, etc.)
- Organizations (with fields: Organization Name, etc.)
- Registrations (with all V2 fields from requirements)

**Questions for you:**
- Are these tables already created in Airtable?  
  _[Yes / No / Partially]_

- If not, would you like us to provide the exact Airtable schema to create?  
  _[Yes / No / Already have it]_

**Your Answers:**  
_[Please provide your responses]_

---

## 4. Testing & Validation

### Question 4.1: Test Event
**Context:** We need to test the full workflow with real data before the first live event.

**Question:** Can we create a test event in Airtable for development testing?

**What we need:**
- A test event entry in Airtable
- A few test organizations
- Permission to create/delete test registrations

**Questions for you:**
- Can we use your production Airtable base for testing?  
  _[Yes / No / Create separate test base]_

- When would you like to do a full end-to-end test?  
  _[Date/timeframe]_

**Your Answers:**  
_[Please provide your responses]_

---

## 5. Timeline & Priorities

### Question 5.1: Next Event Date
**Context:** Understanding when the next event is helps us prioritize development.

**Question:** When is the next PowerHouseGames event?

**Your Answer:**  
_[Please provide date or timeframe]_

---

### Question 5.2: Feature Priorities
**Context:** We have several features in the backlog. Which are most important?

**Question:** Please rank these features in order of priority (1 = highest):

- [ ] ___ Admin dashboard (fetch/sync/wipe functions)
- [ ] ___ Attendance tracking (check-in/check-out)
- [ ] ___ CSV export functionality
- [ ] ___ Live registration statistics
- [ ] ___ Multi-event support (switching between events)

**Your Ranking:**  
_[Please number 1-5]_

---

## 6. Additional Questions or Concerns

**Question:** Is there anything else we should consider or any concerns you have about the current implementation?

**Your Response:**  
_[Please share any additional thoughts, questions, or requirements]_

---

## Next Steps

Once you've provided answers to these questions, we will:

1. **Update the technical specifications** based on your decisions
2. **Implement the admin dashboard** with your chosen authentication method
3. **Build the Airtable integration** with the agreed workflow
4. **Schedule a testing session** to validate everything works as expected

**Please return this document with your answers by:** _[Date]_

**Contact:** Will Jackson - will@play.physio

---

**Thank you for your input! Your answers will help us build exactly what you need.** 🎉

