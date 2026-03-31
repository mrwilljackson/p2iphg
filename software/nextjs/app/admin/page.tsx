"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect based on admin level
    const adminAuth = sessionStorage.getItem("adminAuth");
    const adminLevel = sessionStorage.getItem("adminLevel");

    if (adminAuth === "true") {
      if (adminLevel === "p2i") {
        router.push("/admin/p2i/manage-events");
      } else if (adminLevel === "event") {
        router.push("/admin/event");
      } else {
        router.push("/registration");
      }
    } else {
      router.push("/registration");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-4xl mb-4">⏳</div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}

