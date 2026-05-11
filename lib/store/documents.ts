import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AccessLevel = "public" | "internal" | "private";
export type DocumentStatus = "active" | "archived" | "deleted";
export type ShareAccess = "view" | "edit";

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  status: "active" | "inactive";
  createdOn: string;
  createdBy: string;
}

export interface DocumentRequest {
  id: string;
  title: string;
  requestedFrom: string;
  requestedFromEmail: string;
  notes: string;
  dueDate: string;
  status: "pending" | "completed" | "overdue" | "cancelled";
  createdAt: string;
  priority: "low" | "medium" | "high";
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string; // PDF, DOCX, XLSX, etc.
  category: string;
  sizeMB: number;
  ownerId: string;
  relatedToType: string;
  tags: string[];
  description: string;
  accessLevel: AccessLevel;
  effectiveDate?: string;
  expiryDate?: string;
  version: string;
  folder?: string;
  status: DocumentStatus;
  
  // Share details
  sharedBy?: string;
  sharedWith?: string;
  sharedWithEmail?: string;
  shareAccess?: ShareAccess;
  sharedOn?: string;
  shareStatus?: "active" | "expired";
  
  // Recycle bin details
  deletedBy?: string;
  deletedOn?: string;
  originalLocation?: string;
  daysLeft?: number;
}

interface DocumentStore {
  documents: DocumentItem[];
  categories: DocumentCategory[];
  requests: DocumentRequest[];
  addDocument: (doc: DocumentItem) => void;
  updateDocument: (id: string, updates: Partial<DocumentItem>) => void;
  deleteDocument: (id: string, deletedBy?: string) => void;
  shareDocument: (id: string, share: { sharedWith: string; sharedWithEmail: string; shareAccess: ShareAccess; expiryDate?: string }) => void;
  revokeShare: (id: string) => void;
  addCategory: (cat: DocumentCategory) => void;
  updateCategory: (id: string, updates: Partial<DocumentCategory>) => void;
  deleteCategory: (id: string) => void;
  restoreDocument: (id: string) => void;
  permanentlyDeleteDocument: (id: string) => void;
  emptyRecycleBin: () => void;
  addRequest: (req: DocumentRequest) => void;
  updateRequest: (id: string, updates: Partial<DocumentRequest>) => void;
  deleteRequest: (id: string) => void;
  reset: () => void;
}

const DUMMY_CATEGORIES: DocumentCategory[] = [
  { id: "c1", name: "Contracts", description: "All contract related documents and agreements", documentCount: 312, status: "active", createdOn: "2024-05-31T10:30:00Z", createdBy: "Admin User" },
  { id: "c2", name: "Invoices", description: "Customer and vendor invoices", documentCount: 568, status: "active", createdOn: "2024-05-28T14:15:00Z", createdBy: "Admin User" },
  { id: "c3", name: "Insurance", description: "Insurance policies and certificates", documentCount: 145, status: "active", createdOn: "2024-05-25T11:20:00Z", createdBy: "John Dela Cruz" },
  { id: "c4", name: "Permits & Licenses", description: "Permits, licenses and regulatory documents", documentCount: 98, status: "active", createdOn: "2024-05-22T09:45:00Z", createdBy: "Maria Santos" },
  { id: "c5", name: "Proof of Delivery", description: "Delivery proofs and POD documents", documentCount: 612, status: "active", createdOn: "2024-05-20T15:30:00Z", createdBy: "Kevin Tan" },
  { id: "c6", name: "Maintenance", description: "Vehicle maintenance records", documentCount: 210, status: "active", createdOn: "2024-05-18T08:10:00Z", createdBy: "Driver Juan" },
  { id: "c7", name: "HR Documents", description: "Employee related documents", documentCount: 87, status: "inactive", createdOn: "2024-05-15T13:05:00Z", createdBy: "HR Admin" },
  { id: "c8", name: "Safety & Compliance", description: "Safety inspections and compliance documents", documentCount: 134, status: "active", createdOn: "2024-05-12T16:50:00Z", createdBy: "Kevin Tan" },
  { id: "c9", name: "Financial Records", description: "Financial statements and records", documentCount: 162, status: "active", createdOn: "2024-05-10T10:25:00Z", createdBy: "Admin User" },
  { id: "c10", name: "Others", description: "Other miscellaneous documents", documentCount: 228, status: "active", createdOn: "2024-05-08T09:15:00Z", createdBy: "Admin User" },
];

