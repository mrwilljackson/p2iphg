# Family Group Feature

**Version:** 1.0  
**Last Updated:** 2026-02-18  
**Status:** ✅ Implemented  
**Related Documentation:** [DATA_MODELS.md](DATA_MODELS.md), [DUAL_ID_PATTERN.md](DUAL_ID_PATTERN.md), [AIRTABLE_INTEGRATION.md](../03_INTEGRATION/AIRTABLE_INTEGRATION.md)

> ⚠️ **Note (2026-04-29):** The "Airtable sync" sections below describe a code path that is now **deprecated**. CSV export is the supported post-event workflow. The family-group creation logic itself is unaffected; only the post-event push to Airtable is deprecated. See `AIRTABLE_INTEGRATION.md` for the canonical deprecation note.

---

## Overview

The Family Group feature enables families to register for PowerHouseGames events without requiring pre-registration in the system. When a Group leader selects "Family Group" and enters their surname, the system dynamically creates an organization record with the format `"{Surname} Family Group"` (e.g., "Johnson Family Group").

This feature supports the event's goal of being inclusive and accessible to families who may not be affiliated with any formal organization.

---

## How It Works

### User Experience Flow

1. **Group leader selects role:** User chooses "Group" registration type
2. **Selects Family Group:** From the organization dropdown, user selects "Family Group"
3. **Enters surname:** User enters their last name (e.g., "Johnson")
4. **Dynamic name display:** Dropdown updates to show "Johnson Family Group"
5. **Completes registration:** User fills remaining fields and submits
6. **Organization created:** System creates "Johnson Family Group" organization automatically
7. **Registration saved:** Registration is linked to the newly created organization

### Technical Implementation

The feature is implemented across three layers:

#### 1. Database Service Layer (`lib/db-service.ts`)

**Method:** `DatabaseService.findOrCreateFamilyGroup()`

```typescript
static async findOrCreateFamilyGroup(
  eventId: string,
  surname: string,
  contactEmail: string,
  contactFirstName: string,
  contactLastName: string
): Promise<Organization>
```

**Logic:**
- Checks for existing family group by: `name + eventId + contactEmail`
- If found: Returns existing organization
- If not found: Creates new organization with:
  - `name`: `"{surname} Family Group"`
  - `eventId`: Current event ID
  - `isDisabilityGroup`: `false`
  - `contactEmail`, `contactFirstName`, `contactLastName`: From group leader
  - `notes`: "Auto-created family group"
  - `airtableRecordId`: `null` (will be populated during sync)

#### 2. Server Actions Layer (`lib/actions.ts`)

**Server Action:** `findOrCreateFamilyGroup()`

Wraps the DatabaseService method with `"use server"` directive to enable secure access from client components.

#### 3. Registration Form (`components/registration-form.tsx`)

**Form Submission Logic:**

```typescript
const onSubmit = async (data: RegistrationFormData) => {
  let finalOrganizationId = data.organizationId;

  // Check if "Family Group" was selected
  const selectedOrg = allOrganizations.find(org => org.id === data.organizationId);
  if (selectedOrg && selectedOrg.name === "Family Group") {
    // Create or find the family group organization
    const familyGroup = await findOrCreateFamilyGroup(
      data.eventId,
      data.attendeeSurname,
      data.email || "",
      data.attendeeName,
      data.attendeeSurname
    );
    
    finalOrganizationId = familyGroup.id!;
  }

  // Save registration with the organization ID
  await createRegistration({
    ...data,
    organizationId: finalOrganizationId,
  });
};
```

---

## Uniqueness Logic

Family groups are unique by the combination of:
1. **Organization name** (e.g., "Johnson Family Group")
2. **Event ID** (e.g., Manchester 2026)
3. **Contact email** (e.g., john.johnson@email.com)

### Scenarios

