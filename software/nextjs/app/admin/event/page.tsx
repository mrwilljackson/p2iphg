"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminEventHeader } from "@/components/admin-event-header";
import { getCurrentEvent, getRegistrationCountsByRole } from "@/lib/actions";
import type { Event } from "@/lib/types";
import type { ParticipantCounts } from "@/lib/participant-counting";

export default function EventAdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [counts, setCounts] = useState<ParticipantCounts>({
    individualParticipants: 0,
    groupParticipants: {
      familyAndDisability: {
        expected: 0,
        registered: 0,
      },
      otherGroups: {
        expected: 0,
        registered: 0,
      },
      total: {
        expected: 0,
        registered: 0,
      },
    },
    totalParticipants: 0,
    disabledStudents: 0,
    senStudents: 0,
    volunteers: 0,
    groups: {
      total: 0,
      familyGroups: 0,
      disabilityGroups: 0,
      corporateGroups: 0,
      sportingGroups: 0,
      communityGroups: 0,
      educationalGroups: 0,
      otherGroups: 0,
    },
    totalRegistrations: 0,
  });

  // Load current event and registration counts
  useEffect(() => {
    async function loadData() {
      const event = await getCurrentEvent();
      setCurrentEvent(event);

      if (event) {
        const registrationCounts = await getRegistrationCountsByRole(event.id);
        setCounts(registrationCounts);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    // Check if user is authenticated as Event Admin
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && (adminLevel === "event" || adminLevel === "p2i")) {
      setIsAuthenticated(true);
    } else {
      // Redirect to test-form if not authenticated
      router.push("/test-form");
    }
    setIsLoading(false);
  }, [router]);

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
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Event Header */}
      <AdminEventHeader />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Event Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">PowerHouseGames Event Management</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Log out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalParticipants}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>Individual: {counts.individualParticipants}</div>
                  <div>Group (Registered): {counts.groupParticipants.total.registered}</div>
                  <div className="text-[10px] text-gray-400">
                    Expected: {counts.groupParticipants.total.expected}
                  </div>
                </div>
              </div>
              <div className="text-4xl ml-4">🎯</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.groups.total}</p>
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Family: {counts.groups.familyGroups}</span>
                    <span>Disability: {counts.groups.disabilityGroups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Corporate: {counts.groups.corporateGroups}</span>
                    <span>Sporting: {counts.groups.sportingGroups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Community: {counts.groups.communityGroups}</span>
                    <span>Educational: {counts.groups.educationalGroups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other: {counts.groups.otherGroups}</span>
                  </div>
                </div>
              </div>
              <div className="text-4xl ml-4">👨‍👩‍👧‍👦</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Volunteers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.volunteers}</p>
              </div>
              <div className="text-4xl">🙋</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-6">
          {/* New Registrations */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">New Registrations</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start text-lg h-16 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => router.push("/test-form?role=Participant")}
              >
                🎯 New Participant Registration
              </Button>
              <Button
                className="w-full justify-start text-lg h-16 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => router.push("/test-form?role=Group")}
              >
                👨‍👩‍👧‍👦 New Group Registration
              </Button>

            </div>
          </div>

          {/* Admin Functions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Functions</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start text-lg h-16 bg-lime-500 hover:bg-lime-600 text-white"
                onClick={() => router.push("/admin/event/register-volunteer")}
              >
                🙋 New Volunteer Registration
              </Button>
              <Button
                className="w-full justify-start text-lg h-16 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => router.push("/admin/event/register-organization")}
              >
                🏢 Add New Organization or Group
              </Button>
            </div>
          </div>

          {/* Reports & Data */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reports & Data</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start text-lg h-16"
                variant="outline"
                onClick={() => router.push("/admin/event/registrations")}
              >
                📋 View All Registrations
              </Button>
              <Button
                className="w-full justify-start text-lg h-16"
                variant="outline"
              >
                📸 Photo Consent Report
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

