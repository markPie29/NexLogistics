"use client";
import Link from "next/link";
import { useMemo } from "react";
import {
  Calculator, DollarSign, TrendingUp, TrendingDown, Receipt, Wallet,
  Fuel, CalendarClock, BarChart3, ChevronRight, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueExpensesChart } from "@/components/dashboard/RevenueExpensesChart";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useExpenseStore, usePayrollStore, useDriverStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";

export default function AccountingPage() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const expenses = useExpenseStore((s) => s.expenses);
  const payroll = usePayrollStore((s) => s.records);
  const drivers = useDriverStore((s) => s.drivers);

  const stats = useMemo(() => {
    const revenue = trips.filter((t) => t.status === "completed").reduce((s, t) => s + t.fare, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const payrollPaid = payroll.filter((r) => r.status === "paid").reduce((s, r) => s + r.net, 0);
    const payrollPending = payroll.filter((r) => r.status !== "paid").reduce((s, r) => s + r.net, 0);
    const netProfit = revenue - totalExpenses - payrollPaid;
    const fuelExpenses = expenses.filter((e) => e.category === "fuel").reduce((s, e) => s + e.amount, 0);
    const maintenanceExpenses = expenses.filter((e) => e.category === "repair").reduce((s, e) => s + e.amount, 0);
    return { revenue, totalExpenses, payrollPaid, payrollPending, netProfit, fuelExpenses, maintenanceExpenses };
  }, [trips, expenses, payroll]);

  const recentExpenses = expenses.slice(0, 6);
  const recentPayroll = payroll.slice(0, 5);

  const EXPENSE_VARIANT: any = {
    fuel: "warning", maintenance: "info", toll: "neutral", repair: "danger",
    insurance: "neutral", parts: "info", other: "neutral",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance Overview"
        subtitle={`Welcome, ${user?.name?.split(" ")[0] || "Accountant"} — review financial performance and manage records`}
        breadcrumbs={[{ label: "Finance" }, { label: "Overview" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reports"><BarChart3 className="w-4 h-4" /> Reports</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/billing"><Receipt className="w-4 h-4" /> Billing</Link>
            </Button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <KpiCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[30,45,40,55,50,65,60,72]} sparklineColor="#10B981" footerLabel="+12.4% MoM" />
        <KpiCard label="Total Expenses" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} iconColor="text-red-500" iconBg="bg-red-50" sparklineData={[20,22,25,23,28,26,30,stats.totalExpenses > 0 ? 30 : 0]} sparklineColor="#EF4444" footerLabel="All categories" />
        <KpiCard label="Net Profit" value={formatCurrency(Math.max(0, stats.netProfit))} icon={DollarSign} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="After deductions" />
        <KpiCard label="Payroll Paid" value={formatCurrency(stats.payrollPaid)} icon={Wallet} iconColor="text-violet-600" iconBg="bg-violet-50" footerLabel="Settled records" href="/payroll" />
        <KpiCard label="Payroll Due" value={formatCurrency(stats.payrollPending)} icon={CalendarClock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel="Pending approval" href="/payroll" />
        <KpiCard label="Fuel Spend" value={formatCurrency(stats.fuelExpenses)} icon={Fuel} iconColor="text-orange-500" iconBg="bg-orange-50" footerLabel="This period" href="/expenses" />
      </div>

      {/* Revenue Chart + Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-brand-border shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-brand-navy">Revenue vs. Expenses</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Monthly performance trend</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-teal" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Expenses</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <RevenueExpensesChart />
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100">
            <CardTitle className="text-lg font-bold text-brand-navy flex items-center justify-between">
              Expense Breakdown
              <Link href="/expenses" className="text-sm font-medium text-brand-teal hover:underline">Details</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {[
              { label: "Fuel", amount: stats.fuelExpenses, color: "bg-orange-400", pct: stats.totalExpenses > 0 ? (stats.fuelExpenses / stats.totalExpenses) * 100 : 0 },
              { label: "Maintenance", amount: stats.maintenanceExpenses, color: "bg-sky-400", pct: stats.totalExpenses > 0 ? (stats.maintenanceExpenses / stats.totalExpenses) * 100 : 0 },
              { label: "Payroll", amount: stats.payrollPaid, color: "bg-violet-400", pct: (stats.payrollPaid + stats.totalExpenses) > 0 ? (stats.payrollPaid / (stats.payrollPaid + stats.totalExpenses)) * 100 : 0 },
              { label: "Other", amount: stats.totalExpenses - stats.fuelExpenses - stats.maintenanceExpenses, color: "bg-gray-300", pct: 20 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-brand-navy flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                    {item.label}
                  </span>
                  <span className="font-bold text-brand-navy">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(100, item.pct)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses + Payroll Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Expenses */}
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-brand-navy">Recent Expenses</CardTitle>
            <Link href="/expenses" className="text-sm font-medium text-brand-teal hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Fuel className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy capitalize">{e.category}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()} · {e.vehicleId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-brand-navy">{formatCurrency(e.amount)}</div>
                    <Badge variant={EXPENSE_VARIANT[e.category] || "neutral"} className="text-[10px]">{e.category}</Badge>
                  </div>
                </div>
              ))}
              {recentExpenses.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No expenses recorded</div>}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-brand-navy">Payroll Summary</CardTitle>
            <Link href="/payroll" className="text-sm font-medium text-brand-teal hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {recentPayroll.map((r) => {
                const driver = drivers.find((d) => d.id === r.driverId);
                const variant = r.status === "paid" ? "success" : r.status === "approved" ? "info" : "neutral";
                return (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {driver?.name.split(" ").map((p) => p[0]).slice(0, 2).join("") || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-navy">{driver?.name || r.driverId}</div>
                      <div className="text-xs text-muted-foreground">{r.periodStart} – {r.periodEnd}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-brand-navy">{formatCurrency(r.net)}</div>
                      <Badge variant={variant as any} className="text-[10px]">{r.status}</Badge>
                    </div>
                  </div>
                );
              })}
              {recentPayroll.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No payroll records</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        {[
          { href: "/payroll", label: "Payroll", desc: "Manage driver payroll", icon: Wallet, color: "text-violet-600", bg: "bg-violet-50" },
          { href: "/expenses", label: "Expenses", desc: "Fuel, maintenance & more", icon: Fuel, color: "text-orange-500", bg: "bg-orange-50" },
          { href: "/billing", label: "Billing", desc: "Invoices & receivables", icon: Receipt, color: "text-sky-600", bg: "bg-sky-50" },
          { href: "/reports", label: "Reports", desc: "Analytics & exports", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="flex items-center gap-4 p-4 rounded-2xl border border-brand-border bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className={`w-11 h-11 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
              <link.icon className={`w-5 h-5 ${link.color}`} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-brand-navy">{link.label}</div>
              <div className="text-xs text-muted-foreground">{link.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

