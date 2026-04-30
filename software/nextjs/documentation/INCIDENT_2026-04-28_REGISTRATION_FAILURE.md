# Incident: Registration Failure on Live Event Day

**Date:** 28 April 2026
**Status:** Resolved (hotfix deployed)
**Affected environment:** Production (`phg.power2inspire.org.uk`)
**PR:** [#2 — hotfix: registrations column mismatch (live event)](https://github.com/mrwilljackson/p2iphg/pull/2)

---

## What happened (in plain English)

During a live event, attendees and group leaders trying to register through the public registration form saw a JavaScript pop-up saying **"Failed to save registration. Please try again."** No registrations were being saved to the database.

The form looked normal, validation passed, and submitting *appeared* to work — but every submit silently failed in the background with a "500 Internal Server Error".

## What caused it

The application's **expected database structure** had drifted out of sync with the **actual live database**.

Two specific fields on the `registrations` table did not match:

| What the code expected | What actually existed in the database |
|---|---|
| `disabled_students` | `impaired_participants` |
| `sen_students` | `non_impaired_participants` |

These two fields hold the participant counts that group leaders enter for closed groups (Family / Disability groups). When the form tried to save a registration, the database rejected the request because it was being asked to write to columns that didn't exist — `column "disabled_students" of relation "registrations" does not exist`.

Because *every* registration insert sets these two fields (even if to `null` for non-group registrations), **every single submission failed**, regardless of registration type.

## Why the database had different column names

At some point earlier in the project's lifecycle the team decided to rename these fields:

- `impaired_participants` → `disabled_students`
- `non_impaired_participants` → `sen_students`

Migration files were generated for the rename (`drizzle/0001_stormy_absorbing_man.sql` and `drizzle/0002_salty_hercules.sql`) and the codebase was updated to use the new names. However the migrations were **never actually applied** to the live Neon database — so the code expected the new names while the database still had the old ones. This mismatch was latent (i.e. it had been broken for some time), but only became visible the moment a registration was attempted on the live event.

## Why the error wasn't obvious

1. The browser only showed a generic alert ("Failed to save registration. Please try again.") because the form's `catch` block was hard-coded to that message. The real error was being logged to the browser console and the server terminal but nobody had cause to look until the event went live.
2. Server-rendered errors in production Next.js are deliberately redacted in the browser ("The specific message is omitted in production builds…"), so even checking DevTools didn't reveal the cause without access to server logs.

## The fix

A minimal hotfix was chosen because the event was already running and a wider rename across the codebase would have been higher risk than necessary.

**One file changed: [`lib/db/schema.ts`](../lib/db/schema.ts)**

```ts
// Before
disabledStudents: integer('disabled_students'),
senStudents: integer('sen_students'),

// After
disabledStudents: integer('impaired_participants'),
senStudents: integer('non_impaired_participants'),
```

The TypeScript field names (`disabledStudents`, `senStudents`) were intentionally **left unchanged** so that the rest of the codebase (form, validation, types, server actions, admin pages, CSV exports, Airtable sync) continued to work exactly as before. Only the *physical column name* the ORM points at was corrected.

Additionally, the registration form's failure alert was updated to display the real error message instead of a generic one, so any further issues during the event could be diagnosed without needing access to the server logs.

## Why this fix is "good enough" — and what's still owed

The hotfix is intentionally a sticking-plaster:

- Inside the codebase the fields are still called `disabledStudents` / `senStudents`, which no longer reflects what they actually mean ("impaired" / "non-impaired" participants).
- The user-facing labels still read **"Disabled Students"** and **"SEN Students"**, which is the wrong terminology going forward.
- Two unused legacy columns (`organisation_contact_id`, `Organisation`) still sit on the `registrations` table.
- The orphan migration files (`0001_stormy_absorbing_man.sql`, `0002_salty_hercules.sql`) describe a database state that doesn't exist.

These should be tidied up post-event in a planned rename:

1. Rename TS identifiers everywhere: `disabledStudents` → `impairedParticipants`, `senStudents` → `nonImpairedParticipants`.
2. Update UI labels to "Impaired Participants" / "Non-Impaired Participants".
3. Drop the two unreferenced columns.
4. Remove or reconcile the orphan migrations so the migration history matches reality.

## Lessons / preventative actions

1. **Migrations and the live DB drifted apart.** A check that compares the Drizzle schema against the actual production database (e.g. `drizzle-kit check`/`introspect`) before deploying would have caught this far earlier. Worth adding to the deploy process.
2. **The generic catch-all alert hid the real error for too long.** The improved alert (now showing `error.message`) is retained and should be kept.
3. **No automated tests exercise the public registration path.** Even a single end-to-end smoke test that submits each role would have caught the column mismatch in CI rather than on event day.
4. **Renames need to be enforced in both directions.** When a column is renamed in the schema, the migration must be applied to every environment (and verified) before the rename is considered done. A simple post-deploy verification query against `information_schema.columns` would close this loop.

## Timeline

- The mismatch had existed silently in the codebase for an unknown period (the orphan migrations are dated well before today).
- Issue surfaced when registrations were attempted live on the event day (28 April 2026).
- Server-side error inspected; root cause identified as missing columns.
- Database state inspected directly against `information_schema` — confirmed `impaired_participants` / `non_impaired_participants` were the real column names, with 7 rows of legacy data.
- Hotfix branch `hotfix/2026-04-28-registrations-column-mismatch` cut from `master`.
- Verified locally: closed-group registration saves successfully and writes to the correct columns in Neon.
- PR #2 merged and deployed to production. Registrations confirmed working.
