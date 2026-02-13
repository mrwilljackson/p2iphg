"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationFormSchema } from "@/lib/validation";
import type { RegistrationFormData, Event, Organization } from "@/lib/types";
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
import { MockDataService, organizationsToOptions } from "@/lib/mock-data-service";
import { isFieldVisible, type RegistrationType } from "@/lib/field-visibility-config";
import type { RegistrationRole } from "@/lib/types";

interface RegistrationFormProps {
  preselectedRole?: RegistrationRole;
}

export function RegistrationForm({ preselectedRole }: RegistrationFormProps = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [organizations, setOrganizations] = useState<ComboboxOption[]>([]);
  const [volunteerEmails, setVolunteerEmails] = useState<string[]>([]);
  const [showVolunteerAlert, setShowVolunteerAlert] = useState(false);
  const [showOrganizationAlert, setShowOrganizationAlert] = useState(false);

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
  const volunteerEmail = form.watch("email");

  // Debug: Log the selected role and field visibility
  console.log("Selected Role:", selectedRole);
  console.log("Group Size Visible:", isFieldVisible("groupSize", selectedRole));
  console.log("Email Visible:", isFieldVisible("email", selectedRole));

  // Reset volunteer alert when role changes away from Volunteer
  useEffect(() => {
    if (selectedRole !== "Volunteer") {
      setShowVolunteerAlert(false);
    }
  }, [selectedRole]);

  // Reset organization alert when role changes away from Group
  useEffect(() => {
    if (selectedRole !== "Group") {
      setShowOrganizationAlert(false);
    }
  }, [selectedRole]);

  // Update organizations list with personalized "Family Group" option
  useEffect(() => {
    const updateOrganizations = async () => {
      const orgs = await MockDataService.getOrganizations();
      const orgOptions = organizationsToOptions(orgs);

      // Find and update the "Family Group" option
      const updatedOptions = orgOptions.map(option => {
        if (option.label === "Family Group" && attendeeSurname && attendeeSurname.trim()) {
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
  }, [attendeeSurname]);

  // Load pre-populated data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Fetch current event, organizations, and volunteer emails from mock data service
        const [event, orgs, emails] = await Promise.all([
          MockDataService.getCurrentEvent(),
          MockDataService.getOrganizations(),
          MockDataService.getVolunteerEmails(),
        ]);

        if (event) {
          setCurrentEvent(event);
          // Pre-populate the event field
          form.setValue('eventId', event.id);
        }

        // Convert organizations to combobox options
        setOrganizations(organizationsToOptions(orgs));

        // Store volunteer emails
        setVolunteerEmails(emails);
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setSubmitSuccess(true);
    
    // Reset form after 2 seconds
    setTimeout(() => {
      form.reset();
      setSubmitSuccess(false);
    }, 2000);
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

        {/* Registration Type */}
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Registration Type *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                      <div className="font-semibold">🙋 I&apos;m a Volunteer</div>
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

        {/* Separator: Role -> Personal Details */}
        {!showOrganizationAlert && <hr className="my-6 border-gray-200" />}

        {/* First Name and Last Name - Side by Side */}
        {!showOrganizationAlert && (isFieldVisible("attendeeName", selectedRole) || isFieldVisible("attendeeSurname", selectedRole)) && (
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
        )}

        {/* Email and Organization - Side by Side for Participant/Group, Stacked for Volunteer */}
        {!showOrganizationAlert && (isFieldVisible("email", selectedRole) || isFieldVisible("organizationId", selectedRole)) && (
          <>
            {selectedRole === "Volunteer" ? (
              // Volunteer: Email field with label on left
              isFieldVisible("email", selectedRole) && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                        <FormLabel className="sm:pt-2">Your email:</FormLabel>
                        <div className="space-y-2">
                          <FormControl>
                            <Select
                              onValueChange={async (value) => {
                                if (value === "NOT_LISTED") {
                                  setShowVolunteerAlert(true);
                                  field.onChange("");
                                } else {
                                  setShowVolunteerAlert(false);
                                  field.onChange(value);

                                  // Pre-populate volunteer details
                                  const volunteer = await MockDataService.getVolunteerByEmail(value);
                                  if (volunteer) {
                                    form.setValue("attendeeName", volunteer.firstName);
                                    form.setValue("attendeeSurname", volunteer.lastName);
                                    form.setValue("photoConsent", volunteer.photoConsent);
                                    form.setValue("feedbackConsent", volunteer.feedbackConsent);
                                    form.setValue("nextEventConsent", volunteer.nextEventConsent);
                                  }
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your email" />
                              </SelectTrigger>
                              <SelectContent>
                                {volunteerEmails.map((email) => (
                                  <SelectItem key={email} value={email}>
                                    {email}
                                  </SelectItem>
                                ))}
                                <SelectItem value="NOT_LISTED" className="text-orange-600 font-medium">
                                  ⚠️ My email isn&apos;t listed here!
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </div>
                      </div>
                    </FormItem>
                  )}
                />
              )
            ) : (
              // Participant/Group: Email and Organization side by side with labels above
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {isFieldVisible("organizationId", selectedRole) && (
                  <FormField
                    control={form.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Organisation or Group</FormLabel>
                        <FormControl>
                          {selectedRole === "Group" ? (
                            // Group: Dropdown with "not listed" option
                            <Select
                              onValueChange={(value) => {
                                if (value === "NOT_LISTED") {
                                  setShowOrganizationAlert(true);
                                  field.onChange("");
                                } else {
                                  setShowOrganizationAlert(false);
                                  field.onChange(value);
                                }
                              }}
                              value={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select your organisation" />
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
                          ) : (
                            // Participant: Combobox with custom entry
                            <Combobox
                              options={organizations}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select or type organisation name..."
                              searchPlaceholder="- choose here -"
                              emptyText="No organization found."
                              allowCustom={true}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Volunteer Not Listed Alert */}
        {showVolunteerAlert && selectedRole === "Volunteer" && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-6 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="text-3xl">👋</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 text-lg mb-2">
                  Welcome New Volunteer!
                </h3>
                <p className="text-orange-800 mb-3">
                  We&apos;re excited to have you join us! Since this is your first time volunteering with us,
                  please speak to a <strong>Power2Inspire team member</strong> so we can capture your details
                  and get you registered properly.
                </p>
                <p className="text-orange-700 text-sm">
                  Look for someone wearing a P2I staff badge - they&apos;ll be happy to help you! 🎉
                </p>
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
                  Organisation Not Listed
                </h3>
                <p className="text-orange-800 mb-3">
                  Your organisation isn&apos;t currently registered for this event.
                  Please speak to a <strong>Power2Inspire team member</strong> so we can add your organisation
                  and get your group registered.
                </p>
                <p className="text-orange-700 text-sm">
                  Look for someone wearing a P2I staff badge - they&apos;ll be happy to help you! 🎉
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Email Consent */}
        {!showVolunteerAlert && !showOrganizationAlert && (isFieldVisible("feedbackConsent", selectedRole) || isFieldVisible("nextEventConsent", selectedRole)) && (
          // For volunteers, only show if an email is selected (not empty and not NOT_LISTED)
          selectedRole !== "Volunteer" || (volunteerEmail && volunteerEmail !== "" && volunteerEmail !== "NOT_LISTED")
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
        {/* Impairment - Label and Input Side by Side */}
        {!showOrganizationAlert && isFieldVisible("impairment", selectedRole) && (
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
        {!showOrganizationAlert && (isFieldVisible("groupSize", selectedRole) ||
          isFieldVisible("disabledStudents", selectedRole) ||
          isFieldVisible("senStudents", selectedRole)) && (
          <hr className="my-6 border-gray-200" />
        )}

        {/* Conditional Fields for Teacher/Coordinator */}
        {!showOrganizationAlert && (isFieldVisible("groupSize", selectedRole) ||
          isFieldVisible("disabledStudents", selectedRole) ||
          isFieldVisible("senStudents", selectedRole)) && (
          <>
            {/* Group Size */}
            {isFieldVisible("groupSize", selectedRole) && (
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

            {/* Disabled Students */}
            {isFieldVisible("disabledStudents", selectedRole) && (
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

            {/* SEN Students */}
            {isFieldVisible("senStudents", selectedRole) && (
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
          </>
        )}

        {/* Separator: Personal/Group Details -> Consent */}
        {!showOrganizationAlert && <hr className="my-6 border-gray-200" />}

        {/* Photo Consent */}
        {!showVolunteerAlert && !showOrganizationAlert && isFieldVisible("photoConsent", selectedRole) && (
          // For volunteers, only show if an email is selected (not empty and not NOT_LISTED)
          selectedRole !== "Volunteer" || (volunteerEmail && volunteerEmail !== "" && volunteerEmail !== "NOT_LISTED")
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
                        Yes, I consent to the use of photographs as specified
                      </span>
                    </label>
                    <label className="flex items-start space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                      <RadioGroupItem value="false" id="photo-no" className="mt-1" />
                      <span className="font-normal flex-1">
                        No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way
                      </span>
                    </label>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Submit Button */}
        {!showVolunteerAlert && !showOrganizationAlert && (
          <Button
            type="submit"
            className="w-full bg-lime-500 hover:bg-lime-600 active:bg-purple-600 text-white font-semibold transition-colors"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Click here to register!"}
          </Button>
        )}
      </form>
    </Form>
  );
}
