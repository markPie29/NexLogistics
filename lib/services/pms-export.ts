/**
 * PMS Export Service
 *
 * Client-side export utilities for CSV download and PDF (print) generation.
 * Uses browser APIs (Blob, URL.createObjectURL, window.open) — no external dependencies.
 *
 * Requirements: 4.6, 10.2, 10.4
 */

import type { MaintenanceRecord, Vehicle } from "@/lib/services/pms-types";
import { BRAND } from "@/lib/config/brand";

// ─── Filename Generation ─────────────────────────────────────────────────────

/**
 * Generate a timestamped export filename.
 *
 * Pattern: pms-report-{YYYY-MM-DD}.{csv|pdf}
 *
 * Requirements: 10.4 (Property 21)
 */
export function generateExportFilename(format: "csv" | "pdf"): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `pms-report-${yyyy}-${mm}-${dd}.${format}`;
}

// ─── CSV Helpers ─────────────────────────────────────────────────────────────

/**
 * Escape a CSV field value.
 *
 * Wraps the value in double quotes if it contains a comma, double quote,
 * or newline character. Internal double quotes are doubled.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Resolve a vehicleId to its plate number.
 *
 * Returns the vehicle's plate if found, otherwise the raw vehicleId.
 */
function resolveVehiclePlate(vehicleId: string, vehicles: Vehicle[]): string {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  return vehicle ? vehicle.plate : vehicleId;
}

// ─── CSV Generation ──────────────────────────────────────────────────────────

/**
 * Generate a CSV string from maintenance records.
 *
 * Header: Vehicle Plate,Service Type,Due Date,Due Odometer,Cost,Status,Completed At,Notes
 * - Resolves vehicleId → vehicle.plate (or raw id if not found)
 * - Cost formatted as plain number (no currency symbol)
 * - Dates in ISO format
 * - Proper CSV escaping for fields with commas, quotes, or newlines
 *
 * Requirements: 4.6, 10.2 (Property 11)
 */
export function generateCsv(records: MaintenanceRecord[], vehicles: Vehicle[]): string {
  const header = "Vehicle Plate,Service Type,Due Date,Due Odometer,Cost,Status,Completed At,Notes";

  const rows = records.map((record) => {
    const plate = resolveVehiclePlate(record.vehicleId, vehicles);
    const cost = record.cost != null ? String(record.cost) : "";
    const dueOdometer = record.dueOdometer != null ? String(record.dueOdometer) : "";
    const completedAt = record.completedAt ?? "";
    const notes = record.notes ?? "";

    return [
      escapeCsvField(plate),
      escapeCsvField(record.type),
      escapeCsvField(record.dueDate),
      escapeCsvField(dueOdometer),
      escapeCsvField(cost),
      escapeCsvField(record.status),
      escapeCsvField(completedAt),
      escapeCsvField(notes),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

// ─── PDF HTML Generation ─────────────────────────────────────────────────────

/**
 * Build a printable HTML document string with a styled table of records.
 */
function buildPdfHtml(records: MaintenanceRecord[], vehicles: Vehicle[]): string {
  const timestamp = new Date().toLocaleString();

  const tableRows = records
    .map((record) => {
      const plate = resolveVehiclePlate(record.vehicleId, vehicles);
      const cost = record.cost != null ? record.cost.toFixed(2) : "";
      const dueOdometer = record.dueOdometer != null ? String(record.dueOdometer) : "";
      const completedAt = record.completedAt ?? "";
      const notes = record.notes ?? "";

      return `<tr>
        <td>${escapeHtml(plate)}</td>
        <td>${escapeHtml(record.type)}</td>
        <td>${escapeHtml(record.dueDate)}</td>
        <td>${escapeHtml(dueOdometer)}</td>
        <td>${escapeHtml(cost)}</td>
        <td>${escapeHtml(record.status)}</td>
        <td>${escapeHtml(completedAt)}</td>
        <td>${escapeHtml(notes)}</td>
      </tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PMS Report - ${escapeHtml(BRAND.company)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1a1a1a; }
    .header { margin-bottom: 24px; border-bottom: 2px solid #0d9488; padding-bottom: 12px; }
    .header h1 { font-size: 20px; color: #0d9488; margin-bottom: 4px; }
    .header p { font-size: 12px; color: #666; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; font-weight: 600; }
    td { border: 1px solid #e5e7eb; padding: 6px; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print {
      body { padding: 0; }
      .header { page-break-after: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(BRAND.company)} — Preventive Maintenance Report</h1>
    <p>Generated: ${escapeHtml(timestamp)}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Vehicle Plate</th>
        <th>Service Type</th>
        <th>Due Date</th>
        <th>Due Odometer</th>
        <th>Cost</th>
        <th>Status</th>
        <th>Completed At</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Escape HTML special characters to prevent XSS in the print document.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── Export Orchestration ────────────────────────────────────────────────────

export interface ExportOptions {
  records: MaintenanceRecord[];
  vehicles: Vehicle[];
  format: "csv" | "pdf";
}

/**
 * Export PMS report in the specified format.
 *
 * - CSV: generates CSV string, creates a Blob, and triggers browser download.
 * - PDF: opens a new window with a formatted HTML table and invokes print().
 *
 * Requirements: 4.6, 10.2, 10.4
 */
export async function exportPmsReport(options: ExportOptions): Promise<void> {
  const { records, vehicles, format } = options;

  if (format === "csv") {
    const csv = generateCsv(records, vehicles);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const filename = generateExportFilename("csv");

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();

    // Cleanup
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } else {
    // PDF via print
    const html = buildPdfHtml(records, vehicles);
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Small delay to ensure styles are loaded before print dialog
      printWindow.addEventListener("load", () => {
        printWindow.print();
      });
    }
  }
}
