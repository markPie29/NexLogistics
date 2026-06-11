"use client";
import { FileText, AlertTriangle, Clock } from "lucide-react";

interface DocumentsSummaryBarProps {
  total: number;
  expired: number;
  expiringSoon: number;
}

export function DocumentsSummaryBar({ total, expired, expiringSoon }: DocumentsSummaryBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div
        className="rounded-2xl border border-brand-border bg-white p-4 shadow-card flex items-center gap-3"
        aria-label={`${total} total documents and permits`}
      >
        <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center">
          <FileText className="w-5 h-5 text-brand-teal" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total</div>
          <div className="text-base font-bold text-brand-navy">{total}</div>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 shadow-card flex items-center gap-3 ${
          expired > 0
            ? "border-red-200 bg-red-50"
            : "border-brand-border bg-white"
        }`}
        aria-label={`${expired} expired documents and permits`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          expired > 0 ? "bg-red-100" : "bg-gray-100"
        }`}>
          <AlertTriangle className={`w-5 h-5 ${expired > 0 ? "text-red-600" : "text-gray-400"}`} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Expired</div>
          <div className={`text-base font-bold ${expired > 0 ? "text-red-700" : "text-brand-navy"}`}>
            {expired}
          </div>
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 shadow-card flex items-center gap-3 ${
          expiringSoon > 0
            ? "border-amber-200 bg-amber-50"
            : "border-brand-border bg-white"
        }`}
        aria-label={`${expiringSoon} documents and permits expiring soon`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          expiringSoon > 0 ? "bg-amber-100" : "bg-gray-100"
        }`}>
          <Clock className={`w-5 h-5 ${expiringSoon > 0 ? "text-amber-600" : "text-gray-400"}`} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Expiring Soon</div>
          <div className={`text-base font-bold ${expiringSoon > 0 ? "text-amber-700" : "text-brand-navy"}`}>
            {expiringSoon}
          </div>
        </div>
      </div>
    </div>
  );
}
