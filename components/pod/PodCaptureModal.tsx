"use client";

/**
 * POD Capture Modal
 *
 * Modal dialog for capturing POD directly from the admin table.
 * Pre-fills with dummy data for demonstration purposes.
 */

import * as React from "react";
import { CheckCircle2, MapPin, User, Camera, PenLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDeliveryDate } from "@/lib/utils/pod-helpers";
import type { Trip } from "@/lib/types";

interface PodCaptureModalProps {
  open: boolean;
  trip: Trip | null;
  driverName: string;
  onClose: () => void;
  onConfirmCapture: (tripId: string, data: CaptureData) => void;
}

export interface CaptureData {
  receiverName: string;
  receiverContact?: string;
  notes?: string;
  signatureDataUrl: string;
  photoDataUrls: string[];
  gps: { lat: number; lng: number };
}

// Dummy data generators for demonstration
const DUMMY_RECEIVERS = [
  { name: "Maria Santos", contact: "+63 917 123 4567" },
  { name: "Juan Dela Cruz", contact: "+63 922 987 6543" },
  { name: "Pedro Reyes", contact: "+63 906 555 1234" },
  { name: "Ana Garcia", contact: "+63 918 777 8899" },
  { name: "Carlos Mendoza", contact: "+63 936 444 5566" },
];

const DUMMY_NOTES = [
  "Cargo received in good condition. All items accounted for.",
  "Delivered to warehouse dock B. Security confirmed receipt.",
  "Partial delivery — 2 of 3 pallets. Remaining tomorrow.",
  "Received by authorized representative. No damage observed.",
  "Package intact. Delivered to front desk reception.",
];

// Simple placeholder signature (a minimal SVG data URL)
const DUMMY_SIGNATURE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNMjAgNjBjMjAtMzAgNDAtMTAgNjAtMjBzMzAgMTAgNTAgMCAzMC0yMCA1MC0xMCAyMCAyMCA0MCAxMCAzMC0yMCA1MC0xMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMEIxMjIwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==";

// Placeholder photo thumbnails (simple colored squares as data URLs)
const DUMMY_PHOTOS = [
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiI+RGVsaXZlcnkgUGhvdG8gMTwvdGV4dD48L3N2Zz4=",
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2RiZWFmZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzE2NjUzNCI+RGVsaXZlcnkgUGhvdG8gMjwvdGV4dD48L3N2Zz4=",
];

function getDummyData(): Omit<CaptureData, "gps"> {
  const receiver = DUMMY_RECEIVERS[Math.floor(Math.random() * DUMMY_RECEIVERS.length)];
  const notes = DUMMY_NOTES[Math.floor(Math.random() * DUMMY_NOTES.length)];
  return {
    receiverName: receiver.name,
    receiverContact: receiver.contact,
    notes,
    signatureDataUrl: DUMMY_SIGNATURE,
    photoDataUrls: DUMMY_PHOTOS,
  };
}

export function PodCaptureModal({
  open,
  trip,
  driverName,
  onClose,
  onConfirmCapture,
}: PodCaptureModalProps) {
  const [dummyData] = React.useState(getDummyData);

  if (!trip) return null;

  const gps = { lat: trip.dropoff.lat, lng: trip.dropoff.lng };

  const handleCapture = () => {
    onConfirmCapture(trip.id, {
      ...dummyData,
      gps,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto dark:bg-[#172033]">
        <DialogHeader>
          <DialogTitle className="text-brand-navy dark:text-white flex items-center gap-2">
            Capture POD — {trip.id}
          </DialogTitle>
          <DialogDescription>
            Confirm proof of delivery for this trip. Dummy data has been pre-filled for demonstration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Trip Summary */}
          <div className="rounded-xl border border-brand-border dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-brand-navy/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-navy dark:text-white">{trip.id}</span>
              <Badge variant="warning">Awaiting POD</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Driver</span>
                <p className="font-medium text-brand-navy dark:text-white">{driverName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Delivery Date</span>
                <p className="font-medium text-brand-navy dark:text-white">
                  {formatDeliveryDate(trip.createdAt)}
                </p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Pickup</span>
                <p className="font-medium text-brand-navy dark:text-white truncate">{trip.pickup.address}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Dropoff</span>
                <p className="font-medium text-brand-navy dark:text-white truncate">{trip.dropoff.address}</p>
              </div>
            </div>
          </div>

          {/* Pre-filled Receiver Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-brand-navy dark:text-white flex items-center gap-1.5">
              <User className="w-4 h-4" /> Receiver Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-brand-border dark:border-gray-700 p-3 bg-white dark:bg-brand-navy/30">
                <span className="text-[11px] text-muted-foreground">Name</span>
                <p className="text-sm font-medium text-brand-navy dark:text-white">{dummyData.receiverName}</p>
              </div>
              <div className="rounded-lg border border-brand-border dark:border-gray-700 p-3 bg-white dark:bg-brand-navy/30">
                <span className="text-[11px] text-muted-foreground">Contact</span>
                <p className="text-sm font-medium text-brand-navy dark:text-white">{dummyData.receiverContact}</p>
              </div>
            </div>
            <div className="rounded-lg border border-brand-border dark:border-gray-700 p-3 bg-white dark:bg-brand-navy/30">
              <span className="text-[11px] text-muted-foreground">Notes</span>
              <p className="text-sm text-brand-navy dark:text-white mt-0.5">{dummyData.notes}</p>
            </div>
          </div>

          {/* Signature Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-brand-navy dark:text-white flex items-center gap-1.5">
              <PenLine className="w-4 h-4" /> Signature
            </h4>
            <div className="border border-brand-border dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-brand-navy/30">
              <img
                src={dummyData.signatureDataUrl}
                alt="Receiver signature"
                className="w-full h-20 object-contain"
              />
            </div>
          </div>

          {/* Photos Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-brand-navy dark:text-white flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Delivery Photos ({dummyData.photoDataUrls.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {dummyData.photoDataUrls.map((url, i) => (
                <div key={i} className="border border-brand-border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-brand-navy/30">
                  <img src={url} alt={`Delivery photo ${i + 1}`} className="w-full aspect-square object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* GPS */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            GPS: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)} · Auto-timestamped
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCapture} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Confirm Capture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
