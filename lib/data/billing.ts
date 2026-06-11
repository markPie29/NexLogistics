import type { Invoice, BillingPayment, CreditNote, RecurringInvoice } from "@/lib/types";

/* ── helpers ── */
function inv(n: number) { return `INV-2024-0${560 + n}`; }
function pay(n: number) { return `PAY-2024-0${867 + n}`; }

const sp = ["Juan Dela Cruz", "Maria Santos", "Carlos Garcia"];

/* ─── 10 Invoices ─── */
export const seedInvoices: Invoice[] = [
  {
    id: "inv-001", invoiceNumber: inv(8), clientId: "c-001", referenceNo: "PO-12548",
    invoiceDate: "2026-04-31", dueDate: "2026-05-15", status: "paid",
    items: [
      { description: "Trucking – Manila ↔ Taguig (10T Load)", quantity: 3, unitPrice: 62000, amount: 186000 },
      { description: "Handling & Demurrage Fee", quantity: 1, unitPrice: 33429.57, amount: 33429.57 },
    ],
    subtotal: 219429.57, vatRate: 12, vatAmount: 26330.43, totalAmount: 245760,
    paidAmount: 245760, balance: 0, salesperson: sp[0], paymentTerms: "Net 15",
  },
  {
    id: "inv-002", invoiceNumber: inv(7), clientId: "c-002", referenceNo: "PO-12547",
    invoiceDate: "2026-04-30", dueDate: "2026-05-14", status: "partially_paid",
    items: [
      { description: "Long-haul Freight – Pampanga Route", quantity: 2, unitPrice: 80000, amount: 160000 },
      { description: "Fuel Surcharge", quantity: 1, unitPrice: 20000, amount: 20000 },
    ],
    subtotal: 160714.29, vatRate: 12, vatAmount: 19285.71, totalAmount: 180000,
    paidAmount: 60000, balance: 120000, salesperson: sp[1], paymentTerms: "Net 30",
  },
  {
    id: "inv-003", invoiceNumber: inv(6), clientId: "c-003", referenceNo: "PO-12546",
    invoiceDate: "2026-04-29", dueDate: "2026-05-12", status: "sent",
    items: [
      { description: "Distribution – Northline Pampanga", quantity: 5, unitPrice: 55500, amount: 277500 },
      { description: "Warehousing Fee", quantity: 1, unitPrice: 33000, amount: 33000 },
    ],
    subtotal: 277232.14, vatRate: 12, vatAmount: 33267.86, totalAmount: 310500,
    paidAmount: 0, balance: 310500, salesperson: sp[2], paymentTerms: "Net 15",
  },
  {
    id: "inv-004", invoiceNumber: inv(5), clientId: "c-004", referenceNo: "PO-12545",
    invoiceDate: "2026-04-28", dueDate: "2026-05-11", status: "overdue",
    items: [
      { description: "Multi-stop Delivery – QuickMart Branches", quantity: 8, unitPrice: 14300, amount: 114400 },
      { description: "COD Collection Service", quantity: 1, unitPrice: 14000, amount: 14000 },
    ],
    subtotal: 114642.86, vatRate: 12, vatAmount: 13757.14, totalAmount: 128400,
    paidAmount: 0, balance: 128400, salesperson: sp[0], paymentTerms: "Net 15",
  },
  {
    id: "inv-005", invoiceNumber: inv(4), clientId: "c-005", referenceNo: "PO-12544",
    invoiceDate: "2026-04-27", dueDate: "2026-05-10", status: "paid",
    items: [
      { description: "Reefer Truck – Fresh Foods", quantity: 2, unitPrice: 42580, amount: 85160 },
      { description: "Cold Chain Handling", quantity: 1, unitPrice: 10600, amount: 10600 },
    ],
    subtotal: 85500, vatRate: 12, vatAmount: 10260, totalAmount: 95760,
    paidAmount: 95760, balance: 0, salesperson: sp[1], paymentTerms: "Net 15",
  },
  {
    id: "inv-006", invoiceNumber: inv(3), clientId: "c-006", referenceNo: "PO-12543",
    invoiceDate: "2026-04-26", dueDate: "2026-05-09", status: "sent",
    items: [
      { description: "Medical Supply Transport – Prime Med", quantity: 4, unitPrice: 46875, amount: 187500 },
      { description: "Insurance Surcharge", quantity: 1, unitPrice: 22500, amount: 22500 },
    ],
    subtotal: 187500, vatRate: 12, vatAmount: 22500, totalAmount: 210000,
    paidAmount: 0, balance: 210000, salesperson: sp[2], paymentTerms: "Net 30",
  },
  {
    id: "inv-007", invoiceNumber: inv(2), clientId: "c-007", referenceNo: "PO-12542",
    invoiceDate: "2026-04-25", dueDate: "2026-05-08", status: "overdue",
    items: [
      { description: "Construction Materials – BGC Site", quantity: 3, unitPrice: 24500, amount: 73500 },
      { description: "Crane-assist Unloading", quantity: 1, unitPrice: 8850, amount: 8850 },
    ],
    subtotal: 73526.79, vatRate: 12, vatAmount: 8823.21, totalAmount: 82350,
    paidAmount: 10000, balance: 72350, salesperson: sp[0], paymentTerms: "Net 15",
  },
  {
    id: "inv-008", invoiceNumber: inv(1), clientId: "c-008", referenceNo: "PO-12541",
    invoiceDate: "2026-04-24", dueDate: "2026-05-07", status: "paid",
    items: [
      { description: "Cold Storage Pickup – Manila Fresh", quantity: 6, unitPrice: 22920, amount: 137520 },
      { description: "Express Delivery Fee", quantity: 1, unitPrice: 16800, amount: 16800 },
    ],
    subtotal: 137785.71, vatRate: 12, vatAmount: 16534.29, totalAmount: 154320,
    paidAmount: 154320, balance: 0, salesperson: sp[1], paymentTerms: "Net 15",
  },
  {
    id: "inv-009", invoiceNumber: "INV-2024-0560", clientId: "c-009", referenceNo: "PO-12540",
    invoiceDate: "2026-04-23", dueDate: "2026-05-06", status: "partially_paid",
    items: [
      { description: "Full Truckload – Distribution Hub", quantity: 2, unitPrice: 53571.43, amount: 107142.86 },
      { description: "Extra Mileage Charge", quantity: 1, unitPrice: 12857.14, amount: 12857.14 },
    ],
    subtotal: 107142.86, vatRate: 12, vatAmount: 12857.14, totalAmount: 120000,
    paidAmount: 20000, balance: 100000, salesperson: sp[2], paymentTerms: "Net 30",
  },
  {
    id: "inv-010", invoiceNumber: "INV-2024-0559", clientId: "c-010", referenceNo: "PO-12539",
    invoiceDate: "2026-04-22", dueDate: "2026-05-05", status: "cancelled",
    items: [
      { description: "Cancelled – QuickMart Route Change", quantity: 1, unitPrice: 66964.29, amount: 66964.29 },
    ],
    subtotal: 66964.29, vatRate: 12, vatAmount: 8035.71, totalAmount: 75000,
    paidAmount: 0, balance: 0, salesperson: sp[0], paymentTerms: "Net 15",
  },
  {
    id: "inv-011", invoiceNumber: "INV-2024-0570", clientId: "c-001", referenceNo: "PO-12550",
    invoiceDate: "2026-05-02", dueDate: "2026-05-16", status: "sent",
    items: [
      { description: "Trucking Service – Manila to Pampanga (20T Load)", quantity: 2, unitPrice: 72000, amount: 144000 },
      { description: "Fuel Surcharge", quantity: 2, unitPrice: 9500, amount: 19000 },
      { description: "Handling Fee", quantity: 1, unitPrice: 2535.71, amount: 2535.71 },
    ],
    subtotal: 165535.71, vatRate: 12, vatAmount: 19864.29, totalAmount: 185400,
    paidAmount: 0, balance: 185400, salesperson: sp[0], paymentTerms: "Net 15",
  },
  {
    id: "inv-012", invoiceNumber: "INV-2024-0571", clientId: "c-001", referenceNo: "PO-12551",
    invoiceDate: "2026-04-20", dueDate: "2026-05-04", status: "overdue",
    items: [
      { description: "Trucking Service – Makati to Laguna (10T Load)", quantity: 3, unitPrice: 24000, amount: 72000 },
      { description: "Fuel Surcharge", quantity: 3, unitPrice: 2800, amount: 8400 },
      { description: "Handling Fee", quantity: 1, unitPrice: 2412.50, amount: 2412.50 },
    ],
    subtotal: 82812.50, vatRate: 12, vatAmount: 9937.50, totalAmount: 92750,
    paidAmount: 0, balance: 92750, salesperson: sp[1], paymentTerms: "Net 15",
  },
  {
    id: "inv-013", invoiceNumber: "INV-2024-0572", clientId: "c-001", referenceNo: "PO-12552",
    invoiceDate: "2026-04-25", dueDate: "2026-05-25", status: "partially_paid",
    items: [
      { description: "Heavy Equipment Transport – Quezon City to Batangas", quantity: 2, unitPrice: 115000, amount: 230000 },
      { description: "Crane-assist Loading/Unloading", quantity: 2, unitPrice: 15000, amount: 30000 },
      { description: "Escort Vehicle Service", quantity: 2, unitPrice: 8482.14, amount: 16964.29 },
    ],
    subtotal: 276964.29, vatRate: 12, vatAmount: 33235.71, totalAmount: 310200,
    paidAmount: 150000, balance: 160200, salesperson: sp[2], paymentTerms: "Net 30",
  },
  {
    id: "inv-014", invoiceNumber: "INV-2024-0573", clientId: "c-001", referenceNo: "PO-12553",
    invoiceDate: "2026-04-15", dueDate: "2026-04-30", status: "paid",
    items: [
      { description: "Trucking Service – Taguig to Bulacan (15T Load)", quantity: 4, unitPrice: 28000, amount: 112000 },
      { description: "Fuel Surcharge", quantity: 4, unitPrice: 2500, amount: 10000 },
      { description: "Documentation Fee", quantity: 1, unitPrice: 1866.07, amount: 1866.07 },
    ],
    subtotal: 123866.07, vatRate: 12, vatAmount: 14863.93, totalAmount: 138730,
    paidAmount: 138730, balance: 0, salesperson: sp[0], paymentTerms: "Net 15",
  },
];