| Scenario | Surname | Event | Email | Result |
|----------|---------|-------|-------|--------|
| Same family, same event | Johnson | Manchester 2026 | john@email.com | ✅ Reuses existing organization |
| Same family, different event | Johnson | Leicester 2027 | john@email.com | ✅ Creates new organization (event-specific) |
| Different family, same surname, same event | Johnson | Manchester 2026 | mary@email.com | ✅ Creates new organization (different email) |
| Same family returns, same email | Johnson | Manchester 2026 | john@email.com | ✅ Reuses existing organization |

---

## Database Schema

Family groups are stored in the `organizations` table with the following structure:

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id),
  name VARCHAR(255) NOT NULL,
  is_disability_group BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  contact_first_name VARCHAR(100),
  contact_last_name VARCHAR(100),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  notes TEXT,
  airtable_record_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Example family group record:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "eventId": "evt_manchester_2026",
  "name": "Johnson Family Group",
  "isDisabilityGroup": false,
  "imageUrl": null,
  "contactFirstName": "John",
  "contactLastName": "Johnson",
  "contactEmail": "john.johnson@email.com",
  "contactPhone": null,
  "notes": "Auto-created family group",
  "airtableRecordId": null,
  "createdAt": "2026-06-20T09:30:00Z",
  "modifiedAt": "2026-06-20T09:30:00Z"
}
```

---

## Airtable Sync Considerations

### Phase 3: Post-Event Sync Strategy

When implementing the Airtable sync feature, family groups require special handling to support **returning families across multiple events**.

#### Deduplication Strategy

**Primary Identifier:** `contactEmail`
**Secondary Validation:** `name` (surname should match)

**Sync Logic:**

```typescript
async function syncFamilyGroupToAirtable(familyGroup: Organization) {
  // Search Airtable for existing family group with same contact email
  const existingFamily = await airtable.organizations.find({
    filterByFormula: `AND(
      {contactEmail} = '${familyGroup.contactEmail}',
      {name} = '${familyGroup.name}'
    )`
  });

  if (existingFamily) {
    // Returning family - link to existing Airtable record
    console.log(`Returning family: ${familyGroup.name}`);

    // Update local record with Airtable ID
    await db.update(organizations)
      .set({ airtableRecordId: existingFamily.id })
      .where(eq(organizations.id, familyGroup.id));

    return existingFamily.id;
  } else {
    // New family - create new Airtable record
    console.log(`New family: ${familyGroup.name}`);

    const newRecord = await airtable.organizations.create({
      name: familyGroup.name,
      contactEmail: familyGroup.contactEmail,
      contactFirstName: familyGroup.contactFirstName,
      contactLastName: familyGroup.contactLastName,
      isDisabilityGroup: familyGroup.isDisabilityGroup,
      notes: familyGroup.notes,
    });

    // Update local record with Airtable ID
    await db.update(organizations)
      .set({ airtableRecordId: newRecord.id })
      .where(eq(organizations.id, familyGroup.id));

    return newRecord.id;
  }
}
```

#### Handling Returning Families

**Scenario:** Johnson family attends multiple events over time

**Event 1 (Manchester 2026):**
- Neon: Creates "Johnson Family Group" (UUID: `uuid-001`, email: `john@email.com`)
- Sync: Creates Airtable record (Record ID: `recABC123`)
- Neon: Updates `airtableRecordId` to `recABC123`

**Event 2 (Leicester 2027):**
- Neon: Creates new "Johnson Family Group" (UUID: `uuid-002`, email: `john@email.com`)
- Sync: Finds existing Airtable record by email (`recABC123`)
- Neon: Updates `airtableRecordId` to `recABC123` (links to same family)
- Airtable: One family record linked to multiple event registrations

**Benefits:**
- ✅ Historical tracking of family participation across events
- ✅ Marketing: Identify returning families for targeted communications
- ✅ Analytics: Track family engagement over time
- ✅ Data quality: Single source of truth for each family

#### Edge Cases

**Case 1: Email typo on second registration**
- **Problem:** Same family, different email (typo)
- **Result:** Creates duplicate Airtable record
- **Solution:** Manual deduplication in Airtable after event

**Case 2: Surname change (marriage, etc.)**
- **Problem:** Same email, different surname
- **Result:** Creates new family group (different name)
- **Solution:** Validation check - warn if email exists with different surname

**Case 3: Multiple families sharing email**
- **Problem:** Different families, same email (e.g., school email)
- **Result:** Incorrectly links to same Airtable record
- **Solution:** Validate surname matches; flag for manual review if mismatch

---

## Integration Points

### Related Code Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `lib/db-service.ts` | Database operations | `findOrCreateFamilyGroup()` |
| `lib/actions.ts` | Server actions | `findOrCreateFamilyGroup()` |
| `components/registration-form.tsx` | Form submission | `onSubmit()` - family group detection |
| `db/schema.ts` | Database schema | `organizations` table definition |
| `lib/types.ts` | TypeScript types | `Organization` interface |
| `lib/validation.ts` | Zod schemas | `organizationSchema` |

### Related Documentation

- **[DATA_MODELS.md](DATA_MODELS.md)** - Organization entity definition
- **[DUAL_ID_PATTERN.md](DUAL_ID_PATTERN.md)** - UUID + Airtable Record ID pattern
- **[AIRTABLE_INTEGRATION.md](../03_INTEGRATION/AIRTABLE_INTEGRATION.md)** - Sync workflow (Phase 3)
- **[REGISTRATION_FORM_FIELDS.md](../05_DESIGN/REGISTRATION_FORM_FIELDS.md)** - Form field specifications

---

## Testing Scenarios

### Manual Testing Checklist

- [ ] **New family registration**
  - Select Group role
  - Select "Family Group"
  - Enter surname (e.g., "Smith")
  - Verify dropdown shows "Smith Family Group"
  - Complete and submit form
  - Verify organization created in database
  - Verify registration linked to organization

- [ ] **Same family, same event (duplicate prevention)**
  - Register same family again (same surname + email)
  - Verify existing organization is reused
  - Verify no duplicate organization created

- [ ] **Different family, same surname**
  - Register different family with same surname but different email
  - Verify new organization is created
  - Verify organizations are separate

- [ ] **Same family, different event**
  - Change active event
  - Register same family (same surname + email)
  - Verify new event-specific organization is created
  - Verify organizations have different event IDs

### Database Verification Queries

```sql
-- Check all family groups for an event
SELECT id, name, "eventId", "contactEmail", "airtableRecordId"
FROM organizations
WHERE name LIKE '% Family Group'
  AND "eventId" = 'evt_manchester_2026'
