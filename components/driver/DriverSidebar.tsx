"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X, LayoutGrid, ClipboardList, Camera, Settings, LogOut, Truck,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useDriverStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { DriverTab } from "./DriverNav";

// ── Nav items ────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard",          icon: LayoutGrid,    href: "/driver" },
  { id: "trips",     label: "My Trips",           icon: ClipboardList, href: "/driver?view=trips" },
  { id: "pod",       label: "Proof of Delivery",  icon: Camera,        href: "/pod" },
  { id: "settings",  label: "Settings",           icon: Settings,      href: "/driver/settings" },
] as const;

// ── Props ─────────────────────────────────────────────────────
interface DriverSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  active: DriverTab;
}

// ── Component ─────────────────────────────────────────────────
export function DriverSidebar({ isOpen, onClose, active }: DriverSidebarProps) {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const drivers = useDriverStore((s) => s.drivers);

  const driverId = user?.driverId ?? drivers[0]?.id;
  const myDriver = drivers.find((d) => d.id === driverId) ?? drivers[0];
  const fullName = user?.name ?? myDriver?.name ?? "Driver";
  const phone    = myDriver?.phone ?? user?.email ?? "";
  const initials = fullName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function navigate(href: string) {
    onClose();
    // Small delay lets the close animation start before navigating
    setTimeout(() => router.push(href), 150);
  }

  function handleLogout() {
    onClose();
    logout();
    router.push("/login");
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-brand-navy/60 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Drawer ── */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 max-w-[82vw] bg-white flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Navigation menu"
        role="navigation"
      >
        {/* ── Header (brand-navy band) ── */}
        <div className="bg-brand-navy px-5 pt-4 pb-5 shrink-0">
          <div className="flex items-center justify-between mb-5">
            {/* Brand */}
            <div className="leading-none select-none">
              <p className="text-white font-extrabold text-base tracking-tight">
                NE<span className="text-brand-teal">X</span>
              </p>
              <p className="text-[8px] tracking-[0.25em] text-brand-teal/80 font-semibold">
                LOGISTICS
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Driver profile card */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold text-base shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{fullName}</p>
              {phone && (
                <p className="text-white/50 text-xs mt-0.5 truncate">{phone}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-[10px] font-medium">Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation items ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] px-3 mb-2">
            Navigation
          </p>

          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left transition-all min-h-[52px]",
                    isActive
                      ? "bg-brand-teal text-white font-semibold shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 active:bg-gray-100",
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 shrink-0",
                      isActive ? "text-white" : "text-gray-400",
                    )}
                  />
                  <span className="text-sm flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-gray-100" />

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] px-3 mb-2">
            More
          </p>

          {/* Fleet overview shortcut */}
          <button
            onClick={() => navigate("/fleet")}
            className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left text-gray-600 hover:bg-gray-50 active:bg-gray-100 transition-all min-h-[52px]"
          >
            <Truck className="w-5 h-5 shrink-0 text-gray-400" />
            <span className="text-sm flex-1">Fleet Overview</span>
          </button>
        </nav>

        {/* ── Logout ── */}
        <div className="px-3 pb-2 border-t border-gray-100 pt-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3 py-3.5 rounded-xl text-left text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors min-h-[52px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
