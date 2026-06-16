"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth";
import { SESSION_CONFIG } from "@/lib/config/session";
import { toast } from "sonner";

export function useSessionTimeout() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const sessionTimeout = useAuthStore((s) => s.sessionTimeout);
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(SESSION_CONFIG.warningSeconds);
  
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    setShowWarning(false);
    router.push("/login?reason=inactivity");
    toast.info("You were logged out due to inactivity.");
  }, [logout, router]);

  const resetTimers = useCallback(() => {
    // Clear existing timers
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);

    if (!user) return;

    // Time until the warning should show: (Total timeout - warning duration)
    // Convert minutes to seconds, subtract warning seconds, then to milliseconds
    const warningTime = (sessionTimeout * 60 - SESSION_CONFIG.warningSeconds) * 1000;
    
    // Safety: if warningTime is negative (misconfiguration), show warning immediately or use a safe minimum
    const safeWarningTime = Math.max(warningTime, 0);

    timeoutTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(SESSION_CONFIG.warningSeconds);
      
      // Start the countdown interval
      warningTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, safeWarningTime);
  }, [user, handleLogout, sessionTimeout]);

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    
    const activityHandler = () => {
      // Only reset timers if we aren't already in the warning phase
      if (!showWarning) {
        resetTimers();
      }
    };

    if (user) {
      resetTimers();
      events.forEach((e) => window.addEventListener(e, activityHandler));
    }

    return () => {
      events.forEach((e) => window.removeEventListener(e, activityHandler));
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [user, resetTimers, showWarning]);

  const stayLoggedIn = () => {
    setShowWarning(false);
    resetTimers();
  };

  return {
    showWarning,
    countdown,
    stayLoggedIn,
    logout: handleLogout,
  };
}