/* ─── 10 Payments ─── */
export const seedBillingPayments: BillingPayment[] = [
  {
    id: "bp-001", paymentId: pay(9), type: "received", clientId: "c-001", invoiceId: "inv-001",
    referenceNo: "TRX-987654321", paymentDate: "2026-04-31T14:15:00", method: "bank_transfer",
    status: "completed", amount: 245760, bank: "BDO Unibank, Inc.", accountNo: "0123 4567 8910", notes: "Payment for invoice INV-2024-0568",
  },
  {
    id: "bp-002", paymentId: pay(8), type: "received", clientId: "c-003", invoiceId: "inv-003",
    referenceNo: "TRX-876543210", paymentDate: "2026-04-31T10:34:00", method: "credit_card",
    status: "completed", amount: 310500, bank: "Metrobank", accountNo: "9876 5432 1012",
  },
  {
    id: "bp-003", paymentId: pay(7), type: "sent", clientId: "c-002", invoiceId: "inv-005",
    referenceNo: "BILL-2024-0321", paymentDate: "2026-04-30T04:20:00", method: "bank_transfer",
    status: "completed", amount: -45000, notes: "Vendor payment – cold chain partner",
  },
  {
    id: "bp-004", paymentId: pay(6), type: "received", clientId: "c-006", invoiceId: "inv-002",
    referenceNo: "TRX-765432109", paymentDate: "2026-04-30T11:35:00", method: "bank_transfer",
    status: "completed", amount: 120000,
  },
  {
    id: "bp-005", paymentId: pay(5), type: "received", clientId: "c-004", invoiceId: "inv-004",
    referenceNo: "TRX-654321098", paymentDate: "2026-04-29T09:17:00", method: "gcash",
    status: "completed", amount: 128400,
  },
  {
    id: "bp-006", paymentId: pay(4), type: "refund", clientId: "c-002", invoiceId: "inv-008",
    referenceNo: "REF-2024-0156", paymentDate: "2026-04-28T15:45:00", method: "bank_transfer",
    status: "completed", amount: -28750, notes: "Partial refund – overcharge on INV-2024-0561",
  },
  {
    id: "bp-007", paymentId: pay(3), type: "received", clientId: "c-001", invoiceId: "inv-007",
    referenceNo: "TRX-543210987", paymentDate: "2026-04-28T10:11:00", method: "credit_card",
    status: "completed", amount: 82350,
  },
  {
    id: "bp-008", paymentId: pay(2), type: "received", clientId: "c-005", invoiceId: "inv-006",
    referenceNo: "TRX-432109876", paymentDate: "2026-04-27T13:30:00", method: "bank_transfer",
    status: "completed", amount: -5250, bank: "Landbank", notes: "Debit – service fee",
  },
  {
    id: "bp-009", paymentId: pay(1), type: "received", clientId: "c-002", invoiceId: "inv-008",
    referenceNo: "TRX-321098765", paymentDate: "2026-04-27T09:08:00", method: "bank_transfer",
    status: "completed", amount: 154320, bank: "BPI",
  },
  {
    id: "bp-010", paymentId: "PAY-2024-0867", type: "received", clientId: "c-004", invoiceId: "inv-010",
    referenceNo: "TRX-210987654", paymentDate: "2026-04-26T14:22:00", method: "gcash",
    status: "pending", amount: 75000,
  },
];

