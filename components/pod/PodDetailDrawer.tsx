"use client";

/**
 * POD Detail Drawer
 *
 * Slide-over drawer displaying full details of a captured POD including
 * signature, photos (with lightbox), receiver info, GPS coordinates, and notes.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.4, 11.3, 11.4, 11.7
 */

import * as React from "react";
import { X, MapPin, PenLine, Camera, ImageOff } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatPodDate } from "@/lib/utils/pod-helpers";
import type { ProofOfDelivery } from "@/lib/types";

interface PodDetailDrawerProps {
  open: boolean;
  pod: ProofOfDelivery | null;
  tripId: string | null;
  onClose: () => void;
}

export function PodDetailDrawer({
  open,
  pod,
  tripId,
  onClose,
}: PodDetailDrawerProps) {
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const titleId = "pod-detail-drawer-title";

  // Reset state when drawer closes or pod changes
  React.useEffect(() => {
    if (!open) {
      setLightboxIndex(null);
      setImageErrors(new Set());
    }
  }, [open]);

  // Handle Escape key for lightbox dismissal
  React.useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setLightboxIndex(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [lightboxIndex]);

  const handleImageError = (url: string) => {
    setImageErrors((prev) => new Set(prev).add(url));
  };

  const photos = pod?.photoDataUrls ?? [];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full md:w-[480px] md:max-w-[480px] p-0",
          "dark:bg-brand-navy-light dark:border-gray-700"
        )}
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-brand-navy-light border-b border-brand-border dark:border-gray-700 px-6 py-4">
          <SheetHeader className="mb-0">
            <SheetTitle id={titleId} className="text-lg font-semibold text-brand-navy dark:text-white">
              POD Details
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {tripId ? `Trip ${tripId}` : "Proof of Delivery details"}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto">
          {pod ? (
            <>
              {/* Trip & Receiver Info */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-brand-navy dark:text-white uppercase tracking-wide">
                  Delivery Information
                </h3>

                <InfoRow label="Trip ID" value={tripId ?? pod.tripId} />
                <InfoRow label="Receiver Name" value={pod.receiverName} />
                {pod.receiverContact && (
                  <InfoRow label="Receiver Contact" value={pod.receiverContact} />
                )}
                <InfoRow
                  label="Capture Timestamp"
                  value={formatPodDate(pod.timestamp)}
                />
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="text-muted-foreground font-medium">GPS Coordinates</span>
                    <p className="text-brand-navy dark:text-white font-mono text-xs mt-0.5">
                      {pod.gps.lat.toFixed(6)}, {pod.gps.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
                {pod.notes && <InfoRow label="Notes" value={pod.notes} />}
              </section>

              {/* Signature Section */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-brand-navy dark:text-white uppercase tracking-wide">
                    Signature
                  </h3>
                </div>

                {pod.signatureDataUrl && !imageErrors.has(pod.signatureDataUrl) ? (
                  <div
                    className={cn(
                      "border border-brand-border dark:border-gray-700 rounded-lg p-3",
                      "bg-gray-50 dark:bg-brand-navy/50"
                    )}
                  >
                    <img
                      src={pod.signatureDataUrl}
                      alt="Receiver signature"
                      className="w-full h-auto max-h-[200px] object-contain"
                      onError={() => handleImageError(pod.signatureDataUrl!)}
                    />
                  </div>
                ) : pod.signatureDataUrl && imageErrors.has(pod.signatureDataUrl) ? (
                  <ImageErrorPlaceholder />
                ) : (
                  <div
                    className={cn(
                      "border border-dashed border-brand-border dark:border-gray-700 rounded-lg p-6",
                      "flex items-center justify-center text-muted-foreground text-sm"
                    )}
                  >
                    No signature captured
                  </div>
                )}
              </section>

              {/* Photos Section */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-brand-navy dark:text-white uppercase tracking-wide">
                    Photos
                  </h3>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((url, idx) => (
                      <PhotoThumbnail
                        key={`${url}-${idx}`}
                        url={url}
                        index={idx}
                        hasError={imageErrors.has(url)}
                        onError={() => handleImageError(url)}
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "border border-dashed border-brand-border dark:border-gray-700 rounded-lg p-6",
                      "flex items-center justify-center text-muted-foreground text-sm"
                    )}
                  >
                    No photos captured
                  </div>
                )}
              </section>
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              No POD data available
            </div>
          )}
        </div>

        {/* Lightbox Overlay */}
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <LightboxOverlay
            url={photos[lightboxIndex]}
            hasError={imageErrors.has(photos[lightboxIndex])}
            onError={() => handleImageError(photos[lightboxIndex])}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span className="text-brand-navy dark:text-white">{value}</span>
    </div>
  );
}

function PhotoThumbnail({
  url,
  index,
  hasError,
  onError,
  onClick,
}: {
  url: string;
  index: number;
  hasError: boolean;
  onError: () => void;
  onClick: () => void;
}) {
  if (hasError) {
    return <ImageErrorPlaceholder />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative aspect-square rounded-lg overflow-hidden border border-brand-border dark:border-gray-700",
        "hover:ring-2 hover:ring-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal",
        "transition-all cursor-pointer bg-gray-50 dark:bg-brand-navy/50"
      )}
      aria-label={`View photo ${index + 1} in lightbox`}
    >
      <img
        src={url}
        alt={`Delivery photo ${index + 1}`}
        className="w-full h-full object-cover"
        onError={onError}
      />
    </button>
  );
}

function ImageErrorPlaceholder() {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1 aspect-square rounded-lg",
        "border border-brand-border dark:border-gray-700",
        "bg-gray-50 dark:bg-brand-navy/50 text-muted-foreground text-xs"
      )}
    >
      <ImageOff className="w-5 h-5" />
      <span>Image failed to load</span>
    </div>
  );
}

function LightboxOverlay({
  url,
  hasError,
  onError,
  onClose,
}: {
  url: string;
  hasError: boolean;
  onError: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn(
          "absolute top-4 right-4 z-[101] rounded-full p-2",
          "bg-white/10 hover:bg-white/20 text-white",
          "focus:outline-none focus:ring-2 focus:ring-white"
        )}
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      <div
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {hasError ? (
          <div className="flex flex-col items-center gap-2 text-white/80 text-sm">
            <ImageOff className="w-10 h-10" />
            <span>Image failed to load</span>
          </div>
        ) : (
          <img
            src={url}
            alt="Full size delivery photo"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onError={onError}
          />
        )}
      </div>
    </div>
  );
}
