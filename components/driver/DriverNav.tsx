"use client";
import { useRouter } from "next/navigation";
import { LayoutGrid, ClipboardList, Camera, MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type DriverTab = "dashboard" | "trips" | "pod" | "messages" | "settings";

const TABS = [
  { id: "dashboard" as DriverTab, label: "Home",      icon: LayoutGrid,    href: "/driver" },
  { id: "trips"     as DriverTab, label: "Trips",     icon: ClipboardList, href: "/driver?view=trips" },
  { id: "pod"       as DriverTab, label: "POD",       icon: Camera,        href: "/pod" },
  { id: "messages"  as DriverTab, label: "Messages",  icon: MessageSquare, href: "/driver?view=messages" },
  { id: "settings"  as DriverTab, label: "Settings",  icon: Settings,      href: "/driver/settings" },
] as const;

export function DriverNav({ active }: { active: DriverTab }) {
  const router = useRouter();
  return (
    <nav
      className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.07)] shrink-0 pointer-events-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-lg mx-auto h-16 flex items-center">
        {TABS.map(({ id, label, icon: Icon, href }) => (
          <button
            key={id}
            onClick={() => router.push(href)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 h-full min-h-[44px] transition-colors",
              active === id ? "text-brand-teal" : "text-gray-400"
            )}
            aria-label={label}
          >
            <Icon className={cn("w-5 h-5 transition-transform", active === id && "scale-110")} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
