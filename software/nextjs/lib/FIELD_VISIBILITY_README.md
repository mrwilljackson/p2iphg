# Field Visibility Configuration Guide

## Overview

The field visibility system allows you to easily control which form fields are shown for each registration type (Participant, Volunteer, or Group).

## How to Use

### 1. Open the Configuration File

Edit: `software/nextjs/lib/field-visibility-config.ts`

### 2. Find the Registration Type

The configuration object has three sections:
- `"Participant"` - Individual participants taking part in the event
- `"Volunteer"` - Volunteers helping to run the event
- `"Group"` - Teachers, parents, or community group leaders bringing participants

### 3. Set Field Visibility

For each field, set it to:
- `true` = Field is **visible** for this registration type
- `false` = Field is **hidden** for this registration type

## Example

**To hide the email field for Volunteers:**

```typescript
"Volunteer": {
  attendeeName: true,
  attendeeSurname: true,
  email: false,  // ← Changed from true to false
  organizationId: true,
  // ... rest of fields
}
```

**To show group fields for Participants:**

```typescript
"Participant": {
  // ... other fields
  groupSize: true,        // ← Changed from false to true
  disabledStudents: true, // ← Changed from false to true
  senStudents: true,      // ← Changed from false to true
}
```

## Available Fields

| Field Name | Description |
|------------|-------------|
| `attendeeName` | First name field |
| `attendeeSurname` | Last name field |
| `email` | Email address field |
| `organizationId` | Organization selection field |
| `impairment` | Disability/impairment question |
| `photoConsent` | Photo consent radio buttons |
| `feedbackConsent` | Feedback survey consent checkbox |
| `nextEventConsent` | Next event info consent checkbox |
| `groupSize` | Number of participants in group |
| `disabledStudents` | Number of disabled participants |
| `senStudents` | Number of SEN participants |

## Current Default Configuration

### Participant
- ✅ All personal fields (name, email, organization, impairment)
- ✅ All consent fields (photo, feedback, next event)
- ❌ Group fields (hidden)

### Volunteer
- ✅ All personal fields (name, email, organization, impairment)
- ✅ All consent fields (photo, feedback, next event)
- ❌ Group fields (hidden)

### Group
- ✅ All personal fields (name, email, organization, impairment)
- ✅ All consent fields (photo, feedback, next event)
- ✅ All group fields (visible)

## Testing Your Changes

1. Save the configuration file
2. The Next.js dev server will automatically reload
3. Open http://localhost:3000/test-form
4. Switch between registration types to see which fields appear

## Tips

- **Start simple:** Only hide fields you're certain you don't need
- **Test thoroughly:** Check all three registration types after making changes
- **Document changes:** If you make significant changes, note them in your project documentation
- **Validation:** Remember that hidden fields may still have validation rules in the schema - you may need to update `lib/validation.ts` if you hide required fields

## Need Help?

If you need to add new fields or change validation rules, you'll also need to update:
- `lib/types.ts` - TypeScript type definitions
- `lib/validation.ts` - Zod validation schema
- `components/registration-form.tsx` - Form UI (if adding new fields)

