"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface AirtableEvent {
  airtableRecordId: string;
  name: string;
  date: string;
  location: string | null;
  description: string | null;
  status: string;
}

export default function AirtableImportPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Events state
  const [availableEvents, setAvailableEvents] = useState<AirtableEvent[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isFetchingEvents, setIsFetchingEvents] = useState(false);
  const [isImportingEvents, setIsImportingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [eventsSuccess, setEventsSuccess] = useState<string | null>(null);

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

  // Fetch available events from Airtable
  const handleFetchEvents = async () => {
    setIsFetchingEvents(true);
    setEventsError(null);
    setEventsSuccess(null);
    setAvailableEvents([]);
    setSelectedEventIds([]);

    try {
      const response = await fetch('/api/airtable/events');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events');
      }

      setAvailableEvents(data.events);
      setEventsSuccess(`Found ${data.count} future event(s) in Airtable`);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : 'Failed to fetch events');
    } finally {
      setIsFetchingEvents(false);
    }
  };

  // Toggle event selection
  const toggleEventSelection = (recordId: string) => {
    setSelectedEventIds(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // Import selected events
  const handleImportEvents = async () => {
    if (selectedEventIds.length === 0) {
      setEventsError('Please select at least one event to import');
      return;
    }

    setIsImportingEvents(true);
    setEventsError(null);
    setEventsSuccess(null);

    try {
      const response = await fetch('/api/airtable/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventIds: selectedEventIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import events');
      }

      // Build success message
      const messages = [];
      if (data.created > 0) messages.push(`${data.created} created`);
      if (data.updated > 0) messages.push(`${data.updated} updated`);
      if (data.failed > 0) messages.push(`${data.failed} failed`);

      const successMsg = `✅ Import complete: ${messages.join(', ')}`;
      setEventsSuccess(successMsg);

      // Show errors if any
      if (data.importErrors && data.importErrors.length > 0) {
        const errorMsg = data.importErrors
          .map((e: any) => `${e.eventName}: ${e.error}`)
          .join('; ');
        setEventsError(`Some imports failed: ${errorMsg}`);
      }

      setSelectedEventIds([]);
      // Optionally refresh the list
      // handleFetchEvents();
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : 'Failed to import events');
    } finally {
      setIsImportingEvents(false);
    }
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
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 md:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📅 Import Events</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import future event data from Airtable Events table
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1: Fetch Events */}
              <div>
                <Button
                  className="w-full"
                  onClick={handleFetchEvents}
                  disabled={isFetchingEvents}
                >
                  {isFetchingEvents ? 'Fetching Events...' : '1. Fetch Future Events from Airtable'}
                </Button>
              </div>

              {/* Success/Error Messages */}
              {eventsSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">✅ {eventsSuccess}</p>
                </div>
              )}
              {eventsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">❌ {eventsError}</p>
                </div>
              )}

              {/* Step 2: Select Events */}
              {availableEvents.length > 0 && (
                <div className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    2. Select Events to Import ({selectedEventIds.length} selected)
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableEvents.map((event) => (
                      <div
                        key={event.airtableRecordId}
                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md border border-gray-100"
                      >
                        <Checkbox
                          checked={selectedEventIds.includes(event.airtableRecordId)}
                          onCheckedChange={() => toggleEventSelection(event.airtableRecordId)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{event.name}</p>
                          <p className="text-xs text-gray-600">
                            📅 {new Date(event.date).toLocaleDateString('en-GB', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {event.location && (
                            <p className="text-xs text-gray-500">📍 {event.location}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            ID: {event.airtableRecordId}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'planned'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Import Selected Events */}
              {availableEvents.length > 0 && (
                <div>
                  <Button
                    className="w-full"
                    onClick={handleImportEvents}
                    disabled={isImportingEvents || selectedEventIds.length === 0}
                    variant={selectedEventIds.length > 0 ? "default" : "outline"}
                  >
                    {isImportingEvents
                      ? 'Importing...'
                      : `3. Import ${selectedEventIds.length} Selected Event(s) to Neon`
                    }
                  </Button>
                </div>
              )}

              {/* Instructions */}
              {availableEvents.length === 0 && !isFetchingEvents && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">How to import events:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Click "Fetch Future Events" to retrieve events from Airtable</li>
                    <li>Select the events you want to import</li>
                    <li>Click "Import" to add them to your Neon database</li>
                  </ol>
                  <p className="mt-3 text-xs text-gray-500">
                    Note: Only future events (today and onwards) will be shown
                  </p>
                </div>
              )}
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

