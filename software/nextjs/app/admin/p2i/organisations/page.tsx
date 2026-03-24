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
  getOrgRecords, getEventById, createOrgRecord, updateOrgRecord, deleteOrgRecord,
} from "@/lib/actions";
import { adminOrgRecordFormSchema, type AdminOrgRecordFormData } from "@/lib/validation";
import type { OrgRecord, Event } from "@/lib/types";

const GROUP_TYPES = ['Family', 'Disability', 'Corporate', 'Sporting', 'Community', 'Educational', 'Other'] as const;

const defaultValues: AdminOrgRecordFormData = {
  name: "",
  groupType: "Other",
  openGroup: true,
  airtableRecordId: "",
};

export default function OrganisationsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [orgs, setOrgs] = useState<OrgRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<OrgRecord | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createForm = useForm<AdminOrgRecordFormData>({
    resolver: zodResolver(adminOrgRecordFormSchema),
    defaultValues,
  });

  const editForm = useForm<AdminOrgRecordFormData>({
    resolver: zodResolver(adminOrgRecordFormSchema),
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
  }, [isAuthenticated]);

  const loadData = async (eventId: string) => {
    try {
      setLoading(true);
      const [event, orgList] = await Promise.all([
        getEventById(eventId),
        getOrgRecords(eventId),
      ]);
      setCurrentEvent(event);
      setOrgs(orgList);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: AdminOrgRecordFormData) => {
    const eventId = sessionStorage.getItem("administeringEventId");
    if (!eventId) return;
    try {
      setIsSaving(true);
      await createOrgRecord({
        eventId,
        name: data.name,
        groupType: data.groupType,
        openGroup: data.openGroup,
        airtableRecordId: data.airtableRecordId || undefined,
      });
      setIsCreateOpen(false);
      createForm.reset(defaultValues);
      await loadData(eventId);
    } catch (error) {
      alert("Failed to create organisation. " + (error instanceof Error ? error.message : ""));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (org: OrgRecord) => {
    setEditingOrg(org);
    editForm.reset({
      name: org.name,
      groupType: org.groupType as AdminOrgRecordFormData["groupType"],
      openGroup: org.openGroup,
      airtableRecordId: org.airtableRecordId?.startsWith("local-") ? "" : (org.airtableRecordId || ""),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (data: AdminOrgRecordFormData) => {
    if (!editingOrg) return;
    const eventId = sessionStorage.getItem("administeringEventId");
    try {
      setIsSaving(true);
      await updateOrgRecord(editingOrg.id, {
        name: data.name,
        groupType: data.groupType,
        openGroup: data.openGroup,
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

  const handleDelete = async (org: OrgRecord) => {
    if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    const eventId = sessionStorage.getItem("administeringEventId");
    try {
      setDeletingId(org.id);
      await deleteOrgRecord(org.id);
      if (eventId) await loadData(eventId);
    } catch (error) {
      alert("Cannot delete: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setDeletingId(null);
    }
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
            You need to select an event to administer before managing its organisations. Go to Manage Events and click <strong>Administer</strong> on the event you want to work with.
          </p>
          <Button onClick={() => router.push("/admin/p2i/manage-events")}>
            Go to Manage Events
          </Button>
        </div>
      </div>
    );
  }

  const formFields = (form: ReturnType<typeof useForm<AdminOrgRecordFormData>>) => (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem>
          <FormLabel>Organisation Name *</FormLabel>
          <FormControl><Input placeholder="e.g. Riverside FC" {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="groupType" render={({ field }) => (
        <FormItem>
          <FormLabel>Group Type *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {GROUP_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />
      <FormField control={form.control} name="openGroup" render={({ field }) => (
        <FormItem className="flex items-center gap-3">
          <FormControl>
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="mt-0!">Open group — visible to individual participants</FormLabel>
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
            <h1 className="text-2xl font-bold text-gray-900">Organisations</h1>
            <p className="text-sm text-gray-600 mt-1">{currentEvent.name}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsCreateOpen(true)}>+ Add Organisation</Button>
            <Button variant="outline" onClick={() => router.push("/admin/p2i")}>
              ← Back to P2I Admin
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orgs.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-gray-200 p-12 text-center text-gray-500">
            No organisations yet. Click &quot;+ Add Organisation&quot; to create one.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Name", "Type", "Group", "Airtable ID", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orgs.map(org => (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{org.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{org.groupType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.openGroup ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {org.openGroup ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                      {org.airtableRecordId?.startsWith("local-") ? "—" : (org.airtableRecordId || "—")}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenEdit(org)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(org)}
                        disabled={deletingId === org.id}
                      >
                        {deletingId === org.id ? "Deleting..." : "Delete"}
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
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Organisation</DialogTitle></DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)}>
              {formFields(createForm)}
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add Organisation"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Organisation</DialogTitle></DialogHeader>
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
