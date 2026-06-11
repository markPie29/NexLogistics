"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useBillingPaymentStore } from "@/lib/store";

export function useClientPayments() {
  const user = useAuthStore((s) => s.user);
  const payments = useBillingPaymentStore((s) => s.payments);

  const clientPayments = useMemo(
    () => payments.filter((p) => p.clientId === user?.clientId),
    [payments, user?.clientId]
  );

  return { payments: clientPayments };
}
