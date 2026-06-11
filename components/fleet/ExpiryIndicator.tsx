"use client";
import { Badge } from "@/components/ui/badge";
import { getExpiryStatus } from "@/lib/utils/vehicle-documents";

interface ExpiryIndicatorProps {
  expiryDate: string;
}

const STATUS_CONFIG = {
  expired: { label: "Expired", variant: "danger" as const },
  expiring_soon: { label: "Expiring Soon", variant: "warning" as const },
  valid: { label: "Valid", variant: "success" as const },
};

export function ExpiryIndicator({ expiryDate }: ExpiryIndicatorProps) {
  const status = getExpiryStatus(expiryDate);
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} aria-label={`Status: ${config.label}`}>
      {config.label}
    </Badge>
  );
}
