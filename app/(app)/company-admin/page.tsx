"use client";
import { useState } from "react";
import {
  Building2, Users, Truck, Route, Wallet, Settings, Shield,
  Mail, Phone, ChevronRight, UserPlus, Edit2, CheckCircle2,
  TrendingUp, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useAuthStore } from "@/lib/store/auth";
import { useFleetStore, useDriverStore, useTripStore, usePayrollStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const ROLE_STYLES: Record<string, { label: string; variant: any; color: string; bg: string }> = {
  super_admin: { label: "Super Admin", variant: "danger", color: "text-red-600", bg: "bg-red-50" },
  company_admin: { label: "Company Admin", variant: "warning", color: "text-amber-600", bg: "bg-amber-50" },
  dispatcher: { label: "Dispatcher", variant: "info", color: "text-sky-600", bg: "bg-sky-50" },
  driver: { label: "Driver", variant: "neutral", color: "text-brand-teal", bg: "bg-brand-teal-light" },
  accounting: { label: "Accounting", variant: "success", color: "text-emerald-600", bg: "bg-emerald-50" },
  client: { label: "Client", variant: "neutral", color: "text-violet-600", bg: "bg-violet-50" },
};

const DEMO_USERS = [
  { id: "u-001", name: "Admin User", email: "admin@nexlogistics.demo", role: "super_admin", phone: "+63 917 000 0001", status: "active" },
  { id: "u-002", name: "Operations Lead", email: "operations@nexlogistics.demo", role: "company_admin", phone: "+63 917 000 0002", status: "active" },
  { id: "u-003", name: "Dispatch Center", email: "dispatcher@nexlogistics.demo", role: "dispatcher", phone: "+63 917 000 0003", status: "active" },
  { id: "u-004", name: "Mark Santos", email: "driver.mark@nexlogistics.demo", role: "driver", phone: "0917 123 4567", status: "active" },
  { id: "u-005", name: "Finance Officer", email: "finance@nexlogistics.demo", role: "accounting", phone: "+63 917 000 0005", status: "active" },
  { id: "u-006", name: "ABC Construction", email: "client@abcconstruction.demo", role: "client", phone: "(02) 8888 1100", status: "active" },
];

const COMPANY_BRANCHES = [
  { id: "br-001", name: "Main Depot – Quezon City", vehicles: 58, drivers: 45, status: "active" },
  { id: "br-002", name: "South Hub – Laguna", vehicles: 32, drivers: 28, status: "active" },
  { id: "br-003", name: "North Gate – Bulacan", vehicles: 18, drivers: 15, status: "active" },
  { id: "br-004", name: "Cebu Branch", vehicles: 12, drivers: 10, status: "active" },
];

export default function CompanyAdminPage() {
  const user = useAuthStore((s) => s.user);
  const company = useAuthStore((s) => s.company);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);
  const payroll = usePayrollStore((s) => s.records);

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "branches">("overview");

  const completedTrips = trips.filter((t) => t.status === "completed").length;
  const revenue = trips.filter((t) => t.status === "completed").reduce((s, t) => s + t.fare, 0);
  const totalPayroll = payroll.filter((r) => r.status === "paid").reduce((s, r) => s + r.net, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Management"
        subtitle={`Manage users, branches, and company settings for ${company.name}`}
        breadcrumbs={[{ label: "Admin" }, { label: "Company Management" }]}
        actions={
          <Button size="sm" onClick={() => toast.success("User invite sent")}>
            <UserPlus className="w-4 h-4" /> Invite User
          </Button>
        }
      />

      {/* Company Banner */}
      <Card className="bg-gradient-to-br from-brand-navy to-[#1a2540] text-white border-0 overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-teal flex items-center justify-center shrink-0 shadow-glow">
            <span className="text-brand-navy font-extrabold text-2xl">N</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-extrabold">{company.name}</div>
            <div className="text-sm text-white/70 mt-1">Company ID: {company.code}</div>
            <div className="flex flex-wrap gap-3 mt-3">
              <Badge className="bg-white/10 border-0 text-white hover:bg-white/20">{vehicles.length} Vehicles</Badge>
              <Badge className="bg-white/10 border-0 text-white hover:bg-white/20">{drivers.length} Drivers</Badge>
              <Badge className="bg-white/10 border-0 text-white hover:bg-white/20">{COMPANY_BRANCHES.length} Branches</Badge>
              <Badge className="bg-white/10 border-0 text-white hover:bg-white/20">{DEMO_USERS.length} Users</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => toast.success("Redirecting to company settings")}>
            <Settings className="w-4 h-4" /> Configure
          </Button>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Vehicles" value={vehicles.length} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" footerLabel="Fleet capacity" href="/fleet" />
        <KpiCard label="Active Drivers" value={drivers.filter((d) => d.status === "active").length} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" footerLabel="Of {drivers.length} total" href="/drivers" />
        <KpiCard label="This Month Revenue" value={formatCurrency(revenue)} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" footerLabel={`${completedTrips} trips`} />
        <KpiCard label="Payroll Paid" value={formatCurrency(totalPayroll)} icon={Wallet} iconColor="text-violet-600" iconBg="bg-violet-50" footerLabel="This period" href="/payroll" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(["overview", "users", "branches"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? "bg-white text-brand-navy shadow" : "text-muted-foreground hover:text-brand-navy"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Quick Links */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-brand-navy">Management Modules</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                { href: "/fleet", label: "Fleet Management", desc: "Vehicles, assignments & registrations", icon: Truck, color: "text-brand-teal", bg: "bg-brand-teal-light" },
                { href: "/drivers", label: "Driver Management", desc: "Profiles, licenses & performance", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
                { href: "/trips", label: "Trip & Dispatch", desc: "All trips and dispatch logs", icon: Route, color: "text-sky-600", bg: "bg-sky-50" },
                { href: "/payroll", label: "Payroll", desc: "Salary, incentives & deductions", icon: Wallet, color: "text-violet-600", bg: "bg-violet-50" },
                { href: "/billing", label: "Billing & Invoices", desc: "Client billing and receivables", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
                { href: "/settings", label: "System Settings", desc: "Preferences and configuration", icon: Settings, color: "text-gray-600", bg: "bg-gray-100" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-teal/30 hover:bg-gray-50/60 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl ${link.bg} flex items-center justify-center shrink-0`}>
                    <link.icon className={`w-5 h-5 ${link.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-brand-navy">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-teal transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-brand-border shadow-sm">
            <CardHeader className="pb-3 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-brand-navy">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {[
                { label: "New trip TRP-2026-084 created", time: "2 min ago", type: "info" },
                { label: "Driver Mark Santos clocked in", time: "15 min ago", type: "success" },
                { label: "Vehicle PLT-3421 PMS overdue", time: "1 hr ago", type: "warning" },
                { label: "Payroll batch April 2026 approved", time: "3 hrs ago", type: "success" },
                { label: "Invoice INV-2026-0012 sent to client", time: "5 hrs ago", type: "info" },
                { label: "Trip TRP-2026-081 delayed — traffic", time: "6 hrs ago", type: "danger" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    a.type === "success" ? "bg-emerald-500" :
                    a.type === "warning" ? "bg-amber-500" :
                    a.type === "danger" ? "bg-red-500" : "bg-sky-500"
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm text-brand-navy">{a.label}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card className="border-brand-border shadow-sm">
          <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-brand-navy">System Users</CardTitle>
            <Button size="sm" onClick={() => toast.success("User invite coming in full version")}>
              <UserPlus className="w-4 h-4" /> Add User
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-100 bg-gray-50/50">
                  <th className="py-3 px-5 font-semibold">User</th>
                  <th className="py-3 px-5 font-semibold">Contact</th>
                  <th className="py-3 px-5 font-semibold">Role</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {DEMO_USERS.map((u) => {
                  const style = ROLE_STYLES[u.role] || ROLE_STYLES.driver;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-navy text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-navy">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{u.phone}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <Badge variant={style.variant}>{style.label}</Badge>
                      </td>
                      <td className="py-4 px-5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => toast.success(`Edit ${u.name} — coming in full version`)}>
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Branches Tab */}
      {activeTab === "branches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPANY_BRANCHES.map((branch) => (
            <Card key={branch.id} className="border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-teal-light flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-brand-teal" />
                    </div>
                    <div>
                      <div className="font-bold text-brand-navy">{branch.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {branch.id}</div>
                    </div>
                  </div>
                  <Badge variant="success">{branch.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <div className="text-xl font-extrabold text-brand-navy">{branch.vehicles}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Vehicles</div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-center">
                    <div className="text-xl font-extrabold text-brand-navy">{branch.drivers}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Drivers</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => toast.success(`Branch details — coming in full version`)}>
                  Manage Branch
                </Button>
              </CardContent>
            </Card>
          ))}
          <Card className="border-dashed border-2 border-gray-200 shadow-none hover:border-brand-teal/50 hover:bg-brand-teal-light/10 transition-colors cursor-pointer" onClick={() => toast.success("Add branch — coming in full version")}>
            <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[180px] text-center gap-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-sm font-semibold text-muted-foreground">Add New Branch</div>
              <div className="text-xs text-muted-foreground">Expand your operations</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

