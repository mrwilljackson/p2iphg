"use server";

/**
 * Airtable Sync Action — Push registrations from Neon to Airtable
 *
 * Confirmed field mapping per REGISTRATION_SYNC_FIELD_MAPPING.txt (2026-03-11)
 */

import { db } from "@/lib/db/client";
import { registrations, events, organisations } from "@/lib/db/schema";
import { eq, or, isNull } from "drizzle-orm";
import { AIRTABLE_FIELDS } from "@/lib/airtable";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const BATCH_SIZE = 10; // Airtable max per request

interface SyncResult {
  synced: number;
  failed: number;
  skipped: number;
  errors: Array<{ registrationId: string; error: string }>;
}

/**
 * Build the Airtable fields object for a single registration row.
 * Linked records (Event, Organization) are resolved via their airtable_record_id.
 */
function buildAirtableFields(
  reg: typeof registrations.$inferSelect,
  eventAirtableId: string | null,
  orgName: string | null,
) {
  const F = AIRTABLE_FIELDS.REGISTRATION;

  // NOTE: "Record ID" is autoNumber in Airtable (computed) — do NOT send it.
  const fields: Record<string, unknown> = {
    [F.FIRST_NAME]: reg.attendeeName,
    [F.LAST_NAME]: reg.attendeeSurname,
    [F.ROLE]: reg.role,
  };

  // Event — linked record (array of Airtable Record IDs)
  if (eventAirtableId) {
    fields[F.EVENT] = [eventAirtableId];
  }

  // Organisation — singleLineText in Airtable, send org name as plain text
  if (orgName) {
    fields[F.ORGANIZATION] = orgName;
  }

  // Optional text / email
  if (reg.email) fields[F.EMAIL] = reg.email;

  // Impairment — checkbox in Airtable. Convert "Yes" → true, else omit.
  if (reg.impairment && reg.impairment.toLowerCase() === "yes") {
    fields[F.IMPAIRMENT] = true;
  }

  // Checkboxes — only send true, omit for false/null
  if (reg.photoConsent) fields[F.PHOTO_CONSENT] = true;
  if (reg.feedbackConsent) fields[F.FEEDBACK_CONSENT] = true;
  if (reg.nextEventConsent) fields[F.NEXT_EVENT_CONSENT] = true;

  // Group-specific fields
  if (reg.role === "Group") {
    if (reg.groupSize != null) fields[F.GROUP_SIZE] = reg.groupSize;
    if (reg.disabledStudents != null) fields[F.DISABLED_STUDENTS] = reg.disabledStudents;
    if (reg.senStudents != null) fields[F.SEN_STUDENTS] = reg.senStudents;
    if (reg.groupLeaderParticipating) fields[F.LEADER_PARTICIPATING] = true;
  }

  return fields;
}

/**
 * Batch-create records in Airtable. Returns array of created record IDs.
 */
