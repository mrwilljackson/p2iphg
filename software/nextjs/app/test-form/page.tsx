import { Suspense } from "react";
import { getCurrentEvent } from "@/lib/actions";
import { TestFormContent } from "@/components/test-form-content";
import type { Event } from "@/lib/types";

// Force dynamic rendering since we're fetching data from database
export const dynamic = 'force-dynamic';

export default async function TestFormPage() {
  // Fetch event data on the server
  const currentEvent = await getCurrentEvent();

  return <TestFormContent currentEvent={currentEvent} />;
}

