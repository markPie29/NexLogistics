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
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { TripSummaryDonut } from "@/components/dashboard/TripSummaryDonut";
import { RevenueExpensesChart } from "@/components/dashboard/RevenueExpensesChart";
import { LiveMapDynamic } from "@/components/maps/LiveMapDynamic";
import { useFleetStore, useTripStore, useDriverStore, useMaintenanceStore, useUiStore } from "@/lib/store";
import { formatCurrency, relativeTime } from "@/lib/utils";

export default function DashboardPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const drivers = useDriverStore((s) => s.drivers);
  const maintenance = useMaintenanceStore((s) => s.records);
  const insights = useUiStore((s) => s.insights);

  // Aggregate KPIs (use seed-aligned demo numbers per brief)
  const totalVehicles = 120;
  const activeVehicles = 98;
  const underMaint = 12;
  const activeTrips = 34;
  const completedTrips = 128;
  const delayedTrips = 7;

  const recentTrips = trips.slice(0, 5);
  const topDrivers = [...drivers].sort((a, b) => b.onTimePercent - a.onTimePercent).slice(0, 5);
  const upcomingPms = [...maintenance].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy tracking-tight">Operations Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time fleet, trips, and financial performance for NEX Logistics Inc.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />All systems operational</Badge>
          <Button variant="outline" size="sm"><Calendar className="w-4 h-4" /> May 2026</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <KpiCard label="Total Vehicles" value={totalVehicles} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="View all vehicles →" href="/fleet" />
        <KpiCard label="Active Vehicles" value={activeVehicles} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[40,65,55,80,75,90,85,98]} sparklineColor="#10B981" footerLabel="81.7% of total" href="/fleet" />
        <KpiCard label="Under Maintenance" value={underMaint} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[5,12,8,15,10,14,11,12]} sparklineColor="#F59E0B" footerLabel="10.0% of total" href="/pms" />
        <KpiCard label="Active Trips" value={activeTrips} icon={RouteIcon} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineData={[15,20,18,25,22,30,28,34]} sparklineColor="#0EA5E9" footerLabel="View all trips →" href="/trips" />
        <KpiCard label="Completed Trips" value={completedTrips} icon={PackageCheck} iconColor="text-violet-600" iconBg="bg-violet-50" footerLabel="This month" href="/trips" />
        <KpiCard label="Delayed Trips" value={delayedTrips} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" footerLabel="Needs attention" href="/trips" />
      </div>

      {/* Map + Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="lg:col-span-2 border-brand-border bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <CardTitle className="text-xl font-bold text-brand-navy">Live Vehicle Locations</CardTitle>
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

        <Card className="border-brand-border bg-white shadow-sm flex flex-col">
          <CardHeader className="pb-2 border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-brand-navy">Trip Status Overview</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Today's active runs</p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center pt-6">
            <TripSummaryDonut
              centerValue={169}
              centerLabel="Total Trips"
              data={[
                { name: "Completed", value: 128, color: "#10B981" },
                { name: "In Transit", value: 34, color: "#0EA5E9" },
                { name: "Delayed", value: 7, color: "#EF4444" },
              ]}
            />
            <div className="mt-8 space-y-3 px-2">
              <Row color="#10B981" label="Completed" value={128} />
              <Row color="#0EA5E9" label="In Transit" value={34} />
              <Row color="#EF4444" label="Delayed" value={7} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 4 Finance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-5">
        <FinanceCard label="Total Revenue" value={formatCurrency(6820000)} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend="+12.4% MoM" />
        <FinanceCard label="Total Expenses" value={formatCurrency(3680000)} icon={DollarSign} color="text-red-500" bg="bg-red-50" trend="-2.1% MoM" />
        <FinanceCard label="Net Profit" value={formatCurrency(3140000)} icon={TrendingUp} color="text-brand-teal" bg="bg-brand-teal-light" trend="+8.2% MoM" />
        <FinanceCard label="Avg Trip Margin" value="46.0%" icon={TrendingUp} color="text-brand-teal" bg="bg-brand-teal-light" trend="+1.5% MoM" />
      </div>

      {/* Bottom: Upcoming PMS, Recent Trips, Top Drivers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <Card className="border-brand-border bg-white shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-brand-navy">Upcoming Maintenance</CardTitle>
            <Link href="/pms" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 flex-1">
            {upcomingPms.map((m) => {
              const v = vehicles.find((x) => x.id === m.vehicleId);
              const colorMap: Record<string, string> = { overdue: "danger", due_soon: "warning", upcoming: "info", completed: "success" };
              return (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-teal/30 hover:bg-gray-50/50 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-brand-navy truncate">{v?.plate || m.vehicleId} • {m.type}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Due {new Date(m.dueDate).toLocaleDateString()}</div>
                  </div>
                  <Badge variant={colorMap[m.status] as any} className="shrink-0">{m.status.replace("_", " ")}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-brand-border bg-white shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-brand-navy">Recent Trips</CardTitle>
            <Link href="/trips" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-4 font-semibold">Route</th>
                  <th className="py-3 px-4 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTrips.map((t) => {
                  const variant: any = t.status === "delivered" || t.status === "completed" ? "success"
                    : t.status === "delayed" ? "danger"
                    : t.status === "in_transit" || t.status === "loaded" ? "info"
                    : "neutral";
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-brand-navy truncate max-w-[200px]">{t.pickup.address}</div>
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

        <Card className="border-brand-border bg-white shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-brand-navy">Top Drivers</CardTitle>
            <Link href="/drivers" className="text-sm font-medium text-brand-teal hover:underline">View all</Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 flex-1">
            {topDrivers.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-teal/30 hover:bg-gray-50/50 transition-colors">
                <div className="relative w-10 h-10 rounded-full bg-brand-navy text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {d.name.split(" ").map((p) => p[0]).slice(0,2).join("")}
                  {i === 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-brand-navy truncate">{d.name}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-brand-teal" style={{ width: `${d.onTimePercent}%` }} />
                    </div>
                    <span className="text-xs font-bold text-brand-navy">{d.onTimePercent}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
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
      <span className="text-sm font-extrabold text-brand-navy">{value}</span>
    </div>
  );
}

function FinanceCard({ label, value, icon: Icon, color, bg, trend }: { label: string; value: string; icon: any; color: string; bg: string; trend: string }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all h-full flex flex-col">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3 shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex flex-col min-w-0 flex-1 justify-end">
        <div className="text-xs font-bold text-muted-foreground whitespace-normal leading-tight">{label}</div>
        <div className="text-2xl sm:text-3xl font-black text-brand-navy mt-0.5 leading-tight tracking-tight">{value}</div>
      </div>
      <div className="text-xs font-semibold text-emerald-500 mt-2 tracking-wide shrink-0">{trend}</div>
    </div>
  );
}
