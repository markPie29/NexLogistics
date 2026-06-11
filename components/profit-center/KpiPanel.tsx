"use client";

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { FleetKPIs } from "@/lib/profit-center/types";
import { cn } from "@/lib/utils";

interface KpiPanelProps {
  kpis: FleetKPIs;
}

export function KpiPanel({ kpis }: KpiPanelProps) {
  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(kpis.totalRevenue),
      delta: kpis.revenueDelta,
      icon: DollarSign,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(kpis.totalExpenses),
      delta: kpis.expenseDelta,
      icon: DollarSign,
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
    },
    {
      label: "Net Profit",
      value: formatCurrency(kpis.netProfit),
      delta: kpis.profitDelta,
      icon: kpis.netProfit >= 0 ? TrendingUp : TrendingDown,
      iconColor: kpis.netProfit >= 0 ? "text-emerald-600" : "text-red-500",
      iconBg: kpis.netProfit >= 0 ? "bg-emerald-50" : "bg-red-50",
      valueColor: kpis.netProfit >= 0 ? "text-emerald-600" : "text-red-500",
    },
    {
      label: "Profit Margin",
      value: kpis.profitMargin !== null ? `${kpis.profitMargin.toFixed(1)}%` : "N/A",
      delta: kpis.marginDelta,
      icon: TrendingUp,
      iconColor: "text-brand-teal",
      iconBg: "bg-brand-teal-light",
    },
    {
      label: "Active Vehicles",
      value: String(kpis.activeVehicleCount),
      delta: null,
      icon: Truck,
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
      {cards.map((card) => (
        <Card
          key={card.label}
          className="p-4 xl:p-5 border-brand-border shadow-sm hover:shadow-md transition-shadow"
          aria-label={`${card.label}: ${card.value}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                card.iconBg
              )}
            >
              <card.icon className={cn("w-4 h-4", card.iconColor)} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <span
                className={cn(
                  "text-lg xl:text-xl font-extrabold tracking-tight mt-0.5 truncate",
                  card.valueColor ?? "text-brand-navy dark:text-white"
                )}
                title={card.value}
              >
                {card.value}
              </span>
            </div>
          </div>
          {card.delta !== null && card.delta !== undefined && (
            <div className="mt-3 flex items-center gap-1">
              {card.delta >= 0 ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-red-500" />
              )}
              <span
                className={cn(
                  "text-xs font-semibold",
                  card.delta >= 0 ? "text-emerald-500" : "text-red-500"
                )}
              >
                {Math.abs(card.delta).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">vs prev</span>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
