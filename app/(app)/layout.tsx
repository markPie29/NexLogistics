"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const darkMode = useUiStore((s) => s.darkMode);

  // Hydrate dark mode class on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    // Platform-admin has its own login gate — skip the main-app auth redirect
    if (pathname === "/platform-admin") return;
    // small delay so persisted store hydrates
    const t = setTimeout(() => {
      if (!useAuthStore.getState().user) router.replace("/login");
    }, 50);
    return () => clearTimeout(t);
  }, [router, pathname]);

  useEffect(() => {
    if (!user || user.role !== "client") return;
    if (pathname.startsWith("/billing") || pathname.startsWith("/pod")) {
      router.replace("/client-portal/overview");
    }
  }, [pathname, router, user]);

  // Platform-admin with no session: render bare so the login gate shows without sidebar
  if (pathname === "/platform-admin" && !user) {
    return (
      <div className="min-h-screen bg-white">
        <main className="p-6">{children}</main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  // Driver mobile app — full-screen, no sidebar or topbar
  // NOTE: must match /driver exactly or /driver/ sub-paths, NOT /drivers (management page)
  const isDriverApp =
    pathname === "/driver" ||
    (pathname?.startsWith("/driver/") && !pathname.startsWith("/drivers")) ||
    (user.role === "driver" && pathname?.startsWith("/pod"));
  if (isDriverApp) {
    return <>{children}</>;
  }

  // Helper mobile app — full-screen, no sidebar or topbar
  const isHelperApp =
    pathname === "/helper" ||
    pathname?.startsWith("/helper/") ||
    (user.role === "helper" && pathname?.startsWith("/pod"));
  if (isHelperApp) {
    return <>{children}</>;
  }

  // Employee Portal — full-screen, no sidebar or topbar
  const isEmployeePortal =
    pathname === "/employee-portal" ||
    pathname?.startsWith("/employee-portal/");
  if (isEmployeePortal) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <Sidebar />
      <div className={cn("transition-[padding] duration-300", collapsed ? "pl-[78px]" : "pl-[260px]")}>
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
