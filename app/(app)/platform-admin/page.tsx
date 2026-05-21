"use client";
import { useState, useRef, useEffect } from "react";
import { useFeatureStore, FEATURE_META } from "@/lib/store/features";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";
import {
  Shield, RotateCcw, CheckCheck, EyeOff, AlertTriangle,
  Eye, EyeOff as EyeOffIcon, Lock, LogOut, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { BRAND } from "@/lib/config/brand";

// ── Platform-owner credentials (checked client-side only, never sent to a server) ──
const PLATFORM_EMAIL    = "platform@nex.internal";
const PLATFORM_PASSWORD = "NexPlatform@2025!";
const SESSION_KEY       = `${BRAND.storeKey}-platform-session`;

const GROUP_ORDER = [
  "Operations",
  "Finance & HR",
  "Sales & Customer",
  "Reports & Analytics",
  "Admin",
] as const;

// ─────────────────────────── Login Gate ───────────────────────────
function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate brief auth check
    setTimeout(() => {
      if (
        email.trim().toLowerCase() === PLATFORM_EMAIL &&
        password === PLATFORM_PASSWORD
      ) {
        sessionStorage.setItem(SESSION_KEY, "1");
        toast.success("Welcome, Platform Owner");
        onSuccess();
      } else {
        setError("Invalid credentials. Access denied.");
        setLoading(false);
      }
    }, 600);
  };

  const quickAccess = () => {
    setEmail(PLATFORM_EMAIL);
    setPassword(PLATFORM_PASSWORD);
    setError("");
    // Auto-submit after fill
    setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      toast.success("Welcome, Platform Owner");
      onSuccess();
    }, 400);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-navy flex items-center justify-center shadow-lg mb-4">
            <Shield className="w-8 h-8 text-brand-teal" />
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy tracking-tight">Platform Access</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Restricted to platform administrators only.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={PLATFORM_EMAIL}
              required
              className="w-full h-11 border border-gray-200 rounded-xl px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                required
                className="w-full h-11 border border-gray-200 rounded-xl px-4 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPw ? <EyeOffIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand-navy text-white font-semibold rounded-xl text-sm hover:bg-brand-navy/90 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Authenticating…" : "Sign In"}
          </button>

          {/* Quick access for internal demos */}
          <button
            type="button"
            onClick={quickAccess}
            className="w-full h-11 border-2 border-dashed border-brand-teal/40 text-brand-teal font-semibold rounded-xl text-sm hover:bg-brand-teal/5 transition flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Quick Access (Demo)
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          This page is not linked in any navigation menu.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────── Toggle Dashboard ───────────────────────────
function ToggleDashboard({ onLock }: { onLock: () => void }) {
  const { flags, toggle, enableAll } = useFeatureStore();

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: FEATURE_META.filter((f) => f.group === group),
  }));

  const totalEnabled  = FEATURE_META.filter((f) => flags[f.key] !== false).length;
  const totalDisabled = FEATURE_META.length - totalEnabled;

  const handleEnableAll = () => {
    enableAll();
    toast.success("All features enabled");
  };

  const handleReset = () => {
    enableAll();
    toast.success("Reset — all features enabled");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm">
          <span className="font-semibold text-amber-800">Platform Owner — Hidden Page</span>
          <span className="text-amber-700">
            {" "}— Not linked in any menu. Toggle features below to control what the client's Super Admin can see.
            Changes take effect immediately.
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
              {totalEnabled} of {FEATURE_META.length} features visible to client
              {totalDisabled > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-red-500">
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
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={onLock}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
          >
            <LogOut className="w-4 h-4" /> Lock
          </button>
        </div>
      </div>

      {/* Feature Groups */}
      {grouped.map(({ group, items }) => (
        <div key={group}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">{group}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((feat) => {
              const enabled = flags[feat.key] !== false;
              return (
                <button
                  key={feat.key}
                  onClick={() => {
                    toggle(feat.key);
                    toast.success(`${feat.label} ${enabled ? "hidden from client" : "enabled for client"}`);
                  }}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 transition-all duration-150",
                    enabled
                      ? "border-brand-teal/30 bg-white hover:border-brand-teal/60"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-sm font-bold",
                      enabled ? "text-brand-navy" : "text-gray-400 line-through"
                    )}>
                      {feat.label}
                    </span>
                    {/* Toggle pill */}
                    <div className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                      enabled ? "bg-brand-teal" : "bg-gray-300"
                    )}>
                      <span className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                        enabled ? "translate-x-[18px]" : "translate-x-[3px]"
                      )} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{feat.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-center text-gray-400 pt-4">
        Flags stored in{" "}
        <code className="font-mono bg-gray-100 px-1 rounded">nex-feature-flags</code>{" "}
        localStorage — affects all users on this browser. Clear storage to reset.
      </p>
    </div>
  );
}

// ─────────────────────────── Page Orchestrator ───────────────────────────
export default function PlatformAdminPage() {
  const mainUser = useAuthStore((s) => s.user);
  const [unlocked, setUnlocked] = useState(false);

  // Auto-unlock if the main-app session is already the platform owner,
  // or if a tab-level session cookie was set from the login gate
  useEffect(() => {
    if (mainUser?.isPlatformOwner || sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
    }
  }, [mainUser]);

  const handleLock = () => {
    sessionStorage.removeItem(SESSION_KEY);
    // Only redirect to main login if we're NOT already logged in as platform owner
    if (!mainUser?.isPlatformOwner) {
      setUnlocked(false);
    } else {
      setUnlocked(false);
    }
    toast("Session locked");
  };

  if (!unlocked) {
    return <LoginGate onSuccess={() => setUnlocked(true)} />;
  }

  return <ToggleDashboard onLock={handleLock} />;
}
