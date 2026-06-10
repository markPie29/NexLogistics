// Core domain types for Nex Logistics MVP

export type Role =
  | "super_admin"
  | "company_admin"
  | "dispatcher"
  | "driver"
  | "helper"
  | "accounting"
  | "client"
  | "partner";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  /** @internal demo only — never persisted to a real store or sent over network */
  _demoPassword?: string;
  phone?: string;
  companyId?: string;
  driverId?: string; // when role is driver
  helperId?: string; // when role is helper
  clientId?: string; // when role is client
  partnerId?: string; // when role is partner
  isPlatformOwner?: boolean; // hidden: platform-level feature toggle access
}

export type VehicleStatus =
  | "available"
  | "in_trip"
  | "maintenance"
  | "inactive";

export type VehicleOwnership = "company" | "subcon";

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
  ownership?: VehicleOwnership;  // "company" (default) | "subcon" (registered to a partner)
  partnerId?: string;            // when ownership="subcon", links to Partner
  imageUrl?: string;
  notes?: string;
  createdAt: string;
}

export type EmploymentType = "per_trip" | "monthly" | "hybrid";

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
  // Payroll basis (Phase 1: monthly employees)
  employmentType?: EmploymentType;   // default "per_trip"
  monthlyBaseSalary?: number;        // when employmentType is "monthly" or "hybrid"
  baseRatePerTrip?: number;          // suggested per-trip rate
  ratePerKm?: number;                // alternative km-based rate
  commissionPercent?: number;        // % of fare
}

// ── Helper (driver's assistant / loader) ──
export interface Helper {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: "active" | "off_duty" | "on_leave";
  assignedDriverId?: string;
  hireDate?: string;
  address?: string;
  emergencyContact?: string;
  photoUrl?: string;
  // Payroll basis
  employmentType?: EmploymentType;   // default "per_trip"
  monthlyBaseSalary?: number;
  baseRatePerTrip?: number;          // ₱ per trip
  ratePerKm?: number;                // ₱ per km
  commissionPercent?: number;        // % of fare
  notes?: string;
  createdAt: string;
  // Performance metrics
  rating?: number;          // 0–5, default 0
  onTimePercent?: number;   // 0–100, default 100
  totalTrips?: number;      // >= 0, default 0
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

export type TripApprovalStatus =
  | "pending"
  | "pending_rate_approval"   // Phase 5: awaiting Super Admin rate confirmation at trip creation
  | "approved"
  | "rejected";

// One-off pass-through cost on a trip (toll, parking, helper fee, etc.)
export interface TripFee {
  id: string;
  label: string;
  amount: number;
}

export type PartnerPayoutStatus = "pending" | "paid";

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
  podSubmittedAt?: string;        // ISO timestamp when POD was submitted
  createdAt: string;
  eta?: string;
  // ── Operational extensions (client requirement) ──
  // Plate number is NOT duplicated here — derive from vehicleId → Vehicle.plate.
  documentNo?: string;          // DR# / waybill / document number
  // Customer / Client fields (renamed from "consignee" — boss request May 14, 2026)
  customerName?: string;        // Deliver-to person/business
  customerContact?: string;     // Receiver phone/contact
  /** @deprecated Use customerName. Kept for backward-compat with persisted data. */
  consigneeName?: string;
  /** @deprecated Use customerContact. Kept for backward-compat with persisted data. */
  consigneeContact?: string;
  notes?: string;               // Free-text trip note (distinct from statusLogs)
  otherFees?: TripFee[];        // Toll, parking, etc.
  // ── Helper assignment (Phase 1) ──
  helperId?: string;            // optional assistant assigned to trip
  helperName?: string;          // snapshot at creation (optional override)
  helperContact?: string;
  helperFee?: number;           // ₱ paid to helper for this trip
  // ── Rate snapshots (locked at trip creation, used by approvals + payroll) ──
  driverRate?: number;          // ₱ driver earns for this trip
  helperRate?: number;          // ₱ helper earns for this trip
  commissionPct?: number;       // 0-100 — employee/subcon commission on this trip
  // ── Subcon assignment ──
  partnerId?: string;                    // Subcontractor handling the trip
  partnerPayoutStatus?: PartnerPayoutStatus;
  partnerPayoutAt?: string;
  partnerRate?: number;                  // ₱ paid to partner for this trip
  // ── Approval workflow ──
  approvalStatus?: TripApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  // Phase 5: separate rate-approval audit (Super Admin gate at creation)
  rateApprovedBy?: string;
  rateApprovedAt?: string;
  rateApprovalNotes?: string;
  payrollProcessed?: boolean; // true once a payroll period locks the earnings
  payrollPeriodId?: string;
}

// ── Subcontractor / 3rd-party hauler ──
export type PartnerStatus = "active" | "suspended" | "inactive";

