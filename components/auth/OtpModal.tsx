"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import type { User } from "@/lib/types";

interface OtpModalProps {
  user: User | null;
  isOpen: boolean;
  generatedOtp: string;
  onVerify: (otp: string) => void;
  onCancel: () => void;
}

export function OtpModal({ user, isOpen, generatedOtp, onVerify, onCancel }: OtpModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setValue("");
      setError("");
    }
  }, [isOpen]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === generatedOtp) {
      onVerify(value);
    } else if (value.length < 6) {
      setError("Please enter all 6 digits.");
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  if (!user) return null;

  // Mask phone number: +63 917 000 0001 -> •••• •••• 0001
  const phone = user.phone || "0917 000 0000";
  const last4 = phone.slice(-4);
  const maskedPhone = `•••• •••• ${last4}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-[400px] p-8" hideClose>
        <DialogHeader className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal-light flex items-center justify-center text-brand-teal shadow-glow">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-extrabold tracking-tight text-brand-navy dark:text-white">
            Verify Your Identity
          </DialogTitle>
          <DialogDescription className="text-sm text-brand-gray dark:text-white/60 leading-relaxed">
            We sent an OTP to this number:
            <span className="block font-bold text-brand-navy dark:text-brand-teal mt-1">{maskedPhone}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                className="pl-11 h-12 text-center text-lg font-bold tracking-[0.5em] rounded-xl border-brand-border focus:border-brand-teal focus:ring-brand-teal/20"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center justify-center gap-2 text-status-danger text-xs font-semibold animate-in fade-in zoom-in duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}

            <div className="text-[11px] text-center text-muted-foreground bg-gray-50 dark:bg-white/5 py-2.5 px-3 rounded-lg border border-dashed border-gray-200 dark:border-white/10">
              <span className="font-bold text-brand-teal">[Demo Only]</span> Your OTP is: <span className="font-mono font-bold text-brand-navy dark:text-white underline decoration-brand-teal/30">{generatedOtp}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button type="submit" variant="primary" className="h-12 rounded-xl font-bold shadow-lg shadow-brand-navy/10 active:scale-[0.98] transition-transform dark:bg-brand-teal">
              Verify & Sign In
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} className="h-11 rounded-xl text-muted-foreground font-semibold hover:text-brand-navy dark:hover:text-white">
              Back to Login
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
