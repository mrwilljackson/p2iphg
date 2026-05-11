"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentEvent, getEventById, getRegistrationCountsByRole, getAllRegistrations, getOrganizations, getAllVolunteers, createEvent, markEventCompleted, getEventDataCounts, clearEventData, previewEventArchive, archiveEvent } from "@/lib/actions";
import { syncRegistrationsToAirtable } from "@/app/actions/airtable-sync";
import type { Event, Registration, Organization, Volunteer, EventArchivePreview } from "@/lib/types";
import type { ParticipantCounts } from "@/lib/participant-counting";
import { P2iAdminNav } from "@/components/p2i-admin-nav";

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
  impairedParticipants: string;
  nonImpairedParticipants: string;
  groupLeaderParticipating: string;
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
  const [groupRegistrations, setGroupRegistrations] = useState<Registration[]>([]);
  const [eventOrganizations, setEventOrganizations] = useState<Organization[]>([]);

  // Create Event Dialog State
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Airtable sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Event completion state
  const [isMarkingCompleted, setIsMarkingCompleted] = useState(false);

  // Clear Event Data Dialog State
  const [isClearEventOpen, setIsClearEventOpen] = useState(false);
  const [clearEventCounts, setClearEventCounts] = useState<{
    registrations: number;
    volunteers: number;
    organisations: number;
    organisationContacts: number;
    unsyncedRegistrations: number;
  } | null>(null);
  const [isClearEventLoading, setIsClearEventLoading] = useState(false);
  const [forceClearUnsynced, setForceClearUnsynced] = useState(false);

  // Archive Event Dialog State
  const [isArchiveEventOpen, setIsArchiveEventOpen] = useState(false);
  const [archivePreview, setArchivePreview] = useState<EventArchivePreview | null>(null);
  const [isArchivePreviewLoading, setIsArchivePreviewLoading] = useState(false);
  const [archiveSequenceNumber, setArchiveSequenceNumber] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

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
    impairedParticipants: 0,
    nonImpairedParticipants: 0,
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
      try {
        // Check if P2I admin has selected a specific event to administer
        const administeringEventId = sessionStorage.getItem('administeringEventId');

        console.log('P2I Admin Dashboard - administeringEventId:', administeringEventId);

        let event: Event | null = null;

        if (administeringEventId) {
          // P2I admin is administering a specific event
          console.log('Loading administering event:', administeringEventId);
          event = await getEventById(administeringEventId);
        } else {
          // Default to current active event
          console.log('Loading current active event');
          event = await getCurrentEvent();
        }

        console.log('P2I Admin - Loaded event:', event?.name, event?.id);
        setCurrentEvent(event);

        if (event) {
          try {
            const registrationCounts = await getRegistrationCountsByRole(event.id);
            console.log('P2I Admin - Registration counts loaded:', registrationCounts.totalRegistrations);
            setCounts(registrationCounts);
          } catch (countErr) {
            console.error('P2I Admin - Error loading registration counts:', countErr);
          }

          try {
            // Fetch all volunteers for this event
            const allVolunteers = await getAllVolunteers(event.id);
            console.log('P2I Admin - Volunteers loaded:', allVolunteers.length);
            setVolunteers(allVolunteers);
          } catch (volErr) {
            console.error('P2I Admin - Error loading volunteers:', volErr);
          }

          try {
            // Fetch all registrations and filter for volunteers
            const allRegistrations = await getAllRegistrations(event.id);
            console.log('P2I Admin - All registrations loaded:', allRegistrations.length);
            const volRegistrations = allRegistrations.filter(r => r.role === 'Volunteer');
            setVolunteerRegistrations(volRegistrations);
            const grpRegistrations = allRegistrations.filter(r => r.role === 'Group');
            setGroupRegistrations(grpRegistrations);

            // Fetch organizations for open/closed status lookup
            const allOrgs = await getOrganizations(event.id);
            setEventOrganizations(allOrgs);
          } catch (regErr) {
            console.error('P2I Admin - Error loading registrations:', regErr);
          }
        }
      } catch (error) {
        console.error('P2I Admin - Error in loadData:', error);
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
      // Redirect to registration if not authenticated
      router.push("/registration");
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminLevel");
    router.push("/registration");
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

  // Check if current event date is in the past
  const isEventPast = (() => {
    if (!currentEvent?.date) return false;
    const eventDate = new Date(currentEvent.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate < today;
  })();

  const handleMarkCompleted = async () => {
    if (!currentEvent) return;
    if (!confirm("Mark this event as completed? The public registration form will continue to show 'No Active Event'.")) return;

    setIsMarkingCompleted(true);
    try {
      await markEventCompleted(currentEvent.id);
      window.location.reload();
    } catch (error) {
      console.error("Error marking event as completed:", error);
      alert("Failed to mark event as completed. Please try again.");
    } finally {
      setIsMarkingCompleted(false);
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
      'Impaired Participants',
      'Non-impaired Participants',
      'Group Leader Participating',
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
        escapeCSV(row.impairedParticipants),
        escapeCSV(row.nonImpairedParticipants),
        escapeCSV(row.groupLeaderParticipating),
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
          impairedParticipants: reg.impairedParticipants?.toString() || '',
          nonImpairedParticipants: reg.nonImpairedParticipants?.toString() || '',
          groupLeaderParticipating: formatBoolean(reg.groupLeaderParticipating),
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

  const handleSyncToAirtable = async () => {
    if (!currentEvent) {
      alert("No event data available to sync");
      return;
    }

    if (!confirm("This will push all pending registrations to Airtable. Continue?")) {
      return;
    }

    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncRegistrationsToAirtable();

      if (result.synced === 0 && result.failed === 0 && result.skipped === 0) {
        setSyncMessage("No pending registrations to sync.");
      } else {
        const parts: string[] = [];
        if (result.synced > 0) parts.push(`✅ ${result.synced} synced`);
        if (result.failed > 0) parts.push(`❌ ${result.failed} failed`);
        if (result.skipped > 0) parts.push(`⚠️ ${result.skipped} skipped`);
        setSyncMessage(parts.join(" · "));
      }

      if (result.errors.length > 0) {
        console.error("Sync errors:", result.errors);
      }
    } catch (error) {
      console.error("Error syncing to Airtable:", error);
      setSyncMessage(`❌ Sync failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load record counts when Clear Event Data dialog opens
  const handleClearEventDialogOpen = async (open: boolean) => {
    setIsClearEventOpen(open);
    if (!open) {
      setForceClearUnsynced(false);
      setClearEventCounts(null);
      return;
    }
    if (currentEvent) {
      setIsClearEventLoading(true);
      try {
        const counts = await getEventDataCounts(currentEvent.id);
        setClearEventCounts(counts);
      } catch (error) {
        console.error("Failed to load event data counts:", error);
      } finally {
        setIsClearEventLoading(false);
      }
    }
  };

  const handleArchiveEventOpen = async (open: boolean) => {
    setIsArchiveEventOpen(open);
    if (!open) {
      setArchivePreview(null);
      setArchiveSequenceNumber("");
      return;
    }
    if (currentEvent) {
      setIsArchivePreviewLoading(true);
      try {
        const preview = await previewEventArchive(currentEvent.id);
        setArchivePreview(preview);
      } catch (error) {
        console.error("Failed to load archive preview:", error);
        alert("Failed to load event preview. " + (error instanceof Error ? error.message : ""));
        setIsArchiveEventOpen(false);
      } finally {
        setIsArchivePreviewLoading(false);
      }
    }
  };

  const handleArchiveEventCommit = async () => {
    if (!currentEvent) return;
    const seqNum = parseInt(archiveSequenceNumber, 10);
    if (isNaN(seqNum) || seqNum <= 0) return;
    try {
      setIsArchiving(true);
      await archiveEvent(currentEvent.id, seqNum);
      setIsArchiveEventOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to archive event:", error);
      alert("Failed to archive event. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsArchiving(false);
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
              <h1 className="text-2xl font-bold text-gray-900">P2I Admin Dashboard - Event Options</h1>
              <p className="text-sm text-gray-600 mt-1">Power2Inspire System Administration</p>
            </div>
            <P2iAdminNav currentPath="/admin/p2i" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Event Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {sessionStorage.getItem('administeringEventId') ? 'Administering Event' : 'Current Event'}
            </h2>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              currentEvent?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : currentEvent?.status === 'planned'
                ? 'bg-blue-100 text-blue-800'
                : currentEvent?.status === 'completed'
                ? 'bg-gray-100 text-gray-800'
                : currentEvent?.status === 'archived'
                ? 'bg-gray-100 text-gray-600'
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

        {/* Past Event Warning Banner */}
        {currentEvent && isEventPast && currentEvent.status === 'active' && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-800">This event has passed</p>
                <p className="text-sm text-amber-700">
                  The event date was {new Date(currentEvent.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.
                  The public registration form is already hidden. When you&apos;re finished with post-event tasks (e.g. Airtable sync, CSV export), mark it as completed.
                </p>
              </div>
            </div>
            <Button
              onClick={handleMarkCompleted}
              disabled={isMarkingCompleted}
              className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              {isMarkingCompleted ? '⏳ Updating...' : '✅ Mark as Completed'}
            </Button>
          </div>
        )}

        {/* Archive Event Banner — shown for completed events */}
        {currentEvent && currentEvent.status === 'completed' && (
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-semibold text-blue-800">This event is completed</p>
                <p className="text-sm text-blue-700">
                  Archive this event to preserve aggregate counts and permanently delete attendee personal data.
                </p>
              </div>
            </div>
            <Dialog open={isArchiveEventOpen} onOpenChange={handleArchiveEventOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
                  📋 Archive event
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Archive event</DialogTitle>
                  <DialogDescription>
                    Review the figures below. Pressing &quot;Archive event&quot; will permanently delete all attendee, organisation-contact and helper personal data for this event.
                  </DialogDescription>
                </DialogHeader>

                {currentEvent && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-900">{currentEvent.name}</p>
                    <p className="text-gray-500">
                      {new Date(currentEvent.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {currentEvent.location ? ` — ${currentEvent.location}` : ''}
                    </p>
                  </div>
                )}

                {isArchivePreviewLoading ? (
                  <div className="py-8 text-center text-gray-500">Loading preview...</div>
                ) : archivePreview ? (
                  <div className="space-y-4 py-2">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">Headline counts</h4>
                      <div className="flex justify-between"><span className="text-gray-600">Companies / organisations</span><span className="font-medium">{archivePreview.companiesCount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Total headcount</span><span className="font-medium">{archivePreview.totalHeadcount}</span></div>
                      <div className="pl-3 flex justify-between text-gray-500"><span>– Participants</span><span>{archivePreview.participantCount}</span></div>
                      <div className="pl-3 flex justify-between text-gray-500"><span>– Helpers</span><span>{archivePreview.volunteerCount}</span></div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">Participant impairment split</h4>
                      <div className="flex justify-between"><span className="text-gray-600">Impaired</span><span className="font-medium">{archivePreview.impairedParticipantCount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Non-impaired</span><span className="font-medium">{archivePreview.nonImpairedParticipantCount}</span></div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                      <div className="flex justify-between"><span className="text-gray-600">Photo</span><span className="font-medium">{archivePreview.photoConsentCount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Feedback</span><span className="font-medium">{archivePreview.feedbackConsentCount}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Next event</span><span className="font-medium">{archivePreview.nextEventConsentCount}</span></div>
                    </div>

                    {archivePreview.orgLines.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                        <h4 className="font-semibold text-gray-900 mb-2">Per-organisation breakdown</h4>
                        <div className="space-y-2">
                          {archivePreview.orgLines.map((line) => (
                            <div key={line.organisationId} className="border-b last:border-b-0 border-gray-200 pb-2 last:pb-0">
                              <p className="font-medium text-gray-900">{line.orgNameSnapshot}</p>
                              <p className="text-gray-500 text-xs">
                                {line.actualHeadcount} attended &middot; {line.impairedCount} impaired, {line.nonImpairedCount} not
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-1.5">
                      <Label htmlFor="dashboard-seq-number">Event sequence number *</Label>
                      <Input
                        id="dashboard-seq-number"
                        type="number"
                        min="1"
                        value={archiveSequenceNumber}
                        onChange={(e) => setArchiveSequenceNumber(e.target.value)}
                        placeholder="e.g. 43"
                      />
                    </div>

                    <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
                      <strong>This will permanently delete</strong> all attendee, organisation-contact and helper personal data for this event. The aggregate counts above will be preserved in the archive. <strong>This action cannot be undone.</strong>
                    </p>
                  </div>
                ) : null}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsArchiveEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleArchiveEventCommit}
                    disabled={!archivePreview || !archiveSequenceNumber.trim() || isNaN(parseInt(archiveSequenceNumber, 10)) || parseInt(archiveSequenceNumber, 10) <= 0 || isArchiving}
                  >
                    {isArchiving ? "Archiving..." : "Archive event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Archived Event Banner */}
        {currentEvent && currentEvent.status === 'archived' && (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 mb-8 flex items-center gap-3">
            <span className="text-2xl">🗂️</span>
            <div>
              <p className="font-semibold text-gray-700">This event is archived</p>
              <p className="text-sm text-gray-500">Aggregate counts have been preserved; attendee personal data was permanently deleted. View the archive from Manage Events.</p>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.totalParticipants}</p>
                <div className="mt-2">
                  <span className="text-lg text-gray-400">({counts.individualParticipants + counts.groupParticipants.total.expected} expected)</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 space-y-1 pt-2 border-t border-gray-200">
                  <div>Individual: {counts.individualParticipants}</div>
                  <div>Group Participants: {counts.groupParticipants.total.registered} / {counts.groupParticipants.total.expected}</div>
                </div>
              </div>
              <div className="text-4xl ml-4 shrink-0">🎯</div>
            </div>
            {groupRegistrations.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-1 px-2 font-semibold text-gray-700">Leader Name</th>
                        <th className="text-center py-1 px-2 font-semibold text-gray-700">Group</th>
                        <th className="text-center py-1 px-2 font-semibold text-gray-700">Type</th>
                        <th className="text-center py-1 px-2 font-semibold text-gray-700">Participating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupRegistrations.map((reg) => {
                        const org = eventOrganizations.find(o => o.id === reg.organizationId);
                        const isOpen = org?.openGroup !== false;
                        return (
                          <tr key={reg.id} className="border-b border-gray-100">
                            <td className="py-1 px-2 font-bold text-gray-900">
                              {reg.attendeeName} {reg.attendeeSurname}
                            </td>
                            <td className="py-1 px-2 text-center text-gray-600">
                              {reg.organizationName || '—'}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                                isOpen ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {isOpen ? 'Open' : 'Closed'}
                              </span>
                            </td>
                            <td className="py-1 px-2 text-center">
                              {reg.groupLeaderParticipating ? '✅' : '—'}
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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Groups</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{counts.groups.registered}</p>
                <div className="mt-2 space-y-1">
                  <div className="text-lg text-gray-400">({counts.groups.total} expected)</div>
                  {counts.groups.walkIns > 0 && (
                    <div className="text-sm text-blue-600">+ {counts.groups.walkIns} walk-in{counts.groups.walkIns !== 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>
              <div className="text-4xl ml-4 shrink-0">👨‍👩‍👧‍👦</div>
            </div>
            {counts.groupDetails.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-1 px-2 font-semibold text-gray-700">Group Name</th>
                            <th className="text-center py-1 px-2 font-semibold text-gray-700">Expected</th>
                            <th className="text-center py-1 px-2 font-semibold text-gray-700">Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {counts.groupDetails.map((group) => {
                            const hasLowRegistration = group.expected > group.registered;
                            return (
                              <tr
                                key={group.organizationId}
                                className={`border-b border-gray-100 ${hasLowRegistration ? 'bg-yellow-50' : ''}`}
                              >
                                <td className={`py-1 px-2 font-bold text-gray-900 ${hasLowRegistration ? 'border-l-4 border-yellow-400' : ''}`}>
                                  {group.organizationName}
                                </td>
                                <td className="py-1 px-2 text-center text-gray-600">
                                  {group.expected}
                                </td>
                                <td className="py-1 px-2 text-center text-gray-600">
                                  {group.registered}
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

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Helpers</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{volunteerRegistrations.length}</p>
                <div className="mt-2">
                  <span className="text-lg text-gray-400">({volunteers.length} expected)</span>
                </div>
              </div>
              <div className="text-4xl ml-4 shrink-0">🙋</div>
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
                onClick={() => router.push("/registration")}
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

          {/* Events Management */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Events Management</h2>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/admin/p2i/group-leaders")}
              >
                👥 Manage Group Leaders
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/admin/p2i/helpers")}
              >
                👥 Manage Helpers
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleExportCSV}
              >
                ⬇️ Export Registrations to CSV
              </Button>
            </div>
          </div>

          {/* System Integration */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Integration</h2>
            <div className="space-y-3">
              {/* Clear Event Data Dialog */}
              <Dialog open={isClearEventOpen} onOpenChange={handleClearEventDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    variant="outline"
                    disabled={!currentEvent}
                  >
                    🗑️ Clear Event Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle className="text-red-600">⚠️ Clear Event Data</DialogTitle>
                    <DialogDescription>
                      This will permanently remove all participant and organisation data for this event from the PHG Events database.
                      The event name will be retained as &apos;archived&apos; in the PHG Events database. No Airtable data will be changed.
                    </DialogDescription>
                  </DialogHeader>

                  {currentEvent && (
                    <div className="space-y-4 py-2">
                      {/* Event identification */}
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-1">{currentEvent.name}</h4>
                        <p className="text-sm text-gray-600">
                          {currentEvent.date} — {currentEvent.location || "No location"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">ID: {currentEvent.id}</p>
                      </div>

                      {/* Record counts */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h4 className="font-medium text-gray-900 mb-3">Records to be removed:</h4>
                        {clearEventCounts ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Registrations</span>
                              <span className="font-medium">{clearEventCounts.registrations}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Volunteers</span>
                              <span className="font-medium">{clearEventCounts.volunteers}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Organisations</span>
                              <span className="font-medium">{clearEventCounts.organisations}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Organisation Contacts</span>
                              <span className="font-medium">{clearEventCounts.organisationContacts}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                              <span>Total records</span>
                              <span>
                                {clearEventCounts.registrations +
                                  clearEventCounts.volunteers +
                                  clearEventCounts.organisations +
                                  clearEventCounts.organisationContacts}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="animate-spin">⏳</span>
                            <span>Loading record counts...</span>
                          </div>
                        )}
                      </div>

                      {/* Unsynced registrations warning */}
                      {clearEventCounts && clearEventCounts.unsyncedRegistrations > 0 && (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 text-lg">⚠️</span>
                            <div>
                              <h4 className="font-semibold text-amber-800">
                                {clearEventCounts.unsyncedRegistrations} unsynced registration{clearEventCounts.unsyncedRegistrations !== 1 ? "s" : ""}
                              </h4>
                              <p className="text-sm text-amber-700 mt-1">
                                These registrations have <strong>not been synced to Airtable</strong> and will be
                                permanently lost. Go back and sync first, or check the box below to force clear.
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <Checkbox
                                  id="force-clear"
                                  checked={forceClearUnsynced}
                                  onCheckedChange={(checked) => setForceClearUnsynced(checked === true)}
                                />
                                <Label
                                  htmlFor="force-clear"
                                  className="text-sm font-medium text-amber-800 cursor-pointer"
                                >
                                  I understand — force clear unsynced data
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Event status note */}
                      <p className="text-xs text-gray-500">
                        The event record will be kept and its status changed to <strong>archived</strong>.
                      </p>
                    </div>
                  )}

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsClearEventOpen(false);
                        setForceClearUnsynced(false);
                        setClearEventCounts(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={
                        isClearEventLoading ||
                        !clearEventCounts ||
                        (clearEventCounts.unsyncedRegistrations > 0 && !forceClearUnsynced)
                      }
                      onClick={async () => {
                        if (!currentEvent) return;
                        setIsClearEventLoading(true);
                        try {
                          const result = await clearEventData(currentEvent.id, forceClearUnsynced);
                          if (result.success) {
                            const total = result.deleted.registrations + result.deleted.volunteers +
                              result.deleted.organisationContacts + result.deleted.organisations;
                            alert(
                              `✅ Event data cleared successfully.\n\n` +
                              `Deleted ${total} records:\n` +
                              `  • ${result.deleted.registrations} registrations\n` +
                              `  • ${result.deleted.volunteers} volunteers\n` +
                              `  • ${result.deleted.organisationContacts} organisation contacts\n` +
                              `  • ${result.deleted.organisations} organisations\n\n` +
                              `Event "${currentEvent.name}" is now archived.`
                            );
                            // Close dialog and reset state
                            setIsClearEventOpen(false);
                            setForceClearUnsynced(false);
                            setClearEventCounts(null);
                            // Update the local event to reflect archived status
                            setCurrentEvent({ ...currentEvent, status: 'archived' });
                            // Clear local counts since data is gone
                            setCounts({
                              individualParticipants: 0,
                              groupParticipants: {
                                familyAndDisability: { expected: 0, registered: 0 },
                                otherGroups: { expected: 0, registered: 0 },
                                total: { expected: 0, registered: 0 },
                              },
                              groupDetails: [],
                              totalParticipants: 0,
                              impairedParticipants: 0,
                              nonImpairedParticipants: 0,
                              volunteers: 0,
                              groups: { total: 0, registered: 0, walkIns: 0, familyGroups: 0, disabilityGroups: 0, corporateGroups: 0, sportingGroups: 0, communityGroups: 0, educationalGroups: 0, otherGroups: 0 },
                              totalRegistrations: 0,
                            });
                            setVolunteers([]);
                            setVolunteerRegistrations([]);
                          } else {
                            alert(`❌ Failed to clear event data:\n${result.error}`);
                          }
                        } catch (error) {
                          console.error("Error clearing event data:", error);
                          alert("❌ An unexpected error occurred while clearing event data.");
                        } finally {
                          setIsClearEventLoading(false);
                        }
                      }}
                    >
                      {isClearEventLoading ? "Clearing..." : "🗑️ Clear Event Data"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

