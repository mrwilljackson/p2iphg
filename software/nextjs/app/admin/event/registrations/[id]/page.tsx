"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminEventHeader } from "@/components/admin-event-header";
import { Button } from "@/components/ui/button";
import { getRegistrationById } from "@/lib/actions";
import type { Registration } from "@/lib/types";

export default function RegistrationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const registrationId = params.id as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loadingRegistration, setLoadingRegistration] = useState(true);

  // Check authentication
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && (adminLevel === "event" || adminLevel === "p2i")) {
      setIsAuthenticated(true);
    } else {
      router.push("/test-form");
    }
    setIsLoading(false);
  }, [router]);

  // Load registration
  useEffect(() => {
    async function loadRegistration() {
      if (!registrationId) return;
      
      setLoadingRegistration(true);
      try {
        const reg = await getRegistrationById(registrationId);
        setRegistration(reg);
      } catch (error) {
        console.error("Error loading registration:", error);
      } finally {
        setLoadingRegistration(false);
      }
    }
    loadRegistration();
  }, [registrationId]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminLevel");
    router.push("/test-form");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Event Header */}
      <AdminEventHeader />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Registration Details
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/event/registrations")}
              >
                ← Back to List
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        {loadingRegistration ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Loading registration details...</p>
          </div>
        ) : !registration ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-gray-600">Registration not found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            {/* Basic Information */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="First Name" value={registration.attendeeName} />
                <DetailField label="Last Name" value={registration.attendeeSurname} />
                <DetailField label="Email" value={registration.email || '—'} />
                <DetailField
                  label="Role"
                  value={
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      registration.role === 'Participant' ? 'bg-blue-100 text-blue-800' :
                      registration.role === 'Volunteer' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {registration.role}
                    </span>
                  }
                />
                {registration.organizationName && (
                  <DetailField label="Organization" value={registration.organizationName} />
                )}
              </div>
            </div>

            {/* Accessibility */}
            {registration.impairment && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Accessibility Needs</h2>
                <DetailField label="Impairment / Accessibility Needs" value={registration.impairment} />
              </div>
            )}

            {/* Group Information */}
            {registration.role === 'Group' && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DetailField label="Group Size" value={registration.groupSize?.toString() || '—'} />
                  <DetailField label="Disabled Students" value={registration.disabledStudents?.toString() || '—'} />
                  <DetailField label="SEN Students" value={registration.senStudents?.toString() || '—'} />
                </div>
                <div className="mt-4">
                  <DetailField 
                    label="Group Leader Participating" 
                    value={registration.groupLeaderParticipating ? 'Yes' : 'No'} 
                  />
                </div>
              </div>
            )}

            {/* Consent Information */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Consent</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField 
                  label="Photo Consent" 
                  value={registration.photoConsent ? '✅ Yes' : '🟧 No (Orange Wristband)'} 
                />
                <DetailField 
                  label="Feedback Consent" 
                  value={registration.feedbackConsent ? '✅ Yes' : '❌ No'} 
                />
                <DetailField 
                  label="Next Event Consent" 
                  value={registration.nextEventConsent ? '✅ Yes' : '❌ No'} 
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailField label="Registration ID" value={registration.id || '—'} className="font-mono text-xs" />
                <DetailField label="Sync Status" value={registration.syncStatus || 'pending'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for displaying field details
function DetailField({ 
  label, 
  value, 
  className = "" 
}: { 
  label: string; 
  value: React.ReactNode; 
  className?: string;
}) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className={`text-sm text-gray-900 ${className}`}>{value}</dd>
    </div>
  );
}

