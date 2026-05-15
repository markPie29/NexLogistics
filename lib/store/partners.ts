"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Partner, PartnerRequest, PartnerRequestStatus } from "@/lib/types";
import { seedPartners, seedPartnerRequests } from "@/lib/data/partners";

interface PartnerState {
  partners: Partner[];
  addPartner: (p: Omit<Partner, "id" | "createdAt">) => Partner;
  updatePartner: (id: string, patch: Partial<Partner>) => void;
  deletePartner: (id: string) => void;
  reset: () => void;
}

export const usePartnerStore = create<PartnerState>()(
  persist(
    (set) => ({
      partners: seedPartners,
      addPartner: (p) => {
        const np: Partner = {
          ...p,
          id: `ptn-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ partners: [np, ...s.partners] }));
        return np;
      },
      updatePartner: (id, patch) =>
        set((s) => ({
          partners: s.partners.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deletePartner: (id) =>
        set((s) => ({ partners: s.partners.filter((x) => x.id !== id) })),
      reset: () => set({ partners: seedPartners }),
    }),
    { name: "nex-partners" }
  )
);

interface PartnerRequestState {
  requests: PartnerRequest[];
  addRequest: (r: Omit<PartnerRequest, "id" | "requestedAt" | "status" | "reviewedBy" | "reviewedAt" | "releaseReference">) => PartnerRequest;
  updateRequest: (id: string, patch: Partial<PartnerRequest>) => void;
  setRequestStatus: (id: string, status: PartnerRequestStatus, by?: string, releaseReference?: string) => void;
  deleteRequest: (id: string) => void;
  reset: () => void;
}

export const usePartnerRequestStore = create<PartnerRequestState>()(
  persist(
    (set) => ({
      requests: seedPartnerRequests,
      addRequest: (r) => {
        const nr: PartnerRequest = {
          ...r,
          id: `prq-${Date.now().toString(36)}`,
          requestedAt: new Date().toISOString(),
          status: "pending",
        };
        set((s) => ({ requests: [nr, ...s.requests] }));
        return nr;
      },
      updateRequest: (id, patch) =>
        set((s) => ({ requests: s.requests.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      setRequestStatus: (id, status, by, releaseReference) =>
        set((s) => ({
          requests: s.requests.map((x) => {
            if (x.id !== id) return x;
            return {
              ...x,
              status,
              reviewedBy: by ?? x.reviewedBy,
              reviewedAt: by ? new Date().toISOString() : x.reviewedAt,
              releaseReference: releaseReference ?? x.releaseReference,
            };
          }),
        })),
      deleteRequest: (id) => set((s) => ({ requests: s.requests.filter((x) => x.id !== id) })),
      reset: () => set({ requests: seedPartnerRequests }),
    }),
    { name: "nex-partner-requests" }
  )
);
