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

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [organizations, setOrganizations] = useState<ComboboxOption[]>([]);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      eventId: "",
      attendeeName: "",
      attendeeSurname: "",
      email: "",
      organizationId: "",
      impairment: "",
      role: "Attendee",
      photoConsent: false,
      feedbackConsent: false,
      nextEventConsent: false,
      groupSize: undefined,
      disabledStudents: undefined,
      senStudents: undefined,
    },
  });

  // Watch the role field to show/hide conditional fields
  const selectedRole = form.watch("role");

  // Load pre-populated data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Fetch current event and organizations from mock data service
        const [event, orgs] = await Promise.all([
          MockDataService.getCurrentEvent(),
          MockDataService.getOrganizations(),
        ]);

        if (event) {
          setCurrentEvent(event);
          // Pre-populate the event field
          form.setValue('eventId', event.id);
        }

        // Convert organizations to combobox options
        setOrganizations(organizationsToOptions(orgs));
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
                    <RadioGroupItem value="Attendee" id="attendee" />
                    <div className="flex-1">
                      <div className="font-semibold">👤 I&apos;m an Attendee</div>
                      <div className="text-sm text-gray-600">I&apos;m here to take part in the event today - Hooray!</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Volunteer" id="volunteer" />
                    <div className="flex-1">
                      <div className="font-semibold">🙋 I&apos;m a Volunteer</div>
                      <div className="text-sm text-gray-600">I&apos;m here to help support and run the event today</div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Teacher / Coordinator" id="teacher" />
                    <div className="flex-1">
                      <div className="font-semibold">👨‍🏫 I am a Teacher, Parent or Coordinator of a group</div>
                      <div className="text-sm text-gray-600">I have brought one or more participants and/or volunteers to take part in todays event</div>
                    </div>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Separator: Role -> Personal Details */}
        <hr className="my-6 border-gray-200" />

        {/* First Name and Last Name - Side by Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
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

          {/* Last Name */}
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
        </div>

        {/* Email Consent */}
        <div className="space-y-3">
          <FormLabel>Please can we contact you:</FormLabel>

          {/* Feedback Consent */}
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
                      To ask for your honest feedback after todays event? (4 minute online survey)
                    </span>
                  </div>
                </label>
              </FormItem>
            )}
          />

          {/* Next Event Consent */}
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
        </div>

        {/* Email - Label and Input Side by Side */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <FormLabel className="sm:pt-2">Your email:</FormLabel>
                <div className="space-y-2">
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />



        {/* Impairment - Label and Input Side by Side */}
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

        {/* Organization - Label and Input Side by Side */}
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <FormLabel className="sm:pt-2">Your organisation</FormLabel>
                <div className="space-y-2">
                  <FormControl>
                    <Combobox
                      options={organizations}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select or type organisation name..."
                      searchPlaceholder="Search organisations..."
                      emptyText="No organization found."
                      allowCustom={true}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Separator: Impairment -> Group Details (conditional) */}
        {selectedRole === "Teacher / Coordinator" && (
          <hr className="my-6 border-gray-200" />
        )}

        {/* Conditional Fields for Teacher/Coordinator */}
        {selectedRole === "Teacher / Coordinator" && (
          <>
            {/* Group Size */}
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

            {/* Disabled Students */}
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

            {/* SEN Students */}
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
          </>
        )}

        {/* Separator: Personal/Group Details -> Consent */}
        <hr className="my-6 border-gray-200" />

        {/* Photo Consent */}
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

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-lime-500 hover:bg-lime-600 active:bg-purple-600 text-white font-semibold transition-colors"
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Click here to register!"}
        </Button>
      </form>
    </Form>
  );
}
