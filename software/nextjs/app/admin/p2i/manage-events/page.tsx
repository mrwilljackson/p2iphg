"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getAllEvents, setCurrentEvent, updateEvent, deleteEvent, createEvent, previewEventSummary, generateEventSummary, getEventSummary } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { P2iAdminNav } from "@/components/p2i-admin-nav";
import { HelpTip } from "@/components/help-tip";
import { adminEventFormSchema, type AdminEventFormData } from "@/lib/validation";
import type { Event, EventSummaryPreview } from "@/lib/types";

export default function ManageEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [settingCurrent, setSettingCurrent] = useState<string | null>(null);

  // Edit dialog state
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create event dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newEventName, setNewEventName] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventDescription, setNewEventDescription] = useState("");

  // Generate Summary dialog state
  const [summaryEventId, setSummaryEventId] = useState<string | null>(null);
  const [summaryEvent, setSummaryEvent] = useState<Event | null>(null);
  const [summaryPreview, setSummaryPreview] = useState<EventSummaryPreview | null>(null);
  const [isSummaryPreviewLoading, setIsSummaryPreviewLoading] = useState(false);
  const [summarySequenceNumber, setSummarySequenceNumber] = useState("");
  const [summaryNotes, setSummaryNotes] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  // View Summary dialog state
  const [viewSummaryData, setViewSummaryData] = useState<{
    eventName: string;
    eventDate: string;
    eventLocation: string | null;
    participantCount: number;
    volunteerCount: number;
    groupCount: number;
    totalHeadcount: number;
    photoConsentCount: number;
    feedbackConsentCount: number;
    nextEventConsentCount: number;
    orgBreakdown: { orgName: string; headcount: number }[];
    eventSequenceNumber: number;
    adminNotes: string | null;
  } | null>(null);
  const [isViewSummaryLoading, setIsViewSummaryLoading] = useState(false);

  const editForm = useForm<AdminEventFormData>({
    resolver: zodResolver(adminEventFormSchema),
    defaultValues: { name: "", date: "", location: "", description: "", airtableRecordId: "" },
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await getAllEvents();
      setEvents(allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error loading events:", error);
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName || !newEventDate) {
      alert("Please fill in Event Name and Date");
      return;
    }
    setIsCreating(true);
    try {
      await createEvent({
        name: newEventName,
        date: newEventDate,
        location: newEventLocation || undefined,
        description: newEventDescription || undefined,
        status: 'planned',
      });
      setNewEventName("");
      setNewEventDate("");
      setNewEventLocation("");
      setNewEventDescription("");
      setIsCreateOpen(false);
      await loadEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenSummary = async (event: Event) => {
    setSummaryEventId(event.id);
    setSummaryEvent(event);
    setSummaryPreview(null);
    setSummarySequenceNumber("");
    setSummaryNotes("");
    setIsSummaryPreviewLoading(true);
    try {
      const preview = await previewEventSummary(event.id);
      setSummaryPreview(preview);
    } catch (error) {
      console.error("Failed to load summary preview:", error);
      alert("Failed to load event summary. " + (error instanceof Error ? error.message : ""));
      setSummaryEventId(null);
    } finally {
      setIsSummaryPreviewLoading(false);
    }
  };

  const handleArchiveEvent = async () => {
    if (!summaryEventId) return;
    const seqNum = parseInt(summarySequenceNumber, 10);
    if (isNaN(seqNum)) return;
    try {
      setIsArchiving(true);
      await generateEventSummary(summaryEventId, seqNum, summaryNotes.trim() || null);
      setSummaryEventId(null);
      await loadEvents();
    } catch (error) {
      console.error("Failed to archive event:", error);
      alert("Failed to archive event. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleViewSummary = async (eventId: string) => {
    setIsViewSummaryLoading(true);
    try {
      const summary = await getEventSummary(eventId);
      if (summary) {
        setViewSummaryData(summary);
      } else {
        alert("No summary found for this event.");
      }
    } catch (error) {
      console.error("Failed to load event summary:", error);
      alert("Failed to load event summary.");
    } finally {
      setIsViewSummaryLoading(false);
    }
  };

  const handleSetCurrent = async (eventId: string) => {
    if (!confirm("Are you sure you want to set this as the current event? This will make it the only active event visible to the public and Event Admin.")) {
      return;
    }
    try {
      setSettingCurrent(eventId);
      await setCurrentEvent(eventId);
      await loadEvents();
      alert("Current event updated successfully!");
    } catch (error) {
      console.error("Error setting current event:", error);
      alert("Failed to set current event");
    } finally {
      setSettingCurrent(null);
    }
  };

  const handleAdminister = (eventId: string) => {
    sessionStorage.setItem('administeringEventId', eventId);
    router.push('/admin/p2i');
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    editForm.reset({
      name: event.name,
      date: event.date,
      location: event.location || "",
      description: event.description || "",
      airtableRecordId: event.airtableRecordId || "",
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (data: AdminEventFormData) => {
    if (!editingEvent) return;
    try {
      setIsSaving(true);
      await updateEvent(editingEvent.id, {
        name: data.name,
        date: data.date,
        location: data.location || undefined,
        description: data.description || undefined,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsEditOpen(false);
      await loadEvents();
    } catch (error) {
      alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Delete "${event.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(event.id);
      await deleteEvent(event.id);
      await loadEvents();
    } catch (error) {
      alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                P2I Admin Dashboard - Manage Events
                <HelpTip title="Manage Events">
                  This page shows all events in the system. You can create new events, set one as the current active event, edit details, or generate summaries for completed events.
                </HelpTip>
              </h1>
              <p className="text-sm text-gray-600 mt-1">View all events and set the current active event</p>
            </div>
            <P2iAdminNav currentPath="/admin/p2i/manage-events" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 flex items-center gap-2">
          <Button onClick={() => setIsCreateOpen(true)}>+ Add New Event</Button>
          <HelpTip title="Add New Event">
            Create a new event with a name, date, location, and description. New events start with &apos;planned&apos; status. Use &apos;Set as Current&apos; to make one active for registrations.
          </HelpTip>
        </div>

        {/* Create Event Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-event-name">Event Name *</Label>
                <Input
                  id="new-event-name"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g., Manchester Arena 2026"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-event-date">Event Date *</Label>
                <Input
                  id="new-event-date"
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-event-location">Location</Label>
                <Input
                  id="new-event-location"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="e.g., Manchester Arena"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-event-description">Description</Label>
                <Input
                  id="new-event-description"
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  placeholder="Event details..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 text-lg">No events found in the database.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section: Active / Planned */}
            {(() => {
              const activePlanned = events.filter(e => e.status === 'active' || e.status === 'planned');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Active / Planned</h2>
                  {activePlanned.length === 0 ? (
                    <p className="text-sm text-gray-500">No active or planned events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {activePlanned.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">{event.name}</div>
                                  {event.status === 'active' && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Current Event
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                <div className="text-sm text-gray-900 truncate">{event.location || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                {event.status !== 'active' && (
                                  <Button size="sm" variant="outline" onClick={() => handleSetCurrent(event.id)} disabled={settingCurrent !== null}>
                                    {settingCurrent === event.id ? 'Setting...' : 'Set as Current'}
                                  </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={() => handleEdit(event)}>Edit</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDelete(event)} disabled={deletingId === event.id}>
                                  {deletingId === event.id ? 'Deleting...' : 'Delete'}
                                </Button>
                                <Button size="sm" onClick={() => handleAdminister(event.id)}>Administer →</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Section: Completed */}
            {(() => {
              const completed = events.filter(e => e.status === 'completed');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-800 mb-3">Completed</h2>
                  {completed.length === 0 ? (
                    <p className="text-sm text-gray-500">No completed events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {completed.map((event) => (
                            <tr key={event.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{event.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 max-w-xs">
                                <div className="text-sm text-gray-900 truncate">{event.location || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Completed
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenSummary(event)}>
                                  Generate Summary
                                </Button>
                                <Button size="sm" onClick={() => handleAdminister(event.id)}>Review →</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}

            {/* Section: Archived */}
            {(() => {
              const archived = events.filter(e => e.status === 'archived');
              return (
                <section>
                  <h2 className="text-lg font-semibold text-gray-500 mb-3">Archived</h2>
                  {archived.length === 0 ? (
                    <p className="text-sm text-gray-400">No archived events.</p>
                  ) : (
                    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden opacity-75">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Event Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {archived.map((event) => (
                            <tr key={event.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-500">{event.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-400">{formatDate(event.date)}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                  Archived
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button size="sm" variant="outline" onClick={() => handleViewSummary(event.id)} disabled={isViewSummaryLoading}>
                                  Event Summary
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              );
            })()}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="Venue / address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="airtableRecordId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
                    <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Generate Summary Dialog */}
      <Dialog open={summaryEventId !== null} onOpenChange={(open) => { if (!open) setSummaryEventId(null); }}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Event Summary</DialogTitle>
            <DialogDescription>
              Review the computed counts below, then enter a sequence number and optional notes before archiving.
            </DialogDescription>
          </DialogHeader>

          {summaryEvent && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">{summaryEvent.name}</p>
              <p className="text-gray-500">
                {new Date(summaryEvent.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {summaryEvent.location ? ` — ${summaryEvent.location}` : ''}
              </p>
            </div>
          )}

          {isSummaryPreviewLoading ? (
            <div className="py-8 text-center text-gray-500">Loading summary data...</div>
          ) : summaryPreview ? (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Registration Counts</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-medium">{summaryPreview.participantCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Helpers</span>
                  <span className="font-medium">{summaryPreview.volunteerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Group Leaders</span>
                  <span className="font-medium">{summaryPreview.groupCount} <span className="text-gray-400 font-normal">({summaryPreview.participatingLeaderCount} participating)</span></span>
                </div>
              </div>

              {summaryPreview.orgBreakdown.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Organisation Breakdown</h4>
                  <div className="space-y-1">
                    {summaryPreview.orgBreakdown.map(({ orgName, headcount }) => (
                      <div key={orgName} className="flex justify-between">
                        <span className="text-gray-600 truncate mr-4">{orgName}</span>
                        <span className="font-medium shrink-0">{headcount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="seq-number">Event sequence number *</Label>
                  <Input
                    id="seq-number"
                    type="number"
                    min="1"
                    value={summarySequenceNumber}
                    onChange={(e) => setSummarySequenceNumber(e.target.value)}
                    placeholder="e.g. 42"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="admin-notes">Notes <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Textarea
                    id="admin-notes"
                    rows={3}
                    value={summaryNotes}
                    onChange={(e) => setSummaryNotes(e.target.value)}
                    placeholder="Any notes about this event..."
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Photo consent</span>
                  <span className="font-medium">{summaryPreview.photoConsentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Feedback consent</span>
                  <span className="font-medium">{summaryPreview.feedbackConsentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next event consent</span>
                  <span className="font-medium">{summaryPreview.nextEventConsentCount}</span>
                </div>
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                This will mark the event as archived. Registration data will not be deleted.
              </p>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSummaryEventId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleArchiveEvent}
              disabled={!summaryPreview || !summarySequenceNumber.trim() || isNaN(parseInt(summarySequenceNumber, 10)) || isArchiving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isArchiving ? "Archiving..." : "Archive this event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Event Summary Dialog */}
      <Dialog open={viewSummaryData !== null} onOpenChange={(open) => { if (!open) setViewSummaryData(null); }}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Summary</DialogTitle>
          </DialogHeader>

          {viewSummaryData && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">{viewSummaryData.eventName}</p>
                <p className="text-gray-500">
                  {new Date(viewSummaryData.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {viewSummaryData.eventLocation ? ` — ${viewSummaryData.eventLocation}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">Event #{viewSummaryData.eventSequenceNumber}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Registration Counts</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Participants</span>
                  <span className="font-medium">{viewSummaryData.participantCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Helpers</span>
                  <span className="font-medium">{viewSummaryData.volunteerCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Group Leaders</span>
                  <span className="font-medium">{viewSummaryData.groupCount}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-semibold">
                  <span>Total Headcount</span>
                  <span>{viewSummaryData.totalHeadcount}</span>
                </div>
              </div>

              {viewSummaryData.orgBreakdown.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Organisation Breakdown</h4>
                  <div className="space-y-1">
                    {viewSummaryData.orgBreakdown.map(({ orgName, headcount }) => (
                      <div key={orgName} className="flex justify-between">
                        <span className="text-gray-600 truncate mr-4">{orgName}</span>
                        <span className="font-medium shrink-0">{headcount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                <div className="flex justify-between">
                  <span className="text-gray-600">Photo consent</span>
                  <span className="font-medium">{viewSummaryData.photoConsentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Feedback consent</span>
                  <span className="font-medium">{viewSummaryData.feedbackConsentCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next event consent</span>
                  <span className="font-medium">{viewSummaryData.nextEventConsentCount}</span>
                </div>
              </div>

              {viewSummaryData.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{viewSummaryData.adminNotes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSummaryData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
