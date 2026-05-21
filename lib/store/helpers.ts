import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND } from "@/lib/config/brand";
import type { Helper } from "@/lib/types";
import { seedHelpers } from "@/lib/data/helpers";

interface HelperState {
  helpers: Helper[];
  addHelper: (h: Omit<Helper, "id" | "createdAt">) => Helper;
  updateHelper: (id: string, patch: Partial<Helper>) => void;
  deleteHelper: (id: string) => void;
  reset: () => void;
}

export const useHelperStore = create<HelperState>()(
  persist(
    (set) => ({
      helpers: seedHelpers,
      addHelper: (h) => {
        const nh: Helper = {
          ...h,
          id: `h-${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ helpers: [nh, ...s.helpers] }));
        return nh;
      },
      updateHelper: (id, patch) =>
        set((s) => ({
          helpers: s.helpers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      deleteHelper: (id) =>
        set((s) => ({ helpers: s.helpers.filter((x) => x.id !== id) })),
      reset: () => set({ helpers: seedHelpers }),
    }),
    { name: `${BRAND.storeKey}-helpers` }
  )
);
