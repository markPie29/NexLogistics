"use client";

import { useMemo } from "react";
import { Fuel, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { VehicleProfitability } from "@/lib/profit-center/types";
import type { Trip } from "@/lib/types";

interface VehicleDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleProfitability | null;
  trips: Trip[];
}

export function VehicleDetailDrawer({
  open,
  onOpenChange,
  vehicle,
  trips,
}: VehicleDetailDrawerProps) {
  const recentTrips = useMemo(() => {
    if (!vehicle) return [];
    return trips
      .filter(
        (t) =>
          t.vehicleId === vehicle.vehicleId &&
          (t.status === "delivered" || t.status === "completed")
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
  }, [vehicle, trips]);

  if (!vehicle) return null;

  const expenseBreakdown = [
    { label: "Fuel", amount: vehicle.fuelCost },
    { label: "Maintenance", amount: vehicle.maintenanceCost },
    { label: "Driver Pay", amount: vehicle.driverPay },
    { label: "Helper Fees", amount: vehicle.helperFees },
    { label: "Tolls & Other", amount: vehicle.otherCosts },
  ];

  const totalExpenseForPct = vehicle.totalExpenses || 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-extrabold">
            {vehicle.plate}
          </SheetTitle>
          <SheetDescription>
            {vehicle.brand} {vehicle.model} • {vehicle.type}
          </SheetDescription>
        </SheetHeader>

        {/* Profit Summary */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3 text-center">
            <div className="text-xs text-muted-foreground">Revenue</div>
            <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {formatCurrency(vehicle.revenue)}
            </div>
          </div>
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-center">
            <div className="text-xs text-muted-foreground">Expenses</div>
            <div className="text-sm font-bold text-red-600 dark:text-red-400 mt-1">
              {formatCurrency(vehicle.totalExpenses)}
            </div>
          </div>
          <div
            className={cn(
              "rounded-xl p-3 text-center",
              vehicle.netProfit >= 0
                ? "bg-emerald-50 dark:bg-emerald-900/20"
                : "bg-red-50 dark:bg-red-900/20"
            )}
          >
            <div className="text-xs text-muted-foreground">Net P/L</div>
            <div
              className={cn(
                "text-sm font-bold mt-1",
                vehicle.netProfit >= 0
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {vehicle.netProfit >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(vehicle.netProfit))}
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-brand-navy dark:text-white mb-3">
            Expense Breakdown
          </h3>
          <div className="space-y-2">
            {expenseBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                  <Badge variant="neutral" className="text-[10px]">
                    {vehicle.totalExpenses > 0
                      ? ((item.amount / totalExpenseForPct) * 100).toFixed(1)
                      : "0"}
                    %
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fuel Efficiency */}
        <div className="mt-6 p-4 rounded-xl border border-brand-border bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-brand-navy dark:text-white">
              Fuel Efficiency
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Cost / km</span>
              <div className="font-bold mt-0.5">
                {vehicle.costPerKm !== null
                  ? `${formatCurrency(vehicle.costPerKm)}/km`
                  : "N/A"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Liters / trip</span>
              <div className="font-bold mt-0.5">
                {vehicle.litersPerTrip !== null
                  ? `${vehicle.litersPerTrip.toFixed(1)} L`
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Trips */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-brand-navy dark:text-white mb-3">
            Recent Trips ({recentTrips.length})
          </h3>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trips in this period.</p>
          ) : (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3 rounded-lg border border-gray-100 dark:border-white/10"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-brand-navy dark:text-white">
                      {trip.id}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trip.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                    <span className="truncate">
                      {trip.pickup?.address} → {trip.dropoff?.address}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="font-semibold text-emerald-600">
                      Fare: {formatCurrency(trip.fare)}
                    </span>
                    <span className="text-muted-foreground">
                      Costs: {formatCurrency(
                        (trip.driverRate ?? 0) +
                        (trip.helperFee ?? 0) +
                        (trip.otherFees?.reduce((s, f) => s + f.amount, 0) ?? 0)
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
