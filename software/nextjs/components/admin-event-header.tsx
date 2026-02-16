"use client";

import { useState, useEffect } from "react";
import { EventHeader } from "@/components/event-header";
import { MockDataService } from "@/lib/mock-data-service";
import type { Event } from "@/lib/types";

/**
 * AdminEventHeader - Shared component for admin pages
 * Automatically loads and displays the current active event
 * 
 * Usage:
 * ```tsx
 * import { AdminEventHeader } from "@/components/admin-event-header";
 * 
 * export default function MyAdminPage() {
 *   return (
 *     <div>
 *       <AdminEventHeader />
 *       {/* rest of page content *\/}
 *     </div>
 *   );
 * }
 * ```
 */
export function AdminEventHeader() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  useEffect(() => {
    async function loadEvent() {
      const event = await MockDataService.getCurrentEvent();
      setCurrentEvent(event);
    }
    loadEvent();
  }, []);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!currentEvent) {
    return null; // Don't render anything until event is loaded
  }

  return (
    <EventHeader
      eventName={currentEvent.name}
      eventDate={formatDate(currentEvent.date)}
      eventLocation={currentEvent.location || ""}
    />
  );
}

