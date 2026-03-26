"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationFormSchema } from "@/lib/validation";
import type { RegistrationFormData, Event, Organization, Volunteer, OrgContactOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { getCurrentEvent, getOrganizations, getAllVolunteers, createRegistration, updateVolunteer, updateGroupLeaderConsents, findOrCreateFamilyGroup, getExistingGroupLeaders, getOrgContactsForEvent } from "@/lib/actions";
import { organizationsToOptions } from "@/lib/helpers";
import { isFieldVisible, type RegistrationType } from "@/lib/field-visibility-config";
import type { RegistrationRole } from "@/lib/types";

interface RegistrationFormProps {
  preselectedRole?: RegistrationRole;
}

export function RegistrationForm({ preselectedRole }: RegistrationFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [organizations, setOrganizations] = useState<ComboboxOption[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [showVolunteerAlert, setShowVolunteerAlert] = useState(false);
  const [showOrganizationAlert, setShowOrganizationAlert] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState<Organization[]>([]);

  // Group contact picker state
  const [orgContacts, setOrgContacts] = useState<OrgContactOption[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  // 'new' = new contact option; contactId string = known contact; null = none selected
  const [selectedContactId, setSelectedContactId] = useState<string | 'new' | null>(null);

  // Multi-leader detection state
  const [existingLeaderInfo, setExistingLeaderInfo] = useState<{
    hasExistingLeaders: boolean;
    leaders: { name: string; groupSize: number }[];
    totalParticipantsRegistered: number;
  } | null>(null);
  const [additionalLeaderChoice, setAdditionalLeaderChoice] = useState<'additional_leader' | 'additional_participants' | null>(null);

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      eventId: "",
      attendeeName: "",
      attendeeSurname: "",
      email: "",
      organizationId: "",
      impairment: "",
      role: preselectedRole || "Participant",
      photoConsent: true,
      feedbackConsent: false,
      nextEventConsent: false,
      groupSize: undefined,
      disabledStudents: undefined,
      senStudents: undefined,
      groupLeaderParticipating: undefined,
    },
  });

  // Update role when preselectedRole changes
  useEffect(() => {
    if (preselectedRole) {
      form.setValue("role", preselectedRole);
    }
  }, [preselectedRole, form]);

  // Watch the role field to show/hide conditional fields
  const selectedRole = form.watch("role") as RegistrationType;
  const attendeeSurname = form.watch("attendeeSurname");
  const selectedOrgId = form.watch("organizationId");

  // Determine total steps based on role
  const getTotalSteps = () => {
    if (selectedRole === "Volunteer") return 1; // Single page for volunteers
    if (selectedRole === "Participant") return 2; // Step 1: Details, Step 2: Consents
    if (selectedRole === "Group") return 3; // Step 1: Org/Email/Name, Step 2: Participation/Group, Step 3: Consents
    return 1;
  };

  // Reset to step 1 when role changes
  useEffect(() => {
    setCurrentStep(1);
  }, [selectedRole]);

  // Check for existing group leaders when org is selected and role is Group
  useEffect(() => {
    async function checkExistingLeaders() {
      if (selectedRole === 'Group' && selectedOrgId && selectedOrgId !== 'FAMILY_GROUP_PLACEHOLDER' && selectedOrgId !== 'NOT_LISTED' && currentEvent?.id) {
        try {
          const info = await getExistingGroupLeaders(currentEvent.id, selectedOrgId);
          setExistingLeaderInfo(info);
          // Reset choice when org changes
          setAdditionalLeaderChoice(null);
        } catch (error) {
          console.error('Error checking existing leaders:', error);
          setExistingLeaderInfo(null);
        }
      } else {
        setExistingLeaderInfo(null);
        setAdditionalLeaderChoice(null);
      }
    }
    checkExistingLeaders();
  }, [selectedRole, selectedOrgId, currentEvent?.id]);

  // Fetch contacts for group.contactPicker when org is selected in Group role
  useEffect(() => {
    let cancelled = false;
    async function fetchOrgContacts() {
      if (selectedRole !== 'Group' || !selectedOrgId || selectedOrgId === 'FAMILY_GROUP_PLACEHOLDER' || selectedOrgId === 'NOT_LISTED' || !currentEvent?.id) {
        setOrgContacts([]);
        setSelectedContactId(null);
        setContactsLoading(false);
        return;
      }
      try {
        setContactsLoading(true);
        const contacts = await getOrgContactsForEvent(currentEvent.id, selectedOrgId);
        if (!cancelled) {
          setOrgContacts(contacts);
          setSelectedContactId(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error fetching org contacts:', err);
          setOrgContacts([]);
        }
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    }
    fetchOrgContacts();
    return () => { cancelled = true; };
  }, [selectedOrgId, selectedRole, currentEvent?.id]);

  // Check if selected organization is a closed group (group leader registers on behalf of participants)
  // All closed groups (openGroup === false) need group size / impairment fields
  // Family Group placeholder is always treated as a closed group
  const selectedOrg = allOrganizations.find(org => org.id === selectedOrgId);
  const shouldShowImpairmentFields =
    selectedOrgId === "FAMILY_GROUP_PLACEHOLDER" ||
    selectedOrg?.openGroup === false;

  // Navigation handlers
  const handleNext = async () => {
    // Validate current step fields before proceeding
    const isValid = await validateCurrentStep();
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, getTotalSteps()));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Validate fields for current step
  const validateCurrentStep = async (): Promise<boolean> => {
    let fieldsToValidate: (keyof RegistrationFormData)[] = [];

    if (selectedRole === "Participant") {
      if (currentStep === 1) {
        fieldsToValidate = ["organizationId", "attendeeName", "attendeeSurname", "email", "impairment"];
      }
    } else if (selectedRole === "Group") {
      if (currentStep === 1) {
        fieldsToValidate = ["organizationId", "email", "attendeeName", "attendeeSurname"];
      } else if (currentStep === 2) {
        if (additionalLeaderChoice === 'additional_leader') {
          // Additional leader only — skip group size fields (already set to 0)
          fieldsToValidate = ["groupLeaderParticipating"];
        } else {
          fieldsToValidate = ["groupLeaderParticipating", "groupSize", "disabledStudents", "senStudents"];
        }
      }
    }

    // Trigger validation for the specified fields
    const result = await form.trigger(fieldsToValidate);
    return result;
  };

  // Helper function to determine if a section should be visible based on current step
  const shouldShowSection = (section: string): boolean => {
    // Volunteer role - single page, show everything
    if (selectedRole === "Volunteer") {
      return true;
    }

    // Participant role - 2 steps
    if (selectedRole === "Participant") {
      if (currentStep === 1) {
        return section === "organizationEmail" || section === "personalDetails" || section === "impairment";
      }
      if (currentStep === 2) {
        return section === "consents";
      }
    }

    // Group role - 3 steps
    if (selectedRole === "Group") {
      if (currentStep === 1) {
        return section === "organizationEmail" || section === "personalDetails";
      }
      if (currentStep === 2) {
        return section === "groupLeaderParticipation" || section === "groupDetails";
      }
      if (currentStep === 3) {
        return section === "consents";
      }
    }

    return false;
  };

  // Reset volunteer state when role changes away from Volunteer
  useEffect(() => {
    if (selectedRole !== "Volunteer") {
      setShowVolunteerAlert(false);
      setSelectedVolunteerId("");
    }
  }, [selectedRole]);

  // Reset organization alert and clear selected org when role changes
  // (the filtered options list changes per role, so previous selection may be invalid)
  useEffect(() => {
    if (selectedRole !== "Group") {
      setShowOrganizationAlert(false);
      setOrgContacts([]);
      setSelectedContactId(null);
    }
    form.setValue("organizationId", "");
  }, [selectedRole, form]);

  // Update organizations list with personalized "Family Group" option
  useEffect(() => {
    const updateOrganizations = async () => {
      const eventId = form.getValues("eventId");
      const orgs = await getOrganizations(eventId);

      // Store full organization objects for later reference
      setAllOrganizations(orgs);

      const orgOptions = organizationsToOptions(orgs, selectedRole);

      // Find and update the "Family Group" option with personalized surname
      // The organizationsToOptions helper includes "Family Group" only for Group role
      const updatedOptions = orgOptions.map(option => {
        if (option.value === "FAMILY_GROUP_PLACEHOLDER" && attendeeSurname && attendeeSurname.trim()) {
          return {
            ...option,
            label: `${attendeeSurname} Family Group`
          };
        }
        return option;
      });

      setOrganizations(updatedOptions);
    };

    updateOrganizations();
  }, [attendeeSurname, selectedRole, form]);

  // Load pre-populated data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Fetch current event first
        let event = await getCurrentEvent();

        // If the event date is in the past, treat as no active event
        if (event) {
          const eventDate = new Date(event.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          if (eventDate < today) {
            event = null;
          }
        }

        if (event) {
          setCurrentEvent(event);
          // Pre-populate the event field
          form.setValue('eventId', event.id);

          // Fetch event-specific organizations and volunteers
          const [orgs, vols] = await Promise.all([
            getOrganizations(event.id),
            getAllVolunteers(event.id),
          ]);

          // Convert organizations to combobox options (filtered by role)
          setOrganizations(organizationsToOptions(orgs, selectedRole));

          // Store volunteers for name picker
          setVolunteers(vols);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [form]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    console.log("Form submitted:", data);

    try {
      let finalOrganizationId = data.organizationId;
      let createdFamilyGroup: Organization | undefined;

      // Check if "Family Group" placeholder was selected
      // The placeholder has a special ID "FAMILY_GROUP_PLACEHOLDER" that's always available
      if (data.organizationId === "FAMILY_GROUP_PLACEHOLDER") {
        // Create or find the family group organization
        console.log("Creating/finding family group for:", data.attendeeSurname);

        createdFamilyGroup = await findOrCreateFamilyGroup(
          data.eventId,
          data.attendeeSurname,
          data.email || "",
          data.attendeeName,
          data.attendeeSurname
        );

        console.log("Family group created/found:", createdFamilyGroup);
        finalOrganizationId = createdFamilyGroup.id!;
      }

      // Save registration to database
      const registration = await createRegistration({
        eventId: data.eventId,
        attendeeName: data.attendeeName,
        attendeeSurname: data.attendeeSurname,
        email: data.email,
        organizationId: finalOrganizationId,
        impairment: data.impairment,
        role: data.role,
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent,
        nextEventConsent: data.nextEventConsent,
        groupSize: data.groupSize,
        disabledStudents: data.disabledStudents,
        senStudents: data.senStudents,
        groupLeaderParticipating: data.groupLeaderParticipating,
      });

      console.log("Registration saved successfully:", registration);

      // If a volunteer registered, sync their updated email and consent choices back to the volunteers table
      if (data.role === "Volunteer" && selectedVolunteerId) {
        await updateVolunteer(selectedVolunteerId, {
          email: data.email,
          photoConsent: data.photoConsent,
          feedbackConsent: data.feedbackConsent ?? false,
          nextEventConsent: data.nextEventConsent ?? false,
        });
      }

      // If a group leader registered, sync their updated email and consent choices back to the organisation_contacts record
      if (data.role === "Group") {
        const contactOrg = createdFamilyGroup ?? selectedOrg;
        if (contactOrg?.contactId) {
          await updateGroupLeaderConsents(contactOrg.contactId, {
            contactEmail: data.email,
            photoConsent: data.photoConsent,
            feedbackConsent: data.feedbackConsent ?? false,
            nextEventConsent: data.nextEventConsent ?? false,
          });
        }
      }

      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        form.reset();
        setSubmitSuccess(false);
        // Reload the page to get fresh data
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error("Error saving registration:", error);
      setIsSubmitting(false);
      // TODO: Show error message to user
      alert("Failed to save registration. Please try again.");
    }
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Loading event information...</p>
      </div>
    );
  }

  if (!currentEvent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-orange-600 mb-2">
          No Active Event
        </h2>
        <p className="text-gray-600">There is no active event set up for registration.</p>
        <p className="text-gray-500 text-sm mt-2">Please ask an administrator to set an event as active.</p>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-semibold text-green-600 mb-2">
          Registration Successful!
        </h2>
        <p className="text-gray-600">Thank you for registering.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title when role is preselected via QR code */}
        {preselectedRole && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {preselectedRole === "Volunteer" && "Helper Registration"}
              {preselectedRole === "Participant" && "Participant Registration"}
              {preselectedRole === "Group" && "Group Leader Registration"}
            </h2>
            <p className="text-gray-600 mt-2">
              {preselectedRole === "Volunteer" && "Thank you for volunteering to help at today's event!"}
              {preselectedRole === "Participant" && "Welcome! Let's get you registered for today's event."}
              {preselectedRole === "Group" && "Welcome! Let's register your group for today's event."}
            </p>
          </div>
        )}

        {/* Event ID - Hidden field, automatically set from header/context */}
        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Registration Type - Hidden if preselectedRole is provided */}
        {!preselectedRole && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Type *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="Participant" id="participant" />
                      <div className="flex-1">
                        <div className="font-semibold">👤 I&apos;m a Participant</div>
                        <div className="text-sm text-gray-600">I&apos;m here to take part in the event today - Hooray!</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="Group" id="group" />
                      <div className="flex-1">
                        <div className="font-semibold">👨‍🏫 I am a Teacher, Parent or a Community Group Leader</div>
                        <div className="text-sm text-gray-600">I have brought one or more participants for todays event</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="Volunteer" id="volunteer" />
                      <div className="flex-1">
                        <div className="font-semibold">🙋 I&apos;m a Helper</div>
                        <div className="text-sm text-gray-600">I&apos;m here to help run and support the event today <br />
                        ( I won't be taking part in any games)</div>
                      </div>
                    </label>

                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Separator: Role -> Personal Details */}
        {!showOrganizationAlert && shouldShowSection("organizationEmail") && <hr className="my-6 border-gray-200" />}

        {/* GROUP ROLE: Organization and Email first (side by side) */}
        {selectedRole === "Group" && !showOrganizationAlert && shouldShowSection("organizationEmail") && (isFieldVisible("organizationId", selectedRole) || isFieldVisible("email", selectedRole)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization - Left */}
            {isFieldVisible("organizationId", selectedRole) && (
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Organisation or Group Name: *</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => {
                          if (value === "NOT_LISTED") {
                            setShowOrganizationAlert(true);
                            field.onChange("");
                          } else {
                            setShowOrganizationAlert(false);
                            field.onChange(value);

                            // Pre-populate contact details and consent preferences for Group role
                            const selectedOrg = allOrganizations.find(org => org.id === value);
                            if (selectedOrg) {
                              if (selectedOrg.contactFirstName) {
                                form.setValue("attendeeName", selectedOrg.contactFirstName);
                              }
                              if (selectedOrg.contactLastName) {
                                form.setValue("attendeeSurname", selectedOrg.contactLastName);
                              }
                              if (selectedOrg.contactEmail) {
                                form.setValue("email", selectedOrg.contactEmail);
                              }
                              // Pre-populate saved consent preferences
                              form.setValue("photoConsent", selectedOrg.photoConsent ?? true);
                              form.setValue("feedbackConsent", selectedOrg.feedbackConsent ?? false);
                              form.setValue("nextEventConsent", selectedOrg.nextEventConsent ?? false);
                            }
                          }
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your group" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org.value} value={org.value}>
                              {org.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="NOT_LISTED" className="text-orange-600 font-medium">
                            ⚠️ My organisation isn&apos;t listed here!
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email - Right */}
            {isFieldVisible("email", selectedRole) && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your email:</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* PARTICIPANT ROLE: Organization and Email first (side by side) */}
        {selectedRole === "Participant" && !showOrganizationAlert && shouldShowSection("organizationEmail") && (isFieldVisible("organizationId", selectedRole) || isFieldVisible("email", selectedRole)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization - Left (Combobox for Participant) */}
            {isFieldVisible("organizationId", selectedRole) && (
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Group Name *</FormLabel>
                    <FormControl>
                      <Combobox
                        options={organizations}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select your group"
                        searchPlaceholder="- choose here -"
                        emptyText="No organization found."
                        allowCustom={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email - Right */}
            {isFieldVisible("email", selectedRole) && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your email:</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        )}

        {/* First Name and Last Name - Side by Side */}
        {!showOrganizationAlert && shouldShowSection("personalDetails") && (isFieldVisible("attendeeName", selectedRole) || isFieldVisible("attendeeSurname", selectedRole)) && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              {isFieldVisible("attendeeName", selectedRole) && (
                <FormField
                  control={form.control}
                  name="attendeeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your first name: *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter first name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Last Name */}
              {isFieldVisible("attendeeSurname", selectedRole) && (
                <FormField
                  control={form.control}
                  name="attendeeSurname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your last name: *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Instructional note for Group role with disability organizations (excluding Family Group) */}
            {selectedRole === "Group" && selectedOrg?.groupType === 'Disability' && (
              <p className="text-sm text-blue-600 mt-2">
                ℹ️ <strong>Please check your details are correct - sometimes other staff attend on behalf of the original organiser!</strong>
              </p>
            )}

          </>
        )}

        {/* Existing group leader notice - shown when another leader from same org has already registered */}
        {selectedRole === "Group" && shouldShowSection("groupLeaderParticipation") && existingLeaderInfo?.hasExistingLeaders && (
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-800 mb-2">
              ℹ️ {selectedOrg?.name || 'This organisation'} already has a group registration
            </p>
            <div className="text-sm text-blue-700 mb-3">
              {existingLeaderInfo.leaders.map((leader, i) => (
                <p key={i}>
                  <strong>{leader.name}</strong> has registered {leader.groupSize} participant{leader.groupSize !== 1 ? 's' : ''}
                </p>
              ))}
              <p className="mt-1 font-medium">
                Total participants already registered: {existingLeaderInfo.totalParticipantsRegistered}
              </p>
            </div>
            <p className="text-sm text-blue-800 font-medium mb-2">What would you like to do?</p>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 border border-blue-300 rounded-lg p-3 cursor-pointer hover:bg-blue-100 bg-white">
                <input
                  type="radio"
                  name="additionalLeaderChoice"
                  value="additional_leader"
                  checked={additionalLeaderChoice === 'additional_leader'}
                  onChange={() => {
                    setAdditionalLeaderChoice('additional_leader');
                    // Set groupSize to 0 — no additional participants
                    form.setValue('groupSize', 0);
                    form.setValue('disabledStudents', 0);
                    form.setValue('senStudents', 0);
                  }}
                  className="accent-blue-600"
                />
                <div className="flex-1">
                  <span className="font-medium">Register as additional leader only</span>
                  <p className="text-xs text-gray-500 mt-0.5">No extra participants — they are already counted</p>
                </div>
              </label>
              <label className="flex items-center space-x-2 border border-blue-300 rounded-lg p-3 cursor-pointer hover:bg-blue-100 bg-white">
                <input
                  type="radio"
                  name="additionalLeaderChoice"
                  value="additional_participants"
                  checked={additionalLeaderChoice === 'additional_participants'}
                  onChange={() => {
                    setAdditionalLeaderChoice('additional_participants');
                    // Clear the auto-set values so user can enter their own
                    form.setValue('groupSize', undefined);
                    form.setValue('disabledStudents', undefined);
                    form.setValue('senStudents', undefined);
                  }}
                  className="accent-blue-600"
                />
                <div className="flex-1">
                  <span className="font-medium">Register additional participants</span>
                  <p className="text-xs text-gray-500 mt-0.5">I&apos;m bringing more people from this organisation</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Group Leader Participation - For Group role only - Step 2 */}
        {selectedRole === "Group" && shouldShowSection("groupLeaderParticipation") && (
          <FormField
            control={form.control}
            name="groupLeaderParticipating"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Will you be participating in the games?</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === "true")}
                    value={field.value === undefined ? undefined : field.value ? "true" : "false"}
                    className="space-y-2"
                  >
                    <label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="true" id="participating-yes" />
                      <div className="flex-1">I will be joining in the games as a participant</div>
                    </label>
                    <label className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="false" id="participating-no" />
                      <div className="flex-1">I will not be taking part in the games</div>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Group Size Field - For NON-Disability/NON-Family Groups - Show after name fields - Step 2 for Group */}
        {selectedRole === "Group" && shouldShowSection("groupDetails") && !shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("groupSize", selectedRole) && (
          <FormField
            control={form.control}
            name="groupSize"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>How many participants are in your group (not including yourself)? *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="e.g., 25"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Volunteer Name Selector */}
        {selectedRole === "Volunteer" && !showOrganizationAlert && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <label className="text-sm font-medium sm:pt-2">Select your name:</label>
            <Select
              value={selectedVolunteerId}
              onValueChange={(value) => {
                if (value === "NOT_LISTED") {
                  setShowVolunteerAlert(true);
                  setSelectedVolunteerId("");
                  form.setValue("email", "");
                } else {
                  setShowVolunteerAlert(false);
                  setSelectedVolunteerId(value);
                  const vol = volunteers.find(v => v.id === value);
                  if (vol) {
                    form.setValue("attendeeName", vol.firstName);
                    form.setValue("attendeeSurname", vol.lastName);
                    form.setValue("email", vol.email);
                    form.setValue("photoConsent", vol.photoConsent);
                    form.setValue("feedbackConsent", vol.feedbackConsent);
                    form.setValue("nextEventConsent", vol.nextEventConsent);
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your name" />
              </SelectTrigger>
              <SelectContent>
                {volunteers.map((vol) => (
                  <SelectItem key={vol.id} value={vol.id}>
                    {vol.firstName} {vol.lastName}
                  </SelectItem>
                ))}
                <SelectItem value="NOT_LISTED" className="text-orange-600 font-medium">
                  ⚠️ My name isn&apos;t listed here!
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Email field - shown after a volunteer is selected */}
        {selectedRole === "Volunteer" && selectedVolunteerId && !showVolunteerAlert && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <FormLabel className="sm:pt-2">Your email:</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />
        )}



        {/* Volunteer Not Listed Alert */}
        {showVolunteerAlert && selectedRole === "Volunteer" && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">👋</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 text-lg mb-3">
                  OK - first can we check if you are going to join in with the Games as a player?
                </h3>

                {/* Participant Option */}
                <div className="bg-white border-2 border-blue-300 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 mb-3">
                    <strong>If you are playing in the Games</strong>, please sign up as a Participant instead:
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      window.location.href = '/registration?role=Participant';
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                  >
                    🎯 Switch to Participant Registration
                  </Button>
                </div>

                {/* Volunteer Option */}
                <div className="bg-white border-2 border-lime-300 rounded-lg p-4">
                  <p className="text-gray-800 mb-2">
                    <strong>If you are not taking part</strong> but are setting up, cleaning afterwards, or helping move equipment:
                  </p>
                  <p className="text-orange-800 mb-3">
                    We&apos;re excited to have you join us - thank you! Please speak to a <strong>Power2Inspire team member</strong> so we can capture your details and get you registered properly.
                  </p>
                  <p className="text-orange-700 text-sm">
                    Look for someone wearing a P2I staff badge - they&apos;ll be happy to help you! 🎉
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Organization Not Listed Alert */}
        {showOrganizationAlert && selectedRole === "Group" && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">🏢</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 text-lg mb-2">
                  Group Not Listed
                </h3>
                <p className="text-orange-800 mb-3">
                  Your group isn&apos;t currently registered for this event.
                  Please speak to a <strong>Power2Inspire team member</strong> and we can register your group right away!
                </p>
                <p className="text-orange-700 text-sm">
                  Look for someone wearing a P2I staff badge - they&apos;ll be happy to help you! 🎉
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Consent - Step 2 for Participant, Step 3 for Group, Step 1 for Volunteer */}
        {!showVolunteerAlert && !showOrganizationAlert && shouldShowSection("consents") && (isFieldVisible("feedbackConsent", selectedRole) || isFieldVisible("nextEventConsent", selectedRole)) && (
          // For volunteers, only show if a volunteer has been selected from the name picker
          selectedRole !== "Volunteer" || (selectedVolunteerId && !showVolunteerAlert)
        ) && (
          <div className="space-y-3">
            <FormLabel>Please can we contact you:</FormLabel>

            {/* Feedback Consent */}
            {isFieldVisible("feedbackConsent", selectedRole) && (
              <FormField
                control={form.control}
                name="feedbackConsent"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex flex-row items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <span className="font-normal text-sm">
                          To ask for your honest feedback after todays event?<br /> (4 minute online survey)
                        </span>
                      </div>
                    </label>
                  </FormItem>
                )}
              />
            )}

            {/* Next Event Consent */}
            {isFieldVisible("nextEventConsent", selectedRole) && (
              <FormField
                control={form.control}
                name="nextEventConsent"
                render={({ field }) => (
                  <FormItem>
                    <label className="flex flex-row items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none flex-1">
                        <span className="font-normal text-sm">
                          To share info about our next event?
                        </span>
                      </div>
                    </label>
                  </FormItem>
                )}
              />
            )}
          </div>
        )}
        {/* Impairment - Label and Input Side by Side - Step 1 for Participant */}
        {!showOrganizationAlert && shouldShowSection("impairment") && isFieldVisible("impairment", selectedRole) && (
          <FormField
            control={form.control}
            name="impairment"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <FormLabel className="sm:pt-2">Do you consider yourself to be a disabled person, or to have a long‑term physical or mental health condition or impairment?</FormLabel>
                  <div className="space-y-2">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Please select..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="Rather not say">Rather not say</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            )}
          />
        )}



        {/* Separator: Impairment -> Group Details (conditional) */}
        {!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("groupSize", selectedRole) && (
          <hr className="my-6 border-gray-200" />
        )}

        {/* Group Size Field - For Disability and Family Groups ONLY - Show after impairment field - Step 2 for Group */}
        {!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("groupSize", selectedRole) && (
          <FormField
            control={form.control}
            name="groupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How many participants are you responsible for in your group *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    max="999"
                    placeholder="e.g., 25"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Disabled Students - Only for Disability Groups and Family Groups - Step 2 for Group */}
        {!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("disabledStudents", selectedRole) && (
          <FormField
            control={form.control}
            name="disabledStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How many of your participants are disabled people, or to have a long‑term physical or mental health condition or impairment? *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="e.g., 5"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* SEN Students - Only for Disability Groups and Family Groups - Step 2 for Group */}
        {!showOrganizationAlert && shouldShowSection("groupDetails") && shouldShowImpairmentFields && additionalLeaderChoice !== 'additional_leader' && isFieldVisible("senStudents", selectedRole) && (
          <FormField
            control={form.control}
            name="senStudents"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Do you have any special educational needs (SEN) or require additional learning support (for example dyslexia support, autism support, or similar)? *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="999"
                    placeholder="e.g., 3"
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseInt(value, 10));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Separator: Personal/Group Details -> Consent */}
        {!showOrganizationAlert && shouldShowSection("consents") && <hr className="my-6 border-gray-200" />}

        {/* Photo Consent - Step 2 for Participant, Step 3 for Group, Step 1 for Volunteer */}
        {!showVolunteerAlert && !showOrganizationAlert && shouldShowSection("consents") && isFieldVisible("photoConsent", selectedRole) && (
          // For volunteers, only show if a volunteer has been selected from the name picker
          selectedRole !== "Volunteer" || (selectedVolunteerId && !showVolunteerAlert)
        ) && (
          <FormField
            control={form.control}
            name="photoConsent"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Consent to photography *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(value === "true")}
                    defaultValue={field.value ? "true" : "false"}
                    className="flex flex-col space-y-2"
                  >
                    <label className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="true" id="photo-yes" className="mt-1" />
                      <span className="font-normal flex-1">
                        {selectedRole === "Group"
                          ? "Yes, the whole group including staff consents to the use of photographs as specified"
                          : "Yes, I consent to the use of photographs as specified"}
                      </span>
                    </label>
                    <label className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="false" id="photo-no" className="mt-1" />
                      <span className="font-normal flex-1">
                        {selectedRole === "Group"
                          ? "No. Those within the group will wear a coloured wristband to denote they do not wish photos to be used in this way. Those not wearing wristbands have consented."
                          : "No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way"}
                      </span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Step Progress Indicator - Only show for multi-step forms */}
        {!showVolunteerAlert && !showOrganizationAlert && getTotalSteps() > 1 && (
          <div className="flex items-center justify-center space-x-2 py-4">
            {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-8 bg-lime-500'
                    : step < currentStep
                    ? 'w-2 bg-lime-300'
                    : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Navigation Buttons */}
        {!showVolunteerAlert && !showOrganizationAlert && (
          <div className="flex gap-4">
            {/* Back Button - Only show if not on first step and multi-step form */}
            {currentStep > 1 && getTotalSteps() > 1 && (
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                ← Back
              </Button>
            )}

            {/* Next Button - Show if not on last step */}
            {currentStep < getTotalSteps() && (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-lime-500 hover:bg-lime-600 text-white font-semibold"
                size="lg"
              >
                Next →
              </Button>
            )}

            {/* Submit Button - Only show on last step or single-step form */}
            {(currentStep === getTotalSteps() || getTotalSteps() === 1) && (
              <Button
                type="submit"
                className="flex-1 bg-lime-500 hover:bg-lime-600 active:bg-purple-600 text-white font-semibold transition-colors"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Click here to register!"}
              </Button>
            )}
          </div>
        )}
      </form>
    </Form>
  );
}
