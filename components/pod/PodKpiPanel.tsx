"use client";

/**
 * POD KPI Panel
 *
 * Renders 3 KPI cards: Awaiting POD, Captured Today, Completion Rate.
 * Responsive: 3-column grid on md+, horizontally scrollable row with scroll-snap on mobile.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9
 */

import { Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCount } from "@/lib/utils/pod-helpers";

interface PodKpiPanelProps {
  awaitingCount: number;
  capturedTodayCount: number;
  completionRate: number | null; // null = "N/A" (no delivered/completed trips)
}

interface KpiItem {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  darkIconBg: string;
}

export function PodKpiPanel({
  awaitingCount,
  capturedTodayCount,
  completionRate,
}: PodKpiPanelProps) {
  const items: KpiItem[] = [
    {
      label: "Awaiting POD",
      value: formatCount(awaitingCount),
      icon: Clock,
      iconColor: "text-[#F59E0B]",
      iconBg: "bg-amber-50",
      darkIconBg: "dark:bg-amber-500/10",
    },
    {
      label: "Captured Today",
      value: formatCount(capturedTodayCount),
      icon: CheckCircle2,
      iconColor: "text-[#10B981]",
      iconBg: "bg-emerald-50",
      darkIconBg: "dark:bg-emerald-500/10",
    },
    {
      label: "Completion Rate",
      value: completionRate === null ? "N/A" : `${Math.round(completionRate)}%`,
      icon: TrendingUp,
      iconColor: "text-[#66B2B2]",
      iconBg: "bg-teal-50",
      darkIconBg: "dark:bg-teal-500/10",
    },
  ];

  return (
    <>
      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4">
        {items.map((item) => (
          <KpiCardItem key={item.label} item={item} />
        ))}
      </div>

      {/* Mobile: horizontally scrollable row with scroll-snap */}
      <div
        className={cn(
          "flex md:hidden gap-3 overflow-x-auto snap-x snap-mandatory",
          "scrollbar-none -mx-1 px-1 pb-1"
        )}
      >
        {items.map((item) => (
          <div key={item.label} className="snap-start shrink-0 w-[75vw] max-w-[260px]">
            <KpiCardItem item={item} />
          </div>
        ))}
      </div>
    </>
  );
}

function KpiCardItem({ item }: { item: KpiItem }) {
  const Icon = item.icon;

  return (
    <Card
      className={cn(
        "rounded-lg shadow-card border-brand-border",
        "dark:bg-brand-navy-light dark:border-gray-700"
      )}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
            item.iconBg,
            item.darkIconBg
          )}
        >
          <Icon className={cn("w-5 h-5", item.iconColor)} />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold text-muted-foreground leading-snug">
            {item.label}
          </span>
          <span className="text-2xl font-black text-brand-navy dark:text-white leading-none tracking-tight mt-0.5">
            {item.value}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
