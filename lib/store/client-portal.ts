import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";

export type PortalShipmentStatus = "in_transit" | "delivered" | "pending" | "exception";
export type PortalInvoiceStatus = "paid" | "unpaid" | "overdue";
export type PortalTicketStatus = "open" | "resolved" | "in_progress";
export type PortalPriority = "low" | "medium" | "high";

export interface PortalShipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: PortalShipmentStatus;
  eta: string;
  deliveredAt?: string;
  cargoType: string;
  weightKg: number;
  currentLocation: string;
  lastUpdate: string;
}

export interface PortalDocument {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "XLSX";
  category: "Compliance" | "Delivery" | "Insurance" | "Rate";
  uploadedAt: string;
  uploadedBy: string;
  sizeKb: number;
  isNew?: boolean;
  notes?: string;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  balance: number;
  status: PortalInvoiceStatus;
}

export interface PortalTicket {
  id: string;
  subject: string;
  details: string;
  category: "Shipment" | "Billing" | "Documents" | "System";
  priority: PortalPriority;
  status: PortalTicketStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
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
  shipments: PortalShipment[];
  documents: PortalDocument[];
  invoices: PortalInvoice[];
  tickets: PortalTicket[];
  exports: PortalReportExport[];
  preferences: PortalPreferences;

  markInvoicePaid: (invoiceId: string) => void;
  addTicket: (payload: Omit<PortalTicket, "id" | "createdAt" | "updatedAt" | "messageCount" | "status">) => void;
  updateTicketStatus: (ticketId: string, status: PortalTicketStatus) => void;
  addReportExport: (reportName: string, format: "CSV" | "PDF") => void;
  updatePreferences: (patch: Partial<PortalPreferences>) => void;
  reset: () => void;
}

const SEEDED_SHIPMENTS: PortalShipment[] = [
  {
    id: "sh-1",
    trackingNumber: "NEX-TRK-000124",
    origin: "Los Angeles, CA",
    destination: "Phoenix, AZ",
    status: "in_transit",
    eta: "2026-05-31T10:30:00.000Z",
    cargoType: "Construction Tools",
    weightKg: 1240,
    currentLocation: "Riverside, CA",
    lastUpdate: "2026-05-11T10:10:00.000Z",
  },
  {
    id: "sh-2",
    trackingNumber: "NEX-TRK-000123",
    origin: "Houston, TX",
    destination: "Dallas, TX",
    status: "in_transit",
    eta: "2026-05-31T02:45:00.000Z",
    cargoType: "Steel Sheets",
    weightKg: 2180,
    currentLocation: "Corsicana, TX",
    lastUpdate: "2026-05-11T08:40:00.000Z",
  },
  {
    id: "sh-3",
    trackingNumber: "NEX-TRK-000122",
    origin: "Chicago, IL",
    destination: "Detroit, MI",
    status: "delivered",
    eta: "2026-05-29T11:20:00.000Z",
    deliveredAt: "2026-05-29T11:20:00.000Z",
    cargoType: "Industrial Components",
    weightKg: 930,
    currentLocation: "Delivered",
    lastUpdate: "2026-05-29T11:20:00.000Z",
  },
  {
    id: "sh-4",
    trackingNumber: "NEX-TRK-000121",
    origin: "Miami, FL",
    destination: "Atlanta, GA",
    status: "delivered",
    eta: "2026-05-28T09:10:00.000Z",
    deliveredAt: "2026-05-28T09:10:00.000Z",
    cargoType: "Safety Equipment",
    weightKg: 510,
    currentLocation: "Delivered",
    lastUpdate: "2026-05-28T09:10:00.000Z",
  },
  {
    id: "sh-5",
    trackingNumber: "NEX-TRK-000120",
    origin: "Seattle, WA",
    destination: "Portland, OR",
    status: "pending",
    eta: "2026-06-02T17:00:00.000Z",
    cargoType: "Electrical Supplies",
    weightKg: 740,
    currentLocation: "Seattle Hub",
    lastUpdate: "2026-05-10T17:05:00.000Z",
  },
];

