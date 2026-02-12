"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationFormSchema } from "@/lib/validation";
import type { RegistrationFormData } from "@/lib/types";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

// Common organizations - can be fetched from API in the future
const ORGANIZATION_OPTIONS: ComboboxOption[] = [
  { value: "Community Centre", label: "Community Centre" },
  { value: "Local School", label: "Local School" },
  { value: "Sports Club", label: "Sports Club" },
  { value: "NHS Trust", label: "NHS Trust" },
  { value: "Charity Organization", label: "Charity Organization" },
  { value: "University", label: "University" },
  { value: "Private Company", label: "Private Company" },
];

export function RegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      eventId: "event-1", // Pre-selected to current event
      attendeeName: "",
      attendeeSurname: "",
      email: "",
      organizationId: "",
      impairment: "",
      role: "Attendee",
      photoConsent: false,
      marketingConsent: false,
    },
  });

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
        {/* Event Selection */}
        <FormField
          control={form.control}
          name="eventId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="event-1">PowerHouseGames 2026</SelectItem>
                  <SelectItem value="event-2">Summer Festival 2026</SelectItem>
                </SelectContent>
              </Select>
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
                      <div className="font-semibold">👤 Attendee</div>
                      <div className="text-sm text-gray-600">You are participating in todays event!</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Volunteer" id="volunteer" />
                    <Label htmlFor="volunteer" className="cursor-pointer flex-1">
                      <div className="font-semibold">🙋 Volunteer</div>
                      <div className="text-sm text-gray-600">You have volunteered to help run todays event</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="Teacher / Coordinator" id="teacher" />
                    <Label htmlFor="teacher" className="cursor-pointer flex-1">
                      <div className="font-semibold">👨‍🏫 Teacher / Coordinator</div>
                      <div className="text-sm text-gray-600">You have either brought a group of participants or volunteers with you today</div>
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

        {/* Organization */}
        <FormField
          control={form.control}
          name="organizationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization</FormLabel>
              <FormControl>
                <Combobox
                  options={ORGANIZATION_OPTIONS}
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

        {/* Marketing Consent */}
        <FormField
          control={form.control}
          name="marketingConsent"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>I would like to receive emails about Power2Inspire&apos;s work *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(value === "true")}
                  defaultValue={field.value ? "true" : "false"}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-start space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="true" id="marketing-yes" className="mt-1" />
                    <Label htmlFor="marketing-yes" className="cursor-pointer font-normal">
                      Yes, I would like to hear from Power2Inspire
                    </Label>
                  </div>
                  <div className="flex items-start space-x-2 border rounded-lg p-4">
                    <RadioGroupItem value="false" id="marketing-no" className="mt-1" />
                    <Label htmlFor="marketing-no" className="cursor-pointer font-normal">
                      No, please don&apos;t add me to the mailing list
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </Button>
      </form>
    </Form>
  );
}