/* ─── Credit Notes ─── */
export const seedCreditNotes: CreditNote[] = [
  {
    id: "cn-001", creditNoteNumber: "CN-2024-0012", clientId: "c-002", invoiceId: "inv-008",
    date: "2026-04-28", reason: "Overcharge on cold chain handling fee",
    items: [{ description: "Credit – Handling fee overcharge", quantity: 1, unitPrice: 28750, amount: 28750 }],
    amount: 28750, status: "applied",
  },
  {
    id: "cn-002", creditNoteNumber: "CN-2024-0011", clientId: "c-004", invoiceId: "inv-010",
    date: "2026-04-23", reason: "Invoice cancelled – route change by client",
    items: [{ description: "Full invoice credit – cancelled trip", quantity: 1, unitPrice: 75000, amount: 75000 }],
    amount: 75000, status: "refunded",
  },
  {
    id: "cn-003", creditNoteNumber: "CN-2024-0010", clientId: "c-001",
    date: "2026-04-20", reason: "Volume discount – 10+ trips in April",
    items: [{ description: "Volume discount credit", quantity: 1, unitPrice: 15000, amount: 15000 }],
    amount: 15000, status: "draft",
  },
];

/* ─── Recurring Invoices ─── */
export const seedRecurringInvoices: RecurringInvoice[] = [
  {
    id: "ri-001", clientId: "c-001", frequency: "monthly", nextDate: "2026-06-01",
    templateItems: [
      { description: "Monthly Retainer – Construction Materials Transport", quantity: 1, unitPrice: 180000, amount: 180000 },
      { description: "Standby Vehicle Allocation", quantity: 1, unitPrice: 25000, amount: 25000 },
    ],
    amount: 205000, status: "active", lastGenerated: "2026-05-01", totalGenerated: 8,
  },
  {
    id: "ri-002", clientId: "c-002", frequency: "weekly", nextDate: "2026-05-19",
    templateItems: [
      { description: "Weekly Cold Chain Pickup – Manila Fresh", quantity: 3, unitPrice: 18500, amount: 55500 },
    ],
    amount: 55500, status: "active", lastGenerated: "2026-05-12", totalGenerated: 22,
  },
  {
    id: "ri-003", clientId: "c-005", frequency: "quarterly", nextDate: "2026-07-01",
    templateItems: [
      { description: "Quarterly Medical Supply Logistics Contract", quantity: 1, unitPrice: 450000, amount: 450000 },
      { description: "Priority Handling & Insurance", quantity: 1, unitPrice: 35000, amount: 35000 },
    ],
    amount: 485000, status: "active", lastGenerated: "2026-04-01", totalGenerated: 4,
  },
  {
    id: "ri-004", clientId: "c-003", frequency: "monthly", nextDate: "2026-06-01",
    templateItems: [
      { description: "Distribution Hub – Monthly Contract", quantity: 1, unitPrice: 120000, amount: 120000 },
    ],
    amount: 120000, status: "paused", lastGenerated: "2026-04-01", totalGenerated: 6,
  },
];
