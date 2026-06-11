import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type { PortalDocument, DocumentCategory } from "@/lib/utils/client-portal";

export type PortalTicketStatus = "open" | "resolved" | "in_progress";
export type PortalPriority = "low" | "medium" | "high";

export { type PortalDocument } from "@/lib/utils/client-portal";

export interface PortalTicket {
  id: string;
  subject: string;
  details: string;
  category: "Shipment" | "Billing" | "Documents" | "System";
  priority: PortalPriority;
  status: PortalTicketStatus;
  shipmentRef?: string;
  invoiceRef?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  assignedTo?: string;
}

export interface PortalReportExport {
  id: string;
  reportName: string;
  generatedAt: string;
  format: "CSV" | "PDF";
}

export interface PortalPreferences {
  emailShipmentUpdates: boolean;
  emailInvoiceAlerts: boolean;
  emailSupportReplies: boolean;
  weeklySummary: boolean;
  defaultReportFormat: "CSV" | "PDF";
}

interface ClientPortalState {
  tickets: PortalTicket[];
  documents: PortalDocument[];
  exports: PortalReportExport[];
  preferences: PortalPreferences;

  addTicket: (payload: Omit<PortalTicket, "id" | "createdAt" | "updatedAt" | "messageCount" | "status">) => void;
  updateTicketStatus: (ticketId: string, status: PortalTicketStatus) => void;
  addReportExport: (reportName: string, format: "CSV" | "PDF") => void;
  updatePreferences: (patch: Partial<PortalPreferences>) => void;
  reset: () => void;
}

const SEEDED_DOCUMENTS: PortalDocument[] = [
  {
    id: "doc-1",
    name: "Bill of Lading – Manila to Pampanga",
    type: "PDF",
    category: "Delivery",
    uploadedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago → triggers "New" badge
    uploadedBy: "Maria Santos",
    sizeKb: 452,
    notes: "Signed by receiving supervisor at Clark Freeport Zone",
  },
  {
    id: "doc-2",
    name: "Delivery Receipt – Makati to Laguna",
    type: "PDF",
    category: "Delivery",
    uploadedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago → triggers "New" badge
    uploadedBy: "Juan dela Cruz",
    sizeKb: 310,
    notes: "Confirmed delivery to Laguna Technopark warehouse",
  },
  {
    id: "doc-3",
    name: "BIR 2307 – Withholding Tax Certificate Q1 2026",
    type: "PDF",
    category: "Financial",
    uploadedAt: "2026-05-05T09:30:00+08:00",
    uploadedBy: "Ana Reyes",
    sizeKb: 186,
    notes: "For BIR quarterly filing",
  },
  {
    id: "doc-4",
    name: "Certificate of Insurance – Fleet Coverage 2026",
    type: "PDF",
    category: "Compliance",
    uploadedAt: "2026-05-03T14:15:00+08:00",
    uploadedBy: "Carlo Mendoza",
    sizeKb: 724,
    notes: "Valid until Dec 2026. Covers all assigned vehicles.",
  },
  {
    id: "doc-5",
    name: "OR/CR – Vehicle v-101 (Plate: NCR 1234)",
    type: "PDF",
    category: "Compliance",
    uploadedAt: "2026-04-28T10:00:00+08:00",
    uploadedBy: "Luz Ramos",
    sizeKb: 548,
  },
  {
    id: "doc-6",
    name: "Rate Confirmation – May 2026 Rates",
    type: "DOCX",
    category: "Rate",
    uploadedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago → triggers "New" badge
    uploadedBy: "Pedro Garcia",
    sizeKb: 128,
    notes: "Approved rate schedule for all Metro Manila–Luzon routes",
  },
  {
    id: "doc-7",
    name: "Delivery Receipt – QC to Batangas",
    type: "DOCX",
    category: "Delivery",
    uploadedAt: "2026-05-06T16:45:00+08:00",
    uploadedBy: "Maria Santos",
    sizeKb: 95,
    notes: "Steel rebar delivery to Batangas Container Port",
  },
  {
    id: "doc-8",
    name: "BIR 2307 – Withholding Tax Certificate Q4 2025",
    type: "PDF",
    category: "Financial",
    uploadedAt: "2026-04-15T08:20:00+08:00",
    uploadedBy: "Ana Reyes",
    sizeKb: 192,
  },
  {
    id: "doc-9",
    name: "Shipment Manifest – Weekly Consolidation Report",
    type: "XLSX",
    category: "Delivery",
    uploadedAt: "2026-05-08T11:30:00+08:00",
    uploadedBy: "Juan dela Cruz",
    sizeKb: 67,
    notes: "Consolidated manifests for 5 trips, May 5–9",
  },
  {
    id: "doc-10",
    name: "OR/CR – Vehicle v-102 (Plate: NCR 5678)",
    type: "PDF",
    category: "Compliance",
    uploadedAt: "2026-04-20T09:45:00+08:00",
    uploadedBy: "Carlo Mendoza",
    sizeKb: 530,
  },
];

