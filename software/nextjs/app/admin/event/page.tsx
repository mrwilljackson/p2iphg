"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminEventHeader } from "@/components/admin-event-header";
import { getCurrentEvent, getEventById, getRegistrationCountsByRole, getAllVolunteers, getAllRegistrations } from "@/lib/actions";
import type { Event, Volunteer, Registration } from "@/lib/types";
import type { ParticipantCounts } from "@/lib/participant-counting";

export default function EventAdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteerRegistrations, setVolunteerRegistrations] = useState<Registration[]>([]);
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
    groupDetails: [],
    totalParticipants: 0,
    disabledStudents: 0,
    senStudents: 0,
    volunteers: 0,
    groups: {
      total: 0,
      registered: 0,
      walkIns: 0,
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
      // Check if P2I admin has selected a specific event to administer
      const administeringEventId = sessionStorage.getItem('administeringEventId');

      console.log('Event Admin Dashboard - administeringEventId:', administeringEventId);

      let event: Event | null = null;

      if (administeringEventId) {
        // P2I admin is administering a specific event
        console.log('Loading administering event:', administeringEventId);
        event = await getEventById(administeringEventId);
      } else {
        // Regular Event Admin - use current active event
        console.log('Loading current active event');
        event = await getCurrentEvent();
      }

      console.log('Loaded event:', event?.name, event?.id);
      setCurrentEvent(event);

      if (event) {
        const registrationCounts = await getRegistrationCountsByRole(event.id);
        setCounts(registrationCounts);

        // Fetch all volunteers for this event
        const allVolunteers = await getAllVolunteers(event.id);
        setVolunteers(allVolunteers);

        // Fetch all registrations and filter for volunteers
        const allRegistrations = await getAllRegistrations(event.id);
        const volRegistrations = allRegistrations.filter(r => r.role === 'Volunteer');
        setVolunteerRegistrations(volRegistrations);
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
      // Redirect to registration if not authenticated
      router.push("/registration");
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminLevel");
    router.push("/registration");
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
              <h1 className="text-2xl font-bold text-gray-900">Event Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Power House Games Event Management</p>
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
        {/* Participants - Full width */}
        <div className="mb-4">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{counts.totalParticipants} Registered Participants</p>
                <div className="mt-2">
                  <span className="text-2xl text-gray-400 ml-2">({counts.individualParticipants + counts.groupParticipants.total.expected} expected)</span>
                </div>
              </div>
              <div className="text-4xl">🎯</div>
            </div>

            <div className="space-y-3">
              <div className="font-medium text-gray-700 border-b pb-2 text-sm">
                Individual Participants: {counts.individualParticipants}
              </div>

              {counts.groupDetails.length > 0 && (
                <div>
                  <div className="font-medium text-gray-700 mb-2 text-sm">Groups:</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 font-semibold text-gray-700">Group Name</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-700">Expected</th>
                          <th className="text-center py-2 px-3 font-semibold text-gray-700">Registered</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {counts.groupDetails.map((group) => {
                          const hasLowRegistration = group.expected > group.registered;
                          return (
                            <tr
                              key={group.organizationId}
                              onClick={() => router.push(`/admin/event/organizations/${group.organizationId}`)}
                              className={`border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors ${hasLowRegistration ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}
                            >
                              <td className={`py-2 px-3 font-bold text-gray-900 ${hasLowRegistration ? 'border-l-4 border-yellow-400' : ''}`}>
                                {group.organizationName}
                              </td>
                              <td className="py-2 px-3 text-center text-gray-600">
                                {group.expected}
                              </td>
                              <td className="py-2 px-3 text-center text-gray-600">
                                {group.registered}
                              </td>
                              <td className="py-2 px-3 text-center text-gray-400">
                                →
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Groups and Volunteers - 50% width each */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.groups.registered}</p>
                <div className="mt-2 space-y-1">
                  <div className="text-lg text-gray-400">({counts.groups.total} expected)</div>
                  {counts.groups.walkIns > 0 && (
                    <div className="text-sm text-blue-600">+ {counts.groups.walkIns} walk-in{counts.groups.walkIns !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
              <div className="text-4xl ml-4">👨‍👩‍👧‍👦</div>
            </div>

            <div className="text-xs text-gray-500 space-y-1 mt-4 pt-4 border-t border-gray-200">
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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{volunteerRegistrations.length} Helpers </p>
              </div>
              <div className="text-4xl">🙋</div>
            </div>

            {/* Volunteer List */}
            {(volunteers.length > 0 || volunteerRegistrations.length > 0) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Volunteer List:</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {/* Show volunteers from volunteers table */}
                  {volunteers.map((volunteer) => {
                    // Check if this volunteer has registered (has a registration with role='Volunteer')
                    const hasRegistered = volunteerRegistrations.some(
                      reg => reg.email?.toLowerCase() === volunteer.email.toLowerCase()
                    );

                    return (
                      <div
                        key={`vol-${volunteer.id}`}
                        className={`text-sm flex items-center ${
                          hasRegistered
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-400'
                        }`}
                      >
                        <span className="mr-2">{hasRegistered ? '✅' : '⏳'}</span>
                        <span>{volunteer.firstName} {volunteer.lastName}</span>
                      </div>
                    );
                  })}

                  {/* Show volunteer registrations that don't match anyone in volunteers table */}
                  {volunteerRegistrations
                    .filter(reg => {
                      // Only show if this registration doesn't match any volunteer in the table
                      return !volunteers.some(
                        vol => vol.email.toLowerCase() === reg.email?.toLowerCase()
                      );
                    })
                    .map((reg) => (
                      <div
                        key={`reg-${reg.id}`}
                        className="text-sm flex items-center text-gray-900 font-medium"
                      >
                        <span className="mr-2">✅</span>
                        <span>{reg.attendeeName} {reg.attendeeSurname}</span>
                        <span className="ml-2 text-xs text-gray-500">(walk-in)</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
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
                onClick={() => router.push("/registration?role=Participant")}
              >
                🎯 New Participant Registration
              </Button>
              <Button
                className="w-full justify-start text-lg h-16 bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => router.push("/registration?role=Group")}
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
                onClick={() => router.push("/admin/event/report")}
              >
                📊 Event Summary Report
              </Button>
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

