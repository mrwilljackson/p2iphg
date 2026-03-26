'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Registration, Organization, Event, OrgContactOption } from '@/lib/types';
import { getRegistrationsByOrganization, getOrganizationById, getCurrentEvent, getEventById, getOrgContactsForEvent } from '@/lib/actions';
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
  const [orgContacts, setOrgContacts] = useState<OrgContactOption[]>([]);
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

        // Respect administeringEventId (set when P2I admin selects a specific event)
        const administeringEventId = sessionStorage.getItem('administeringEventId');
        const event = administeringEventId
          ? await getEventById(administeringEventId)
          : await getCurrentEvent();
        if (!event) {
          setError('No active event found');
          return;
        }
        setCurrentEvent(event);

        // Get organization details scoped to this event (ensures correct openGroup value)
        const org = await getOrganizationById(organizationId, event.id);
        if (!org) {
          setError('Organization not found');
          return;
        }
        setOrganization(org);

        // Get registrations for this organization at this event
        const regs = await getRegistrationsByOrganization(event.id!, organizationId);
        setRegistrations(regs);

        // Get org contacts to identify missing group leaders
        const contacts = await getOrgContactsForEvent(event.id!, organizationId);
        setOrgContacts(contacts);
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
  const groupRegistrations = registrations.filter(r => r.role === 'Group');

  // Split group registrations into participating / non-participating leaders
  const participatingLeaders = groupRegistrations.filter(r => r.groupLeaderParticipating === true);
  const nonParticipatingLeaders = groupRegistrations.filter(r => !r.groupLeaderParticipating);

  // Calculate expected count.
  // If any group leader has registered, sum their groupSize values (confirmed on the day).
  // If not, fall back to expectedGroupSize from organisation_contacts (the pre-planned estimate).
  const totalGroupSize = groupRegistrations.reduce((sum, r) => sum + (r.groupSize || 0), 0);
  const expectedCount = groupRegistrations.length > 0
    ? totalGroupSize + participatingLeaders.length
    : (organization?.expectedGroupSize ?? 0);

  // Closed groups (openGroup === false) use groupSize from the registration as their registered count —
  // members don't register individually. Open groups count actual Participant registrations.
  const isClosed = organization?.openGroup === false;
  const registeredCount = isClosed
    ? expectedCount
    : participantRegistrations.length + participatingLeaders.length;

  // Build list of people to display in the participants table (only relevant for open groups).
  // Participating leaders are shown inline with participants; non-participating leaders get their own card.
  const displayRegistrations = [...participatingLeaders, ...participantRegistrations];

  // Org contacts who haven't registered yet (potential missing group leaders)
  const missingContacts = orgContacts.filter(c => !c.alreadyRegistered);

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
                    The Group Leader has confirmed attendance of <span className="font-bold">{expectedCount}</span> participant{expectedCount !== 1 ? 's' : ''}{participatingLeaders.length > 0 ? ', including themselves' : ''}.
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

            {/* Group Leader Card — all registered leaders in one card (closed: all; open: non-participating only) */}
            {(isClosed ? groupRegistrations : nonParticipatingLeaders).length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {isClosed ? 'Group Leader' : 'Group Leader (Not Participating)'}
                </h2>
                <div className="space-y-3">
                  {(isClosed ? groupRegistrations : nonParticipatingLeaders).map((reg) => (
                    <div key={reg.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {reg.attendeeName} {reg.attendeeSurname}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Email</p>
                          <p className="text-sm text-gray-600">{reg.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Group Leaders — org contacts who haven't registered yet */}
            {missingContacts.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-amber-200 p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Missing Group Leader{missingContacts.length !== 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Pre-registered contact{missingContacts.length !== 1 ? 's' : ''} who {missingContacts.length !== 1 ? 'have' : 'has'} not yet checked in on the day.
                </p>
                <div className="space-y-3">
                  {missingContacts.map((contact) => (
                    <div key={contact.contactId} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
                      <div className="text-amber-500 text-lg">⚠</div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-1">
                        <p className="text-sm font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{contact.email ?? '—'}</p>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                        Not registered
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Registrations Table - Only show for open groups (members register individually) */}
            {!isClosed && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {participatingLeaders.length > 0 ? 'Registered Participants (Including Leader)' : 'Registered Participants'} ({displayRegistrations.length})
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

