'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Registration, Organization, Event } from '@/lib/types';
import { getRegistrationsByOrganization, getOrganizationById, getCurrentEvent } from '@/lib/actions';
import { AdminEventHeader } from '@/components/admin-event-header';
import { Button } from '@/components/ui/button';

export default function OrganizationRegistrationsPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && (adminLevel === "event" || adminLevel === "p2i")) {
      setIsAuthenticated(true);
    } else {
      router.push("/registration");
    }
    setIsLoading(false);
  }, [router]);

  // Load data
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated) return;

      try {
        setLoadingData(true);
        setError(null);

        // Get active event
        const event = await getCurrentEvent();
        if (!event) {
          setError('No active event found');
          return;
        }
        setCurrentEvent(event);

        // Get organization details
        const org = await getOrganizationById(organizationId);
        if (!org) {
          setError('Organization not found');
          return;
        }
        setOrganization(org);

        // Get registrations for this organization at this event
        const regs = await getRegistrationsByOrganization(event.id!, organizationId);
        setRegistrations(regs);
      } catch (err) {
        console.error('Error loading organization registrations:', err);
        setError('Failed to load organization registrations');
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [organizationId, isAuthenticated]);

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

  const participantRegistrations = registrations.filter(r => r.role === 'Participant');
  const groupRegistration = registrations.find(r => r.role === 'Group');

  // Determine if group leader is participating
  const groupLeaderParticipating = groupRegistration?.groupLeaderParticipating || false;

  // Calculate expected count
  // Group Size = number of participants from organization (NOT including leader)
  // If leader is participating, add 1 to the expected count
  const groupSize = groupRegistration?.groupSize || 0;
  const expectedCount = groupSize + (groupLeaderParticipating ? 1 : 0);

  // Closed groups (openGroup === false) use groupSize from the registration as their registered count —
  // members don't register individually. Open groups count actual Participant registrations.
  const isClosed = organization?.openGroup === false;
  const registeredCount = isClosed
    ? expectedCount
    : participantRegistrations.length + (groupLeaderParticipating ? 1 : 0);

  // Build list of people to display (only relevant for open groups)
  // If leader is participating, include them in the participants list
  // If leader is NOT participating, show them separately
  const displayRegistrations = groupLeaderParticipating && groupRegistration
    ? [groupRegistration, ...participantRegistrations]
    : participantRegistrations;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Admin Event Header */}
      <AdminEventHeader />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {organization?.name || 'Organization Details'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {currentEvent?.name} - {
                  isClosed
                    ? `${expectedCount} confirmed participant${expectedCount !== 1 ? 's' : ''}`
                    : `${displayRegistrations.length} registered participant${displayRegistrations.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/event")}
              >
                ← Back
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loadingData && !error && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading organization details...</p>
            </div>
          </div>
        )}

        {/* Content - Only show when data is loaded and no error */}
        {!loadingData && !error && (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Summary</h2>

              {/* Closed Groups - Show confirmation message */}
              {isClosed ? (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-900">
                    The Group Leader has confirmed attendance of <span className="font-bold">{expectedCount}</span> participant{expectedCount !== 1 ? 's' : ''}{groupLeaderParticipating ? ', including themselves' : ''}.
                  </p>
                </div>
              ) : (
                /* Other Groups - Show expected/registered/missing counts */
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Expected</p>
                    <p className="text-2xl font-bold text-gray-900">{expectedCount}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Registered</p>
                    <p className="text-2xl font-bold text-gray-900">{registeredCount}</p>
                  </div>
                  <div className={`text-center p-4 rounded-lg ${expectedCount > registeredCount ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <p className="text-xs font-medium text-gray-600 mb-2">Missing</p>
                    <p className={`text-2xl font-bold ${expectedCount > registeredCount ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.max(0, expectedCount - registeredCount)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Group Leader Card */}
            {/* Show for Family/Disability groups (always) OR for other groups (only if NOT participating) */}
            {groupRegistration && (isClosed || !groupLeaderParticipating) && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {isClosed ? 'Group Leader' : 'Group Leader (Not Participating)'}
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Name</p>
                      <p className="text-sm font-medium text-gray-900">
                        {groupRegistration.attendeeName} {groupRegistration.attendeeSurname}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Email</p>
                      <p className="text-sm text-gray-600">{groupRegistration.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations Table - Only show for open groups (members register individually) */}
            {!isClosed && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {groupLeaderParticipating ? 'Registered Participants (Including Leader)' : 'Registered Participants'} ({displayRegistrations.length})
                  </h2>
                </div>

                {displayRegistrations.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="text-gray-500">No participants have registered yet.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Expected {expectedCount} participant{expectedCount !== 1 ? 's' : ''} from this organization.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700">Name</th>
                          <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700">Role</th>
                          <th className="text-left py-3 px-4 sm:px-6 font-semibold text-gray-700">Email</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {displayRegistrations.map((reg) => (
                          <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 sm:px-6 text-gray-900 font-medium">
                              {reg.attendeeName} {reg.attendeeSurname}
                            </td>
                            <td className="py-3 px-4 sm:px-6">
                              {reg.role === 'Group' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Group Leader
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Participant
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 sm:px-6 text-gray-600">{reg.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

