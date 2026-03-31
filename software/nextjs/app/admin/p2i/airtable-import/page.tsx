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

interface AirtableVolunteer {
  airtableRecordId: string;
  eventAirtableId: string | null;
  eventName: string;
  email: string;
  firstName: string;
  lastName: string;
  photoConsent: boolean;
  feedbackConsent: boolean;
  nextEventConsent: boolean;
}

interface AirtableOrganization {
  airtableRecordId: string;
  eventAirtableId: string | null;
  eventName: string;
  name: string;
  groupType: string;
  expectedGroupSize: number | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
}

interface AirtableOrganisationContact {
  airtableRecordId: string;
  organisationId: string | null;
  organisationName: string | null;
  airtableEventId: string | null;
  groupType: string | null;
  contactFirstName: string | null;
  contactLastName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  expectedGroupSize: string | null;
  notes: string | null;
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

  // Volunteers state
  const [availableVolunteers, setAvailableVolunteers] = useState<AirtableVolunteer[]>([]);
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<string[]>([]);
  const [isFetchingVolunteers, setIsFetchingVolunteers] = useState(false);
  const [isImportingVolunteers, setIsImportingVolunteers] = useState(false);
  const [volunteersError, setVolunteersError] = useState<string | null>(null);
  const [volunteersSuccess, setVolunteersSuccess] = useState<string | null>(null);

  // Organizations state
  const [availableOrganizations, setAvailableOrganizations] = useState<AirtableOrganization[]>([]);
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([]);
  const [isFetchingOrganizations, setIsFetchingOrganizations] = useState(false);
  const [isImportingOrganizations, setIsImportingOrganizations] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [organizationsSuccess, setOrganizationsSuccess] = useState<string | null>(null);

