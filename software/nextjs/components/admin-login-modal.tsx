"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminLoginModal({ open, onOpenChange }: AdminLoginModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Simulate PIN validation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TODO: Replace with actual authentication logic (e.g., API call)
    if (pin === "1234") {
      // Event Admin - set authentication and redirect to event admin dashboard
      sessionStorage.setItem("adminAuth", "true");
      sessionStorage.setItem("adminLevel", "event");
      onOpenChange(false);
      setPin("");
      router.push("/admin/event");
    } else if (pin === "9876") {
      // P2I Admin - set authentication and redirect to P2I admin dashboard
      sessionStorage.setItem("adminAuth", "true");
      sessionStorage.setItem("adminLevel", "p2i");
      onOpenChange(false);
      setPin("");
      router.push("/admin/p2i");
    } else {
      setError("Invalid PIN code. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setPin("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Access</DialogTitle>
          <DialogDescription>
            Enter your PIN code to access the admin dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN Code</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError("");
              }}
              autoFocus
              required
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-lime-500 hover:bg-lime-600 active:bg-purple-600 text-white font-semibold transition-colors"
            disabled={isSubmitting || !pin}
          >
            {isSubmitting ? "Verifying..." : "Admin log in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

