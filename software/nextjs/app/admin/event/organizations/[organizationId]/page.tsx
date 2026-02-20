'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Registration, Organization, Event } from '@/lib/types';
import { getRegistrationsByOrganization, getOrganizationById, getCurrentEvent } from '@/lib/actions';

export default function OrganizationRegistrationsPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
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
        setIsLoading(false);
      }
    }

    loadData();
  }, [organizationId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600">{error}</div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const participantRegistrations = registrations.filter(r => r.role === 'Participant');
  const groupRegistration = registrations.find(r => r.role === 'Group');
  const expectedCount = groupRegistration?.groupSize || 0;
  const registeredCount = participantRegistrations.length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{organization?.name}</h1>
          <p className="text-gray-600 mt-1">Event: {currentEvent?.name}</p>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Expected Participants</p>
              <p className="text-2xl font-bold text-gray-900">{expectedCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Registered Participants</p>
              <p className="text-2xl font-bold text-gray-900">{registeredCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Missing Registrations</p>
              <p className={`text-2xl font-bold ${expectedCount > registeredCount ? 'text-yellow-600' : 'text-green-600'}`}>
                {Math.max(0, expectedCount - registeredCount)}
              </p>
            </div>
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Registered Participants ({participantRegistrations.length})
          </h2>
          
          {participantRegistrations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No participants have registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {participantRegistrations.map((reg) => (
                    <tr key={reg.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {reg.attendeeName} {reg.attendeeSurname}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{reg.email}</td>
                      <td className="py-3 px-4 text-center">
                        {reg.checkinTime ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

