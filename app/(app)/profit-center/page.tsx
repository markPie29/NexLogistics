"use client";

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  useFleetStore,
  useTripStore,
  useExpenseStore,
  useMaintenanceStore,
} from "@/lib/store";
import type { PeriodPreset, DateRange } from "@/lib/profit-center/types";
import {
  resolveDateRange,
  getPreviousPeriod,
  computeVehicleProfitability,
  computeFleetKPIs,
  computeChartData,
  computeCostDistribution,
} from "@/lib/profit-center/computations";
import { PeriodFilter } from "@/components/profit-center/PeriodFilter";
import { KpiPanel } from "@/components/profit-center/KpiPanel";
import { ProfitTable } from "@/components/profit-center/ProfitTable";
import { VehicleDetailDrawer } from "@/components/profit-center/VehicleDetailDrawer";
import { RevenueExpensesChart } from "@/components/profit-center/RevenueExpensesChart";
import { CostDistributionChart } from "@/components/profit-center/CostDistributionChart";
import { ProfitTrendChart } from "@/components/profit-center/ProfitTrendChart";
import { TopBottomPerformers } from "@/components/profit-center/TopBottomPerformers";
import { FuelEfficiencyChart } from "@/components/profit-center/FuelEfficiencyChart";
import { ExportButton } from "@/components/profit-center/ExportButton";

export default function ProfitCenterPage() {
  // ── UI State ──
  const [period, setPeriod] = useState<PeriodPreset>("this_quarter");
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // ── Store Data ──
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const expenses = useExpenseStore((s) => s.expenses);
  const maintenance = useMaintenanceStore((s) => s.records);

  // ── Derived Date Range ──
  const dateRange = useMemo(() => resolveDateRange(period, customRange), [period, customRange]);
  const prevRange = useMemo(() => getPreviousPeriod(dateRange), [dateRange]);

  // ── Core Computations ──
  const vehicleData = useMemo(
    () => computeVehicleProfitability(vehicles, trips, expenses, maintenance, dateRange),
    [vehicles, trips, expenses, maintenance, dateRange]
  );
  const prevVehicleData = useMemo(
    () => computeVehicleProfitability(vehicles, trips, expenses, maintenance, prevRange),
    [vehicles, trips, expenses, maintenance, prevRange]
  );
  const fleetKPIs = useMemo(
    () => computeFleetKPIs(vehicleData, prevVehicleData),
    [vehicleData, prevVehicleData]
  );
  const chartData = useMemo(
    () => computeChartData(trips, expenses, maintenance, dateRange),
    [trips, expenses, maintenance, dateRange]
  );
  const costDistribution = useMemo(
    () => computeCostDistribution(vehicleData),
    [vehicleData]
  );

  // ── Drawer ──
  const selectedVehicle = useMemo(
    () => vehicleData.find((v) => v.vehicleId === selectedVehicleId) ?? null,
    [vehicleData, selectedVehicleId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Profit Center"
        subtitle="Per-vehicle profitability analytics"
        breadcrumbs={[
          { label: "Finance", href: "/accounting" },
          { label: "Profit Center" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <PeriodFilter
              period={period}
              onPeriodChange={setPeriod}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
              resolvedRange={dateRange}
            />
            <ExportButton data={vehicleData} />
          </div>
        }
      />

      {/* KPI Panel */}
      <KpiPanel kpis={fleetKPIs} />

      {/* Charts Row — 2 column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <RevenueExpensesChart data={chartData} />
        <CostDistributionChart data={costDistribution} totalExpenses={fleetKPIs.totalExpenses} />
      </div>

      {/* Profit Trend — Full width */}
      <ProfitTrendChart data={chartData} />

      {/* Top/Bottom Performers */}
      <TopBottomPerformers
        data={vehicleData}
        onVehicleClick={(id) => setSelectedVehicleId(id)}
      />

      {/* Fuel Efficiency */}
      <FuelEfficiencyChart data={vehicleData} />

      {/* Vehicle Profitability Table */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy dark:text-white mb-3">
          Vehicle Profitability
        </h2>
        <ProfitTable
          data={vehicleData}
          onVehicleClick={(id) => setSelectedVehicleId(id)}
        />
      </div>

      {/* Detail Drawer */}
      <VehicleDetailDrawer
        open={selectedVehicleId !== null}
        onOpenChange={(open) => { if (!open) setSelectedVehicleId(null); }}
        vehicle={selectedVehicle}
        trips={trips}
      />
    </div>
  );
}
