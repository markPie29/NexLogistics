import type { DocumentCategory, PermitCategory, VehicleDocument, VehiclePermit } from "@/lib/types";

// ─── Constants ──────────────────────────────────────────────

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "OR/CR",
  "Insurance",
  "LTFRB Franchise",
  "LTO Registration",
];

export const PERMIT_CATEGORIES: PermitCategory[] = [
  "City Permit",
  "Barangay Clearance",
  "Mayor's Permit",
  "Special Permit (Hazmat)",
  "Special Permit (Overweight)",
  "Special Permit (Oversized)",
];

export const ACCEPTED_FILE_TYPES = ".pdf,.jpeg,.jpg,.png";
export const MAX_FILE_SIZE_BYTES = 10_485_760; // 10 MB

// ─── Expiry Status ──────────────────────────────────────────

export type ExpiryStatus = "expired" | "expiring_soon" | "valid";

export function getExpiryStatus(expiryDate: string): ExpiryStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return "expired";

  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  if (expiry <= thirtyDaysFromNow) return "expiring_soon";
  return "valid";
}

// ─── Summary Counts ─────────────────────────────────────────

export interface SummaryCounts {
  total: number;
  expired: number;
  expiringSoon: number;
}

export function computeSummaryCounts(
  documents: VehicleDocument[],
  permits: VehiclePermit[]
): SummaryCounts {
  const allRecords = [
    ...documents.map((d) => d.expiryDate),
    ...permits.map((p) => p.expiryDate),
  ];

  let expired = 0;
  let expiringSoon = 0;

  for (const date of allRecords) {
    const status = getExpiryStatus(date);
    if (status === "expired") expired++;
    else if (status === "expiring_soon") expiringSoon++;
  }

  return { total: allRecords.length, expired, expiringSoon };
}

// ─── File Size Formatting ───────────────────────────────────

export function formatFileSize(bytes: number): string {
  if (bytes < 1_048_576) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}
