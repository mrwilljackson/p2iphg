"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentEvent, getEventById } from "@/lib/actions";
import { getRegistrationCountsByRole, getAllRegistrations } from "@/lib/actions";
import type { Event, Registration } from "@/lib/types";
import type { ParticipantCounts } from "@/lib/participant-counting";

interface GroupReportRow {
  groupName: string;
  groupType: string;
  registeredParticipants: number;
  expectedParticipants: number;
  groupLeaderName: string;
  groupLeaderEmail: string;
}

export default function EventReportPage() {
  const router = useRouter();
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [reportData, setReportData] = useState<GroupReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);

      // Check if P2I admin has selected a specific event to administer
      const administeringEventId = sessionStorage.getItem('administeringEventId');

      let event: Event | null = null;

      if (administeringEventId) {
        // P2I admin is administering a specific event
        event = await getEventById(administeringEventId);
      } else {
        // Regular Event Admin - use current active event
        event = await getCurrentEvent();
      }

      setCurrentEvent(event);

      if (event) {
        // Get registration counts
        const counts = await getRegistrationCountsByRole(event.id);
        
        // Get all registrations to find group leaders
        const allRegistrations = await getAllRegistrations(event.id);
        
        // Build report data
        const rows: GroupReportRow[] = counts.groupDetails.map((group) => {
          // Find the group leader registration (role='Group')
          const groupLeaderReg = allRegistrations.find(
            (reg) => reg.role === 'Group' && reg.organizationId === group.organizationId
          );

          return {
            groupName: group.organizationName,
            groupType: group.groupType || 'Other',
            registeredParticipants: group.registered,
            expectedParticipants: group.expected,
            groupLeaderName: groupLeaderReg 
              ? `${groupLeaderReg.attendeeName} ${groupLeaderReg.attendeeSurname}`
              : 'N/A',
            groupLeaderEmail: groupLeaderReg?.email || 'N/A',
          };
        });

        setReportData(rows);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading report...</div>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">No event found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/event')}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Group Registration Report</h1>
          <p className="text-gray-600 mt-2">{currentEvent.name} - {new Date(currentEvent.date).toLocaleDateString()}</p>
        </div>

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Type
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered Participants
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Leader Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group Leader Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No groups registered yet
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.groupName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.groupType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center font-semibold">
                        {row.registeredParticipants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                        {row.expectedParticipants}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.groupLeaderName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {row.groupLeaderEmail}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-600">
            Total Groups: <span className="font-semibold">{reportData.length}</span>
          </p>
          <p className="text-gray-600">
            Total Registered Participants: <span className="font-semibold">
              {reportData.reduce((sum, row) => sum + row.registeredParticipants, 0)}
            </span>
          </p>
          <p className="text-gray-600">
            Total Expected Participants: <span className="font-semibold">
              {reportData.reduce((sum, row) => sum + row.expectedParticipants, 0)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

