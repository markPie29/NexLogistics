"use client";

import { ChevronRight, CheckCircle2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPodDate } from "@/lib/utils/pod-helpers";
import type { Trip, ProofOfDelivery } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Formats a capture timestamp as "MMM DD, YYYY • HH:mm" using en-PH locale.
 * Splits the formatPodDate output and inserts the bullet separator.
 */
function formatCaptureDate(isoString: string): string {
  // formatPodDate returns e.g. "May 14, 2026, 14:30" — replace last comma+space with bullet
  const formatted = formatPodDate(isoString);
  const lastComma = formatted.lastIndexOf(",");
  if (lastComma !== -1) {
    return formatted.slice(0, lastComma) + " •" + formatted.slice(lastComma + 1);
  }
  return formatted;
}

// ─── Interfaces ──────────────────────────────────────────────

interface PodCardListProps {
  awaitingTrips: Trip[];
  capturedTrips: Array<{ trip: Trip; pod: ProofOfDelivery }>;
  onCapture: (tripId: string) => void;
}

// ─── Component ───────────────────────────────────────────────

export default function PodCardList({
  awaitingTrips,
  capturedTrips,
  onCapture,
}: PodCardListProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Awaiting POD Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Awaiting POD
          </h2>
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5",
              "text-xs font-medium text-white bg-amber-500 rounded-full"
            )}
          >
            {awaitingTrips.length}
          </span>
        </div>

        {awaitingTrips.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-8 px-4",
              "bg-white dark:bg-[#172033] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
            )}
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500 opacity-60 mb-3" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              All caught up!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No deliveries need a POD right now.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {awaitingTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={() => onCapture(trip.id)}
                aria-label={`Capture POD for Trip ${trip.id}`}
                className={cn(
                  "flex items-center gap-3 w-full min-h-[44px] p-4",
                  "bg-white dark:bg-[#172033] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm",
                  "text-left transition-colors",
                  "hover:bg-gray-50 dark:hover:bg-[#1e2a3f] active:bg-gray-100 dark:active:bg-[#253347]"
                )}
              >
                {/* Card Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {trip.id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate overflow-hidden whitespace-nowrap">
                    {trip.dropoff.address}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full",
                      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}
                  >
                    Awaiting Capture
                  </span>
                </div>

                {/* Chevron Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center flex-shrink-0",
                    "w-9 h-9 rounded-full bg-teal-500/10"
                  )}
                >
                  <ChevronRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Captured Section */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Captured
          </h2>
          <span
            className={cn(
              "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5",
              "text-xs font-medium text-white bg-emerald-500 rounded-full"
            )}
          >
            {capturedTrips.length}
          </span>
        </div>

        {capturedTrips.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center py-8 px-4",
              "bg-white dark:bg-[#172033] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
            )}
          >
            <ClipboardCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No PODs captured yet.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {capturedTrips.map(({ trip, pod }) => (
              <div
                key={trip.id}
                className={cn(
                  "flex items-center gap-3 w-full min-h-[44px] p-4",
                  "bg-white dark:bg-[#172033] rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm"
                )}
              >
                {/* Card Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {trip.id}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate overflow-hidden whitespace-nowrap">
                    {pod.receiverName}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {formatCaptureDate(pod.timestamp)}
                  </p>
                  <span
                    className={cn(
                      "inline-block mt-1.5 px-2 py-0.5 text-[11px] font-medium rounded-full",
                      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    )}
                  >
                    Done
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
