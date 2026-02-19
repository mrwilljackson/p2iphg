"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getCurrentEvent, getRegistrationCountsByRole } from "@/lib/actions";
import type { Event } from "@/lib/types";

export default function P2IAdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [counts, setCounts] = useState({
    participants: 0,
    groups: 0,
    volunteers: 0,
    total: 0,
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
    // Check if user is authenticated as P2I Admin
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && adminLevel === "p2i") {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">P2I Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Power2Inspire System Administration</p>
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.total}</p>
              </div>
              <div className="text-4xl">👥</div>
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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">7</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">1</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Event Management */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Management</h2>
            <div className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push("/test-form")}
              >
                📝 Registration Form
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/admin/event")}
              >
                🎯 Event Admin View
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/admin/event/registrations")}
              >
                📋 All Registrations
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⬇️ Export to CSV
              </Button>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                👥 Manage Volunteers
              </Button>
              <Button className="w-full justify-start" variant="outline">
                🏢 Manage Organizations
              </Button>
              <Button className="w-full justify-start" variant="outline">
                📅 Manage Events
              </Button>
              <Button className="w-full justify-start text-red-600 hover:text-red-700" variant="outline">
                🗑️ Clear Database
              </Button>
            </div>
          </div>

          {/* System Integration */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Integration</h2>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                🔄 Sync with Airtable
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⬇️ Import from Airtable
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⬆️ Export to Airtable
              </Button>
              <Button className="w-full justify-start" variant="outline">
                ⚙️ Airtable Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

