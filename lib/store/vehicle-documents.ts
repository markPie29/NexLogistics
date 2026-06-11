import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type { VehicleDocument, VehiclePermit } from "@/lib/types";
import { seedVehicleDocuments, seedVehiclePermits } from "@/lib/data/vehicle-documents";

// ─── Store Interface ────────────────────────────────────────

interface VehicleDocumentState {
  documents: VehicleDocument[];
  permits: VehiclePermit[];

  addDocument: (doc: Omit<VehicleDocument, "id" | "createdAt" | "updatedAt">) => VehicleDocument;
  updateDocument: (id: string, patch: Partial<Omit<VehicleDocument, "id" | "createdAt">>) => void;
  deleteDocument: (id: string) => void;

  addPermit: (permit: Omit<VehiclePermit, "id" | "createdAt" | "updatedAt">) => VehiclePermit;
  updatePermit: (id: string, patch: Partial<Omit<VehiclePermit, "id" | "createdAt">>) => void;
  deletePermit: (id: string) => void;

  reset: () => void;
}

// ─── Store ──────────────────────────────────────────────────

export const useVehicleDocumentStore = create<VehicleDocumentState>()(
  persist(
    (set) => ({
      documents: seedVehicleDocuments,
      permits: seedVehiclePermits,

      addDocument: (doc) => {
        const now = new Date().toISOString();
        const newDoc: VehicleDocument = {
          ...doc,
          id: `vd-${Date.now().toString(36)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ documents: [newDoc, ...s.documents] }));
        return newDoc;
      },

      updateDocument: (id, patch) => {
        const now = new Date().toISOString();
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: now } : d
          ),
        }));
      },

      deleteDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      addPermit: (permit) => {
        const now = new Date().toISOString();
        const newPermit: VehiclePermit = {
          ...permit,
          id: `vp-${Date.now().toString(36)}`,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ permits: [newPermit, ...s.permits] }));
        return newPermit;
      },

      updatePermit: (id, patch) => {
        const now = new Date().toISOString();
        set((s) => ({
          permits: s.permits.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now } : p
          ),
        }));
      },

      deletePermit: (id) =>
        set((s) => ({ permits: s.permits.filter((p) => p.id !== id) })),

      reset: () =>
        set({ documents: seedVehicleDocuments, permits: seedVehiclePermits }),
    }),
    { name: `${BRAND.storeKey}-vehicle-documents` }
  )
);
