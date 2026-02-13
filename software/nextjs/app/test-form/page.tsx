"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RegistrationForm } from "@/components/registration-form";
import { EventHeader } from "@/components/event-header";
import { AdminLoginModal } from "@/components/admin-login-modal";
import type { RegistrationRole } from "@/lib/types";

export default function TestFormPage() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const searchParams = useSearchParams();
  const [preselectedRole, setPreselectedRole] = useState<RegistrationRole | undefined>();

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "Participant" || roleParam === "Volunteer" || roleParam === "Group") {
      setPreselectedRole(roleParam as RegistrationRole);
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Event Header */}
      <EventHeader
        eventName="PowerHouseGames 2026"
        eventDate="Saturday, 15th March 2026"
        eventLocation="Cambridge United Community Centre"
      />

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Test Page Notice */}
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <p className="text-sm text-orange-800 font-medium">
            ⚠️ Test Page - Form UI Only (No Database)
          </p>
          <p className="text-xs text-orange-600 mt-1">
            Form data is logged to the browser console
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

