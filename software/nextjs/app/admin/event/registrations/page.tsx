"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminEventHeader } from "@/components/admin-event-header";
import { Button } from "@/components/ui/button";
import { getAllRegistrations, getCurrentEvent, getEventById } from "@/lib/actions";
import type { Registration, Event } from "@/lib/types";

export default function RegistrationsListPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);

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

  // Load current event
  useEffect(() => {
    async function loadEvent() {
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
    }
    loadEvent();
  }, []);

  // Load registrations
  useEffect(() => {
    async function loadRegistrations() {
      if (!currentEvent) return;
      
      setLoadingRegistrations(true);
      try {
        const regs = await getAllRegistrations(currentEvent.id!);
        setRegistrations(regs);
      } catch (error) {
        console.error("Error loading registrations:", error);
      } finally {
        setLoadingRegistrations(false);
      }
    }
    loadRegistrations();
  }, [currentEvent]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Admin Event Header */}
      <AdminEventHeader />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              All Registrations
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/event")}
              >
                ← Back to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
          <p className="text-gray-600">
            {currentEvent?.name} - {registrations.length} registration{registrations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {loadingRegistrations ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading registrations...</p>
            </div>
          ) : registrations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-600">No registrations yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations.map((registration) => (
                    <tr
                      key={registration.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/event/registrations/${registration.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.attendeeName} {registration.attendeeSurname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registration.role === 'Participant' ? 'bg-blue-100 text-blue-800' :
                          registration.role === 'Volunteer' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {registration.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {registration.organizationName || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/event/registrations/${registration.id}`);
                          }}
                        >
                          View Details →
                        </Button>
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