export interface Partner {
  id: string;                 // ptn-001
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  tin?: string;               // PH Tax Identification Number
  bankName?: string;
  bankAccountNo?: string;
  vehicleTypes: string[];     // fleet types they offer (van, 6-wheeler, etc.)
  defaultRate?: number;       // ₱ flat per-trip fallback
  ratePerKm?: number;         // ₱ per km (alt to defaultRate)
  status: PartnerStatus;
  createdAt: string;
  notes?: string;
}

export type PartnerRequestType = "diesel" | "cash_advance" | "other";
export type PartnerRequestStatus = "pending" | "approved" | "rejected" | "released";

export interface PartnerRequest {
  id: string;
  partnerId: string;
  type: PartnerRequestType;
  amount: number;
  reason?: string;
  requestedAt: string;
  status: PartnerRequestStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  releaseReference?: string;
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

// ─── Philippine Logistics Per-Trip Payroll System ────────────

export type PayrollMode =
  | "fixed_salary"          // Pure base salary (office-style)
  | "fixed_plus_trip"       // Base salary + trip incentives  (RECOMMENDED — Hybrid)
  | "per_trip"              // Earnings only from completed trips
  | "per_delivery"          // Paid per successful drop / POD
  | "percentage";           // % commission of trip fare/revenue

export type RateType =
  | "fixed"
  | "per_km"
  | "per_delivery"
  | "percentage"
  | "per_ton"          // ₱ × cargo.weightKg / 1000
  | "per_unit";        // ₱ × cargo.units

// A distance-based multiplier band (e.g. 50-150km × 1.15)
export interface DistanceTier {
  minKm: number;
  maxKm: number;       // inclusive upper bound; use a large number for "no cap"
  multiplier: number;  // 1.0 = no change
}

// Defines how a trip is priced for the DRIVER (not the client invoice).
export interface TripRate {
  id: string;
  name: string;                     // e.g. "Manila → Pampanga · 6-Wheeler"
  vehicleType: string;              // matches Vehicle.type
  routeOrigin: string;              // e.g. "Manila", "*" for any
  routeDestination: string;         // e.g. "Pampanga", "*" for any
  dropoffZone?: string;             // e.g. "Metro Manila", "Region IV-A" — extra match key
  rateType: RateType;
  fixedRate?: number;               // ₱ per trip (rateType=fixed)
  ratePerKm?: number;               // ₱ per km (rateType=per_km)
  ratePerDelivery?: number;         // ₱ per drop (rateType=per_delivery)
  ratePerTon?: number;              // ₱ per metric ton (rateType=per_ton)
  ratePerUnit?: number;             // ₱ per cargo unit (rateType=per_unit)
  commissionPercent?: number;       // 0-100 (rateType=percentage)
  extraStopFee?: number;
  nightDifferentialPercent?: number; // additional % for night trips
  holidayMultiplier?: number;       // e.g. 1.5 for holidays
  distanceTiers?: DistanceTier[];   // optional banded multiplier on distance-affected components
  active: boolean;
}

// Each driver's payroll configuration.
export interface DriverPayrollProfile {
  id: string;
  driverId: string;
  payrollMode: PayrollMode;
  baseSalary: number;               // monthly (used when mode includes fixed)
  dailyRate?: number;               // for daily-rated drivers
  defaultTripRateId?: string;       // fallback when no route match
  commissionPercent?: number;       // global override for percentage mode
  perTripFlatRate?: number;         // global flat per-trip (per_trip mode)
  perDeliveryRate?: number;         // global per-delivery
  // Government-mandated deductions (PH)
  sssEnabled: boolean;
  philhealthEnabled: boolean;
  pagibigEnabled: boolean;
  taxEnabled: boolean;
  // Optional toggles
  overtimeEnabled: boolean;
  allowanceEnabled: boolean;
  monthlyAllowance?: number;        // meal / transport allowance
  active: boolean;
}

export type IncentiveType =
  | "on_time_delivery"
  | "fuel_efficiency"
  | "extra_stop"
  | "holiday_trip"
  | "excellent_rating"
  | "safety_bonus"
  | "other";

export interface Incentive {
  id: string;
  driverId: string;
  tripId?: string;
  type: IncentiveType;
  amount: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  payrollPeriodId?: string;         // set once locked into a period
}

export type DeductionType =
  | "cash_advance"
  | "fuel_shortage"
  | "late_delivery"
  | "vehicle_damage"
  | "violation"
  | "uniform"
  | "sss"
  | "philhealth"
  | "pagibig"
  | "tax"
  | "other";

export type DeductionStatus = "pending" | "applied" | "waived";

export interface Deduction {
  id: string;
  driverId: string;
  tripId?: string;
  type: DeductionType;
  amount: number;
  reason: string;                   // legally required
  status: DeductionStatus;
  createdBy: string;
  createdAt: string;
  payrollPeriodId?: string;
}

export type PayrollPeriodStatus =
  | "draft"
  | "computing"
  | "ready_for_review"
  | "approved"
  | "paid"
  | "closed";

export interface PayrollPeriod {
  id: string;
  name: string;                     // e.g. "May 1-15, 2026"
  startDate: string;
  endDate: string;
  payDate?: string;
  status: PayrollPeriodStatus;
  generatedBy?: string;
  generatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidBy?: string;
  paidAt?: string;
  notes?: string;
}

// Per-trip computed payroll record (one per eligible trip, locked into a period)
export interface TripPayroll {
  id: string;
  tripId: string;
  driverId: string;
  tripRateId?: string;
  rateType: RateType;
  baseTripAmount: number;           // from rate engine
  distanceAmount: number;           // km-based addition
  deliveryAmount: number;           // per-drop addition
  tonAmount: number;                // ratePerTon × cargo.weightKg/1000
  unitAmount: number;               // ratePerUnit × cargo.units
  commissionAmount: number;         // % of fare
  extraStopAmount: number;
  nightDifferential: number;
  holidayBonus: number;
  tierMultiplier: number;           // applied distance-tier multiplier (1.0 = none)
  finalAmount: number;              // sum × tierMultiplier
  payrollPeriodId: string;
  createdAt: string;
}

// Per-driver summary line for a payroll period
export interface PayrollSummary {
  id: string;
  driverId: string;
  payrollPeriodId: string;
  payrollMode: PayrollMode;
  tripsCount: number;
  baseSalary: number;
  tripEarnings: number;             // sum of TripPayroll.finalAmount
  incentives: number;
  allowances: number;
  overtimeAmount: number;
  // Government & operational deductions
  sssDeduction: number;
  philhealthDeduction: number;
  pagibigDeduction: number;
  taxDeduction: number;
  cashAdvanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  grossPay: number;
  netPay: number;
  status: "draft" | "approved" | "paid";
  paidAt?: string;
  notes?: string;
}

// ─── Helper Payroll Profile (mirror of DriverPayrollProfile) ─

export interface HelperPayrollProfile {
  id: string;
  helperId: string;
  payrollMode: PayrollMode;
  baseSalary: number;
  perTripFlatRate?: number;
  perDeliveryRate?: number;
  commissionPercent?: number;
  sssEnabled: boolean;
  philhealthEnabled: boolean;
  pagibigEnabled: boolean;
  taxEnabled: boolean;
  active: boolean;
}

// ─── Department Calendar (Phase 6) ───────────────────────────

export type CalendarDepartment =
  | "admin"
  | "hr"
  | "operation"
  | "accounting"
  | "sales"
  | "subcon";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;          // ISO datetime
  end: string;            // ISO datetime
  allDay?: boolean;
  department: CalendarDepartment;
  color?: string;         // hex; if omitted, derived from department
  location?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export const CALENDAR_DEPARTMENT_COLORS: Record<CalendarDepartment, string> = {
  admin:      "#0F172A", // brand-navy
  hr:         "#0EA5E9",
  operation:  "#10B981",
  accounting: "#F59E0B",
  sales:      "#8B5CF6",
  subcon:     "#EF4444",
};

export const CALENDAR_DEPARTMENT_LABELS: Record<CalendarDepartment, string> = {
  admin:      "Admin",
  hr:         "HR",
  operation:  "Operation",
  accounting: "Accounting",
  sales:      "Sales",
  subcon:     "Subcon / Partners",
};

// ─── Office Staff Payroll ────────────────────────────────────

export type OfficeDepartment =
  | "admin"
  | "hr"
  | "operations"
  | "accounting"
  | "sales"
  | "it"
  | "maintenance";

export interface OfficeEmployee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: OfficeDepartment;
  position: string;              // e.g. "HR Manager", "Accounting Clerk"
  monthlySalary: number;         // gross monthly
  // PH government deductions
  sssEnabled: boolean;
  philhealthEnabled: boolean;
  pagibigEnabled: boolean;
  taxEnabled: boolean;
  // Optional benefits
  monthlyAllowance?: number;
  status: "active" | "resigned" | "on_leave";
  hireDate: string;
  notes?: string;
}

// ─── Vehicle Documents & Permits ─────────────────────────────

export type DocumentCategory =
  | "OR/CR"
  | "Insurance"
  | "LTFRB Franchise"
  | "LTO Registration";

export type PermitCategory =
  | "City Permit"
  | "Barangay Clearance"
  | "Mayor's Permit"
  | "Special Permit (Hazmat)"
  | "Special Permit (Overweight)"
  | "Special Permit (Oversized)";

export interface FileAttachment {
  fileName: string;
  fileSize: number; // bytes
  uploadedAt: string; // ISO date
}

export interface VehicleDocument {
  id: string;
  vehicleId: string;
  category: DocumentCategory;
  documentNumber: string;
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  issuingAuthority: string;
  notes?: string;
  fileAttachment?: FileAttachment;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface VehiclePermit {
  id: string;
  vehicleId: string;
  category: PermitCategory;
  permitNumber: string;
  issuedDate: string; // ISO date
  expiryDate: string; // ISO date
  issuingAuthority: string;
  coverageArea?: string;
  notes?: string;
  fileAttachment?: FileAttachment;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

