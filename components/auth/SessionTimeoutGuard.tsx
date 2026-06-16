"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSessionTimeout } from "@/hooks/use-session-timeout";
import { Clock } from "lucide-react";

export function SessionTimeoutGuard() {
  const { showWarning, countdown, stayLoggedIn, logout } = useSessionTimeout();

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-2">
            <Clock className="w-6 h-6 text-amber-600 animate-pulse" />
          </div>
          <AlertDialogTitle className="text-center text-xl font-extrabold tracking-tight">
            Session Timeout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-brand-gray dark:text-white/60">
            You&apos;ve been inactive for a while. You will be automatically logged out in:
            <span className="block text-3xl font-extrabold text-brand-navy dark:text-brand-teal mt-4 tabular-nums">
              {countdown}s
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel 
            onClick={stayLoggedIn} 
            className="flex-1 rounded-xl h-11 font-bold"
          >
            Stay Logged In
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={logout} 
            className="flex-1 rounded-xl h-11 font-bold"
          >
            Logout Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
