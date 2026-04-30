"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RegistrationForm } from "@/components/registration-form";
import { EventHeader } from "@/components/event-header";
import { AdminLoginModal } from "@/components/admin-login-modal";
import type { RegistrationRole, Event } from "@/lib/types";

interface TestFormContentProps {
  currentEvent: Event | null;
}

function TestFormContentInner({ currentEvent }: TestFormContentProps) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const searchParams = useSearchParams();

  // Read role synchronously during render so the form initialises with the correct
  // role on first render (avoids a race where loadData captures selectedRole="Participant").
  const roleParam = searchParams.get("role");
  let preselectedRole: RegistrationRole | undefined;
  if (roleParam) {
    const normalizedRole = roleParam.charAt(0).toUpperCase() + roleParam.slice(1).toLowerCase();
    if (normalizedRole === "Participant" || normalizedRole === "Volunteer" || normalizedRole === "Group") {
      preselectedRole = normalizedRole as RegistrationRole;
    }
  }

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

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Event Header — always shown for branding; event details only when active */}
      <EventHeader
        eventName={currentEvent?.name}
        eventDate={currentEvent ? formatDate(currentEvent.date) : undefined}
        eventLocation={currentEvent?.location || undefined}
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <RegistrationForm preselectedRole={preselectedRole} />
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Power2Inspire Event Registration System |{" "}
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-gray-600 hover:text-gray-900 underline transition-colors"
            >
              Admin
            </button>
            {process.env.NEXT_PUBLIC_COMMIT_SHA && (
              <>
                {" | "}
                <span className="font-mono">
                  {process.env.NEXT_PUBLIC_COMMIT_SHA.slice(0, 7)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        open={showAdminModal}
        onOpenChange={setShowAdminModal}
      />
    </div>
  );
}

export function TestFormContent({ currentEvent }: TestFormContentProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading registration form...</p>
        </div>
      </div>
    }>
      <TestFormContentInner currentEvent={currentEvent} />
    </Suspense>
  );
}

