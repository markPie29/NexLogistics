"use client";
import Link from "next/link";
import {
  Briefcase, Truck, MapPin, Package, CheckCircle2, Clock, PhoneCall,
  Building2, Mail, Phone, TrendingUp, Download, ChevronRight, Search,
  Plus, Pencil, Trash2,
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/store/auth";
import { useTripStore, useClientStore, useInvoiceStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { TripStatus, Client } from "@/lib/types";

const STATUS_VARIANT: Record<TripStatus, any> = {
  scheduled: "neutral",
  driver_assigned: "info",
  vehicle_dispatched: "info",
  loaded: "info",
  in_transit: "warning",
  delivered: "success",
  completed: "success",
  delayed: "danger",
  cancelled: "danger",
};

// ── Client self-service view ──────────────────────────────────────────────────
function ClientView() {
  const user = useAuthStore((s) => s.user);
  const trips = useTripStore((s) => s.trips);
  const clients = useClientStore((s) => s.clients);
  const [search, setSearch] = useState("");

  const myClient = clients.find((c) => c.id === user?.clientId);
  const myTrips = trips.filter((t) => t.clientId === user?.clientId);
  const filtered = myTrips.filter((t) =>
    search === "" || t.id.toLowerCase().includes(search.toLowerCase()) || t.cargo.type.toLowerCase().includes(search.toLowerCase())
  );

  const active = myTrips.filter((t) => !["completed", "cancelled"].includes(t.status)).length;
  const completed = myTrips.filter((t) => t.status === "completed").length;
  const totalSpend = myTrips.reduce((s, t) => s + t.fare, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${myClient?.name || user?.name}`}
        subtitle="Track shipments, view invoices, and manage your account"
        breadcrumbs={[{ label: "Client Portal" }, { label: "My Shipments" }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/billing"><Download className="w-4 h-4" /> My Invoices</Link>
            </Button>
            <Button size="sm" onClick={() => toast.success("Booking form coming soon")}>
              <Package className="w-4 h-4" /> Book Shipment
            </Button>
          </div>
        }
      />

      {/* Client Info Banner */}
      {myClient && (
        <Card className="bg-gradient-to-br from-brand-navy to-[#1a2540] text-white border-0">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-extrabold">{myClient.name}</div>
              <div className="text-sm text-white/70 mt-0.5">{myClient.industry}</div>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-white/60">
                <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{myClient.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{myClient.phone}</span>
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{myClient.address}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10" onClick={() => toast.success("Contact support — coming soon")}>
              <PhoneCall className="w-4 h-4" /> Contact Us
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <KpiCard label="Active Shipments" value={active} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[2,3,3,4,4,5,5,active]} sparklineColor="#66B2B2" footerLabel="In transit now" />
        <KpiCard label="Completed" value={completed} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[5,8,10,12,15,18,20,completed]} sparklineColor="#10B981" footerLabel="All-time deliveries" />
        <KpiCard label="Total Spend" value={formatCurrency(totalSpend)} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" footerLabel="Lifetime value" href="/billing" />
      </div>

      {/* Shipments Table */}
      <Card className="border-brand-border shadow-sm">
        <CardHeader className="border-b border-gray-100 pb-4 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-xl font-bold text-brand-navy">My Shipments</CardTitle>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search trips..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 w-48 text-xs" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-5 font-semibold">Trip ID</th>
                  <th className="py-3 px-5 font-semibold">Route</th>
                  <th className="py-3 px-5 font-semibold">Schedule</th>
                  <th className="py-3 px-5 font-semibold">Cargo</th>
                  <th className="py-3 px-5 font-semibold text-right">Amount</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
                    <td className="py-3.5 px-5 font-bold text-brand-navy">{t.id}</td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3 text-emerald-500 shrink-0" /><span className="truncate max-w-[120px]">{t.pickup.address}</span></div>
                      <div className="flex items-center gap-1 text-xs mt-0.5"><MapPin className="w-3 h-3 text-red-500 shrink-0" /><span className="truncate max-w-[120px]">{t.dropoff.address}</span></div>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-muted-foreground">{new Date(t.pickup.scheduledAt).toLocaleDateString()}</td>
                    <td className="py-3.5 px-5 text-sm">{t.cargo.type}</td>
                    <td className="py-3.5 px-5 text-right font-bold">{formatCurrency(t.fare)}</td>
                    <td className="py-3.5 px-5"><Badge variant={STATUS_VARIANT[t.status]}>{t.status.replace(/_/g, " ")}</Badge></td>
                    <td className="py-3.5 px-5">
                      <Button size="sm" variant="ghost" className="h-8" asChild>
                        <Link href={`/trips/${t.id}`}><ChevronRight className="w-4 h-4" /></Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    No shipments found
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Admin/Ops client management view ─────────────────────────────────────────
function AdminClientView() {
  const trips = useTripStore((s) => s.trips);
  const clients = useClientStore((s) => s.clients);
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const deleteClient = useClientStore((s) => s.deleteClient);
  const invoices = useInvoiceStore((s) => s.invoices);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id">>({
    name: "", industry: "", contactPerson: "", email: "", phone: "", address: "", logoUrl: "",
  });

  const filtered = clients.filter((c) =>
    search === "" || c.name.toLowerCase().includes(search.toLowerCase()) || c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", industry: "", contactPerson: "", email: "", phone: "", address: "", logoUrl: "" });
    setDialogOpen(true);
  };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, industry: c.industry, contactPerson: c.contactPerson, email: c.email, phone: c.phone, address: c.address, logoUrl: c.logoUrl ?? "" });
    setDialogOpen(true);
  };
  const submit = () => {
    if (!form.name.trim() || !form.contactPerson.trim()) {
      toast.error("Name and contact person are required");
      return;
    }
    const payload = { ...form, logoUrl: form.logoUrl?.trim() || undefined };
    if (editing) {
      updateClient(editing.id, payload);
      toast.success(`Updated ${form.name}`);
    } else {
      const c = addClient(payload);
      toast.success(`Added ${c.name}`);
    }
    setDialogOpen(false);
  };
  const handleDelete = (c: Client) => {
    const tripCount = trips.filter((t) => t.clientId === c.id).length;
    const invCount = invoices.filter((i) => i.clientId === c.id).length;
    if (tripCount > 0 || invCount > 0) {
      toast.error(`Cannot delete — ${c.name} has ${tripCount} trip(s) and ${invCount} invoice(s)`);
      return;
    }
    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
    deleteClient(c.id);
    toast.success(`Deleted ${c.name}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Management"
        subtitle="Manage cargo customers, view their shipments and account status"
        breadcrumbs={[{ label: "Customer" }, { label: "Clients" }]}
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const clientTrips = trips.filter((t) => t.clientId === c.id);
          const revenue = clientTrips.reduce((s, t) => s + t.fare, 0);
          const completed = clientTrips.filter((t) => t.status === "completed").length;
          return (
            <Card key={c.id} className="border-brand-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-navy flex items-center justify-center shrink-0">
                    <span className="text-white font-extrabold text-base">{c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-brand-navy truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.industry}</div>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="w-3.5 h-3.5" />{c.email}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="w-3.5 h-3.5" />{c.phone}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{c.address}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <div className="text-base font-extrabold text-brand-navy">{clientTrips.length}</div>
                    <div className="text-[10px] text-muted-foreground">Trips</div>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-2 text-center">
                    <div className="text-base font-extrabold text-emerald-700">{completed}</div>
                    <div className="text-[10px] text-muted-foreground">Done</div>
                  </div>
                  <div className="rounded-lg bg-sky-50 p-2 text-center">
                    <div className="text-xs font-extrabold text-sky-700">{formatCurrency(revenue)}</div>
                    <div className="text-[10px] text-muted-foreground">Revenue</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(c)}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={() => handleDelete(c)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href="/trips">Trips</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Briefcase className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            No clients found
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.name}` : "Add Client"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company Name *">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp." />
              </Field>
              <Field label="Industry">
                <Input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Retail / FMCG" />
              </Field>
              <Field label="Contact Person *">
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Juan Dela Cruz" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+63 917 555 0000" />
              </Field>
              <Field label="Email" className="col-span-2">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ops@acme.com" />
              </Field>
              <Field label="Address" className="col-span-2">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, Province" />
              </Field>
              <Field label="Logo URL (optional)" className="col-span-2">
                <Input value={form.logoUrl ?? ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…" />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save Changes" : "Create Client"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "client") return <ClientView />;
  return <AdminClientView />;
}


