"use client";

import { useEffect, useState } from "react";
import { getCurrentEvent, getEventById } from "@/lib/actions";
import { TestFormContent } from "@/components/test-form-content";
import type { Event } from "@/lib/types";

export default function TestFormPage() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        // Check if P2I admin has selected a specific event to administer
        const administeringEventId = sessionStorage.getItem('administeringEventId');

        let event: Event | null = null;

        if (administeringEventId) {
          // P2I admin is administering a specific event
          event = await getEventById(administeringEventId);
        } else {
          // Regular users - use current active event
          event = await getCurrentEvent();
        }

        setCurrentEvent(event);
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return <TestFormContent currentEvent={currentEvent} />;
}

