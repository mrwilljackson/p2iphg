"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AdminEventHeader } from "@/components/admin-event-header";
import { getCurrentEvent, getEventById, createRegistration } from "@/lib/actions";
import type { Event } from "@/lib/types";

// Validation schema for volunteer registration
const volunteerRegistrationSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(2, "First name must be at least 2 characters").max(100, "First name must be less than 100 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(100, "Last name must be less than 100 characters"),
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean(),
  nextEventConsent: z.boolean(),
});

type VolunteerRegistrationData = z.infer<typeof volunteerRegistrationSchema>;

export default function RegisterVolunteerPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const form = useForm<VolunteerRegistrationData>({
    resolver: zodResolver(volunteerRegistrationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      photoConsent: true,
      feedbackConsent: false,
      nextEventConsent: false,
    },
  });

  // Load current event
  useEffect(() => {
    async function loadEvent() {
      // Check if P2I admin has selected a specific event to administer
      const administeringEventId = sessionStorage.getItem('administeringEventId');

      let event: Event | null = null;

      if (administeringEventId) {
        // P2I admin is administering a specific event
        event = await getEventById(administeringEventId);
      } else {
        // Regular Event Admin - use current active event
        event = await getCurrentEvent();
      }

      setCurrentEvent(event);
    }
    loadEvent();
  }, []);

  // Check authentication
  useEffect(() => {
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true" && (adminLevel === "event" || adminLevel === "p2i")) {
      setIsAuthenticated(true);
    } else {
      router.push("/test-form");
    }
  }, [router]);

  const onSubmit = async (data: VolunteerRegistrationData) => {
    if (!currentEvent) {
      alert("Error: No event selected. Please refresh the page.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create volunteer registration in registrations table (role="Volunteer")
      const newRegistration = await createRegistration({
        eventId: currentEvent.id,
        attendeeName: data.firstName,
        attendeeSurname: data.lastName,
        email: data.email,
        role: "Volunteer",
        photoConsent: data.photoConsent,
        feedbackConsent: data.feedbackConsent,
        nextEventConsent: data.nextEventConsent,
      });

      console.log("✅ Volunteer registration created:", newRegistration);
      setSubmitSuccess(true);
    } catch (error) {
      console.error("❌ Error saving volunteer registration:", error);
      alert("Error saving volunteer registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
        {/* Event Header */}
        <AdminEventHeader />

        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-semibold text-green-600 mb-2">
                Volunteer Registered Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                The volunteer has been added to the system.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSubmitSuccess(false);
                    form.reset();
                  }}
                  className="bg-lime-500 hover:bg-lime-600"
                >
                  Register Another Volunteer
                </Button>
                <Button
                  onClick={() => router.push("/admin/event")}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Event Header */}
      <AdminEventHeader />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Volunteer Registration</h1>
              <p className="text-sm text-gray-600 mt-1">Event Admin - {currentEvent?.name || "PowerHouseGames 2026"}</p>
            </div>
            <Button
              onClick={() => router.push("/admin/event")}
              variant="outline"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Volunteer Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Register a new volunteer and collect their consent preferences
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="volunteer@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* First Name and Last Name - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Photo Consent */}
              <FormField
                control={form.control}
                name="photoConsent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Photo Consent</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value ? "true" : "false"}
                        className="space-y-3"
                      >
                        <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                          <RadioGroupItem value="true" id="photo-yes" />
                          <div className="flex-1">
                            <div className="font-medium">Yes - I consent to photos</div>
                            <div className="text-sm text-gray-600">
                              No wristband needed
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
                          <RadioGroupItem value="false" id="photo-no" />
                          <div className="flex-1">
                            <div className="font-medium">No - I do not consent to photos</div>
                            <div className="text-sm text-gray-600">
                              Orange wristband - no photos
                            </div>
                          </div>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email Consent Checkboxes */}
              <div className="space-y-4">
                <FormLabel className="text-base font-semibold">Email Consent</FormLabel>

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
                        <span className="font-normal text-sm flex-1">
                          I consent to be contacted for feedback about this event
                        </span>
                      </label>
                    </FormItem>
                  )}
                />

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
                        <span className="font-normal text-sm flex-1">
                          I consent to be contacted about future events
                        </span>
                      </label>
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-lime-500 hover:bg-lime-600 active:bg-purple-500 text-white text-lg h-12"
              >
                {isSubmitting ? "Registering..." : "Register A New Volunteer"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

