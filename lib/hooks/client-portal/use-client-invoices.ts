import { useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useInvoiceStore } from "@/lib/store";

export function useClientInvoices() {
  const user = useAuthStore((s) => s.user);
  const invoices = useInvoiceStore((s) => s.invoices);

  const clientInvoices = useMemo(
    () => invoices.filter((i) => i.clientId === user?.clientId),
    [invoices, user?.clientId]
  );

  return { invoices: clientInvoices };
}
