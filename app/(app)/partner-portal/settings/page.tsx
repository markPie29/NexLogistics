"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, Bell, LogOut } from "lucide-react";

const NOTIFICATION_CATEGORIES = [
  { id: "trip_updates", label: "Trip Updates", description: "Notifications about trip assignments and status changes" },
  { id: "payment_notifications", label: "Payment Notifications", description: "Alerts when payments are processed or pending" },
  { id: "request_status", label: "Request Status Changes", description: "Updates on your funding request approvals" },
  { id: "system_announcements", label: "System Announcements", description: "Important system updates and maintenance notices" },
];

export default function PartnerSettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    trip_updates: true,
    payment_notifications: true,
    request_status: true,
    system_announcements: false,
  });

  function handleToggle(id: string) {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            Profile
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-[11px] font-medium text-gray-500">Full Name</div>
                <div className="text-sm text-gray-900">{user?.name ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-[11px] font-medium text-gray-500">Email</div>
                <div className="text-sm text-gray-900">{user?.email ?? "—"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <div className="text-[11px] font-medium text-gray-500">Phone</div>
                <div className="text-sm text-gray-900">{user?.phone ?? "—"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            Notification Preferences
          </h3>
          <div className="space-y-3">
            {NOTIFICATION_CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center justify-between gap-3 py-2 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{category.label}</div>
                  <div className="text-xs text-gray-500">{category.description}</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifications[category.id]}
                  aria-label={`Toggle ${category.label}`}
                  onClick={() => handleToggle(category.id)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    notifications[category.id] ? "bg-brand-teal" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      notifications[category.id] ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Out */}
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Log Out
      </Button>
    </div>
  );
}
