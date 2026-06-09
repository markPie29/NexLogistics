"use client";

import { useAuthStore } from "@/lib/store/auth";
import { usePartnerStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Banknote,
  Truck,
  User,
} from "lucide-react";

function maskAccountNumber(str: string): string {
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
}

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "success";
    case "suspended":
      return "warning";
    default:
      return "neutral";
  }
}

export default function PartnerProfilePage() {
  const user = useAuthStore((s) => s.user);
  const partners = usePartnerStore((s) => s.partners);
  const partner = partners.find((p) => p.id === user?.partnerId);

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-500">
        Partner profile not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-900">{partner.name}</h2>
        <Badge variant={getStatusVariant(partner.status) as "success" | "warning" | "neutral"}>
          {partner.status}
        </Badge>
      </div>

      {/* Company Information */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            Company Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              icon={<Building2 className="w-4 h-4 text-gray-400" />}
              label="Company Name"
              value={partner.name}
            />
            <Field
              icon={<User className="w-4 h-4 text-gray-400" />}
              label="Contact Person"
              value={partner.contactPerson}
            />
            <Field
              icon={<Phone className="w-4 h-4 text-gray-400" />}
              label="Phone"
              value={partner.phone}
            />
            <Field
              icon={<Mail className="w-4 h-4 text-gray-400" />}
              label="Email"
              value={partner.email}
            />
            <Field
              icon={<MapPin className="w-4 h-4 text-gray-400" />}
              label="Address"
              value={partner.address}
            />
            <Field
              icon={<CreditCard className="w-4 h-4 text-gray-400" />}
              label="TIN"
              value={partner.tin || "—"}
            />
            <Field
              icon={<Truck className="w-4 h-4 text-gray-400" />}
              label="Vehicle Types"
              value={partner.vehicleTypes.join(", ")}
              className="md:col-span-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Banking Details */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-500" />
            Banking Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              icon={<Building2 className="w-4 h-4 text-gray-400" />}
              label="Bank Name"
              value={partner.bankName || "—"}
            />
            <Field
              icon={<CreditCard className="w-4 h-4 text-gray-400" />}
              label="Account Number"
              value={partner.bankAccountNo ? maskAccountNumber(partner.bankAccountNo) : "—"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rate Configuration */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Banknote className="w-4 h-4 text-gray-500" />
            Rate Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              icon={<Banknote className="w-4 h-4 text-gray-400" />}
              label="Default Rate"
              value={partner.defaultRate ? formatCurrency(partner.defaultRate) : "—"}
            />
            <Field
              icon={<Banknote className="w-4 h-4 text-gray-400" />}
              label="Rate per KM"
              value={partner.ratePerKm ? formatCurrency(partner.ratePerKm) : "—"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className ?? ""}`}>
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[11px] font-medium text-gray-500">{label}</div>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}
