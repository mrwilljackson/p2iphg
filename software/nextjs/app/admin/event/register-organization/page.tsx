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
import { MockDataService } from "@/lib/mock-data-service";
import type { Event } from "@/lib/types";

// Validation schema for organization registration
const organizationRegistrationSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  photoConsent: z.boolean(),
  feedbackConsent: z.boolean(),
  nextEventConsent: z.boolean(),
  groupSize: z.number().min(1, "Group size must be at least 1").max(999, "Group size must be less than 1000").optional(),
  disabledStudents: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
  senStudents: z.number().min(0, "Cannot be negative").max(999, "Must be less than 1000").optional(),
});

type OrganizationRegistrationData = z.infer<typeof organizationRegistrationSchema>;

export default function RegisterOrganizationPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitType, setSubmitType] = useState<"quick" | "full">("full");
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);

  const form = useForm<OrganizationRegistrationData>({
    resolver: zodResolver(organizationRegistrationSchema),
    defaultValues: {
      organizationName: "",
      email: "",
      firstName: "",
      lastName: "",
      photoConsent: true,
      feedbackConsent: false,
      nextEventConsent: false,
      groupSize: undefined,
      disabledStudents: undefined,
      senStudents: undefined,
    },
  });

  // Load current event
  useEffect(() => {
    async function loadEvent() {
      const event = await MockDataService.getCurrentEvent();
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

  const onSubmit = async (data: OrganizationRegistrationData) => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (submitType === "quick") {
      console.log("Quick Add - Organization Only:", {
        organizationName: data.organizationName,
      });
    } else {
      console.log("Full Registration - Organization & Group Leader:", data);
    }

    setIsSubmitting(false);
    setSubmitSuccess(true);
  };

  const handleQuickSubmit = () => {
    setSubmitType("quick");
    form.handleSubmit(onSubmit)();
  };

  const handleFullSubmit = () => {
    setSubmitType("full");
    form.handleSubmit(onSubmit)();
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
                {submitType === "quick"
                  ? "Organization Added Successfully!"
                  : "Organization & Group Leader Registered Successfully!"}
              </h2>
              <p className="text-gray-600 mb-6">
                {submitType === "quick"
                  ? "The organization has been added to the system. The group leader can register their details as normal."
                  : "The organization and group leader have been added to the system."}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSubmitSuccess(false);
                    form.reset();
                  }}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  Add Another Organization
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
              <h1 className="text-2xl font-bold text-gray-900">Add New Organization or Group</h1>
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

        {/* Organization Name Card - Required */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Step 1: Add Organization Name</h2>
            <p className="text-sm text-gray-600 mt-1">
              This is the only required field - you can add group leader details later if needed
            </p>
          </div>

          <Form {...form}>
            <div className="space-y-6">
              {/* Organization Name */}
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization or Group Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Manchester United FC, St. Mary's School, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quick Submit Button */}
              <Button
                type="button"
                onClick={handleQuickSubmit}
                disabled={isSubmitting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg h-12"
              >
                {isSubmitting && submitType === "quick" ? "Adding..." : "✓ Add Organization Only (Skip Group Leader Details)"}
              </Button>
            </div>
          </Form>
        </div>

        {/* Group Leader Details Card - Optional */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Step 2: Group Leader Details (Optional)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete these fields if the group leader is available, or skip and have them register separately
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* First Name and Last Name - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name (optional)" {...field} />
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
                        <Input placeholder="Last name (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                        placeholder="leader@organization.com (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <hr className="my-6" />

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Group Information</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Details about the participants in this group (all optional)
                </p>
              </div>

              {/* Group Size */}
              <FormField
                control={form.control}
                name="groupSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How many participants have you brought today?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="999"
                        placeholder="e.g., 15 (optional)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        value={field.value ?? ""}
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
                    <FormLabel>How many of your participants have a disability?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        placeholder="e.g., 5 (optional)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        value={field.value ?? ""}
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
                    <FormLabel>How many of your participants have SEN or additional learning support needs?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        placeholder="e.g., 3 (optional)"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <hr className="my-6" />

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

              {/* Full Submit Button */}
              <Button
                type="button"
                onClick={handleFullSubmit}
                disabled={isSubmitting}
                className="w-full bg-purple-500 hover:bg-purple-600 active:bg-lime-500 text-white text-lg h-12"
              >
                {isSubmitting && submitType === "full" ? "Registering..." : "✓ Register Organization & Complete Group Leader Details"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}