const SEEDED_TICKETS: PortalTicket[] = [
  {
    id: "tkt-1",
    subject: "EDSA Traffic Delay - Shipment DR-2026-00499",
    details:
      "Our shipment of plumbing fixtures from BGC to Bulacan is stuck along EDSA-Balintawak interchange due to heavy traffic. " +
      "The driver reported over 2 hours of standstill near Trinoma. Please provide revised ETA and consider re-routing via NLEX Bocaue.",
    category: "Shipment",
    priority: "high",
    status: "open",
    shipmentRef: "DR-2026-00499",
    createdAt: "2026-05-09T11:00:00+08:00",
    updatedAt: "2026-05-09T11:45:00+08:00",
    messageCount: 3,
    assignedTo: "Ate Grace Villanueva",
  },
  {
    id: "tkt-2",
    subject: "MICT Port Congestion - Container Release",
    details:
      "Container 20ft shipment from Manila North Harbor to Clark Freeport Zone has been stuck at Manila International Container Terminal (MICT) " +
      "for 3 days due to port congestion. Bureau of Customs clearance is complete but container yard is full. " +
      "Please coordinate with port operations for priority release slot.",
    category: "Shipment",
    priority: "high",
    status: "in_progress",
    shipmentRef: "DR-2026-00501",
    createdAt: "2026-05-08T09:30:00+08:00",
    updatedAt: "2026-05-09T14:20:00+08:00",
    messageCount: 5,
    assignedTo: "Miguel Fernandez",
  },
  {
    id: "tkt-3",
    subject: "Incorrect Weight Declaration on INV-2024-0571",
    details:
      "Invoice INV-2024-0571 lists total cargo weight as 10T per trip but our warehouse records show actual loaded weight was only 8.5T " +
      "for the Makati to Laguna deliveries. Please review the weighbridge tickets and issue a corrected invoice or credit note. " +
      "This affects the fuel surcharge computation as well.",
    category: "Billing",
    priority: "medium",
    status: "resolved",
    invoiceRef: "INV-2024-0571",
    createdAt: "2026-05-05T10:15:00+08:00",
    updatedAt: "2026-05-07T16:30:00+08:00",
    messageCount: 7,
    assignedTo: "Diana Torres",
  },
  {
    id: "tkt-4",
    subject: "Request for BIR 2307 - Q1 2026",
    details:
      "Please provide the BIR 2307 withholding tax certificate for all payments made in Q1 2026. " +
      "Our accounting team needs this for our quarterly VAT filing deadline on May 25.",
    category: "Documents",
    priority: "low",
    status: "resolved",
    createdAt: "2026-05-03T08:00:00+08:00",
    updatedAt: "2026-05-04T11:00:00+08:00",
    messageCount: 2,
    assignedTo: "Ate Grace Villanueva",
  },
];

const SEEDED_EXPORTS: PortalReportExport[] = [
  { id: "exp-1", reportName: "Shipment Performance", generatedAt: "2026-05-10T09:20:00.000Z", format: "PDF" },
  { id: "exp-2", reportName: "Invoice Aging", generatedAt: "2026-05-09T15:40:00.000Z", format: "CSV" },
];

const SEEDED_PREFERENCES: PortalPreferences = {
  emailShipmentUpdates: true,
  emailInvoiceAlerts: true,
  emailSupportReplies: true,
  weeklySummary: false,
  defaultReportFormat: "PDF",
};

export const useClientPortalStore = create<ClientPortalState>()(
  persist(
    (set) => ({
      tickets: SEEDED_TICKETS,
      documents: SEEDED_DOCUMENTS,
      exports: SEEDED_EXPORTS,
      preferences: SEEDED_PREFERENCES,

      addTicket: (payload) =>
        set((state) => ({
          tickets: [
            {
              id: `tkt-${Date.now().toString(36)}`,
              subject: payload.subject,
              details: payload.details,
              category: payload.category,
              priority: payload.priority,
              status: "open",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messageCount: 1,
            },
            ...state.tickets,
          ],
        })),

      updateTicketStatus: (ticketId, status) =>
        set((state) => ({
          tickets: state.tickets.map((t) =>
            t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        })),

      addReportExport: (reportName, format) =>
        set((state) => ({
          exports: [
            {
              id: `exp-${Date.now().toString(36)}`,
              reportName,
              format,
              generatedAt: new Date().toISOString(),
            },
            ...state.exports,
          ],
        })),

      updatePreferences: (patch) =>
        set((state) => ({
          preferences: { ...state.preferences, ...patch },
        })),

      reset: () =>
        set({
          tickets: SEEDED_TICKETS,
          documents: SEEDED_DOCUMENTS,
          exports: SEEDED_EXPORTS,
          preferences: SEEDED_PREFERENCES,
        }),
    }),
    { name: `${BRAND.storeKey}-client-portal` }
  )
);
