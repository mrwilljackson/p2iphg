"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RegistrationForm } from "@/components/registration-form";
import { EventHeader } from "@/components/event-header";
import { AdminLoginModal } from "@/components/admin-login-modal";
import type { RegistrationRole, Event } from "@/lib/types";

interface TestFormContentProps {
  currentEvent: Event | null;
}

export function TestFormContent({ currentEvent }: TestFormContentProps) {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const searchParams = useSearchParams();
  const [preselectedRole, setPreselectedRole] = useState<RegistrationRole | undefined>();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "Participant" || roleParam === "Volunteer" || roleParam === "Group") {
      setPreselectedRole(roleParam as RegistrationRole);
    }
  }, [searchParams]);

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
      {/* Event Header */}
      {currentEvent && (
        <EventHeader
          eventName={currentEvent.name}
          eventDate={formatDate(currentEvent.date)}
          eventLocation={currentEvent.location || ""}
        />
      )}

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Test Page Notice */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800 font-medium">
            ✅ Registration form connected to online PHG database
          </p>
          <p className="text-xs text-blue-600 mt-1">
            (No Airtable sync yet)
          </p>
        </div>

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

