"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Truck, Users, Fuel, Wrench, Wallet, ClipboardCheck, BarChart3, Download } from "lucide-react";
import { useTripStore, useFleetStore, useDriverStore, useExpenseStore, useMaintenanceStore, usePayrollStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { toast } from "sonner";

const REPORTS = [
  { id: "trips", title: "Trip Performance", icon: Truck, color: "text-sky-600", bg: "bg-sky-50", desc: "On-time delivery, completed vs cancelled" },
  { id: "vehicles", title: "Vehicle Utilization", icon: Truck, color: "text-brand-teal", bg: "bg-brand-teal-light", desc: "Active hours, distance, downtime" },
  { id: "drivers", title: "Driver Performance", icon: Users, color: "text-purple-600", bg: "bg-purple-50", desc: "On-time %, ratings, total trips" },
  { id: "fuel", title: "Fuel Consumption", icon: Fuel, color: "text-amber-600", bg: "bg-amber-50", desc: "L/100km, cost per vehicle" },
  { id: "maintenance", title: "Maintenance Cost", icon: Wrench, color: "text-red-600", bg: "bg-red-50", desc: "Repairs, PMS, downtime cost" },
  { id: "payroll", title: "Payroll Summary", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Periods, totals, status" },
  { id: "delivery", title: "Delivery Compliance", icon: ClipboardCheck, color: "text-indigo-600", bg: "bg-indigo-50", desc: "POD capture rate, exceptions" },
];

export default function ReportsPage() {
  const trips = useTripStore((s) => s.trips);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const expenses = useExpenseStore((s) => s.expenses);
  const maintenance = useMaintenanceStore((s) => s.records);
  const payroll = usePayrollStore((s) => s.records);

  const completed = trips.filter((t) => t.status === "completed").length;
  const cancelled = trips.filter((t) => t.status === "cancelled").length;
  const totalRevenue = trips.reduce((s, t) => s + t.fare, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const tripsByStatus = ["scheduled", "in_transit", "delivered", "completed", "cancelled"].map((s) => ({
    status: s.replace("_", " "),
    count: trips.filter((t) => t.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational reports for trips, vehicles, drivers, finance, and compliance"
        breadcrumbs={[{ label: "Reports" }]}
        actions={<Button size="sm" variant="outline" onClick={() => toast.success("Export ready · CSV download started (demo)")}><Download className="w-4 h-4" /> Export All</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Trips</div><div className="text-3xl font-bold text-brand-navy mt-1">{trips.length}</div><div className="text-xs text-emerald-600 mt-1">{completed} completed · {cancelled} cancelled</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Revenue</div><div className="text-3xl font-bold text-brand-navy mt-1">{formatCurrency(totalRevenue)}</div><div className="text-xs text-emerald-600 mt-1">+12.4% MoM</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Expenses</div><div className="text-3xl font-bold text-brand-navy mt-1">{formatCurrency(totalExpenses)}</div><div className="text-xs text-red-600 mt-1">+5.2% MoM</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Active Drivers</div><div className="text-3xl font-bold text-brand-navy mt-1">{drivers.filter((d) => d.status === "active").length}/{drivers.length}</div><div className="text-xs text-muted-foreground mt-1">{vehicles.length} vehicles</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Trip Volume by Status</CardTitle></CardHeader>
        <CardContent>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tripsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="status" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#66B2B2" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-bold text-brand-navy mb-3 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand-teal" /> Standard Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORTS.map((r) => (
            <Card key={r.id} className="hover:shadow-card-hover transition cursor-pointer group">
              <CardContent className="p-5">
                <div className={`w-12 h-12 rounded-xl ${r.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                  <r.icon className={`w-5 h-5 ${r.color}`} />
                </div>
                <div className="font-bold text-brand-navy">{r.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`Generating ${r.title} report...`)}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.success(`${r.title} exported`)}><Download className="w-3 h-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Activity Snapshot</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <Stat label="Maintenance Records" value={maintenance.length} sub={`${maintenance.filter((m) => m.status === "overdue").length} overdue`} />
            <Stat label="Expense Entries" value={expenses.length} sub={formatCurrency(totalExpenses)} />
            <Stat label="Payroll Periods" value={payroll.length} sub={`${payroll.filter((p) => p.status === "paid").length} paid`} />
            <Stat label="Avg Driver Rating" value={(drivers.reduce((s, d) => s + d.rating, 0) / Math.max(1, drivers.length)).toFixed(2)} sub="out of 5.00" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: any; sub?: string }) {
  return (
    <div className="p-4 rounded-xl bg-brand-bg">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold text-brand-navy mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}
