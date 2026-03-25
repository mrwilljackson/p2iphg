"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getAllVolunteers, getAllEvents, createVolunteer, updateVolunteer, deleteVolunteer,
} from "@/lib/actions";
import { adminHelperFormSchema, type AdminHelperFormData } from "@/lib/validation";
import type { Volunteer, Event } from "@/lib/types";

const defaultValues: AdminHelperFormData = {
  eventId: "",
  firstName: "",
  lastName: "",
  email: "",
  photoConsent: true,
  feedbackConsent: false,
  nextEventConsent: false,
  airtableRecordId: "",
};

export default function HelpersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [helpers, setHelpers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState<string>("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Volunteer | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import from another event
  const [importOpen, setImportOpen] = useState(false);
  const [importEventId, setImportEventId] = useState<string>("");
  const [importHelpers, setImportHelpers] = useState<Volunteer[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const createForm = useForm<AdminHelperFormData>({
    resolver: zodResolver(adminHelperFormSchema),
    defaultValues,
  });

  const editForm = useForm<AdminHelperFormData>({
    resolver: zodResolver(adminHelperFormSchema),
    defaultValues,
  });

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");
    if (adminAuth === "true" && adminLevel === "p2i") {
      setIsAuthenticated(true);
    } else {
      router.push("/admin");
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadEvents();
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedEventId) {
      loadHelpers(selectedEventId);
    } else {
      setHelpers([]);
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (!importEventId) { setImportHelpers([]); return; }
    setImportLoading(true);
    getAllVolunteers(importEventId)
      .then(setImportHelpers)
      .catch(() => alert("Failed to load helpers from that event"))
      .finally(() => setImportLoading(false));
  }, [importEventId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventList = await getAllEvents();
      setEvents(eventList);
      const adminEventId = sessionStorage.getItem("administeringEventId");
      if (adminEventId && eventList.some(e => e.id === adminEventId)) {
        setSelectedEventId(adminEventId);
      } else if (eventList.length > 0) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (error) {
      console.error("Error loading events:", error);
      alert("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const loadHelpers = async (eventId: string) => {
    try {
      const list = await getAllVolunteers(eventId);
      setHelpers(list);
    } catch (error) {
      console.error("Error loading helpers:", error);
      alert("Failed to load helpers");
    }
  };

  const handleCreate = async (data: AdminHelperFormData) => {
    try {
      setIsSaving(true);
      await createVolunteer({
        eventId: data.eventId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent,
        nextEventConsent: data.nextEventConsent,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsCreateOpen(false);
      createForm.reset(defaultValues);
      setImportOpen(false);
      setImportEventId("");
      setImportHelpers([]);
      await loadHelpers(data.eventId);
    } catch (error) {
      alert("Failed to create helper. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (helper: Volunteer) => {
    setEditingHelper(helper);
    editForm.reset({
      eventId: helper.eventId,
      firstName: helper.firstName,
      lastName: helper.lastName,
      email: helper.email,
      photoConsent: helper.photoConsent,
      feedbackConsent: helper.feedbackConsent,
      nextEventConsent: helper.nextEventConsent,
      airtableRecordId: helper.airtableRecordId?.startsWith("local-") ? "" : (helper.airtableRecordId || ""),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (data: AdminHelperFormData) => {
    if (!editingHelper) return;
    try {
      setIsSaving(true);
      await updateVolunteer(editingHelper.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent,
        nextEventConsent: data.nextEventConsent,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsEditOpen(false);
      await loadHelpers(selectedEventId);
    } catch (error) {
      alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (helper: Volunteer) => {
    const name = `${helper.firstName} ${helper.lastName}`;
    if (!confirm(`Delete helper "${name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(helper.id);
      await deleteVolunteer(helper.id);
      await loadHelpers(selectedEventId);
    } catch (error) {
      alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyFromEvent = (source: Volunteer) => {
    createForm.reset({
      eventId: selectedEventId,
      firstName: source.firstName,
      lastName: source.lastName,
      email: source.email,
      photoConsent: source.photoConsent,
      feedbackConsent: source.feedbackConsent,
      nextEventConsent: source.nextEventConsent,
      airtableRecordId: "",
    });
    setImportOpen(false);
    setImportEventId("");
    setImportHelpers([]);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{loading ? "Loading..." : "Checking authentication..."}</p>
      </div>
    );
  }

  const otherEvents = events.filter(e => e.id !== selectedEventId);

  const consentFields = (form: ReturnType<typeof useForm<AdminHelperFormData>>) => (
    <div className="space-y-3">
      <FormField control={form.control} name="photoConsent" render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="mt-0!">Photo consent</FormLabel>
        </FormItem>
      )} />
      <FormField control={form.control} name="feedbackConsent" render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="mt-0!">Feedback survey consent</FormLabel>
        </FormItem>
      )} />
      <FormField control={form.control} name="nextEventConsent" render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="mt-0!">Next event info consent</FormLabel>
        </FormItem>
      )} />
    </div>
  );

  const formFields = (form: ReturnType<typeof useForm<AdminHelperFormData>>, isEdit = false) => (
    <div className="space-y-4">
      {!isEdit && (
        <FormField control={form.control} name="eventId" render={({ field }) => (
          <FormItem>
            <FormLabel>Event *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {events.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      )}
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="firstName" render={({ field }) => (
          <FormItem>
            <FormLabel>First Name *</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="lastName" render={({ field }) => (
          <FormItem>
            <FormLabel>Last Name *</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="email" render={({ field }) => (
        <FormItem>
          <FormLabel>Email *</FormLabel>
          <FormControl><Input type="email" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Consent preferences</p>
        {consentFields(form)}
      </div>
      <FormField control={form.control} name="airtableRecordId" render={({ field }) => (
        <FormItem>
          <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
          <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helpers</h1>
            {selectedEvent && (
              <p className="text-sm text-gray-600 mt-1">{selectedEvent.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              createForm.reset({ ...defaultValues, eventId: selectedEventId });
              setImportOpen(false);
              setImportEventId("");
              setImportHelpers([]);
              setIsCreateOpen(true);
            }}>
              + Add Helper
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/p2i")}>
              ← Back to P2I Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Event filter */}
        <div className="bg-white rounded-xl shadow border border-gray-200 p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by event:</label>
          <select
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedEventId}
            onChange={e => setSelectedEventId(e.target.value)}
          >
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">{helpers.length} helper{helpers.length !== 1 ? "s" : ""}</span>
        </div>

        {helpers.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
            No helpers for this event yet. Click &quot;+ Add Helper&quot; to create one.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Email", "Photo", "Feedback", "Next Event", "Airtable ID", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {helpers.map(helper => (
                  <tr key={helper.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {helper.firstName} {helper.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{helper.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ConsentBadge value={helper.photoConsent} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ConsentBadge value={helper.feedbackConsent} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <ConsentBadge value={helper.nextEventConsent} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {helper.airtableRecordId?.startsWith("local-") ? "—" : (helper.airtableRecordId || "—")}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(helper)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(helper)}
                        disabled={deletingId === helper.id}
                      >
                        {deletingId === helper.id ? "Deleting..." : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        setIsCreateOpen(open);
        if (!open) { setImportOpen(false); setImportEventId(""); setImportHelpers([]); }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Helper</DialogTitle></DialogHeader>

          {/* Import from another event */}
          {otherEvents.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setImportOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-700 transition-colors"
              >
                <span>Copy details from another event</span>
                <span className="text-gray-400 text-xs">{importOpen ? "▲" : "▼"}</span>
              </button>
              {importOpen && (
                <div className="px-4 py-3 space-y-3 border-t border-gray-200">
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={importEventId}
                    onChange={e => setImportEventId(e.target.value)}
                  >
                    <option value="">Select an event…</option>
                    {otherEvents.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  {importLoading && (
                    <p className="text-xs text-gray-500">Loading helpers…</p>
                  )}
                  {!importLoading && importEventId && importHelpers.length === 0 && (
                    <p className="text-xs text-gray-500">No helpers found for that event.</p>
                  )}
                  {importHelpers.length > 0 && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md">
                      {importHelpers.map(h => (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => handleCopyFromEvent(h)}
                          className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">{h.firstName} {h.lastName}</p>
                            <p className="text-xs text-gray-500">{h.email}</p>
                          </div>
                          <span className="text-xs text-blue-600 font-medium shrink-0 ml-3">Copy</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)}>
              {formFields(createForm, false)}
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Helper"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Helper</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
              {formFields(editForm, true)}
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConsentBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
      value ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
    }`}>
      {value ? "Yes" : "No"}
    </span>
  );
}
