"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useDriverStore } from "@/lib/store";
import {
  ChevronLeft, ChevronRight, LogOut, User, Bell, Shield, Info,
  HelpCircle, Moon, Smartphone, Truck,
} from "lucide-react";
import { DriverNav } from "@/components/driver/DriverNav";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function DriverSettingsPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const drivers = useDriverStore((s) => s.drivers);

  const driverId = user?.driverId ?? drivers[0]?.id;
  const driver   = drivers.find((d) => d.id === driverId) ?? drivers[0];
  const fullName = user?.name ?? driver?.name ?? "Driver";
  const phone    = driver?.phone ?? user?.email ?? "—";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-gray-50 overscroll-none">

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-30 bg-brand-navy w-full shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-lg mx-auto h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/driver")}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center -ml-2"
            aria-label="Back to Driver App"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <p className="text-white font-bold text-sm tracking-tight">Settings</p>
          <div className="min-w-[44px]" />
        </div>
      </header>

      {/* ── Profile banner ── */}
      <div className="bg-brand-navy px-5 pb-6 pt-2 shrink-0">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-brand-gradient flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base leading-tight">{fullName}</p>
              <p className="text-white/50 text-xs mt-0.5">{phone}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] text-white/60">Active · On Duty</span>
              </div>
            </div>
            <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-teal/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-brand-teal" />
            </div>
          </div>
          {/* Driver ID chip */}
          {driver && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5">
              <span className="text-[11px] text-white/60">Driver ID:</span>
              <span className="text-[11px] text-white font-semibold">{driver.id}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-8 space-y-5">

          {/* Account */}
          <SettingsSection title="Account">
            <SettingsRow icon={User}    label="Profile"           sub="Name, contact info, photo"      onPress={() => toast.info("Profile editing coming soon")} />
            <SettingsRow icon={Bell}    label="Notifications"     sub="Trip alerts and push messages"  onPress={() => toast.info("Notification settings coming soon")} />
            <SettingsRow icon={Shield}  label="Privacy & Security" sub="Password, two-factor auth"     onPress={() => toast.info("Security settings coming soon")} />
          </SettingsSection>

          {/* App */}
          <SettingsSection title="App Preferences">
            <SettingsRow icon={Moon}       label="Appearance"           sub="Light / Dark / System theme"        onPress={() => toast.info("Theme settings coming soon")} />
            <SettingsRow icon={Smartphone} label="Device & Permissions" sub="Camera, location, storage"          onPress={() => toast.info("Permission settings coming soon")} />
          </SettingsSection>

          {/* Support */}
          <SettingsSection title="Support">
            <SettingsRow icon={HelpCircle} label="Help & FAQ"   sub="How to use the driver app"               onPress={() => toast.info("Help center coming soon")} />
            <SettingsRow icon={Info}       label="About"         sub="Version 1.0.0 · NexLogistics FMS"       onPress={() => toast.success("NexLogistics FMS v1.0.0")} />
          </SettingsSection>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full min-h-[52px] bg-white border border-red-100 rounded-2xl flex items-center justify-center gap-2 text-red-500 font-semibold text-sm active:scale-[0.99] transition-transform shadow-sm"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>

          <p className="text-center text-[10px] text-gray-400 pb-2">
            NexLogistics FMS · Driver App · v1.0.0
          </p>
        </div>
      </main>

      <DriverNav active="settings" />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────
function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  sub,
  onPress,
}: {
  icon: React.ElementType;
  label: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-gray-50 transition-colors min-h-[64px]"
    >
      <div className="w-9 h-9 rounded-xl bg-brand-teal/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-teal" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-navy">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
    </button>
  );
}
