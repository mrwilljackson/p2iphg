"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getAllEvents, setCurrentEvent, updateEvent, deleteEvent } from "@/lib/actions";
import { adminEventFormSchema, type AdminEventFormData } from "@/lib/validation";
import type { Event } from "@/lib/types";

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
              <h1 className="text-2xl font-bold text-gray-900">P2I Admin Dashboard - Manage Events</h1>
              <p className="text-sm text-gray-600 mt-1">View all events and set the current active event</p>
            </div>
            <Button
              onClick={() => {
                sessionStorage.removeItem("adminAuth");
                sessionStorage.removeItem("adminLevel");
                sessionStorage.removeItem("administeringEventId");
                router.push("/registration");
              }}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Log out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
                                <Button size="sm" variant="outline" onClick={() => handleSetCurrent(event.id)} disabled={settingCurrent !== null}>
                                  {settingCurrent === event.id ? 'Setting...' : 'Set as Current'}
                                </Button>
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
    </div>
  );
}
