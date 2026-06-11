"use client";

import { useMemo } from "react";
import { Package, Truck, CheckCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useClientKpis,
  useClientTrips,
  useClientCompany,
} from "@/lib/hooks/client-portal";
import {
  STATUS_BADGE_VARIANT,
  TRIP_STATUS_LABELS,
} from "@/lib/utils/client-portal";
import { formatCurrency } from "@/lib/utils";

export default function ClientPortalOverviewPage() {
  const kpis = useClientKpis();
  const { trips } = useClientTrips();
  const company = useClientCompany();

  const recentTrips = useMemo(
    () =>
      [...trips]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    [trips]
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Shipments"
          value={kpis.totalShipments.toString()}
          icon={<Package className="h-5 w-5 text-brand-teal" />}
        />
        <KpiCard
          label="In Transit"
          value={kpis.inTransit.toString()}
          icon={<Truck className="h-5 w-5 text-brand-teal" />}
        />
        <KpiCard
          label="Delivered"
          value={kpis.delivered.toString()}
          icon={<CheckCircle className="h-5 w-5 text-brand-teal" />}
        />
        <KpiCard
          label="Outstanding Balance"
          value={formatCurrency(kpis.outstandingBalance)}
          icon={<DollarSign className="h-5 w-5 text-brand-teal" />}
        />
      </div>

      {/* Recent Shipments Table */}
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold text-brand-navy mb-4">
            Recent Shipments
          </h2>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No shipments found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="px-4 py-3 text-xs">Trip ID</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-xs">Route</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-xs">Status</TableHead>
                  <TableHead scope="col" className="px-4 py-3 text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrips.map((trip) => (
                  <TableRow key={trip.id} className="h-12 hover:bg-brand-teal-light">
                    <TableCell className="px-4 py-3 text-sm font-medium text-brand-navy">
                      {trip.id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {trip.pickup.address.split(",")[0]} →{" "}
                      {trip.dropoff.address.split(",")[0]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      <Badge
                        className={
                          STATUS_BADGE_VARIANT[trip.status] ??
                          "bg-gray-100 text-gray-700"
                        }
                      >
                        {TRIP_STATUS_LABELS[
                          trip.status as keyof typeof TRIP_STATUS_LABELS
                        ] ?? trip.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {trip.createdAt
                        ? new Date(trip.createdAt).toLocaleDateString("en-PH", {
                            timeZone: "Asia/Manila",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
          {icon}
        </div>
        <div className="mt-2 text-2xl font-bold text-brand-navy">{value}</div>
      </CardContent>
    </Card>
  );
}
