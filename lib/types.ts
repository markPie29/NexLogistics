// Core domain types for Nex Logistics MVP

export type Role =
  | "super_admin"
  | "company_admin"
  | "dispatcher"
  | "driver"
  | "accounting"
  | "client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  password: string; // demo only
  phone?: string;
  companyId?: string;
  driverId?: string; // when role is driver
  clientId?: string; // when role is client
}

export type VehicleStatus =
  | "available"
  | "in_trip"
  | "maintenance"
  | "inactive";

export interface Vehicle {
  id: string;
  plate: string;
  type: string; // Truck / Van / Pickup / Trailer / Motorcycle
  brand: string;
  model: string;
  year: number;
  color: string;
  capacity: string;
  fuelType: "Diesel" | "Gasoline" | "Electric" | "Hybrid";
  odometer: number;
  assignedDriverId?: string;
  gpsDeviceId?: string;
  registrationExpiry: string; // ISO date
  insuranceExpiry: string;
  permitExpiry: string;
  status: VehicleStatus;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  licenseNumber: string;
  licenseClass: string;
  licenseExpiry: string;
  hireDate: string;
  rating: number; // 0-5
  onTimePercent: number;
  totalTrips: number;
  status: "active" | "off_duty" | "on_leave";
  assignedVehicleId?: string;
  emergencyContact?: string;
  address?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  logoUrl?: string;
}

export type TripStatus =
  | "scheduled"
  | "driver_assigned"
  | "vehicle_dispatched"
  | "loaded"
  | "in_transit"
  | "delivered"
  | "delayed"
  | "completed"
  | "cancelled";

export interface TripStatusLog {
  status: TripStatus;
  at: string;
  by?: string;
  note?: string;
}

export interface Trip {
  id: string; // TRP-2024-001
  clientId: string;
  driverId?: string;
  vehicleId?: string;
  pickup: { address: string; lat: number; lng: number; scheduledAt: string };
  dropoff: { address: string; lat: number; lng: number; scheduledAt: string };
  cargo: {
    type: string;
    weightKg: number;
    units: number;
    description?: string;
  };
  distanceKm: number;
  fare: number;
  status: TripStatus;
  statusLogs: TripStatusLog[];
  podId?: string;
  createdAt: string;
  eta?: string;
}

export type MaintenanceStatus = "upcoming" | "due_soon" | "overdue" | "completed";

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string; // Oil Change, Tire Replacement, etc.
  dueDate: string;
  dueOdometer?: number;
  cost?: number;
  status: MaintenanceStatus;
  completedAt?: string;
  notes?: string;
}

export type ExpenseCategory = "fuel" | "repair" | "toll" | "cash_advance" | "other";

export interface Expense {
  id: string;
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  category: ExpenseCategory;
  amount: number;
  liters?: number;
  date: string;
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}

export type PayrollStatus = "draft" | "approved" | "paid";

export interface PayrollRecord {
  id: string;
  driverId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  incentives: number;
  overtime: number;
  deductions: number;
  net: number;
  status: PayrollStatus;
  paidAt?: string;
}

export interface ProofOfDelivery {
  id: string;
  tripId: string;
  receiverName: string;
  receiverContact?: string;
  signatureDataUrl?: string;
  photoDataUrls: string[];
  notes?: string;
  gps: { lat: number; lng: number };
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  type: "info" | "warning" | "success" | "danger";
  title: string;
  message: string;
  at: string;
  read: boolean;
}

export interface AiInsight {
  id: string;
  category: "fuel" | "driver" | "maintenance" | "route" | "cost";
  severity: "info" | "warning" | "critical" | "positive";
  title: string;
  description: string;
  confidence: number; // 0-100
  affectedEntity?: string;
}

export interface GpsPing {
  vehicleId: string;
  lat: number;
  lng: number;
  speedKph: number;
  heading: number;
  status: "moving" | "idle" | "stopped" | "offline";
  engineOn: boolean;
  timestamp: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

// ─── Billing & Invoices ──────────────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  referenceNo: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  salesperson: string;
  paymentTerms: string;
  notes?: string;
}

export type PaymentType = "received" | "sent" | "refund";
export type PaymentMethod = "bank_transfer" | "credit_card" | "gcash" | "cash" | "check";
export type PaymentStatus = "completed" | "pending" | "failed";

export interface BillingPayment {
  id: string;
  paymentId: string;
  type: PaymentType;
  clientId: string;
  invoiceId: string;
  referenceNo: string;
  paymentDate: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  bank?: string;
  accountNo?: string;
  notes?: string;
}

export type CreditNoteStatus = "draft" | "applied" | "refunded";

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  clientId: string;
  invoiceId?: string;
  date: string;
  reason: string;
  items: InvoiceLineItem[];
  amount: number;
  status: CreditNoteStatus;
}

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";
export type RecurringStatus = "active" | "paused" | "cancelled";

export interface RecurringInvoice {
  id: string;
  clientId: string;
  frequency: RecurringFrequency;
  nextDate: string;
  templateItems: InvoiceLineItem[];
  amount: number;
  status: RecurringStatus;
  lastGenerated?: string;
  totalGenerated: number;
}
