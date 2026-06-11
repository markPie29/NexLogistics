"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import type { VehicleProfitability } from "@/lib/profit-center/types";

interface TopBottomPerformersProps {
  data: VehicleProfitability[];
  onVehicleClick: (vehicleId: string) => void;
}

export function TopBottomPerformers({ data, onVehicleClick }: TopBottomPerformersProps) {
  const sorted = [...data].sort((a, b) => b.netProfit - a.netProfit);
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse();

  const hasData = data.some((v) => v.tripCount > 0);

  if (!hasData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No vehicle data for this period
          </CardContent>
        </Card>
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" /> Bottom Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No vehicle data for this period
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Performers */}
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {top5.map((v, i) => (
            <div
              key={v.vehicleId}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
              onClick={() => onVehicleClick(v.vehicleId)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onVehicleClick(v.vehicleId); }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-brand-navy dark:text-white">
                  {v.plate}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-600">
                  +{formatCurrency(v.netProfit)}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {v.margin !== null ? `${v.margin.toFixed(1)}% margin` : "N/A"}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom Performers */}
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
          <CardTitle className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" /> Bottom Performers
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-2">
          {bottom5.map((v, i) => (
            <div
              key={v.vehicleId}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
              onClick={() => onVehicleClick(v.vehicleId)}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter") onVehicleClick(v.vehicleId); }}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-red-50 text-red-700 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm font-bold text-brand-navy dark:text-white">
                  {v.plate}
                </span>
              </div>
              <div className="text-right">
                <div className={cn("text-sm font-bold", v.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {v.netProfit >= 0 ? "+" : "−"}{formatCurrency(Math.abs(v.netProfit))}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {v.margin !== null ? `${v.margin.toFixed(1)}% margin` : "N/A"}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
