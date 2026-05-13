"use client";
import { useState, useMemo } from "react";
import {
  Handshake, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin,
  Truck, CheckCircle2, Clock, Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePartnerStore, useTripStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { toast } from "sonner";
import type { Partner, PartnerStatus } from "@/lib/types";

const STATUS_VARIANT: Record<PartnerStatus, any> = {
  active: "success",
  suspended: "warning",
  inactive: "neutral",
};

const EMPTY: Omit<Partner, "id" | "createdAt"> = {
  name: "", contactPerson: "", phone: "", email: "", address: "",
  vehicleTypes: [], status: "active",
  tin: "", bankName: "", bankAccountNo: "",
  defaultRate: 0, ratePerKm: 0, notes: "",
};

export default function PartnersPage() {
  const partners = usePartnerStore((s) => s.partners);
  const addPartner = usePartnerStore((s) => s.addPartner);
  const updatePartner = usePartnerStore((s) => s.updatePartner);
  const deletePartner = usePartnerStore((s) => s.deletePartner);
  const trips = useTripStore((s) => s.trips);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Omit<Partner, "id" | "createdAt">>(EMPTY);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subcon Partners"
        subtitle="Manage subcontractor trucking partners and haulers"
        breadcrumbs={[{ label: "Operations" }, { label: "Subcon Partners" }]}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Partners" value={kpi.total} icon={Handshake} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" />
        <KpiCard label="Active Partners" value={kpi.active} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <KpiCard label="Total Trips Handled" value={kpi.totalTrips} icon={Truck} iconColor="text-sky-600" iconBg="bg-sky-50" />
        <KpiCard label="Pending Payables" value={formatCurrency(kpi.pendingAmt)} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" footerLabel={`${kpi.pending} trip(s) unpaid`} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
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
        </CardContent>
      </Card>

      {/* Partner Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const pTrips = trips.filter((t) => t.partnerId === p.id);
          const pendingTrips = pTrips.filter((t) => t.partnerPayoutStatus === "pending").length;
          return (
            <Card key={p.id} className="border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.vehicleTypes.join(", ")}</div>
                  </div>
                  <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="w-3.5 h-3.5" />{p.email || "—"}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{p.phone}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{p.address}</span></div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <div className="text-base font-extrabold text-brand-navy">{pTrips.length}</div>
                    <div className="text-[10px] text-muted-foreground">Trips</div>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-2 text-center">
                    <div className="text-base font-extrabold text-amber-700">{pendingTrips}</div>
                    <div className="text-[10px] text-muted-foreground">Unpaid</div>
                  </div>
                  <div className="rounded-lg bg-sky-50 p-2 text-center">
                    <div className="text-xs font-extrabold text-sky-700">{p.defaultRate ? formatCurrency(p.defaultRate) : p.ratePerKm ? `₱${p.ratePerKm}/km` : "—"}</div>
                    <div className="text-[10px] text-muted-foreground">Rate</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDelete(p)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Handshake className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No partners found
          </div>
        )}
      </div>

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
