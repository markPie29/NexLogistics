"use client";
import {
  Truck,
  CheckCircle2,
  Wrench,
  Route as RouteIcon,
  PackageCheck,
  AlertTriangle,
  Fuel,
  DollarSign,
  TrendingUp,
  Calendar,
  Sparkles,
  ChevronRight,
  Wallet,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TripSummaryDonut } from "@/components/dashboard/TripSummaryDonut";
import { RevenueExpensesChart } from "@/components/dashboard/RevenueExpensesChart";
import { FuelConsumptionChart } from "@/components/dashboard/FuelConsumptionChart";
import { VehicleUtilizationChart } from "@/components/dashboard/VehicleUtilizationChart";
import { DriverPerformanceChart } from "@/components/dashboard/DriverPerformanceChart";
import { DeliveryOnTimeChart } from "@/components/dashboard/DeliveryOnTimeChart";
import { LiveMapDynamic } from "@/components/maps/LiveMapDynamic";
import { useFleetStore, useTripStore, useDriverStore, useMaintenanceStore, useExpenseStore, usePayrollStore, useUiStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export default function DashboardPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const drivers = useDriverStore((s) => s.drivers);
  const maintenance = useMaintenanceStore((s) => s.records);
  const expenses = useExpenseStore((s) => s.expenses);
  const payrollRecords = usePayrollStore((s) => s.records);
  const insights = useUiStore((s) => s.insights);

  // ─── Aggregated KPIs from real store data ───────────────────────
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === "in_trip" || v.status === "available").length;
  const underMaint = vehicles.filter((v) => v.status === "maintenance").length;
  const activeTrips = trips.filter((t) => ["in_transit", "loaded", "vehicle_dispatched", "driver_assigned"].includes(t.status)).length;
  const completedTrips = trips.filter((t) => t.status === "completed" || t.status === "delivered").length;
  const delayedTrips = trips.filter((t) => t.status === "delayed").length;
  const pendingPms = maintenance.filter((m) => m.status !== "completed").length;

  // Financial aggregations
  const totalRevenue = trips.reduce((sum, t) => sum + (t.fare || 0), 0);
  const fuelExpenses = expenses.filter((e) => e.category === "fuel").reduce((sum, e) => sum + e.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const payrollCost = payrollRecords.reduce((sum, p) => sum + p.net, 0);
  const netProfit = totalRevenue - totalExpenses - payrollCost;
  const avgTripMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0;

  const recentTrips = trips.slice(0, 5);
  const topDrivers = [...drivers].sort((a, b) => b.onTimePercent - a.onTimePercent).slice(0, 5);
  const upcomingPms = [...maintenance].filter((m) => m.status !== "completed").slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy dark:text-white tracking-tight">Operations Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time fleet, trips, and financial performance for NEX Logistics Inc.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />All systems operational</Badge>
          <Button variant="outline" size="sm"><Calendar className="w-4 h-4" /> May 2026</Button>
        </div>
      </div>

      {/* KPI Row — 5 column grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KpiCard label="Total Vehicles" value={totalVehicles} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="View all vehicles →" href="/fleet" />
        <KpiCard label="Active Vehicles" value={activeVehicles} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[40,65,55,80,75,90,85,activeVehicles * 10]} sparklineColor="#10B981" footerLabel={`${totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0}% of total`} href="/fleet" />
        <KpiCard label="Under Maintenance" value={underMaint} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[5,12,8,15,10,14,11,underMaint]} sparklineColor="#F59E0B" footerLabel={`${totalVehicles > 0 ? ((underMaint / totalVehicles) * 100).toFixed(1) : 0}% of total`} href="/pms" />
        <KpiCard label="Active Trips" value={activeTrips} icon={RouteIcon} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineData={[15,20,18,25,22,30,28,activeTrips]} sparklineColor="#0EA5E9" footerLabel="View all trips →" href="/trips" />
        <KpiCard label="Delayed Trips" value={delayedTrips} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" footerLabel="Needs attention" href="/trips" />
      </div>

      {/* KPI Row 2 — Financial + PMS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KpiCard label="Revenue This Month" value={formatCurrency(totalRevenue)} icon={DollarSign} iconColor="text-emerald-600" iconBg="bg-emerald-50" trend={12.4} trendLabel="MoM" href="/reports" />
        <KpiCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={DollarSign} iconColor="text-red-500" iconBg="bg-red-50" trend={-2.1} trendLabel="MoM" href="/expenses" />
        <KpiCard label="Fuel Cost" value={formatCurrency(fuelExpenses)} icon={Fuel} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[20,35,28,40,32,38,34,fuelExpenses / 100]} sparklineColor="#F59E0B" footerLabel="This month" href="/expenses" />
        <KpiCard label="Payroll Cost" value={formatCurrency(payrollCost)} icon={Wallet} iconColor="text-violet-600" iconBg="bg-violet-50" footerLabel="Current period" href="/payroll" />
        <KpiCard label="Pending PMS" value={pendingPms} icon={Wrench} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="Reminders active" href="/pms" />
      </div>

      {/* Map + Trip Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="lg:col-span-2 border-brand-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100 dark:border-white/5">
            <div>
              <CardTitle className="text-xl font-bold text-brand-navy dark:text-white">Live Vehicle Locations</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Real-time GPS tracking across active routes</p>
            </div>
            <Link href="/gps" className="text-sm font-medium text-brand-teal hover:underline flex items-center gap-1">
              Open full map <ChevronRight className="w-4 h-4" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ height: 420 }}>
              <LiveMapDynamic />
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white dark:bg-card shadow-sm flex flex-col">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-xl font-bold text-brand-navy dark:text-white">Trip Status Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Today&apos;s active runs</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center pt-6">
            <TripSummaryDonut
              centerValue={trips.length}
              centerLabel="Total Trips"
              data={[
                { name: "Completed", value: completedTrips, color: "#10B981" },
                { name: "In Transit", value: activeTrips, color: "#0EA5E9" },
                { name: "Delayed", value: delayedTrips, color: "#EF4444" },
              ]}
            />
            <div className="mt-8 space-y-3 px-2">
              <Row color="#10B981" label="Completed" value={completedTrips} />
              <Row color="#0EA5E9" label="In Transit" value={activeTrips} />
              <Row color="#EF4444" label="Delayed" value={delayedTrips} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: Revenue vs Expenses + Fuel Consumption */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <Card className="border-brand-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Revenue vs Expenses</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Daily trend — May 2026</p>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueExpensesChart />
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Fuel Consumption Trend</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Monthly diesel vs gasoline usage</p>
          </CardHeader>
          <CardContent className="pt-4">
            <FuelConsumptionChart />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Vehicle Utilization + On-Time Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
        <Card className="border-brand-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Vehicle Utilization</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Fleet utilization rate per vehicle</p>
          </CardHeader>
          <CardContent className="pt-4">
            <VehicleUtilizationChart />
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white dark:bg-card shadow-sm">
          <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Delayed vs On-Time Deliveries</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Weekly delivery performance</p>
          </CardHeader>
          <CardContent className="pt-4">
            <DeliveryOnTimeChart />
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Chart — Full Width */}
      <Card className="border-brand-border bg-white dark:bg-card shadow-sm">
        <CardHeader className="pb-2 border-b border-gray-100 dark:border-white/5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Driver Performance Ranking</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">On-time delivery rate by driver</p>
          </div>
          <Link href="/drivers" className="text-sm font-medium text-brand-teal hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          <DriverPerformanceChart />
        </CardContent>
      </Card>

      {/* Finance Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        <FinanceCard label="Total Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend="+12.4% MoM" />
        <FinanceCard label="Total Expenses" value={formatCurrency(totalExpenses)} icon={DollarSign} color="text-red-500" bg="bg-red-50" trend="-2.1% MoM" />
        <FinanceCard label="Net Profit" value={formatCurrency(netProfit)} icon={TrendingUp} color="text-brand-teal" bg="bg-brand-teal-light" trend="+8.2% MoM" />
        <FinanceCard label="Avg Trip Margin" value={`${avgTripMargin.toFixed(1)}%`} icon={TrendingUp} color="text-brand-teal" bg="bg-brand-teal-light" trend="+1.5% MoM" />
      </div>

      {/* Bottom: Upcoming PMS, Recent Trips, Top Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="border-brand-border bg-white dark:bg-card shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Upcoming Maintenance</CardTitle>
            <Link href="/pms" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 flex-1">
            {upcomingPms.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              const colorMap: Record<string, string> = { overdue: "danger", due_soon: "warning", upcoming: "info", completed: "success" };
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10 hover:border-brand-teal/30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-brand-navy dark:text-white truncate">{v?.plate || m.vehicleId} • {m.type}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Due {new Date(m.dueDate).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={colorMap[m.status] as any} className="shrink-0">{m.status.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white dark:bg-card shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Recent Trips</CardTitle>
            <Link href="/trips" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-4 font-semibold">Route</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {recentTrips.map((t) => {
                  const variant: any = t.status === "delivered" || t.status === "completed" ? "success"
                    : t.status === "delayed" ? "danger"
                    : t.status === "in_transit" || t.status === "loaded" ? "info"
                    : "neutral";
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-navy dark:text-white truncate max-w-[200px]">{t.pickup.address}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">→ {t.dropoff.address}</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Badge variant={variant}>{t.status.replace(/_/g, " ")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white dark:bg-card shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <CardTitle className="text-lg font-bold text-brand-navy dark:text-white">Top Drivers</CardTitle>
            <Link href="/drivers" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 flex-1">
            {topDrivers.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/10 hover:border-brand-teal/30 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                <div className="relative w-10 h-10 rounded-full bg-brand-navy text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {d.name.split(" ").map((p) => p[0]).slice(0,2).join("")}
                  {i === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white dark:border-brand-navy" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-brand-navy dark:text-white truncate">{d.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                      <div className="h-full bg-brand-teal" style={{ width: `${d.onTimePercent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-brand-navy dark:text-white">{d.onTimePercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Teaser */}
      <Card className="bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark text-white border-0 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-teal/30 flex items-center justify-center backdrop-blur-sm shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-lg">AI Insights</div>
              <div className="text-sm text-white/70 mt-0.5">{insights.length} actionable insights detected across fleet operations</div>
            </div>
          </div>
          <Link href="/ai-insights">
            <Button className="bg-brand-teal text-white hover:bg-brand-teal-dark border-0">
              View Insights <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="text-sm font-extrabold text-brand-navy dark:text-white">{value}</span>
    </div>
  );
}

function FinanceCard({ label, value, icon: Icon, color, bg, trend }: { label: string; value: string; icon: any; color: string; bg: string; trend: string }) {
  return (
    <div className="rounded-2xl border border-brand-border dark:border-white/10 bg-white dark:bg-card p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex flex-col min-w-0 flex-1 justify-end">
        <div className="text-xs font-bold text-muted-foreground whitespace-normal leading-tight">{label}</div>
        <div className="text-2xl sm:text-3xl font-black text-brand-navy dark:text-white mt-0.5 leading-tight tracking-tight">{value}</div>
      </div>
      <div className="text-xs font-semibold text-emerald-500 mt-2 tracking-wide shrink-0">{trend}</div>
    </div>
  );
}
