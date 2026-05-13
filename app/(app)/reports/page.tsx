"use client";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { Truck, Users, Fuel, Wrench, Wallet, ClipboardCheck, BarChart3, Download, Handshake, Receipt } from "lucide-react";
import { useTripStore, useFleetStore, useDriverStore, useExpenseStore, useMaintenanceStore, usePayrollStore, useClientStore, usePartnerStore } from "@/lib/store";
import { usePayrollPeriodStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { exportToCsv } from "@/lib/utils/csv";
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
  { id: "subcon", title: "Subcon Trips Report", icon: Handshake, color: "text-teal-600", bg: "bg-teal-50", desc: "All subcontractor trips, payout status" },
  { id: "partner_perf", title: "Partner Performance", icon: Handshake, color: "text-violet-600", bg: "bg-violet-50", desc: "Trips per partner, on-time, pending payables" },
  { id: "other_fees", title: "Trip Fees & Other Charges", icon: Receipt, color: "text-rose-600", bg: "bg-rose-50", desc: "Itemized other fees and charges per trip" },
];

export default function ReportsPage() {
  const trips = useTripStore((s) => s.trips);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const expenses = useExpenseStore((s) => s.expenses);
  const maintenance = useMaintenanceStore((s) => s.records);
  const payroll = usePayrollStore((s) => s.records);
  const clients = useClientStore((s) => s.clients);
  const partners = usePartnerStore((s) => s.partners);
  const summaries = usePayrollPeriodStore((s) => s.summaries);

  const vehicleMap = useMemo(() => {
    const m: Record<string, string> = {};
    vehicles.forEach((v) => (m[v.id] = v.plate));
    return m;
  }, [vehicles]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTrips = useMemo(() => {
    if (!dateFrom && !dateTo) return trips;
    return trips.filter((t) => {
      const d = new Date(t.createdAt);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [trips, dateFrom, dateTo]);

  const clientMap = useMemo(() => {
    const m: Record<string, string> = {};
    clients.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [clients]);
  const driverMap = useMemo(() => {
    const m: Record<string, string> = {};
    drivers.forEach((d) => (m[d.id] = d.name));
    return m;
  }, [drivers]);
  const partnerMap = useMemo(() => {
    const m: Record<string, string> = {};
    partners.forEach((p) => (m[p.id] = p.name));
    return m;
  }, [partners]);

  const completed = filteredTrips.filter((t) => t.status === "completed").length;
  const cancelled = filteredTrips.filter((t) => t.status === "cancelled").length;
  const totalRevenue = filteredTrips.reduce((s, t) => s + t.fare, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const tripsByStatus = ["scheduled", "in_transit", "delivered", "completed", "cancelled"].map((s) => ({
    status: s.replace("_", " "),
    count: filteredTrips.filter((t) => t.status === s).length,
  }));

  const exportAll = () => {
    const rows = filteredTrips.map((t) => ({
      "Load Date": new Date(t.pickup.scheduledAt).toLocaleDateString(),
      "Unload Date": new Date(t.dropoff.scheduledAt).toLocaleDateString(),
      "Plate#": t.vehicleId ? (vehicleMap[t.vehicleId] ?? t.vehicleId) : (t.partnerId ? "subcon" : "—"),
      "Client": clientMap[t.clientId] ?? "—",
      "DR#": t.documentNo ?? "",
      "Pickup": t.pickup.address,
      "Item": t.cargo.type,
      "Consignee": t.consigneeName ?? "",
      "Dropoff": t.dropoff.address,
      "Qty": t.cargo?.units ?? "",
      "Rate": t.fare,
      "Total": t.fare + (t.otherFees?.reduce((a, f) => a + f.amount, 0) ?? 0),
      "Other Fees": t.otherFees?.map((f) => `${f.label}: ${f.amount}`).join(" | ") ?? "",
      "Notes": t.notes ?? "",
      "Driver/Partner": t.partnerId ? (partnerMap[t.partnerId] ?? t.partnerId) : (driverMap[t.driverId ?? ""] ?? "—"),
      "Status": t.status,
    }));
    exportToCsv(`all-trips-master-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success(`Exported ${rows.length} trips`);
  };

  const handleExport = (id: string) => {
    const ts = new Date().toISOString().slice(0, 10);
    if (id === "trips") {
      const rows = filteredTrips.map((t) => ({
        "Trip ID": t.id, "DR#": t.documentNo ?? "", "Client": clientMap[t.clientId] ?? "—",
        "Pickup": t.pickup.address, "Dropoff": t.dropoff.address, "Distance (km)": t.distanceKm,
        "Status": t.status, "Fare": t.fare, "Date": new Date(t.createdAt).toLocaleDateString(),
      }));
      exportToCsv(`trip-performance-${ts}.csv`, rows);
    } else if (id === "drivers") {
      const rows = drivers.map((d) => ({
        "Driver": d.name, "License": d.licenseNumber, "Status": d.status,
        "Rating": d.rating, "Total Trips": filteredTrips.filter((t) => t.driverId === d.id).length,
        "Completed": filteredTrips.filter((t) => t.driverId === d.id && t.status === "completed").length,
      }));
      exportToCsv(`driver-performance-${ts}.csv`, rows);
    } else if (id === "vehicles") {
      const rows = vehicles.map((v) => ({
        "Plate": v.plate, "Type": v.type, "Status": v.status,
        "Trips": filteredTrips.filter((t) => t.vehicleId === v.id).length,
        "Distance (km)": filteredTrips.filter((t) => t.vehicleId === v.id).reduce((a, t) => a + t.distanceKm, 0),
      }));
      exportToCsv(`vehicle-utilization-${ts}.csv`, rows);
    } else if (id === "fuel") {
      const fuelExp = expenses.filter((e) => e.category === "fuel");
      const rows = fuelExp.map((e) => ({
        "Date": new Date(e.date).toLocaleDateString(), "Vehicle": e.vehicleId ?? "—",
        "Amount": e.amount, "Notes": e.notes ?? "",
      }));
      exportToCsv(`fuel-consumption-${ts}.csv`, rows);
    } else if (id === "maintenance") {
      const rows = maintenance.map((m) => ({
        "Vehicle": m.vehicleId, "Type": m.type, "Status": m.status,
        "Cost": m.cost ?? 0, "Due Date": new Date(m.dueDate).toLocaleDateString(), "Completed": m.completedAt ? new Date(m.completedAt).toLocaleDateString() : "", "Notes": m.notes ?? "",
      }));
      exportToCsv(`maintenance-cost-${ts}.csv`, rows);
    } else if (id === "payroll") {
      const rows = summaries.map((s) => ({
        "Driver": driverMap[s.driverId] ?? s.driverId, "Period": s.payrollPeriodId,
        "Gross Pay": s.grossPay, "Deductions": s.totalDeductions, "Net Pay": s.netPay, "Status": s.status,
      }));
      exportToCsv(`payroll-summary-${ts}.csv`, rows);
    } else if (id === "delivery") {
      const rows = filteredTrips.map((t) => ({
        "Trip ID": t.id, "Status": t.status, "Client": clientMap[t.clientId] ?? "—",
        "POD": t.podId ? "Yes" : "No", "Date": new Date(t.createdAt).toLocaleDateString(),
      }));
      exportToCsv(`delivery-compliance-${ts}.csv`, rows);
    } else if (id === "subcon") {
      const subconTrips = filteredTrips.filter((t) => t.partnerId);
      const rows = subconTrips.map((t) => ({
        "Trip ID": t.id, "DR#": t.documentNo ?? "", "Partner": partnerMap[t.partnerId!] ?? t.partnerId,
        "Route": `${t.pickup.address} → ${t.dropoff.address}`, "Distance (km)": t.distanceKm,
        "Payout Status": t.partnerPayoutStatus ?? "pending", "Date": new Date(t.createdAt).toLocaleDateString(),
      }));
      exportToCsv(`subcon-trips-${ts}.csv`, rows);
    } else if (id === "partner_perf") {
      const rows = partners.map((p) => {
        const pTrips = filteredTrips.filter((t) => t.partnerId === p.id);
        const pending = pTrips.filter((t) => t.partnerPayoutStatus === "pending").length;
        return {
          "Partner": p.name, "Status": p.status, "Total Trips": pTrips.length,
          "Pending Payables": pending, "Completed Trips": pTrips.filter((t) => t.status === "completed").length,
        };
      });
      exportToCsv(`partner-performance-${ts}.csv`, rows);
    } else if (id === "other_fees") {
      const rows = filteredTrips.filter((t) => t.otherFees && t.otherFees.length > 0).flatMap((t) =>
        (t.otherFees ?? []).map((f) => ({
          "Trip ID": t.id, "DR#": t.documentNo ?? "", "Client": clientMap[t.clientId] ?? "—",
          "Fee Label": f.label, "Fee Amount": f.amount, "Date": new Date(t.createdAt).toLocaleDateString(),
        }))
      );
      exportToCsv(`trip-other-fees-${ts}.csv`, rows);
    } else {
      toast.success(`${id} exported`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Operational reports for trips, vehicles, drivers, finance, and compliance"
        breadcrumbs={[{ label: "Reports" }]}
        actions={
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-input rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-teal" />
            <label className="text-xs text-muted-foreground">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-input rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-teal" />
            {(dateFrom || dateTo) && (
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>Clear</Button>
            )}
            <Button size="sm" variant="outline" onClick={exportAll}><Download className="w-4 h-4" /> Export All Trips</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5"><div className="text-xs text-muted-foreground">Total Trips</div><div className="text-3xl font-bold text-brand-navy mt-1">{filteredTrips.length}</div><div className="text-xs text-emerald-600 mt-1">{completed} completed · {cancelled} cancelled</div></CardContent></Card>
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
                  <Button size="sm" variant="outline" onClick={() => handleExport(r.id)}>View</Button>
                  <Button size="sm" variant="ghost" onClick={() => handleExport(r.id)}><Download className="w-3 h-3" /></Button>
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