const DUMMY_DOCUMENTS: DocumentItem[] = [
  // Shared
  { id: "d1", name: "Rate Agreement - ABC Construction.pdf", type: "PDF", category: "Contracts", sizeMB: 1.24, ownerId: "client1", relatedToType: "Customer", tags: ["Contract", "Customer"], description: "Rate agreement for dedicated logistics services with ABC Construction Inc.", accessLevel: "private", status: "active", sharedBy: "You", sharedWith: "ABC Construction Inc.", sharedWithEmail: "abccorp@example.com", shareAccess: "view", sharedOn: "2024-05-31T10:30:00Z", expiryDate: "2024-06-14T23:59:00Z", shareStatus: "active", version: "1.0", folder: "Contracts / 2024" },
  { id: "d2", name: "Insurance Certificate - Truck 105.docx", type: "DOCX", category: "Insurance", sizeMB: 0.5, ownerId: "client1", relatedToType: "Customer", tags: ["Insurance"], description: "Insurance cert", accessLevel: "public", status: "active", sharedBy: "ABC Construction Inc.", sharedWith: "You", shareAccess: "view", sharedOn: "2024-05-30T16:15:00Z", expiryDate: "2024-06-13T23:59:00Z", shareStatus: "active", version: "1.0" },
  { id: "d3", name: "Fuel Reconciliation - May 2024.xlsx", type: "XLSX", category: "Finance", sizeMB: 2.1, ownerId: "admin", relatedToType: "Internal", tags: ["Finance"], description: "Fuel report", accessLevel: "internal", status: "active", sharedBy: "You", sharedWith: "Admin User", shareAccess: "edit", sharedOn: "2024-05-29T14:20:00Z", expiryDate: "2024-06-12T23:59:00Z", shareStatus: "active", version: "1.0" },
  { id: "d4", name: "Maintenance Report - May 2024.pdf", type: "PDF", category: "Maintenance", sizeMB: 3.4, ownerId: "fleet", relatedToType: "Vendor", tags: ["Maintenance"], description: "Maintenance report", accessLevel: "internal", status: "active", sharedBy: "Fleet Partners Ltd.", sharedWith: "You", shareAccess: "view", sharedOn: "2024-05-28T11:05:00Z", expiryDate: "2024-06-10T23:59:00Z", shareStatus: "active", version: "1.0" },
  { id: "d5", name: "Delivery Proof - TRP-000124.jpg", type: "JPG", category: "Proof of Delivery", sizeMB: 1.1, ownerId: "driver", relatedToType: "Trip", tags: ["POD"], description: "POD for trip 124", accessLevel: "public", status: "active", sharedBy: "You", sharedWith: "Customer", shareAccess: "view", sharedOn: "2024-05-27T08:45:00Z", expiryDate: "2024-06-09T23:59:00Z", shareStatus: "expired", version: "1.0" },
  { id: "d6", name: "Trip Documents - May 2024.zip", type: "ZIP", category: "Trip Documents", sizeMB: 15.2, ownerId: "driver", relatedToType: "Trip", tags: ["Trip"], description: "Trip docs", accessLevel: "internal", status: "active", sharedBy: "You", sharedWith: "Dispatcher", shareAccess: "edit", sharedOn: "2024-05-25T15:30:00Z", expiryDate: "2024-06-07T23:59:00Z", shareStatus: "active", version: "1.0" },
  { id: "d7", name: "Vendor Agreement - Fuel Corp.docx", type: "DOCX", category: "Contracts", sizeMB: 0.8, ownerId: "admin", relatedToType: "Vendor", tags: ["Contract"], description: "Vendor agreement", accessLevel: "internal", status: "active", sharedBy: "Fuel Corp.", sharedWith: "You", shareAccess: "view", sharedOn: "2024-05-24T13:10:00Z", expiryDate: "2024-06-06T23:59:00Z", shareStatus: "active", version: "1.0" },
  
  // Deleted (Recycle Bin)
  { id: "d8", name: "Rate Agreement - ABC Construction.pdf", type: "PDF", category: "Contracts", sizeMB: 1.24, ownerId: "client1", relatedToType: "Customer", tags: ["Contract", "Customer"], description: "Rate agreement for dedicated logistics services with ABC Construction Inc.", accessLevel: "private", status: "deleted", deletedBy: "Admin User", deletedOn: "2024-05-31T10:30:00Z", originalLocation: "/Contracts/2024/Rate Agreement/", daysLeft: 25, version: "1.0" },
  { id: "d9", name: "Insurance Certificate - Truck 105.docx", type: "DOCX", category: "Insurance", sizeMB: 0.5, ownerId: "client1", relatedToType: "Customer", tags: ["Insurance"], description: "Insurance cert", accessLevel: "public", status: "deleted", deletedBy: "John Dela Cruz", deletedOn: "2024-05-30T16:15:00Z", originalLocation: "/Insurance/2024/", daysLeft: 24, version: "1.0" },
  { id: "d10", name: "Fuel Reconciliation - May 2024.xlsx", type: "XLSX", category: "Finance", sizeMB: 2.1, ownerId: "admin", relatedToType: "Internal", tags: ["Finance"], description: "Fuel report", accessLevel: "internal", status: "deleted", deletedBy: "Maria Santos", deletedOn: "2024-05-29T11:20:00Z", originalLocation: "/Finance/2024/", daysLeft: 23, version: "1.0" },
  { id: "d11", name: "Maintenance Report - May 2024.pdf", type: "PDF", category: "Maintenance", sizeMB: 3.4, ownerId: "fleet", relatedToType: "Vendor", tags: ["Maintenance"], description: "Maintenance report", accessLevel: "internal", status: "deleted", deletedBy: "Kevin Tan", deletedOn: "2024-05-28T09:45:00Z", originalLocation: "/Maintenance/2024/", daysLeft: 22, version: "1.0" },
  { id: "d12", name: "Delivery Proof - TRP-000124.jpg", type: "JPG", category: "Proof of Delivery", sizeMB: 1.1, ownerId: "driver", relatedToType: "Trip", tags: ["POD"], description: "POD for trip 124", accessLevel: "public", status: "deleted", deletedBy: "Driver Juan", deletedOn: "2024-05-27T08:30:00Z", originalLocation: "/POD/2024/", daysLeft: 21, version: "1.0" },
  { id: "d13", name: "Trip Documents - May 2024.zip", type: "ZIP", category: "Trip Documents", sizeMB: 15.2, ownerId: "driver", relatedToType: "Trip", tags: ["Trip"], description: "Trip docs", accessLevel: "internal", status: "deleted", deletedBy: "John Dela Cruz", deletedOn: "2024-05-25T14:40:00Z", originalLocation: "/Trips/2024/", daysLeft: 19, version: "1.0" },
  { id: "d14", name: "Vendor Agreement - Fuel Corp.docx", type: "DOCX", category: "Contracts", sizeMB: 0.8, ownerId: "admin", relatedToType: "Vendor", tags: ["Contract"], description: "Vendor agreement", accessLevel: "internal", status: "deleted", deletedBy: "Admin User", deletedOn: "2024-05-24T13:10:00Z", originalLocation: "/Contracts/2024/", daysLeft: 18, version: "1.0" },
  { id: "d15", name: "Safety Inspection - Truck 105.pdf", type: "PDF", category: "Compliance", sizeMB: 2.5, ownerId: "fleet", relatedToType: "Asset", tags: ["Safety"], description: "Safety inspection", accessLevel: "internal", status: "deleted", deletedBy: "Kevin Tan", deletedOn: "2024-05-23T09:15:00Z", originalLocation: "/Compliance/2024/", daysLeft: 17, version: "1.0" },
];

