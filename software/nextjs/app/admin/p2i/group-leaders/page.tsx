"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  getGroupLeaders, getOrgRecords, getEventById, getAllEvents,
  createGroupLeader, updateGroupLeader, deleteGroupLeader,
} from "@/lib/actions";
import { adminGroupLeaderFormSchema, type AdminGroupLeaderFormData } from "@/lib/validation";
import type { GroupLeader, OrgRecord, Event } from "@/lib/types";

const defaultValues: AdminGroupLeaderFormData = {
  orgId: "",
  openGroup: true,
  expectedGroupSize: null,
  contactFirstName: "",
  contactLastName: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
  airtableRecordId: "",
};

export default function GroupLeadersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [leaders, setLeaders] = useState<GroupLeader[]>([]);
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<GroupLeader | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import from another event
  const [importOpen, setImportOpen] = useState(false);
  const [importEventId, setImportEventId] = useState<string>("");
  const [importLeaders, setImportLeaders] = useState<GroupLeader[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const createForm = useForm<AdminGroupLeaderFormData>({
    resolver: zodResolver(adminGroupLeaderFormSchema),
    defaultValues,
  });

  const editForm = useForm<AdminGroupLeaderFormData>({
    resolver: zodResolver(adminGroupLeaderFormSchema),
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
    const eventId = sessionStorage.getItem("administeringEventId");
    if (!eventId) return;
    loadData(eventId);
    getAllEvents().then(setAllEvents).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!importEventId) { setImportLeaders([]); return; }
    setImportLoading(true);
    getGroupLeaders(importEventId)
      .then(setImportLeaders)
      .catch(() => alert("Failed to load group leaders from that event"))
      .finally(() => setImportLoading(false));
  }, [importEventId]);

  const loadData = async (eventId: string) => {
    try {
      setLoading(true);
      const [event, leaderList, orgList] = await Promise.all([
        getEventById(eventId),
        getGroupLeaders(eventId),
        getOrgRecords(),
      ]);
      setCurrentEvent(event);
      setLeaders(leaderList);
      setOrgs(orgList);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: AdminGroupLeaderFormData) => {
    const eventId = sessionStorage.getItem("administeringEventId");
    if (!eventId) return;
    try {
      setIsSaving(true);
      await createGroupLeader({
        orgId: data.orgId,
        eventId,
        openGroup: data.openGroup,
        expectedGroupSize: data.expectedGroupSize ?? undefined,
        contactFirstName: data.contactFirstName || undefined,
        contactLastName: data.contactLastName || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        notes: data.notes || undefined,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsCreateOpen(false);
      createForm.reset(defaultValues);
      resetImport();
      await loadData(eventId);
    } catch (error) {
      alert("Failed to create group leader. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (leader: GroupLeader) => {
    setEditingLeader(leader);
    editForm.reset({
      orgId: leader.orgId,
      openGroup: leader.openGroup,
      expectedGroupSize: leader.expectedGroupSize ?? null,
      contactFirstName: leader.contactFirstName || "",
      contactLastName: leader.contactLastName || "",
      contactEmail: leader.contactEmail || "",
      contactPhone: leader.contactPhone || "",
      notes: leader.notes || "",
      airtableRecordId: leader.airtableRecordId?.startsWith("local-") ? "" : (leader.airtableRecordId || ""),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (data: AdminGroupLeaderFormData) => {
    if (!editingLeader) return;
    const eventId = sessionStorage.getItem("administeringEventId");
    try {
      setIsSaving(true);
      await updateGroupLeader(editingLeader.id, {
        orgId: data.orgId !== editingLeader.orgId ? data.orgId : undefined,
        openGroup: data.openGroup,
        expectedGroupSize: data.expectedGroupSize ?? null,
        contactFirstName: data.contactFirstName || undefined,
        contactLastName: data.contactLastName || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
        notes: data.notes || undefined,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsEditOpen(false);
      if (eventId) await loadData(eventId);
    } catch (error) {
      alert("Failed to save changes. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (leader: GroupLeader) => {
    const name = [leader.contactFirstName, leader.contactLastName].filter(Boolean).join(" ") || leader.orgName;
    if (!confirm(`Delete group leader "${name}"? This cannot be undone.`)) return;
    const eventId = sessionStorage.getItem("administeringEventId");
    try {
      setDeletingId(leader.id);
      await deleteGroupLeader(leader.id);
      if (eventId) await loadData(eventId);
    } catch (error) {
      alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyFromEvent = (source: GroupLeader) => {
    // orgId carries across directly since organisations are event-agnostic.
    // Only pre-fill if the org exists in the current orgs list.
    const orgExists = orgs.some(o => o.id === source.orgId);
    createForm.reset({
      orgId: orgExists ? source.orgId : "",
      openGroup: source.openGroup,
      expectedGroupSize: source.expectedGroupSize ?? null,
      contactFirstName: source.contactFirstName || "",
      contactLastName: source.contactLastName || "",
      contactEmail: source.contactEmail || "",
      contactPhone: source.contactPhone || "",
      notes: source.notes || "",
      airtableRecordId: "",
    });
    resetImport();
  };

  const resetImport = () => {
    setImportOpen(false);
    setImportEventId("");
    setImportLeaders([]);
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{loading ? "Loading..." : "Checking authentication..."}</p>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-10 text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No event selected</h2>
          <p className="text-gray-600 mb-6">
            You need to select an event to administer before managing its group leaders. Go to Manage Events and click <strong>Administer</strong> on the event you want to work with.
          </p>
          <Button onClick={() => router.push("/admin/p2i/manage-events")}>
            Go to Manage Events
          </Button>
        </div>
      </div>
    );
  }

  const otherEvents = allEvents.filter(e => e.id !== currentEvent.id);

  const formFields = (form: ReturnType<typeof useForm<AdminGroupLeaderFormData>>) => (
    <div className="space-y-4">
      <FormField control={form.control} name="orgId" render={({ field }) => (
        <FormItem>
          <FormLabel>Organisation *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Select organisation" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {orgs.map(org => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name} ({org.groupType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
          {orgs.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No organisations found for this event. Add organisations first.
            </p>
          )}
        </FormItem>
      )} />
      <FormField control={form.control} name="openGroup" render={({ field }) => (
        <FormItem>
          <FormLabel>Group Type</FormLabel>
          <FormControl>
            <div className="space-y-2">
              {[
                { value: true, label: "Open group", description: "individuals register as participants" },
                { value: false, label: "Closed group", description: "group leaders register only" },
              ].map(option => (
                <label
                  key={String(option.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                    field.value === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    className="accent-blue-600"
                    checked={field.value === option.value}
                    onChange={() => field.onChange(option.value)}
                  />
                  <span className="text-sm">
                    <span className="font-medium text-gray-900">{option.label}</span>
                    <span className="text-gray-500"> — {option.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="expectedGroupSize" render={({ field }) => (
        <FormItem>
          <FormLabel>Expected Group Size</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={1}
              placeholder="e.g. 12"
              value={field.value ?? ""}
              onChange={e => field.onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="contactFirstName" render={({ field }) => (
          <FormItem>
            <FormLabel>Leader First Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="contactLastName" render={({ field }) => (
          <FormItem>
            <FormLabel>Leader Last Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="contactEmail" render={({ field }) => (
        <FormItem>
          <FormLabel>Leader Email</FormLabel>
          <FormControl><Input type="email" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="contactPhone" render={({ field }) => (
        <FormItem>
          <FormLabel>Leader Phone</FormLabel>
          <FormControl><Input type="tel" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem>
          <FormLabel>Notes</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="airtableRecordId" render={({ field }) => (
        <FormItem>
          <FormLabel>Airtable Record ID <span className="text-gray-400 font-normal">(optional)</span></FormLabel>
          <FormControl><Input placeholder="recXXXXXXXXXXXXXX" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Group Leaders</h1>
            <p className="text-sm text-gray-600 mt-1">{currentEvent.name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              createForm.reset(defaultValues);
              resetImport();
              setIsCreateOpen(true);
            }}>
              + Add Group Leader
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/p2i/organisations")}>
              Manage Organisations
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/p2i")}>
              ← Back to P2I Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {leaders.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
            No group leaders yet. Click &quot;+ Add Group Leader&quot; to create one.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Organisation", "Group", "Exp. Size", "Leader", "Email", "Airtable ID", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaders.map(leader => (
                  <tr key={leader.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{leader.orgName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        leader.openGroup ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {leader.openGroup ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {leader.expectedGroupSize ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {[leader.contactFirstName, leader.contactLastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{leader.contactEmail || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {leader.airtableRecordId?.startsWith("local-") ? "—" : (leader.airtableRecordId || "—")}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(leader)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(leader)}
                        disabled={deletingId === leader.id}
                      >
                        {deletingId === leader.id ? "Deleting..." : "Delete"}
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
        if (!open) resetImport();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Group Leader</DialogTitle></DialogHeader>

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
                    <p className="text-xs text-gray-500">Loading group leaders…</p>
                  )}
                  {!importLoading && importEventId && importLeaders.length === 0 && (
                    <p className="text-xs text-gray-500">No group leaders found for that event.</p>
                  )}
                  {importLeaders.length > 0 && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-md">
                      {importLeaders.map(l => {
                        const name = [l.contactFirstName, l.contactLastName].filter(Boolean).join(" ") || "—";
                        const orgExists = orgs.some(o => o.id === l.orgId);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleCopyFromEvent(l)}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-blue-50 text-left transition-colors"
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900">{name}</p>
                              <p className="text-xs text-gray-500">
                                {l.orgName}
                                {!orgExists && (
                                  <span className="text-amber-600 ml-1">(org not in current event)</span>
                                )}
                              </p>
                            </div>
                            <span className="text-xs text-blue-600 font-medium shrink-0 ml-3">Copy</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)}>
              {formFields(createForm)}
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Group Leader"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Group Leader</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleSaveEdit)}>
              {formFields(editForm)}
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