  // Organisation Contacts state
  const [availableContacts, setAvailableContacts] = useState<AirtableOrganisationContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [isImportingContacts, setIsImportingContacts] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactsSuccess, setContactsSuccess] = useState<string | null>(null);

  // Event filter state — set when user imports an event
  const [filterEventAirtableId, setFilterEventAirtableId] = useState<string | null>(null);
  const [filterEventName, setFilterEventName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated as P2I Admin
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && adminLevel === "p2i") {
      setIsAuthenticated(true);
    } else {
      // Redirect to registration if not authenticated
      router.push("/registration");
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

      // Auto-set the event filter to the first imported event
      if (selectedEventIds.length > 0) {
        const importedEvent = availableEvents.find(e => e.airtableRecordId === selectedEventIds[0]);
        if (importedEvent) {
          setFilterEventAirtableId(importedEvent.airtableRecordId);
          setFilterEventName(importedEvent.name);
        }
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

  // Clear event filter
  const handleClearEventFilter = () => {
    setFilterEventAirtableId(null);
    setFilterEventName(null);
  };

  // Set event filter from a fetched event (without importing)
  const handleSetEventFilter = (event: AirtableEvent) => {
    setFilterEventAirtableId(event.airtableRecordId);
    setFilterEventName(event.name);
  };

  // Computed filtered lists — filter by selected event, or show all if no filter
  // Contacts filter directly by their airtableEventId
  const filteredContacts = filterEventAirtableId
    ? availableContacts.filter(c => c.airtableEventId === filterEventAirtableId)
    : availableContacts;

  // Organisations don't have a direct event link — use the contacts to find
  // which org airtable record IDs are associated with the selected event
  const filteredOrganizations = filterEventAirtableId
    ? (() => {
        const orgIdsForEvent = new Set(
          filteredContacts
            .map(c => c.organisationId)
            .filter(Boolean)
        );
        return availableOrganizations.filter(o => orgIdsForEvent.has(o.airtableRecordId));
      })()
    : availableOrganizations;

  const filteredVolunteers = filterEventAirtableId
    ? availableVolunteers.filter(v => v.eventAirtableId === filterEventAirtableId)
    : availableVolunteers;

  // Fetch available volunteers from Airtable
  const handleFetchVolunteers = async () => {
    setIsFetchingVolunteers(true);
    setVolunteersError(null);
    setVolunteersSuccess(null);
    setAvailableVolunteers([]);
    setSelectedVolunteerIds([]);

    try {
      const response = await fetch('/api/airtable/volunteers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch volunteers');
      }

      setAvailableVolunteers(data.volunteers);
      setVolunteersSuccess(`Found ${data.count} volunteer(s) in Airtable`);
    } catch (error) {
      setVolunteersError(error instanceof Error ? error.message : 'Failed to fetch volunteers');
    } finally {
      setIsFetchingVolunteers(false);
    }
  };

  // Toggle volunteer selection
  const handleToggleVolunteer = (volunteerId: string) => {
    setSelectedVolunteerIds(prev =>
      prev.includes(volunteerId)
        ? prev.filter(id => id !== volunteerId)
        : [...prev, volunteerId]
    );
  };

  // Import selected volunteers
  const handleImportVolunteers = async () => {
    if (selectedVolunteerIds.length === 0) {
      setVolunteersError('Please select at least one volunteer to import');
      return;
    }

    setIsImportingVolunteers(true);
    setVolunteersError(null);
    setVolunteersSuccess(null);

    try {
      const response = await fetch('/api/airtable/volunteers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ volunteerIds: selectedVolunteerIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import volunteers');
      }

      // Build success message
      const messages = [];
      if (data.created > 0) messages.push(`${data.created} created`);
      if (data.updated > 0) messages.push(`${data.updated} updated`);
      if (data.failed > 0) messages.push(`${data.failed} failed`);

      const successMsg = `✅ Import complete: ${messages.join(', ')}`;
      setVolunteersSuccess(successMsg);

      // Show errors if any
      if (data.importErrors && data.importErrors.length > 0) {
        const errorMsg = data.importErrors
          .map((e: any) => `${e.volunteerName}: ${e.error}`)
          .join('; ');
        setVolunteersError(`Some imports failed: ${errorMsg}`);
      }

      setSelectedVolunteerIds([]);
    } catch (error) {
      setVolunteersError(error instanceof Error ? error.message : 'Failed to import volunteers');
    } finally {
      setIsImportingVolunteers(false);
    }
  };

  // Fetch available organizations from Airtable
  const handleFetchOrganizations = async () => {
    setIsFetchingOrganizations(true);
    setOrganizationsError(null);
    setOrganizationsSuccess(null);
    setAvailableOrganizations([]);
    setSelectedOrganizationIds([]);

    try {
      const response = await fetch('/api/airtable/organizations');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organizations');
      }

      setAvailableOrganizations(data.organizations);
      setOrganizationsSuccess(`Found ${data.count} organization(s) in Airtable`);
    } catch (error) {
      setOrganizationsError(error instanceof Error ? error.message : 'Failed to fetch organizations');
    } finally {
      setIsFetchingOrganizations(false);
    }
  };

  // Toggle organization selection
  const handleToggleOrganization = (organizationId: string) => {
    setSelectedOrganizationIds(prev =>
      prev.includes(organizationId)
        ? prev.filter(id => id !== organizationId)
        : [...prev, organizationId]
    );
  };

  // Import selected organizations
  const handleImportOrganizations = async () => {
    if (selectedOrganizationIds.length === 0) {
      setOrganizationsError('Please select at least one organization to import');
      return;
    }

    setIsImportingOrganizations(true);
    setOrganizationsError(null);
    setOrganizationsSuccess(null);

    try {
      const response = await fetch('/api/airtable/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationIds: selectedOrganizationIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import organizations');
      }

      // Build success message
      const messages = [];
      if (data.created > 0) messages.push(`${data.created} created`);
      if (data.updated > 0) messages.push(`${data.updated} updated`);
      if (data.failed > 0) messages.push(`${data.failed} failed`);

      const successMsg = `✅ Import complete: ${messages.join(', ')}`;
      setOrganizationsSuccess(successMsg);

      // Show errors if any
      if (data.importErrors && data.importErrors.length > 0) {
        const errorMsg = data.importErrors
          .map((e: any) => `${e.organizationName}: ${e.error}`)
          .join('; ');
        setOrganizationsError(`Some imports failed: ${errorMsg}`);
      }

      setSelectedOrganizationIds([]);
    } catch (error) {
      setOrganizationsError(error instanceof Error ? error.message : 'Failed to import organizations');
    } finally {
      setIsImportingOrganizations(false);
    }
  };

  // Fetch available organisation contacts from Airtable
  const handleFetchContacts = async () => {
    setIsFetchingContacts(true);
    setContactsError(null);
    setContactsSuccess(null);
    setAvailableContacts([]);
    setSelectedContactIds([]);

    try {
      const response = await fetch('/api/airtable/organisation-contacts');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch organisation contacts');
      }

      setAvailableContacts(data.contacts);
      setContactsSuccess(`Found ${data.count} organisation contact(s) in Airtable`);
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : 'Failed to fetch organisation contacts');
    } finally {
      setIsFetchingContacts(false);
    }
  };

  // Toggle contact selection
  const handleToggleContact = (contactId: string) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Import selected organisation contacts
  const handleImportContacts = async () => {
    if (selectedContactIds.length === 0) {
      setContactsError('Please select at least one contact to import');
      return;
    }

    setIsImportingContacts(true);
    setContactsError(null);
    setContactsSuccess(null);

    try {
      const response = await fetch('/api/airtable/organisation-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactIds: selectedContactIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to import organisation contacts');
      }

      const messages = [];
      if (data.created > 0) messages.push(`${data.created} created`);
      if (data.updated > 0) messages.push(`${data.updated} updated`);
      if (data.failed > 0) messages.push(`${data.failed} failed`);

      const successMsg = `✅ Import complete: ${messages.join(', ')}`;
      setContactsSuccess(successMsg);

      if (data.errors && data.errors.length > 0) {
        const errorMsg = data.errors
          .map((e: any) => `${e.contactName}: ${e.error}`)
          .join('; ');
        setContactsError(`Some imports failed: ${errorMsg}`);
      }

      setSelectedContactIds([]);
    } catch (error) {
      setContactsError(error instanceof Error ? error.message : 'Failed to import organisation contacts');
    } finally {
      setIsImportingContacts(false);
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
              <h1 className="text-2xl font-bold text-gray-900">P2I Admin Dashboard - Airtable Import</h1>
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

      {/* Event Filter Banner */}
      {filterEventAirtableId && filterEventName && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <p className="text-sm text-blue-800">
              🔍 <strong>Filtering by event:</strong> {filterEventName}
              <span className="text-xs text-blue-600 ml-2">({filterEventAirtableId})</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearEventFilter}
              className="text-blue-700 border-blue-300 hover:bg-blue-100"
            >
              ✕ Clear Filter
            </Button>
          </div>
        </div>
      )}

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
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : event.status === 'planned'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs ${filterEventAirtableId === event.airtableRecordId ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetEventFilter(event);
                            }}
                          >
                            {filterEventAirtableId === event.airtableRecordId ? '✓ Filtering' : '🔍 Use as Filter'}
                          </Button>
                        </div>
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
              <h2 className="text-xl font-semibold text-gray-900">🏢 Import Organisations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import organisation data from Airtable Organisations table
              </p>
            </div>
            <div className="space-y-4">
              {/* Step 1: Fetch Organizations */}
              <Button
                onClick={handleFetchOrganizations}
                disabled={isFetchingOrganizations}
                className="w-full"
              >
                {isFetchingOrganizations ? '⏳ Fetching...' : '1. Fetch Organizations from Airtable'}
              </Button>

              {/* Success/Error Messages */}
              {organizationsSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  {organizationsSuccess}
                </div>
              )}
              {organizationsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                  {organizationsError}
                </div>
              )}

              {/* Step 2: Select Organizations */}
              {filteredOrganizations.length > 0 && (
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    2. Select Organizations to Import ({selectedOrganizationIds.length} selected)
                    {filterEventAirtableId && (
                      <span className="text-xs text-blue-600 font-normal ml-2">
                        — showing {filteredOrganizations.length} of {availableOrganizations.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {filteredOrganizations.map((organization) => (
                      <div
                        key={organization.airtableRecordId}
                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md border border-gray-100"
                      >
                        <Checkbox
                          checked={selectedOrganizationIds.includes(organization.airtableRecordId)}
                          onCheckedChange={() => handleToggleOrganization(organization.airtableRecordId)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {organization.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {organization.groupType} • {organization.expectedGroupSize || 'N/A'} participants
                          </div>
                          <div className="text-sm text-gray-500">
                            Event: {organization.eventName}
                            {organization.eventAirtableId && (
                              <span className="text-xs text-gray-400"> ({organization.eventAirtableId})</span>
                            )}
                          </div>
                          {organization.contactEmail && (
                            <div className="text-sm text-gray-500">
                              Contact: {organization.contactFirstName} {organization.contactLastName} ({organization.contactEmail})
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Organization ID: {organization.airtableRecordId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Import Button */}
              {filteredOrganizations.length > 0 && (
                <Button
                  onClick={handleImportOrganizations}
                  disabled={selectedOrganizationIds.length === 0 || isImportingOrganizations}
                  className="w-full"
                  variant={selectedOrganizationIds.length > 0 ? "default" : "secondary"}
                >
                  {isImportingOrganizations
                    ? '⏳ Importing...'
                    : `3. Import ${selectedOrganizationIds.length} Selected Organization(s) to Neon`
                  }
                </Button>
              )}
            </div>
          </div>

          {/* Import Organisation Contacts */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">📇 Import Organisation Contacts</h2>
              <p className="text-sm text-gray-600 mt-1">
                Import organisation contact data from Airtable Organisation Contacts table
              </p>
            </div>
            <div className="space-y-4">
              {/* Step 1: Fetch Contacts */}
              <Button
                onClick={handleFetchContacts}
                disabled={isFetchingContacts}
                className="w-full"
              >
                {isFetchingContacts ? '⏳ Fetching...' : '1. Fetch Organisation Contacts from Airtable'}
              </Button>

              {/* Success/Error Messages */}
              {contactsSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  {contactsSuccess}
                </div>
              )}
              {contactsError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                  {contactsError}
                </div>
              )}

              {/* Step 2: Select Contacts */}
              {filteredContacts.length > 0 && (
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    2. Select Contacts to Import ({selectedContactIds.length} selected)
                    {filterEventAirtableId && (
                      <span className="text-xs text-blue-600 font-normal ml-2">
                        — showing {filteredContacts.length} of {availableContacts.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.airtableRecordId}
                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md border border-gray-100"
                      >
                        <Checkbox
                          checked={selectedContactIds.includes(contact.airtableRecordId)}
                          onCheckedChange={() => handleToggleContact(contact.airtableRecordId)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {contact.contactFirstName} {contact.contactLastName}
                          </div>
                          {contact.contactEmail && (
                            <div className="text-sm text-gray-600">{contact.contactEmail}</div>
                          )}
                          {contact.contactPhone && (
                            <div className="text-sm text-gray-500">📞 {contact.contactPhone}</div>
                          )}
                          {contact.expectedGroupSize && (
                            <div className="text-sm text-gray-500">
                              Expected group size: {contact.expectedGroupSize}
                            </div>
                          )}
                          {contact.organisationId && (
                            <div className="text-xs text-gray-400">
                              Org ID: {contact.organisationId}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Contact ID: {contact.airtableRecordId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Import Button */}
              {filteredContacts.length > 0 && (
                <Button
                  onClick={handleImportContacts}
                  disabled={selectedContactIds.length === 0 || isImportingContacts}
                  className="w-full"
                  variant={selectedContactIds.length > 0 ? "default" : "secondary"}
                >
                  {isImportingContacts
                    ? '⏳ Importing...'
                    : `3. Import ${selectedContactIds.length} Selected Contact(s) to Neon`
                  }
                </Button>
              )}
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
              {/* Step 1: Fetch Volunteers */}
              <Button
                onClick={handleFetchVolunteers}
                disabled={isFetchingVolunteers}
                className="w-full"
              >
                {isFetchingVolunteers ? '⏳ Fetching...' : '1. Fetch Volunteers from Airtable'}
              </Button>

              {/* Success/Error Messages */}
              {volunteersSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
                  {volunteersSuccess}
                </div>
              )}
              {volunteersError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                  {volunteersError}
                </div>
              )}

              {/* Step 2: Select Volunteers */}
              {filteredVolunteers.length > 0 && (
                <div className="border border-gray-200 rounded-md p-4 max-h-96 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    2. Select Volunteers to Import ({selectedVolunteerIds.length} selected)
                    {filterEventAirtableId && (
                      <span className="text-xs text-blue-600 font-normal ml-2">
                        — showing {filteredVolunteers.length} of {availableVolunteers.length}
                      </span>
                    )}
                  </h3>
                  <div className="space-y-2">
                    {filteredVolunteers.map((volunteer) => (
                      <div
                        key={volunteer.airtableRecordId}
                        className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md border border-gray-100"
                      >
                        <Checkbox
                          checked={selectedVolunteerIds.includes(volunteer.airtableRecordId)}
                          onCheckedChange={() => handleToggleVolunteer(volunteer.airtableRecordId)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {volunteer.firstName} {volunteer.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{volunteer.email}</div>
                          <div className="text-sm text-gray-500">
                            Event: {volunteer.eventName}
                            {volunteer.eventAirtableId && (
                              <span className="text-xs text-gray-400"> ({volunteer.eventAirtableId})</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Volunteer ID: {volunteer.airtableRecordId}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Import Button */}
              {filteredVolunteers.length > 0 && (
                <Button
                  onClick={handleImportVolunteers}
                  disabled={selectedVolunteerIds.length === 0 || isImportingVolunteers}
                  className="w-full"
                  variant={selectedVolunteerIds.length > 0 ? "default" : "secondary"}
                >
                  {isImportingVolunteers
                    ? '⏳ Importing...'
                    : `3. Import ${selectedVolunteerIds.length} Selected Volunteer(s) to Neon`
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

