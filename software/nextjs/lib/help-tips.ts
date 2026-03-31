/**
 * Centralised help tip definitions.
 *
 * To add a new tip:
 *   1. Add an entry here with a descriptive key
 *   2. Place <HelpTip tipKey="your-key" /> next to the relevant UI element
 *
 * Each tip has a title (shown bold in the popover header) and text (the description).
 * Start each text with "Use this to " for consistency.
 */
export const helpTips: Record<string, { title: string; text: string }> = {
  // ── Manage Events page ──
  "manage-events-page": {
    title: "Manage Events",
    text: "Use this to view all events in the system, create new events, set one as the current active event, edit details, or generate summaries for completed events.",
  },
  "add-new-event": {
    title: "Add New Event",
    text: "Use this to create a new event with a name, date, location, and description. New events start with 'planned' status. Use 'Set as Current' to make one active for registrations.",
  },
};