const SEEDED_DOCUMENTS: PortalDocument[] = [
  {
    id: "doc-1",
    name: "Bill of Lading",
    type: "PDF",
    category: "Delivery",
    uploadedAt: "2026-05-30T09:10:00.000Z",
    uploadedBy: "NEX-TRK-000124",
    sizeKb: 821,
    isNew: true,
    notes: "Signed by receiving supervisor",
  },
  {
    id: "doc-2",
    name: "Delivery Receipt",
    type: "DOCX",
    category: "Delivery",
    uploadedAt: "2026-05-30T08:42:00.000Z",
    uploadedBy: "NEX-TRK-000123",
    sizeKb: 302,
  },
  {
    id: "doc-3",
    name: "Proof of Delivery",
    type: "XLSX",
    category: "Compliance",
    uploadedAt: "2026-05-29T16:15:00.000Z",
    uploadedBy: "NEX-TRK-000122",
    sizeKb: 268,
  },
  {
    id: "doc-4",
    name: "Rate Confirmation",
    type: "PDF",
    category: "Rate",
    uploadedAt: "2026-05-28T14:05:00.000Z",
    uploadedBy: "NEX-TRK-000121",
    sizeKb: 442,
  },
  {
    id: "doc-5",
    name: "Insurance Certificate",
    type: "PDF",
    category: "Insurance",
    uploadedAt: "2026-05-25T11:35:00.000Z",
    uploadedBy: "System",
    sizeKb: 676,
  },
];

const SEEDED_INVOICES: PortalInvoice[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0158",
    issueDate: "2026-05-30",
    dueDate: "2026-06-15",
    amount: 6250,
    balance: 0,
    status: "paid",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0157",
    issueDate: "2026-05-28",
    dueDate: "2026-06-12",
    amount: 4820,
    balance: 0,
    status: "paid",
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-0156",
    issueDate: "2026-05-25",
    dueDate: "2026-06-10",
    amount: 7680.5,
    balance: 7680.5,
    status: "unpaid",
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-2026-0155",
    issueDate: "2026-05-20",
    dueDate: "2026-06-05",
    amount: 3930,
    balance: 3930,
    status: "unpaid",
  },
  {
    id: "inv-5",
    invoiceNumber: "INV-2026-0154",
    issueDate: "2026-05-18",
    dueDate: "2026-05-26",
    amount: 2000,
    balance: 2000,
    status: "overdue",
  },
];

const SEEDED_TICKETS: PortalTicket[] = [
  {
    id: "tkt-1",
    subject: "Shipment delay on NEX-TRK-000123",
    details: "Please provide updated ETA and reason for the delay warning seen this morning.",
    category: "Shipment",
    priority: "high",
    status: "open",
    createdAt: "2026-05-30T08:15:00.000Z",
    updatedAt: "2026-05-30T09:10:00.000Z",
    messageCount: 3,
  },
  {
    id: "tkt-2",
    subject: "Update delivery appointment",
    details: "Need to move receiving window to 2PM due to site access schedule.",
    category: "Shipment",
    priority: "medium",
    status: "open",
    createdAt: "2026-05-29T07:45:00.000Z",
    updatedAt: "2026-05-29T07:50:00.000Z",
    messageCount: 2,
  },
  {
    id: "tkt-3",
    subject: "Invoice discrepancy on INV-2026-0156",
    details: "Please validate line-item handling fee and resend corrected copy if needed.",
    category: "Billing",
    priority: "high",
    status: "resolved",
    createdAt: "2026-05-28T10:30:00.000Z",
    updatedAt: "2026-05-28T13:05:00.000Z",
    messageCount: 5,
  },
  {
    id: "tkt-4",
    subject: "Access to delivery documents",
    details: "Need all POD files consolidated in a single export for audit.",
    category: "Documents",
    priority: "low",
    status: "resolved",
    createdAt: "2026-05-27T14:00:00.000Z",
    updatedAt: "2026-05-27T16:20:00.000Z",
    messageCount: 2,
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
      shipments: SEEDED_SHIPMENTS,
      documents: SEEDED_DOCUMENTS,
      invoices: SEEDED_INVOICES,
      tickets: SEEDED_TICKETS,
      exports: SEEDED_EXPORTS,
      preferences: SEEDED_PREFERENCES,

      markInvoicePaid: (invoiceId) =>
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === invoiceId ? { ...inv, status: "paid", balance: 0 } : inv
          ),
        })),

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
          shipments: SEEDED_SHIPMENTS,
          documents: SEEDED_DOCUMENTS,
          invoices: SEEDED_INVOICES,
          tickets: SEEDED_TICKETS,
          exports: SEEDED_EXPORTS,
          preferences: SEEDED_PREFERENCES,
        }),
    }),
    { name: `${BRAND.storeKey}-client-portal` }
  )
);
