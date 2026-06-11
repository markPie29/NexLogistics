"use client";
import { useState, useMemo } from "react";
import {
  Handshake, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin,
  Truck, CheckCircle2, Clock, Building2, CircleDollarSign,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePartnerStore, usePartnerRequestStore, useTripStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { toast } from "sonner";
import type { Partner, PartnerRequestType, PartnerStatus } from "@/lib/types";

const STATUS_VARIANT: Record<PartnerStatus, any> = {
  active: "success",
  suspended: "warning",
  inactive: "neutral",
};

const REQUEST_LABEL: Record<PartnerRequestType, string> = {
  diesel: "Diesel",
  cash_advance: "Cash Advance",
  other: "Others",
};

const REQUEST_VARIANT: Record<PartnerRequestType, "warning" | "info" | "neutral"> = {
  diesel: "warning",
  cash_advance: "info",
  other: "neutral",
};

const EMPTY: Omit<Partner, "id" | "createdAt"> = {
  name: "", contactPerson: "", phone: "", email: "", address: "",
  vehicleTypes: [], status: "active",
  tin: "", bankName: "", bankAccountNo: "",
  defaultRate: 0, ratePerKm: 0, notes: "",
};

const EMPTY_REQUEST = {
  partnerId: "",
  type: "diesel" as PartnerRequestType,
  amount: 0,
  reason: "",
};

export default function PartnersPage() {
  const partners = usePartnerStore((s) => s.partners);
  const addPartner = usePartnerStore((s) => s.addPartner);
  const updatePartner = usePartnerStore((s) => s.updatePartner);
  const deletePartner = usePartnerStore((s) => s.deletePartner);
  const requests = usePartnerRequestStore((s) => s.requests);
  const addRequest = usePartnerRequestStore((s) => s.addRequest);
  const setRequestStatus = usePartnerRequestStore((s) => s.setRequestStatus);
  const trips = useTripStore((s) => s.trips);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Omit<Partner, "id" | "createdAt">>(EMPTY);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestForm, setRequestForm] = useState(EMPTY_REQUEST);

  const filtered = useMemo(() => partners.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.contactPerson.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [partners, search, statusFilter]);

  // KPIs
  const kpi = useMemo(() => {
    const active = partners.filter((p) => p.status === "active").length;
    const partnerTrips = trips.filter((t) => t.partnerId);
    const pending = partnerTrips.filter((t) => t.partnerPayoutStatus === "pending").length;
    const pendingAmt = partnerTrips
      .filter((t) => t.partnerPayoutStatus === "pending")
      .reduce((a, t) => {
        const p = partners.find((x) => x.id === t.partnerId);
        return a + (p?.defaultRate ?? (t.distanceKm * (p?.ratePerKm ?? 0)));
      }, 0);
    return { total: partners.length, active, totalTrips: partnerTrips.length, pending, pendingAmt };
  }, [partners, trips]);

  const requestSummary = useMemo(() => {
    const pending = requests.filter((r) => r.status === "pending");
    const approved = requests.filter((r) => r.status === "approved");
    return {
      total: requests.length,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((a, b) => a + b.amount, 0),
      approvedCount: approved.length,
    };
  }, [requests]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setDialogOpen(true);
  };
  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name, contactPerson: p.contactPerson, phone: p.phone, email: p.email,
      address: p.address, vehicleTypes: p.vehicleTypes, status: p.status,
      tin: p.tin ?? "", bankName: p.bankName ?? "", bankAccountNo: p.bankAccountNo ?? "",
      defaultRate: p.defaultRate ?? 0, ratePerKm: p.ratePerKm ?? 0, notes: p.notes ?? "",
    });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.name.trim() || !form.contactPerson.trim()) {
      toast.error("Name and contact person are required");
      return;
    }
    const payload = {
      ...form,
      tin: form.tin?.trim() || undefined,
      bankName: form.bankName?.trim() || undefined,
      bankAccountNo: form.bankAccountNo?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
      vehicleTypes: typeof form.vehicleTypes === "string"
        ? (form.vehicleTypes as string).split(",").map((s) => s.trim()).filter(Boolean)
        : form.vehicleTypes,
    };
    if (editing) {
      updatePartner(editing.id, payload);
      toast.success(`Updated ${form.name}`);
    } else {
      addPartner(payload);
      toast.success(`Added ${form.name}`);
    }
    setDialogOpen(false);
  };
  const handleDelete = (p: Partner) => {
    const linked = trips.filter((t) => t.partnerId === p.id).length;
    if (linked > 0) {
      toast.error(`Cannot delete — ${p.name} has ${linked} linked trip(s)`);
      return;
    }
    if (!confirm(`Delete partner "${p.name}"?`)) return;
    deletePartner(p.id);
    toast.success(`Deleted ${p.name}`);
  };

  const submitRequest = () => {
    if (!requestForm.partnerId) {
      toast.error("Select a partner");
      return;
    }
    if (requestForm.amount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    addRequest({
      partnerId: requestForm.partnerId,
      type: requestForm.type,
      amount: requestForm.amount,
      reason: requestForm.reason.trim() || undefined,
    });
    toast.success("Partner request submitted");
    setRequestForm(EMPTY_REQUEST);
    setRequestOpen(false);
  };

  const reviewRequest = (id: string, status: "approved" | "rejected" | "released") => {
    setRequestStatus(id, status, "Super Admin");
    toast.success(`Request marked as ${status}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcon Partners"
        subtitle="Manage subcontractor trucking partners and haulers"
        breadcrumbs={[{ label: "Operations" }, { label: "Subcon Partners" }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setRequestOpen(true)}>
              <CircleDollarSign className="w-4 h-4" /> New Request
            </Button>
            <Button size="sm" onClick={openAdd}>
              <Plus className="w-4 h-4" /> Add Partner
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Partners" value={kpi.total} icon={Handshake} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" />
        <KpiCard label="Active Partners" value={kpi.active} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard label="Total Trips Handled" value={kpi.totalTrips} icon={Truck} iconColor="text-sky-600" iconBg="bg-sky-50" />
        <KpiCard label="Pending Payables" value={formatCurrency(kpi.pendingAmt)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel={`${kpi.pending} trip(s) unpaid`} />
      </div>

      {/* Partner Requests */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-navy dark:text-white">Partner Requests (Diesel / Cash Advance / Others)</h3>
              <p className="text-xs text-muted-foreground">Track and approve partner funding requests before release.</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Pending: <span className="font-semibold text-brand-navy dark:text-white">{requestSummary.pendingCount}</span> ·
              Amount: <span className="font-semibold text-brand-navy dark:text-white"> {formatCurrency(requestSummary.pendingAmount)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Partner</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const partner = partners.find((p) => p.id === r.partnerId);
                  return (
                    <tr key={r.id} className="border-b border-brand-border/60">
                      <td className="py-2.5 px-3 text-xs text-muted-foreground">{new Date(r.requestedAt).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 font-medium">{partner?.name ?? r.partnerId}</td>
                      <td className="py-2.5 px-3"><Badge variant={REQUEST_VARIANT[r.type]}>{REQUEST_LABEL[r.type]}</Badge></td>
                      <td className="py-2.5 px-3 font-semibold">{formatCurrency(r.amount)}</td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground max-w-[260px] truncate">{r.reason ?? "—"}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant={r.status === "pending" ? "warning" : r.status === "rejected" ? "danger" : r.status === "approved" ? "info" : "success"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        {r.status === "pending" ? (
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="h-8" onClick={() => reviewRequest(r.id, "rejected")}>Reject</Button>
                            <Button size="sm" className="h-8" onClick={() => reviewRequest(r.id, "approved")}>Approve</Button>
                          </div>
                        ) : r.status === "approved" ? (
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline" className="h-8" onClick={() => reviewRequest(r.id, "released")}>Mark Released</Button>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">No partner requests yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search partners…" className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partners Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50 dark:bg-white/[0.02]">
                  <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Partner</th>
                  <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Contact</th>
                  <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Vehicle Types</th>
                  <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Rate</th>
                  <th className="text-right font-semibold text-brand-navy dark:text-white px-4 py-3">Trips</th>
                  <th className="text-right font-semibold text-brand-navy dark:text-white px-4 py-3">Unpaid</th>
                  <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Status</th>
                  <th className="text-right font-semibold text-brand-navy dark:text-white px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const pTrips = trips.filter((t) => t.partnerId === p.id);
                  const pendingTrips = pTrips.filter((t) => t.partnerPayoutStatus === "pending").length;
                  const rateLabel = p.defaultRate
                    ? formatCurrency(p.defaultRate) + "/trip"
                    : p.ratePerKm
                    ? `₱${p.ratePerKm}/km`
                    : "—";
                  return (
                    <tr
                      key={p.id}
                      className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Partner name + address */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-brand-navy dark:text-white truncate max-w-[180px]">{p.name}</div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{p.address || "—"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-brand-navy dark:text-white">{p.contactPerson}</div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />{p.phone || "—"}
                        </div>
                        {p.email && (
                          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Mail className="w-3 h-3 shrink-0" />{p.email}
                          </div>
                        )}
                      </td>

                      {/* Vehicle types */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[160px]">
                          {p.vehicleTypes.length > 0
                            ? p.vehicleTypes.map((vt) => (
                                <Badge key={vt} variant="neutral" className="text-[10px] border-0">
                                  {vt}
                                </Badge>
                              ))
                            : <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="px-4 py-3 text-xs font-medium text-brand-navy dark:text-white whitespace-nowrap">
                        {rateLabel}
                      </td>

                      {/* Trips */}
                      <td className="px-4 py-3 text-right font-semibold text-brand-navy dark:text-white">
                        {pTrips.length}
                      </td>

                      {/* Unpaid */}
                      <td className="px-4 py-3 text-right">
                        {pendingTrips > 0 ? (
                          <span className="font-semibold text-amber-600 dark:text-amber-400">{pendingTrips}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => openEdit(p)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="ml-1 hidden sm:inline">Edit</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-red-600 hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-white/10"
                            onClick={() => handleDelete(p)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Handshake className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-white/10" />
                      <p className="text-muted-foreground font-medium">No partners found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filter"
                          : "Add your first subcon partner to get started"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-brand-border dark:border-white/10 text-xs text-muted-foreground">
              Showing {filtered.length} of {partners.length} partner{partners.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Partner Request Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Partner Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Partner">
              <Select value={requestForm.partnerId} onValueChange={(v) => setRequestForm({ ...requestForm, partnerId: v })}>
                <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Request Type">
                <Select value={requestForm.type} onValueChange={(v: PartnerRequestType) => setRequestForm({ ...requestForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="cash_advance">Cash Advance</SelectItem>
                    <SelectItem value="other">Others</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Amount (₱)">
                <Input type="number" value={requestForm.amount} onChange={(e) => setRequestForm({ ...requestForm, amount: +e.target.value })} />
              </Field>
            </div>
            <Field label="Reason / Notes">
              <textarea
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                rows={3}
                placeholder="Explain why this request is needed..."
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button onClick={submitRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit — ${editing.name}` : "Add Subcon Partner"}</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="profile">
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
              <TabsTrigger value="banking" className="flex-1">Banking</TabsTrigger>
              <TabsTrigger value="rates" className="flex-1">Rates</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-3 pt-3">
              <Field label="Company / Partner Name *">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ABC Trucking Co." />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Contact Person *">
                  <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 9XX XXX XXXX" />
                </Field>
              </div>
              <Field label="Email">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dispatch@abc.ph" />
              </Field>
              <Field label="Address">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
              <Field label="Vehicle Types (comma-separated)">
                <Input
                  value={Array.isArray(form.vehicleTypes) ? form.vehicleTypes.join(", ") : form.vehicleTypes}
                  onChange={(e) => setForm({ ...form, vehicleTypes: e.target.value as any })}
                  placeholder="6-Wheeler, 10-Wheeler"
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v: PartnerStatus) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes">
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  rows={3}
                  placeholder="Any special instructions or notes..."
                />
              </Field>
            </TabsContent>

            <TabsContent value="banking" className="space-y-3 pt-3">
              <Field label="TIN">
                <Input value={form.tin ?? ""} onChange={(e) => setForm({ ...form, tin: e.target.value })} placeholder="XXX-XXX-XXX-000" />
              </Field>
              <Field label="Bank Name">
                <Input value={form.bankName ?? ""} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="BDO, BPI, Metrobank…" />
              </Field>
              <Field label="Bank Account Number">
                <Input value={form.bankAccountNo ?? ""} onChange={(e) => setForm({ ...form, bankAccountNo: e.target.value })} />
              </Field>
            </TabsContent>

            <TabsContent value="rates" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">Set the default payout rate for this partner. Used when computing payables.</p>
              <Field label="Default Fixed Rate (₱ per trip)">
                <Input type="number" value={form.defaultRate ?? 0} onChange={(e) => setForm({ ...form, defaultRate: +e.target.value })} />
              </Field>
              <Field label="Rate per KM (₱/km — used if no fixed rate)">
                <Input type="number" value={form.ratePerKm ?? 0} onChange={(e) => setForm({ ...form, ratePerKm: +e.target.value })} />
              </Field>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save Changes" : "Create Partner"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
