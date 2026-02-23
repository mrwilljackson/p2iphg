"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentEvent, getEventById, getRegistrationCountsByRole, getAllRegistrations, getOrganizations, getAllVolunteers, createEvent } from "@/lib/actions";
import type { Event, Registration, Organization, Volunteer } from "@/lib/types";
import type { ParticipantCounts } from "@/lib/participant-counting";

interface RegistrationCSVRow {
  id: string;
  eventId: string;
  eventDate: string;
  venueName: string;
  attendeeName: string;
  attendeeSurname: string;
  email: string;
  organizationName: string;
  impairment: string;
  role: string;
  photoConsent: string;
  feedbackConsent: string;
  nextEventConsent: string;
  groupSize: string;
  disabledStudents: string;
  senStudents: string;
  groupLeaderParticipating: string;
  checkinTime: string;
  checkoutTime: string;
  syncStatus: string;
  airtableRecordId: string;
  createdAt: string;
  modifiedAt: string;
}

export default function P2IAdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [volunteerRegistrations, setVolunteerRegistrations] = useState<Registration[]>([]);

  // Create Event Dialog State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
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

      let event: Event | null = null;

      if (administeringEventId) {
        // P2I admin is administering a specific event
        event = await getEventById(administeringEventId);
      } else {
        // Default to current active event
        event = await getCurrentEvent();
      }

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

  // Create Event Handler
  const handleCreateEvent = async () => {
    if (!newEventName || !newEventDate) {
      alert("Please fill in Event Name and Date");
      return;
    }

    setIsCreatingEvent(true);
    try {
      const newEvent = await createEvent({
        name: newEventName,
        date: newEventDate,
        location: newEventLocation || undefined,
        description: newEventDescription || undefined,
        status: 'planned', // New events are created as 'planned' - use Manage Events to set as active
      });

      // Reset form
      setNewEventName("");
      setNewEventDate("");
      setNewEventLocation("");
      setNewEventDescription("");
      setIsCreateEventOpen(false);

      // Reload the page to show the new event
      window.location.reload();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsCreatingEvent(false);
    }
  };

  // CSV Export Functions
  const convertToCSV = (data: RegistrationCSVRow[]): string => {
    if (data.length === 0) return '';

    // CSV Headers - all columns from registrations table
    const headers = [
      'ID',
      'Event ID',
      'Event Date',
      'Venue Name',
      'Attendee Name',
      'Attendee Surname',
      'Email',
      'Organization Name',
      'Impairment',
      'Role',
      'Photo Consent',
      'Feedback Consent',
      'Next Event Consent',
      'Group Size',
      'Disabled Students',
      'SEN Students',
      'Group Leader Participating',
      'Check-in Time',
      'Check-out Time',
      'Sync Status',
      'Airtable Record ID',
      'Created At',
      'Modified At'
    ];

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCSV = (value: string | number | null | undefined): string => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Build CSV rows
    const csvRows = [
      headers.join(','),
      ...data.map(row => [
        escapeCSV(row.id),
        escapeCSV(row.eventId),
        escapeCSV(row.eventDate),
        escapeCSV(row.venueName),
        escapeCSV(row.attendeeName),
        escapeCSV(row.attendeeSurname),
        escapeCSV(row.email),
        escapeCSV(row.organizationName),
        escapeCSV(row.impairment),
        escapeCSV(row.role),
        escapeCSV(row.photoConsent),
        escapeCSV(row.feedbackConsent),
        escapeCSV(row.nextEventConsent),
        escapeCSV(row.groupSize),
        escapeCSV(row.disabledStudents),
        escapeCSV(row.senStudents),
        escapeCSV(row.groupLeaderParticipating),
        escapeCSV(row.checkinTime),
        escapeCSV(row.checkoutTime),
        escapeCSV(row.syncStatus),
        escapeCSV(row.airtableRecordId),
        escapeCSV(row.createdAt),
        escapeCSV(row.modifiedAt)
      ].join(','))
    ];

    return csvRows.join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    // Create a Blob from the CSV string
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a temporary download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (!currentEvent) {
      alert('No event data available to export');
      return;
    }

    try {
      // Get all registrations
      const allRegistrations = await getAllRegistrations(currentEvent.id);

      // Get all organizations to map IDs to names
      const allOrganizations = await getOrganizations(currentEvent.id);

      // Create a map of organization ID to name
      const orgMap = new Map<string, string>();
      allOrganizations.forEach(org => {
        orgMap.set(org.id, org.name);
      });

      // Format event date for display
      const eventDate = currentEvent.date
        ? new Date(currentEvent.date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : '';

      // Get venue name
      const venueName = currentEvent.location || '';

      // Build CSV data with all registration fields
      const rows: RegistrationCSVRow[] = allRegistrations.map((reg) => {
        // Format dates
        const formatDate = (date: Date | string | null | undefined): string => {
          if (!date) return '';
          try {
            return new Date(date).toISOString();
          } catch {
            return '';
          }
        };

        // Format boolean values
        const formatBoolean = (value: boolean | null | undefined): string => {
          if (value === null || value === undefined) return '';
          return value ? 'Yes' : 'No';
        };

        // Get organization name from ID
        const organizationName = reg.organizationId
          ? (orgMap.get(reg.organizationId) || 'Unknown Organization')
          : '';

        return {
          id: reg.id || '',
          eventId: reg.eventId || '',
          eventDate: eventDate,
          venueName: venueName,
          attendeeName: reg.attendeeName,
          attendeeSurname: reg.attendeeSurname,
          email: reg.email || '',
          organizationName: organizationName,
          impairment: reg.impairment || '',
          role: reg.role,
          photoConsent: formatBoolean(reg.photoConsent),
          feedbackConsent: formatBoolean(reg.feedbackConsent),
          nextEventConsent: formatBoolean(reg.nextEventConsent),
          groupSize: reg.groupSize?.toString() || '',
          disabledStudents: reg.disabledStudents?.toString() || '',
          senStudents: reg.senStudents?.toString() || '',
          groupLeaderParticipating: formatBoolean(reg.groupLeaderParticipating),
          checkinTime: formatDate(reg.checkinTime),
          checkoutTime: formatDate(reg.checkoutTime),
          syncStatus: reg.syncStatus || '',
          airtableRecordId: reg.airtableRecordId || '',
          createdAt: formatDate(reg.createdAt),
          modifiedAt: formatDate(reg.modifiedAt),
        };
      });

      // Convert to CSV
      const csv = convertToCSV(rows);

      if (!csv) {
        alert('No data to export');
        return;
      }

      // Generate filename with event name and date
      const eventName = currentEvent.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${eventName}-registrations-${dateStr}.csv`;

      // Download
      downloadCSV(csv, filename);

      alert(`CSV file downloaded successfully! ${rows.length} registration(s) exported.`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
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
        {/* Current Event Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {sessionStorage.getItem('administeringEventId') ? 'Administering Event' : 'Current Event'}
              </h2>
              {sessionStorage.getItem('administeringEventId') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sessionStorage.removeItem('administeringEventId');
                    window.location.reload();
                  }}
                >
                  ← Return to Current Event
                </Button>
              )}
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentEvent?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : currentEvent?.status === 'planned'
                ? 'bg-blue-100 text-blue-800'
                : currentEvent?.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {currentEvent?.status ? currentEvent.status.charAt(0).toUpperCase() + currentEvent.status.slice(1) : 'Unknown'}
            </span>
          </div>
          {currentEvent ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Event Name</p>
                <p className="text-base font-semibold text-gray-900">{currentEvent.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Date</p>
                <p className="text-base font-semibold text-gray-900">
                  {currentEvent.date ? new Date(currentEvent.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Not set'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Location</p>
                <p className="text-base font-semibold text-gray-900">{currentEvent.location || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Total Registrations</p>
                <p className="text-base font-semibold text-gray-900">{counts.totalRegistrations}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No active event</p>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {/* Participants Card - Full Width */}
        <div className="mb-8">
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
                              <td className="py-2 px-3 text-center">
                                <span className="text-gray-400">→</span>
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

        {/* Other Stats Cards */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.groups.registered}</p>
                <div className="mt-2 space-y-1">
                  <div className="text-lg text-gray-400">({counts.groups.total} expected)</div>
                  {counts.groups.walkIns > 0 && (
                    <div className="text-sm text-blue-600">+ {counts.groups.walkIns} walk-in{counts.groups.walkIns !== 1 ? 's' : ''}</div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-2 space-y-1 pt-2 border-t border-gray-200">
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
              <div className="text-4xl ml-4">👨‍👩‍👧‍👦</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="w-full">
                <p className="text-sm font-medium text-gray-600">Helpers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{volunteerRegistrations.length}</p>
                <div className="mt-2">
                  <span className="text-lg text-gray-400">({volunteers.length} expected)</span>
                </div>
              </div>
              <div className="text-4xl ml-4">🙋</div>
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
                        className="text-sm flex items-center text-blue-600 font-medium"
                      >
                        <span className="mr-2">✅</span>
                        <span>{reg.attendeeName} {reg.attendeeSurname}</span>
                        <span className="ml-2 text-xs text-gray-500">(walk-in)</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accessibility</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.disabledStudents + counts.senStudents}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Disabled: {counts.disabledStudents} | SEN: {counts.senStudents}
                </p>
              </div>
              <div className="text-4xl">♿</div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Registration Management */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Management</h2>
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
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleExportCSV}
              >
                ⬇️ Export to CSV
              </Button>
              <Button className="w-full justify-start" variant="outline">
                👥 Manage Volunteers
              </Button>
              <Button className="w-full justify-start" variant="outline">
                🏢 Manage Organizations
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/admin/p2i/manage-events")}
              >
                📅 Manage Events
              </Button>

              {/* Create New Event Dialog */}
              <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start" variant="outline">
                    ➕ Create New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Add a new future event to the system. Fill in the event details below.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="event-name">Event Name *</Label>
                      <Input
                        id="event-name"
                        value={newEventName}
                        onChange={(e) => setNewEventName(e.target.value)}
                        placeholder="e.g., Manchester Arena 2026"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-date">Event Date *</Label>
                      <Input
                        id="event-date"
                        type="date"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-location">Location</Label>
                      <Input
                        id="event-location"
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        placeholder="e.g., Manchester Arena"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-description">Description</Label>
                      <Input
                        id="event-description"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="Event details..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateEventOpen(false)}
                      disabled={isCreatingEvent}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreateEvent} disabled={isCreatingEvent}>
                      {isCreatingEvent ? "Creating..." : "Create Event"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button className="w-full justify-start text-red-600 hover:text-red-700" variant="outline">
                🗑️ Clear Database
              </Button>
            </div>
          </div>

          {/* System Integration */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Integration</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleExportCSV}
              >
                ⬇️ Export to CSV
              </Button>
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

