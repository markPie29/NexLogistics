"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Activity, Search, Plus, Phone, MoreHorizontal, Pencil, Trash2, Eye, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useHelperStore, useDriverStore } from "@/lib/store";
import { initials, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { EmploymentType } from "@/lib/types";

const STATUS_VARIANT: Record<string, any> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function HelpersPage() {
  const helpers = useHelperStore((s) => s.helpers);
  const addHelper = useHelperStore((s) => s.addHelper);
  const deleteHelper = useHelperStore((s) => s.deleteHelper);
  const drivers = useDriverStore((s) => s.drivers);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);

  // New helper form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employmentType, setEmploymentType] = useState<EmploymentType>("per_trip");
  const [monthlyBaseSalary, setMonthlyBaseSalary] = useState<number>(0);
  const [baseRatePerTrip, setBaseRatePerTrip] = useState<number>(0);
  const [commissionPercent, setCommissionPercent] = useState<number>(0);
  const [assignedDriverId, setAssignedDriverId] = useState<string>("");

  const filtered = useMemo(() => helpers.filter((h) => {
    if (search && !h.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && h.status !== statusFilter) return false;
    return true;
  }), [helpers, search, statusFilter]);

  const counts = {
    total: helpers.length,
    active: helpers.filter((h) => h.status === "active").length,
    off_duty: helpers.filter((h) => h.status === "off_duty").length,
    on_leave: helpers.filter((h) => h.status === "on_leave").length,
  };

  const submit = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required.");
      return;
    }
    addHelper({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      status: "active",
      assignedDriverId: assignedDriverId || undefined,
      employmentType,
      monthlyBaseSalary: employmentType !== "per_trip" ? monthlyBaseSalary : undefined,
      baseRatePerTrip: employmentType !== "monthly" ? baseRatePerTrip : undefined,
      commissionPercent: commissionPercent || undefined,
    });
    toast.success(`Helper ${name} added`);
    setOpen(false);
    setName(""); setPhone(""); setEmail("");
    setEmploymentType("per_trip");
    setMonthlyBaseSalary(0); setBaseRatePerTrip(0); setCommissionPercent(0);
    setAssignedDriverId("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helper Management"
        subtitle="Manage loaders, helpers, and assistant crew assigned to drivers"
        breadcrumbs={[{ label: "Operations" }, { label: "Helpers" }]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4" /> Add Helper</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Add New Helper</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Roberto Lim" /></div>
                  <div><Label>Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917XXXXXXX" /></div>
                </div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" /></div>
                <div>
                  <Label>Assign to Driver (optional)</Label>
                  <Select value={assignedDriverId} onValueChange={(v) => setAssignedDriverId(v === "__none__" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="— None —" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select value={employmentType} onValueChange={(v) => setEmploymentType(v as EmploymentType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_trip">Per Trip</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="hybrid">Hybrid (Monthly + Per Trip)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {employmentType !== "per_trip" && (
                    <div><Label>Monthly Salary (₱)</Label><Input type="number" value={monthlyBaseSalary || ""} onChange={(e) => setMonthlyBaseSalary(Number(e.target.value) || 0)} /></div>
                  )}
                  {employmentType !== "monthly" && (
                    <div><Label>Per Trip Rate (₱)</Label><Input type="number" value={baseRatePerTrip || ""} onChange={(e) => setBaseRatePerTrip(Number(e.target.value) || 0)} /></div>
                  )}
                  <div><Label>Commission %</Label><Input type="number" value={commissionPercent || ""} onChange={(e) => setCommissionPercent(Number(e.target.value) || 0)} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submit}>Add Helper</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Helpers" value={counts.total} icon={Users} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[3,4,4,5,5,5,5,5]} />
        <KpiCard label="Active" value={counts.active} icon={Activity} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[2,3,3,4,4,4,4,4]} sparklineColor="#10B981" />
        <KpiCard label="Off Duty" value={counts.off_duty} icon={Briefcase} iconColor="text-gray-500" iconBg="bg-gray-100" sparklineData={[1,1,1,1,1,1,1,1]} sparklineColor="#9CA3AF" />
        <KpiCard label="On Leave" value={counts.on_leave} icon={Briefcase} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[0,0,0,0,0,0,0,0]} sparklineColor="#F59E0B" />
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search helper name..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="off_duty">Off Duty</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-4 font-medium">Helper</th>
                  <th className="py-3 px-4 font-medium">Assigned Driver</th>
                  <th className="py-3 px-4 font-medium">Employment</th>
                  <th className="py-3 px-4 font-medium text-right">Rate</th>
                  <th className="py-3 px-4 font-medium">Commission</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => {
                  const driver = drivers.find((d) => d.id === h.assignedDriverId);
                  const rateLabel =
                    h.employmentType === "monthly"
                      ? `${formatCurrency(h.monthlyBaseSalary || 0)} / mo`
                      : h.employmentType === "hybrid"
                      ? `${formatCurrency(h.monthlyBaseSalary || 0)} + ${formatCurrency(h.baseRatePerTrip || 0)}/trip`
                      : `${formatCurrency(h.baseRatePerTrip || 0)} / trip`;
                  return (
                    <tr key={h.id} className="border-b border-brand-border/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/helpers/${h.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                          <Avatar className="h-10 w-10"><AvatarFallback>{initials(h.name)}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-semibold text-brand-navy dark:text-white hover:text-brand-teal transition">{h.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {h.phone}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">{driver ? <Badge variant="info">{driver.name}</Badge> : <span className="text-xs text-muted-foreground">Unassigned</span>}</td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral" className="capitalize">{(h.employmentType || "per_trip").replace("_", " ")}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-mono">{rateLabel}</td>
                      <td className="py-3 px-4 text-xs">{h.commissionPercent ? `${h.commissionPercent}%` : "—"}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[h.status]}>{h.status.replace("_", " ")}</Badge></td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/helpers/${h.id}`)}><Eye className="w-4 h-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/helpers/${h.id}`)}><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => { deleteHelper(h.id); toast.success("Helper removed"); }}><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No helpers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
