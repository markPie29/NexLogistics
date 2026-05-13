"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Partner } from "@/lib/types";
import { seedPartners } from "@/lib/data/partners";

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
