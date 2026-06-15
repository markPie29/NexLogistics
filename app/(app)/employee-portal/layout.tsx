"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useEmployeeProfileStore } from "@/lib/store/employee-portal";
import { EmployeeNav } from "@/components/employee/EmployeeNav";

export default function EmployeePortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const employees = useEmployeeProfileStore((s) => s.employees);

  useEffect(() => {
    const t = setTimeout(() => {
      const u = useAuthStore.getState().user;
      if (!u) {
        router.replace("/login");
        return;
      }
      // Allow employee role AND driver/helper (they have an EmployeeProfile linked by userId)
      const allowed = ["employee", "driver", "helper"].includes(u.role);
      if (!allowed) {
        router.replace("/login");
      }
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // Resolve employee profile to get employeeType for nav
  const profile = employees.find((e) => e.userId === user.id);
  const employeeType = profile?.employeeType;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-20">
        {children}
      </div>
      <EmployeeNav employeeType={employeeType} />
    </div>
  );
}