const DUMMY_REQUESTS: DocumentRequest[] = [
  { id: "r1", title: "Driver License Renewal", requestedFrom: "Driver Juan", requestedFromEmail: "driver.juan@nexlogistics.demo", notes: "Please provide updated license scanned copy.", dueDate: "2024-06-15", status: "pending", createdAt: "2024-05-31T10:30:00Z", priority: "high" },
  { id: "r2", title: "Updated Vendor Agreement", requestedFrom: "Fuel Corp.", requestedFromEmail: "contracts@fuelcorp.example", notes: "2024 revised vendor agreement with updated rates.", dueDate: "2024-06-01", status: "completed", createdAt: "2024-05-28T14:15:00Z", priority: "medium" },
  { id: "r3", title: "Insurance Policy 2024", requestedFrom: "ABC Construction Inc.", requestedFromEmail: "abccorp@example.com", notes: "Annual insurance policy renewal document.", dueDate: "2024-06-10", status: "pending", createdAt: "2024-05-25T11:20:00Z", priority: "high" },
  { id: "r4", title: "Vehicle Registration - TRK-001", requestedFrom: "Kevin Tan", requestedFromEmail: "kevin.tan@nexlogistics.demo", notes: "Annual vehicle registration renewal for fleet truck #001.", dueDate: "2024-06-20", status: "overdue", createdAt: "2024-05-20T09:00:00Z", priority: "medium" },
  { id: "r5", title: "Signed Delivery Receipt - TRP-000201", requestedFrom: "XYZ Corp", requestedFromEmail: "xyzops@example.com", notes: "Original signed POD for trip TRP-000201.", dueDate: "2024-06-05", status: "cancelled", createdAt: "2024-05-18T15:45:00Z", priority: "low" },
];

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set) => ({
      documents: DUMMY_DOCUMENTS,
      categories: DUMMY_CATEGORIES,
      requests: DUMMY_REQUESTS,
      addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      deleteDocument: (id, deletedBy = "Admin User") => set((state) => ({
        documents: state.documents.map(d =>
          d.id === id
            ? { ...d, status: "deleted", deletedBy, deletedOn: new Date().toISOString(), daysLeft: 30 }
            : d
        )
      })),
      shareDocument: (id, share) => set((state) => ({
        documents: state.documents.map(d =>
          d.id === id
            ? { ...d, sharedBy: "You", sharedWith: share.sharedWith, sharedWithEmail: share.sharedWithEmail, shareAccess: share.shareAccess, expiryDate: share.expiryDate, sharedOn: new Date().toISOString(), shareStatus: "active" }
            : d
        )
      })),
      revokeShare: (id) => set((state) => ({
        documents: state.documents.map(d =>
          d.id === id ? { ...d, shareStatus: "expired" } : d
        )
      })),
      addCategory: (cat) => set((state) => ({ categories: [cat, ...state.categories] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
      })),
      restoreDocument: (id) => set((state) => ({
        documents: state.documents.map(d => d.id === id ? { ...d, status: "active", deletedBy: undefined, deletedOn: undefined, daysLeft: undefined } : d)
      })),
      permanentlyDeleteDocument: (id) => set((state) => ({
        documents: state.documents.filter(d => d.id !== id)
      })),
      emptyRecycleBin: () => set((state) => ({
        documents: state.documents.filter(d => d.status !== "deleted")
      })),
      addRequest: (req) => set((state) => ({ requests: [req, ...state.requests] })),
      updateRequest: (id, updates) => set((state) => ({
        requests: state.requests.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      deleteRequest: (id) => set((state) => ({
        requests: state.requests.filter(r => r.id !== id)
      })),
      reset: () => set({ documents: DUMMY_DOCUMENTS, categories: DUMMY_CATEGORIES, requests: DUMMY_REQUESTS }),
    }),
    { name: "nex-documents" }
  )
);
