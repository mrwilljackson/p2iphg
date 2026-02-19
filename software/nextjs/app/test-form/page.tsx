import { Suspense } from "react";
import { getCurrentEvent } from "@/lib/actions";
import { TestFormContent } from "@/components/test-form-content";
import type { Event } from "@/lib/types";

// Force dynamic rendering since we're fetching data from database
export const dynamic = 'force-dynamic';

export default async function TestFormPage() {
  // Fetch event data on the server
  const currentEvent = await getCurrentEvent();

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <TestFormContent currentEvent={currentEvent} />
    </Suspense>
  );
}

