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
import { getAllEvents, setCurrentEvent, updateEvent, deleteEvent, createEvent, previewEventArchive, archiveEvent, getEventArchive } from "@/lib/actions";
import { Label } from "@/components/ui/label";
import { P2iAdminNav } from "@/components/p2i-admin-nav";
import { HelpTip } from "@/components/help-tip";
import { adminEventFormSchema, type AdminEventFormData } from "@/lib/validation";
import type { Event, EventArchivePreview, EventArchiveView } from "@/lib/types";

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

  // Archive Event dialog state
  const [archiveEventId, setArchiveEventId] = useState<string | null>(null);
  const [archiveEventRow, setArchiveEventRow] = useState<Event | null>(null);
  const [archivePreview, setArchivePreview] = useState<EventArchivePreview | null>(null);
  const [isArchivePreviewLoading, setIsArchivePreviewLoading] = useState(false);
  const [archiveSequenceNumber, setArchiveSequenceNumber] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  // View Archive dialog state
  const [viewArchiveData, setViewArchiveData] = useState<EventArchiveView | null>(null);
  const [isViewArchiveLoading, setIsViewArchiveLoading] = useState(false);

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

  const handleOpenArchive = async (event: Event) => {
    setArchiveEventId(event.id);
    setArchiveEventRow(event);
    setArchivePreview(null);
    setArchiveSequenceNumber("");
    setIsArchivePreviewLoading(true);
    try {
      const preview = await previewEventArchive(event.id);
      setArchivePreview(preview);
    } catch (error) {
      console.error("Failed to load archive preview:", error);
      alert("Failed to load event preview. " + (error instanceof Error ? error.message : ""));
      setArchiveEventId(null);
    } finally {
      setIsArchivePreviewLoading(false);
    }
  };

  const handleArchiveEvent = async () => {
    if (!archiveEventId) return;
    const seqNum = parseInt(archiveSequenceNumber, 10);
    if (isNaN(seqNum) || seqNum <= 0) return;
    try {
      setIsArchiving(true);
      await archiveEvent(archiveEventId, seqNum);
      setArchiveEventId(null);
      await loadEvents();
    } catch (error) {
      console.error("Failed to archive event:", error);
      alert("Failed to archive event. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsArchiving(false);
    }
  };

  const handleViewArchive = async (eventId: string) => {
    setIsViewArchiveLoading(true);
    try {
      const archive = await getEventArchive(eventId);
      if (archive) {
        setViewArchiveData(archive);
      } else {
        alert("No archive found for this event.");
      }
    } catch (error) {
      console.error("Failed to load event archive:", error);
      alert("Failed to load event archive.");
    } finally {
      setIsViewArchiveLoading(false);
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
                <HelpTip tipKey="manage-events-page" />
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
          <HelpTip tipKey="add-new-event" />
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
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleOpenArchive(event)}>
                                  Archive event
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
                                <Button size="sm" variant="outline" onClick={() => handleViewArchive(event.id)} disabled={isViewArchiveLoading}>
                                  View Archive
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

      {/* Archive Event Dialog */}
      <Dialog open={archiveEventId !== null} onOpenChange={(open) => { if (!open) setArchiveEventId(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archive event</DialogTitle>
            <DialogDescription>
              Review the figures below. Pressing &quot;Archive event&quot; will permanently delete all attendee, organisation-contact and helper personal data for this event.
            </DialogDescription>
          </DialogHeader>

          {archiveEventRow && (
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-semibold text-gray-900">{archiveEventRow.name}</p>
              <p className="text-gray-500">
                {new Date(archiveEventRow.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {archiveEventRow.location ? ` — ${archiveEventRow.location}` : ''}
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
                <Label htmlFor="seq-number">Event sequence number *</Label>
                <Input
                  id="seq-number"
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
            <Button variant="outline" onClick={() => setArchiveEventId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveEvent}
              disabled={!archivePreview || !archiveSequenceNumber.trim() || isNaN(parseInt(archiveSequenceNumber, 10)) || parseInt(archiveSequenceNumber, 10) <= 0 || isArchiving}
            >
              {isArchiving ? "Archiving..." : "Archive event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Archive Dialog */}
      <Dialog open={viewArchiveData !== null} onOpenChange={(open) => { if (!open) setViewArchiveData(null); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Archive</DialogTitle>
          </DialogHeader>

          {viewArchiveData && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-900">{viewArchiveData.eventName}</p>
                <p className="text-gray-500">
                  {new Date(viewArchiveData.eventDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {viewArchiveData.eventLocation ? ` — ${viewArchiveData.eventLocation}` : ''}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Event #{viewArchiveData.eventSequenceNumber} &middot; Source data purged {new Date(viewArchiveData.sourcePurgedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Headline counts</h4>
                <div className="flex justify-between"><span className="text-gray-600">Companies / organisations</span><span className="font-medium">{viewArchiveData.companiesCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Total headcount</span><span className="font-medium">{viewArchiveData.totalHeadcount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Participants</span><span>{viewArchiveData.participantCount}</span></div>
                <div className="pl-3 flex justify-between text-gray-500"><span>– Helpers</span><span>{viewArchiveData.volunteerCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Participant impairment split</h4>
                <div className="flex justify-between"><span className="text-gray-600">Impaired</span><span className="font-medium">{viewArchiveData.impairedParticipantCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Non-impaired</span><span className="font-medium">{viewArchiveData.nonImpairedParticipantCount}</span></div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2 text-sm">
                <h4 className="font-semibold text-gray-900 mb-2">Consent</h4>
                <div className="flex justify-between"><span className="text-gray-600">Photo</span><span className="font-medium">{viewArchiveData.photoConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Feedback</span><span className="font-medium">{viewArchiveData.feedbackConsentCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Next event</span><span className="font-medium">{viewArchiveData.nextEventConsentCount}</span></div>
              </div>

              {viewArchiveData.orgLines.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-sm">
                  <h4 className="font-semibold text-gray-900 mb-2">Per-organisation breakdown</h4>
                  <div className="space-y-2">
                    {viewArchiveData.orgLines.map((line) => (
                      <div key={line.id} className="border-b last:border-b-0 border-gray-200 pb-2 last:pb-0">
                        <p className="font-medium text-gray-900">{line.orgNameSnapshot}</p>
                        <p className="text-gray-500 text-xs">
                          {line.actualHeadcount} attended &middot; {line.impairedCount} impaired, {line.nonImpairedCount} not
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewArchiveData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
