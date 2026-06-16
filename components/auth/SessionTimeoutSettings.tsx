"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { Input, Label } from "@/components/ui/input";
import { Clock, Check } from "lucide-react";
import { toast } from "sonner";

export function SessionTimeoutSettings() {
  const timeout = useAuthStore((s) => s.sessionTimeout);
  const setTimeoutValue = useAuthStore((s) => s.setSessionTimeout);
  const [val, setVal] = useState(timeout.toString());
  const [saved, setSaved] = useState(false);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(val, 10);
    if (isNaN(mins) || mins < 1) {
      toast.error("Please enter a valid number of minutes (minimum 1).");
      return;
    }
    
    setTimeoutValue(mins);
    setSaved(true);
    toast.success(`Session timeout updated to ${mins} minutes.`);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-1">
      <form onSubmit={handleUpdate} className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="session-timeout" className="flex items-center gap-2 cursor-pointer">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Session Timeout (mins)</span>
          </Label>
          <div className="relative w-24">
            <Input
              id="session-timeout"
              type="number"
              min="1"
              max="1440"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="h-8 text-xs pr-8"
              onBlur={handleUpdate}
            />
            {saved && (
              <Check className="w-3 h-3 text-status-success absolute right-2.5 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Adjust how long you can be inactive before being automatically logged out.
        </p>
      </form>
    </div>
  );
}
