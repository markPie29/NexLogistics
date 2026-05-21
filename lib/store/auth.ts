import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "@/lib/types";
import { BRAND } from "@/lib/config/brand";
import { seedUsers, demoCompany } from "@/lib/data/users";

interface AuthState {
  user: User | null;
  loginAsRole: (role: Role) => User | null;
  loginWithEmail: (email: string, password: string) => User | null;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (...roles: Role[]) => boolean;
  company: { id: string; name: string; code: string };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: demoCompany,
      loginAsRole: (role) => {
        const u = seedUsers.find((x) => x.role === role) || null;
        set({ user: u });
        return u;
      },
      loginWithEmail: (email, password) => {
        const u =
          seedUsers.find((x) => x.email.toLowerCase() === email.toLowerCase() && x._demoPassword === password) || null;
        if (u) set({ user: u });
        return u;
      },
      logout: () => set({ user: null }),
      isAuthenticated: () => !!get().user,
      hasRole: (...roles) => !!get().user && roles.includes(get().user!.role),
    }),
    { name: `${BRAND.storeKey}-auth` }
  )
);