ORDER BY "createdAt" DESC;

-- Find duplicate family groups (same name + event + email)
SELECT name, "eventId", "contactEmail", COUNT(*) as count
FROM organizations
WHERE name LIKE '% Family Group'
GROUP BY name, "eventId", "contactEmail"
HAVING COUNT(*) > 1;

-- Check registrations linked to family groups
SELECT r.id, r."attendeeName", r."attendeeSurname", o.name as organization
FROM registrations r
JOIN organizations o ON r."organizationId" = o.id
WHERE o.name LIKE '% Family Group'
ORDER BY r."createdAt" DESC;
```

---

## Future Enhancements

### Potential Improvements

1. **Pre-Event Recognition**
   - Fetch historical family groups from Airtable during Phase 1
   - Show "Welcome back!" message for returning families
   - Pre-populate contact details from previous registration

2. **Family Group Dashboard**
   - Admin view showing all family groups
   - Participation history across events
   - Contact information for follow-up

3. **Email Validation**
   - Check for typos in email addresses
   - Suggest corrections based on similar existing emails
   - Confirm if surname doesn't match previous registration

4. **Bulk Family Registration**
   - Allow families to register multiple participants at once
   - Link all family members to the same family group
   - Streamline check-in process

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-18 | Initial documentation - Feature implemented and tested | AI Assistant |

---

## Related Commits

- `22cdb8e` - feat: Implement dynamic family group creation on registration
- `4ff8e8b` - fix: Remove refine validation for Group fields to allow conditional visibility

---

**End of Document**


