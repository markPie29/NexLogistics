import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type {
  EmployeeProfile,
  EmployeePortalType,
  LeaveRequest,
  UndertimeRequest,
  CashAdvanceRequest,
  UniformRequest,
  PPERequest,
  LiquidationRequest,
  LoanRequest,
  HRDocument,
  HRDocumentType,
  EmployeeCredential,
  CredentialType,
  EmployeeRequestStatus,
  ApprovalStep,
} from "@/lib/types";

// ─── Approval chain templates ─────────────────────────────────

/** Returns the default approval steps for each request type */
export function defaultSteps(
  type: "leave" | "undertime" | "cash_advance" | "uniform" | "ppe" | "liquidation" | "loan"
): ApprovalStep[] {
  const hr: ApprovalStep = { role: "HR", status: "pending" };
  const exec: ApprovalStep = { role: "Executive Officer-in-Charge", status: "pending" };
  const owner: ApprovalStep = { role: "Owner", status: "pending" };

  switch (type) {
    case "uniform":
    case "ppe":
      return [exec, owner];
    default:
      return [hr, exec, owner];
  }
}

/** Compute overall status from steps: pending until all approved or first rejected */
function resolveStatus(steps: ApprovalStep[]): EmployeeRequestStatus {
  if (steps.some((s) => s.status === "rejected")) return "rejected";
  if (steps.every((s) => s.status === "approved")) return "approved";
  return "pending";
}

// ─── Seed data ────────────────────────────────────────────────

const seedEmployees: EmployeeProfile[] = [
  {
    id: "ep-001",
    userId: "u-010",
    name: "Maria Santos",
    email: "employee.maria@nexlogistics.demo",
    phone: "0917 400 0001",
    department: "HR",
    position: "HR Assistant",
    employeeType: "office",
    hireDate: "2024-01-15",
    status: "active",
    createdAt: "2024-01-15T08:00:00.000Z",
  },
  {
    id: "ep-002",
    userId: "u-004",  // links to Mark Santos (driver)
    name: "Mark Santos",
    email: "driver.mark@nexlogistics.demo",
    phone: "0917 123 4567",
    department: "Operations",
    position: "Truck Driver",
    employeeType: "driver",
    driverId: "d-001",
    hireDate: "2023-06-01",
    status: "active",
    createdAt: "2023-06-01T08:00:00.000Z",
  },
  {
    id: "ep-003",
    userId: "u-007",  // links to Roberto Lim (helper)
    name: "Roberto Lim",
    email: "helper.roberto@nexlogistics.demo",
    phone: "0917 555 0101",
    department: "Operations",
    position: "Helper / Loader",
    employeeType: "helper",
    helperId: "h-001",
    hireDate: "2023-08-15",
    status: "active",
    createdAt: "2023-08-15T08:00:00.000Z",
  },
];

// ─── Employee Profile Store ───────────────────────────────────

interface EmployeeProfileState {
  employees: EmployeeProfile[];
  addEmployee: (e: Omit<EmployeeProfile, "id" | "createdAt">) => EmployeeProfile;
  updateEmployee: (id: string, patch: Partial<EmployeeProfile>) => void;
  getByUserId: (userId: string) => EmployeeProfile | undefined;
  reset: () => void;
}

