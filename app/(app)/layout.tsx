"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    // small delay so persisted store hydrates
    const t = setTimeout(() => {
      if (!useAuthStore.getState().user) router.replace("/login");
    }, 50);
    return () => clearTimeout(t);
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <div className="text-sm text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />
      <div className={cn("transition-[padding] duration-300", collapsed ? "pl-[78px]" : "pl-[260px]")}>
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