async function createAirtableBatch(
  records: Array<{ fields: Record<string, unknown> }>
): Promise<string[]> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Registrations`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  // Return created Airtable record IDs (positional — matches input order)
  return (data.records as Array<{ id: string }>).map((rec) => rec.id);
}

/**
 * Main sync function — called from the P2I admin page.
 * Fetches pending registrations, pushes to Airtable in batches, updates sync status.
 */
export async function syncRegistrationsToAirtable(): Promise<SyncResult> {
  console.log("[airtable-sync] Starting sync...");
  console.log("[airtable-sync] AIRTABLE_API_KEY set:", !!AIRTABLE_API_KEY);
  console.log("[airtable-sync] AIRTABLE_BASE_ID set:", !!AIRTABLE_BASE_ID, AIRTABLE_BASE_ID ? `(${AIRTABLE_BASE_ID.substring(0, 6)}...)` : "");

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error("Airtable credentials not configured");
  }

  const result: SyncResult = { synced: 0, failed: 0, skipped: 0, errors: [] };

  // 1. Fetch pending registrations (pending, failed, or null sync_status)
  const pendingRegs = await db
    .select()
    .from(registrations)
    .where(or(eq(registrations.syncStatus, "pending"), eq(registrations.syncStatus, "failed"), isNull(registrations.syncStatus)));

  console.log(`[airtable-sync] Found ${pendingRegs.length} pending registrations`);

  if (pendingRegs.length === 0) {
    return result;
  }

  // 2. Pre-fetch event and org airtable IDs for lookups
  const eventIds = [...new Set(pendingRegs.map((r) => r.eventId))];
  console.log(`[airtable-sync] Event IDs:`, eventIds);
  const eventRows = await db.select().from(events).where(
    // fetch all events that match any of the event IDs
    // Using a simple approach since we typically have 1 event
    eq(events.id, eventIds[0])
  );
  console.log(`[airtable-sync] Event rows:`, eventRows.map(e => ({ id: e.id, name: e.name, airtableRecordId: e.airtableRecordId })));
  // Build lookup map
  const eventMap = new Map(eventRows.map((e) => [e.id, e.airtableRecordId]));

  // Fetch multiple events if needed
  for (const eid of eventIds.slice(1)) {
    const rows = await db.select().from(events).where(eq(events.id, eid));
    if (rows[0]) eventMap.set(rows[0].id, rows[0].airtableRecordId);
  }


  // Org lookups — fetch org names (Organisation field is singleLineText in Airtable)
  const orgIds = [...new Set(pendingRegs.filter((r) => r.organizationId).map((r) => r.organizationId!))];
  const orgMap = new Map<string, string | null>();
  for (const oid of orgIds) {
    const rows = await db.select().from(organisations).where(eq(organisations.id, oid));
    if (rows[0]) orgMap.set(rows[0].id, rows[0].name);
  }

  // 3. Process in batches of BATCH_SIZE
  for (let i = 0; i < pendingRegs.length; i += BATCH_SIZE) {
    const batch = pendingRegs.slice(i, i + BATCH_SIZE);

    // Build Airtable records for this batch
    const airtableRecords: Array<{ fields: Record<string, unknown> }> = [];
    const batchRegIds: string[] = [];

    for (const reg of batch) {
      const eventAirtableId = eventMap.get(reg.eventId) ?? null;

      if (!eventAirtableId) {
        // Can't sync without event link — skip
        console.warn(`[airtable-sync] Skipping reg ${reg.id}: event ${reg.eventId} has no airtable_record_id`);
        result.skipped++;
        result.errors.push({
          registrationId: reg.id,
          error: "Event has no Airtable record ID — cannot link",
        });
        await db
          .update(registrations)
          .set({ syncStatus: "failed" })
          .where(eq(registrations.id, reg.id));
        continue;
      }

      const orgName = reg.organizationId
        ? (orgMap.get(reg.organizationId) ?? null)
        : null;

      const fields = buildAirtableFields(reg, eventAirtableId, orgName);
      airtableRecords.push({ fields });
      batchRegIds.push(reg.id);
    }

    if (airtableRecords.length === 0) continue;

    try {
      console.log(`[airtable-sync] Sending batch of ${airtableRecords.length} records to Airtable...`);
      const created = await createAirtableBatch(airtableRecords);
      console.log(`[airtable-sync] Batch success: ${created.length} records created`);

      // Update Neon with returned Airtable record IDs (positional match)
      for (let j = 0; j < created.length; j++) {
        await db
          .update(registrations)
          .set({
            syncStatus: "synced",
            airtableRecordId: created[j],
            modifiedAt: new Date(),
          })
          .where(eq(registrations.id, batchRegIds[j]));
        result.synced++;
      }
    } catch (error) {
      // Mark entire batch as failed
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      console.error(`[airtable-sync] Batch failed:`, errMsg);
      for (const regId of batchRegIds) {
        await db
          .update(registrations)
          .set({ syncStatus: "failed", modifiedAt: new Date() })
          .where(eq(registrations.id, regId));
        result.failed++;
        result.errors.push({ registrationId: regId, error: errMsg });
      }
    }

    // Rate limiting — wait 250ms between batches (Airtable allows 5 req/sec)
    if (i + BATCH_SIZE < pendingRegs.length) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  return result;
}