export const useEmployeeProfileStore = create<EmployeeProfileState>()(
  persist(
    (set, get) => ({
      employees: seedEmployees,
      addEmployee: (e) => {
        const ne: EmployeeProfile = {
          ...e,
          id: `ep-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ employees: [ne, ...s.employees] }));
        return ne;
      },
      updateEmployee: (id, patch) =>
        set((s) => ({ employees: s.employees.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      getByUserId: (userId) => get().employees.find((e) => e.userId === userId),
      reset: () => set({ employees: seedEmployees }),
    }),
    { name: `${BRAND.storeKey}-employee-profiles` }
  )
);

// ─── Leave Requests ───────────────────────────────────────────

interface LeaveState {
  requests: LeaveRequest[];
  submit: (data: Omit<LeaveRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => LeaveRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useLeaveStore = create<LeaveState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: LeaveRequest = {
          ...data,
          id: `lv-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("leave"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-leave-requests` }
  )
);

// ─── Undertime Requests ───────────────────────────────────────

interface UndertimeState {
  requests: UndertimeRequest[];
  submit: (data: Omit<UndertimeRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => UndertimeRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useUndertimeStore = create<UndertimeState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: UndertimeRequest = {
          ...data,
          id: `ut-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("undertime"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-undertime-requests` }
  )
);

// ─── Cash Advance / Vale Requests ────────────────────────────

interface CashAdvanceState {
  requests: CashAdvanceRequest[];
  submit: (data: Omit<CashAdvanceRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => CashAdvanceRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useCashAdvanceRequestStore = create<CashAdvanceState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: CashAdvanceRequest = {
          ...data,
          id: `ca-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("cash_advance"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-cash-advance-requests` }
  )
);

// ─── Uniform Requests ─────────────────────────────────────────

interface UniformState {
  requests: UniformRequest[];
  submit: (data: Omit<UniformRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => UniformRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useUniformRequestStore = create<UniformState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: UniformRequest = {
          ...data,
          id: `ur-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("uniform"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-uniform-requests` }
  )
);

// ─── PPE Requests ─────────────────────────────────────────────

interface PPEState {
  requests: PPERequest[];
  submit: (data: Omit<PPERequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => PPERequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const usePPERequestStore = create<PPEState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: PPERequest = {
          ...data,
          id: `ppe-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("ppe"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-ppe-requests` }
  )
);

// ─── Liquidation Requests ─────────────────────────────────────

interface LiquidationState {
  requests: LiquidationRequest[];
  submit: (data: Omit<LiquidationRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => LiquidationRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useLiquidationStore = create<LiquidationState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: LiquidationRequest = {
          ...data,
          id: `lq-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("liquidation"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-liquidation-requests` }
  )
);

// ─── Loan Requests ────────────────────────────────────────────

interface LoanState {
  requests: LoanRequest[];
  submit: (data: Omit<LoanRequest, "id" | "status" | "steps" | "submittedAt" | "updatedAt">) => LoanRequest;
  approve: (id: string, stepRole: string, by: string, notes?: string) => void;
  reject: (id: string, stepRole: string, by: string, notes: string) => void;
  reset: () => void;
}

export const useLoanRequestStore = create<LoanState>()(
  persist(
    (set) => ({
      requests: [],
      submit: (data) => {
        const r: LoanRequest = {
          ...data,
          id: `ln-${Date.now().toString(36)}`,
          status: "pending",
          steps: defaultSteps("loan"),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ requests: [r, ...s.requests] }));
        return r;
      },
      approve: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "approved" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: resolveStatus(steps), updatedAt: new Date().toISOString() };
          }),
        })),
      reject: (id, stepRole, by, notes) =>
        set((s) => ({
          requests: s.requests.map((r) => {
            if (r.id !== id) return r;
            const steps = r.steps.map((st) =>
              st.role === stepRole && st.status === "pending"
                ? { ...st, status: "rejected" as const, reviewedBy: by, reviewedAt: new Date().toISOString(), notes }
                : st
            );
            return { ...r, steps, status: "rejected", updatedAt: new Date().toISOString() };
          }),
        })),
      reset: () => set({ requests: [] }),
    }),
    { name: `${BRAND.storeKey}-loan-requests` }
  )
);

// ─── HR Documents ─────────────────────────────────────────────

interface HRDocumentState {
  documents: HRDocument[];
  issue: (data: Omit<HRDocument, "id">) => HRDocument;
  submitNTEResponse: (id: string, response: string) => void;
  reset: () => void;
}

const seedHRDocs: HRDocument[] = [
  {
    id: "hrd-001",
    employeeId: "ep-001",
    type: "notice_to_explain",
    title: "NTE — Tardiness (May 2026)",
    body: "You are required to explain in writing why you were late three times during the week of May 12–16, 2026.",
    issuedBy: "HR Department",
    issuedAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "hrd-002",
    employeeId: "ep-002",
    type: "written_warning",
    title: "Written Warning — Vehicle Handling",
    body: "This serves as a formal written warning regarding improper vehicle handling reported on May 10, 2026.",
    issuedBy: "Operations Manager",
    issuedAt: "2026-05-15T10:00:00.000Z",
  },
];

export const useHRDocumentStore = create<HRDocumentState>()(
  persist(
    (set) => ({
      documents: seedHRDocs,
      issue: (data) => {
        const d: HRDocument = { ...data, id: `hrd-${Date.now().toString(36)}` };
        set((s) => ({ documents: [d, ...s.documents] }));
        return d;
      },
      submitNTEResponse: (id, response) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id && d.type === "notice_to_explain"
              ? { ...d, employeeResponse: response, respondedAt: new Date().toISOString() }
              : d
          ),
        })),
      reset: () => set({ documents: seedHRDocs }),
    }),
    { name: `${BRAND.storeKey}-hr-documents` }
  )
);

// ─── Employee Credentials ─────────────────────────────────────

interface CredentialState {
  credentials: EmployeeCredential[];
  upsert: (employeeId: string, type: CredentialType, fileUrl: string) => void;
  getByEmployee: (employeeId: string) => EmployeeCredential[];
  reset: () => void;
}

export const useCredentialStore = create<CredentialState>()(
  persist(
    (set, get) => ({
      credentials: [],
      upsert: (employeeId, type, fileUrl) => {
        const existing = get().credentials.find(
          (c) => c.employeeId === employeeId && c.type === type
        );
        if (existing) {
          set((s) => ({
            credentials: s.credentials.map((c) =>
              c.id === existing.id
                ? { ...c, fileUrl, uploadedAt: new Date().toISOString() }
                : c
            ),
          }));
        } else {
          const nc: EmployeeCredential = {
            id: `cred-${Date.now().toString(36)}`,
            employeeId,
            type,
            fileUrl,
            uploadedAt: new Date().toISOString(),
          };
          set((s) => ({ credentials: [nc, ...s.credentials] }));
        }
      },
      getByEmployee: (employeeId) => get().credentials.filter((c) => c.employeeId === employeeId),
      reset: () => set({ credentials: [] }),
    }),
    { name: `${BRAND.storeKey}-employee-credentials` }
  )
);
