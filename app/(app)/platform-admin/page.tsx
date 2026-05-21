"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { useFeatureStore, FEATURE_META, type FeatureKey } from "@/lib/store/features";
import { cn } from "@/lib/utils";
import { Shield, RotateCcw, CheckCheck, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const GROUP_ORDER = [
  "Operations",
  "Finance & HR",
  "Sales & Customer",
  "Reports & Analytics",
  "Admin",
] as const;

type Group = typeof GROUP_ORDER[number];

export default function PlatformAdminPage() {
  const router  = useRouter();
  const user    = useAuthStore((s) => s.user);
  const { flags, toggle, enableAll } = useFeatureStore();

  // Guard: only platform owners can access this page
  if (!user?.isPlatformOwner) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          This page is only accessible to platform administrators.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-2 px-4 py-2 bg-brand-navy text-white text-sm font-semibold rounded-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: FEATURE_META.filter((f) => f.group === group),
  }));

  const totalEnabled  = FEATURE_META.filter((f) => flags[f.key]).length;
  const totalDisabled = FEATURE_META.length - totalEnabled;

  const handleEnableAll = () => {
    enableAll();
    toast.success("All features enabled");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">Platform Owner Only</span>
          <span className="text-amber-700">
            {" "}— This page is not linked in any navigation menu. Changes take effect immediately for all users on this
            browser session. Use this to configure which features are visible to the client before a demo or handoff.
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-brand-navy flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-brand-navy tracking-tight">Feature Flag Manager</h1>
            <p className="text-sm text-gray-500">
              {totalEnabled} of {FEATURE_META.length} features enabled
              {totalDisabled > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-red-600">
                  <EyeOff className="w-3 h-3" /> {totalDisabled} hidden
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEnableAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <CheckCheck className="w-4 h-4" /> Enable All
          </button>
          <button
            onClick={() => { enableAll(); toast.success("Reset to defaults"); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Feature Groups */}
      {grouped.map(({ group, items }) => (
        <div key={group}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((feat) => {
              const enabled = flags[feat.key] ?? true;
              return (
                <button
                  key={feat.key}
                  onClick={() => {
                    toggle(feat.key);
                    toast.success(`${feat.label} ${enabled ? "hidden" : "enabled"}`);
                  }}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 transition-all duration-150 group",
                    enabled
                      ? "border-brand-teal/30 bg-white hover:border-brand-teal/60"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 opacity-70"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-sm font-bold", enabled ? "text-brand-navy" : "text-gray-400 line-through")}>
                      {feat.label}
                    </span>
                    {/* Toggle pill */}
                    <div
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                        enabled ? "bg-brand-teal" : "bg-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                          enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                        )}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{feat.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <p className="text-xs text-center text-gray-400 pt-4">
        Settings are persisted in <code className="font-mono bg-gray-100 px-1 rounded">nex-feature-flags</code> localStorage key.
        Clearing browser storage resets all features to enabled.
      </p>
    </div>
  );
}
