"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationFormSchema } from "@/lib/validation";
import type { RegistrationFormData, Event, Organization } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        {/* Event Selection - Pre-populated from mock data service */}
        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event *</FormLabel>
              <FormControl>
                <Input
                  value={currentEvent?.name || 'No event selected'}
                  disabled
                  className="bg-gray-50"
                />
              </FormControl>
              {currentEvent && (
                <p className="text-sm text-gray-500">
                  {currentEvent.date && `Date: ${currentEvent.date}`}
                  {currentEvent.location && ` • Location: ${currentEvent.location}`}
                </p>
              )}
              <FormMessage />
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
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Attendee" id="attendee" />
                    <Label htmlFor="attendee" className="cursor-pointer flex-1">
                      <div className="font-semibold">👤 I&apos;m an Attendee</div>
                      <div className="text-sm text-gray-600">I&apos;m here to take part in the event today - Hooray!</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Volunteer" id="volunteer" />
                    <Label htmlFor="volunteer" className="cursor-pointer flex-1">
                      <div className="font-semibold">🙋 I&apos;m a Volunteer</div>
                      <div className="text-sm text-gray-600">I&apos;m here to help support and run the event today</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Teacher / Coordinator" id="teacher" />
                    <Label htmlFor="teacher" className="cursor-pointer flex-1">
                      <div className="font-semibold">👨‍🏫 I am a Teacher, Parent or Coordinator of a group</div>
                      <div className="text-sm text-gray-600">I have brought one or more participants and/or volunteers to take part in todays event</div>
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First Name */}
        <FormField
          control={form.control}
          name="attendeeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
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
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Organization - Loaded from mock data service */}
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <FormControl>
                <Combobox
                  options={organizations}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select or type organization..."
                  searchPlaceholder="Search organizations..."
                  emptyText="No organization found."
                  allowCustom={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Impairment */}
        <FormField
          control={form.control}
          name="impairment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Do you have an impairment</FormLabel>
              <FormControl>
                <Input placeholder="e.g., wheelchair user, visual impairment, none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Conditional Fields for Teacher/Coordinator */}
        {selectedRole === "Teacher / Coordinator" && (
          <>
            {/* Group Size */}
            <FormField
              control={form.control}
              name="groupSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of participants in your group *</FormLabel>
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

            {/* SEN Students */}
            <FormField
              control={form.control}
              name="senStudents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of SEN / disabled students in your group *</FormLabel>
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
          </>
        )}

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
                  <div className="flex items-start space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="true" id="photo-yes" className="mt-1" />
                    <Label htmlFor="photo-yes" className="cursor-pointer font-normal">
                      Yes, I consent to the use of photographs as specified
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="false" id="photo-no" className="mt-1" />
                    <Label htmlFor="photo-no" className="cursor-pointer font-normal">
                      No, I will wear an orange wristband to denote I do not wish photos of me to be used in this way
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Consent */}
        <div className="space-y-3">
          <FormLabel>Please can we contact you to:</FormLabel>

          {/* Feedback Consent */}
          <FormField
            control={form.control}
            name="feedbackConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer font-normal">
                    Ask for your honest feedback after todays event?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Next Event Consent */}
          <FormField
            control={form.control}
            name="nextEventConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 border rounded-lg p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="cursor-pointer font-normal">
                    Share info about our next event?
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </Button>
      </form>
    </Form>
  );
}
