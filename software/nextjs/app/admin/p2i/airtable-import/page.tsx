"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AirtableImportPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
              <h1 className="text-2xl font-bold text-gray-900">Airtable Import</h1>
              <p className="text-sm text-gray-600 mt-1">Import data from Airtable to Neon Database</p>
            </div>
            <Button
              onClick={() => router.push("/admin/p2i")}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Events */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📅 Import Events</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import event data from Airtable Events table
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fetch all events from Airtable</li>
                  <li>Create new events in Neon database</li>
                  <li>Store Airtable Record IDs for sync</li>
                </ul>
              </div>
              <Button className="w-full">
                Import Events
              </Button>
            </div>
          </div>

          {/* Import Organizations */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🏢 Import Organizations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import organization data from Airtable Organizations table
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fetch all organizations from Airtable</li>
                  <li>Link to events via Airtable Record IDs</li>
                  <li>Create organizations in Neon database</li>
                </ul>
              </div>
              <Button className="w-full">
                Import Organizations
              </Button>
            </div>
          </div>

          {/* Import Volunteers */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">🙋 Import Volunteers</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import volunteer data from Airtable Volunteers table
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fetch all volunteers from Airtable</li>
                  <li>Link to events via Airtable Record IDs</li>
                  <li>Create volunteers in Neon database</li>
                </ul>
              </div>
              <Button className="w-full">
                Import Volunteers
              </Button>
            </div>
          </div>

          {/* Import Registrations */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📋 Import Registrations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import registration data from Airtable Registrations table
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fetch all registrations from Airtable</li>
                  <li>Link to events and organizations</li>
                  <li>Create registrations in Neon database</li>
                </ul>
              </div>
              <Button className="w-full">
                Import Registrations
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

