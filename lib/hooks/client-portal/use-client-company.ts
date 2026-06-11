import { useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useClientStore } from "@/lib/store";

/**
 * Returns the Client record matching the authenticated user's clientId,
 * or null if no match is found (e.g., user is not a client role or client
 * record doesn't exist in the store).
 */
export function useClientCompany() {
  const user = useAuthStore((s) => s.user);
  const clients = useClientStore((s) => s.clients);

  const company = useMemo(
    () => clients.find((c) => c.id === user?.clientId) ?? null,
    [clients, user?.clientId]
  );

  return company;
}
