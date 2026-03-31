"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Manage Events", path: "/admin/p2i/manage-events" },
  { label: "Manage Organisations", path: "/admin/p2i/organisations" },
  { label: "Manage Helpers", path: "/admin/p2i/helpers" },
];

interface P2iAdminNavProps {
  currentPath: string;
}

export function P2iAdminNav({ currentPath }: P2iAdminNavProps) {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    sessionStorage.removeItem("adminLevel");
    sessionStorage.removeItem("administeringEventId");
    router.push("/registration");
  };

  return (
    <div className="flex items-center gap-2">
      {navItems.map((item) => (
        <Button
          key={item.path}
          onClick={() => router.push(item.path)}
          variant={currentPath === item.path ? "default" : "outline"}
        >
          {item.label}
        </Button>
      ))}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        Log out
      </Button>
    </div>
  );
}
