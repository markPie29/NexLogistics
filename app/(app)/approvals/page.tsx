"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2, XCircle, Clock, Handshake, Truck, AlertCircle, Eye,
  MapPin, User, Package, DollarSign, Car, Phone, FileText, Ruler,
  CalendarDays, Building2, UserCheck, Scale,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea, Label } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTripStore, useDriverStore, useFleetStore, useClientStore, usePartnerStore, useHelperStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const trips = useTripStore((s) => s.trips);
  const approveRates = useTripStore((s) => s.approveRates);
  const rejectRates = useTripStore((s) => s.rejectRates);
  const drivers = useDriverStore((s) => s.drivers);
  const helpers = useHelperStore((s) => s.helpers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const partners = usePartnerStore((s) => s.partners);
  const user = useAuthStore((s) => s.user);

  const [openId, setOpenId] = useState<string | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [notes, setNotes] = useState("");

  const role = user?.role;
  const isSuper = role === "super_admin";

  const pending = useMemo(
    () => trips.filter((t) => t.approvalStatus === "pending_rate_approval"),
    [trips]
  );

  const open = openId ? trips.find((t) => t.id === openId) : null;

  if (!isSuper) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Trip Rate Approvals"
          subtitle="Super Admin only — confirm trip rates before dispatch"
          breadcrumbs={[{ label: "Operations" }, { label: "Approvals" }]}
        />
        <Card><CardContent className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="font-semibold">Restricted Access</p>
          <p className="text-sm">Only Super Admins can review and confirm trip rates.</p>
        </CardContent></Card>
      </div>
    );
  }

  const handleApprove = () => {
    if (!open) return;
    approveRates(open.id, user?.name || "Super Admin", notes || undefined);
    toast.success(`Rates approved for ${open.id}`);
    setOpenId(null); setNotes(""); setRejectMode(false);
  };
  const handleReject = () => {
    if (!open) return;
    if (!notes.trim()) { toast.error("Rejection reason is required."); return; }
    rejectRates(open.id, user?.name || "Super Admin", notes);
    toast.success(`Rates rejected for ${open.id}`);
    setOpenId(null); setNotes(""); setRejectMode(false);
  };

  const totalPendingValue = pending.reduce((a, t) => a + (t.fare || 0), 0);
  const subconCount = pending.filter((t) => t.partnerId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip Rate Approvals"
        subtitle="Confirm in-house, subcon, employee commission, and driver/helper salary rates"
        breadcrumbs={[{ label: "Operations" }, { label: "Approvals" }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="Pending Approvals" value={pending.length} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard label="Total Pending Value" value={formatCurrency(totalPendingValue)} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" />
        <KpiCard label="Subcon Trips" value={subconCount} icon={Handshake} iconColor="text-violet-600" iconBg="bg-violet-50" />
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                <th className="py-3 px-4 font-medium">Trip ID</th>
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Client</th>
                <th className="py-3 px-4 font-medium">Type</th>
                <th className="py-3 px-4 font-medium">Driver / Partner</th>
                <th className="py-3 px-4 font-medium">Helper</th>
                <th className="py-3 px-4 font-medium text-right">Fare</th>
                <th className="py-3 px-4 font-medium text-right">Driver Rate</th>
                <th className="py-3 px-4 font-medium text-right">Commission</th>
                <th className="py-3 px-4 font-medium w-32"></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((t) => {
                const driver  = drivers.find((d) => d.id === t.driverId);
                const helper  = helpers.find((h) => h.id === t.helperId);
                const partner = partners.find((p) => p.id === t.partnerId);
                const client  = clients.find((c) => c.id === t.clientId);
                return (
                  <tr key={t.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs">
                      <Link href={`/trips/${t.id}`} className="text-brand-teal font-semibold hover:underline">{t.id}</Link>
                    </td>
                    <td className="py-3 px-4 text-xs">{new Date(t.pickup.scheduledAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{client?.name || "—"}</td>
                    <td className="py-3 px-4">
                      {partner
                        ? <Badge variant="warning"><Handshake className="w-3 h-3 mr-0.5" /> Subcon</Badge>
                        : <Badge variant="info">Company</Badge>}
                    </td>
                    <td className="py-3 px-4">{partner?.name || driver?.name || "—"}</td>
                    <td className="py-3 px-4">{helper?.name || <span className="text-muted-foreground text-xs">—</span>}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(t.fare || 0)}</td>
                    <td className="py-3 px-4 text-right font-mono">{t.driverRate ? formatCurrency(t.driverRate) : t.partnerRate ? formatCurrency(t.partnerRate) : "—"}</td>
                    <td className="py-3 px-4 text-right">{t.commissionPct ? `${t.commissionPct}%` : "—"}</td>
                    <td className="py-3 px-4">
                      <Button size="sm" variant="outline" onClick={() => { setOpenId(t.id); setRejectMode(false); setNotes(""); }}>
                        <Eye className="w-3 h-3" /> Review
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground flex-col">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold">All caught up</p>
                  <p className="text-xs">No trips are awaiting rate confirmation.</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!openId} onOpenChange={(v) => { if (!v) { setOpenId(null); setNotes(""); setRejectMode(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brand-navy">
              <Eye className="w-5 h-5 text-brand-teal" />
              Trip Rate Review &mdash; {open?.id}
            </DialogTitle>
          </DialogHeader>

          {open && (() => {
            const driver  = drivers.find((d) => d.id === open.driverId);
            const helper  = helpers.find((h) => h.id === open.helperId);
            const partner = partners.find((p) => p.id === open.partnerId);
            const vehicle = vehicles.find((v) => v.id === open.vehicleId);
            const client  = clients.find((c) => c.id === open.clientId);
            const isSubcon = !!partner;
            const totalOtherFees = (open.otherFees || []).reduce((s, f) => s + f.amount, 0);

            return (
              <div className="space-y-5 text-sm">

                {/* ── Type Banner ── */}
                <div className={`rounded-lg px-4 py-2.5 flex items-center gap-2 ${isSubcon ? "bg-violet-50 border border-violet-200" : "bg-brand-teal-light border border-brand-teal/30"}`}>
                  {isSubcon
                    ? <><Handshake className="w-4 h-4 text-violet-600" /><span className="font-semibold text-violet-700">Subcontractor Trip</span></>
                    : <><Truck className="w-4 h-4 text-brand-teal" /><span className="font-semibold text-brand-teal">Company-Owned Trip</span></>}
                  <Badge variant={isSubcon ? "warning" : "info"} className="ml-auto">{open.status.replace(/_/g, " ")}</Badge>
                </div>

                {/* ── Trip Overview ── */}
                <Section title="Trip Overview" icon={<FileText className="w-3.5 h-3.5" />}>
                  <Grid2>
                    <Row label="Trip ID" value={open.id} mono />
                    <Row label="Document No." value={open.documentNo || "—"} />
                    <Row label="Created" value={new Date(open.createdAt).toLocaleDateString("en-PH", { dateStyle: "medium" })} />
                    <Row label="Pickup Scheduled" value={new Date(open.pickup.scheduledAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })} />
                  </Grid2>
                </Section>

                {/* ── Cargo ── */}
                <Section title="Cargo Details" icon={<Package className="w-3.5 h-3.5" />}>
                  <Grid2>
                    <Row label="Cargo Type" value={open.cargo.type || "—"} />
                    <Row label="Units" value={String(open.cargo.units || "—")} />
                    <Row label="Weight" value={open.cargo.weightKg ? `${open.cargo.weightKg} kg` : "—"} />
                    <Row label="Description" value={open.cargo.description || "—"} />
                  </Grid2>
                </Section>

                {/* ── Route ── */}
                <Section title="Route" icon={<MapPin className="w-3.5 h-3.5" />}>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold shrink-0">A</span>
                      <div>
                        <p className="font-medium text-brand-navy">{open.pickup.address}</p>
                        <p className="text-xs text-muted-foreground">Scheduled: {new Date(open.pickup.scheduledAt).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="mt-0.5 w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">B</span>
                      <div>
                        <p className="font-medium text-brand-navy">{open.dropoff.address}</p>
                        <p className="text-xs text-muted-foreground">Scheduled: {new Date(open.dropoff.scheduledAt).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <Row label="Distance" value={open.distanceKm ? `${open.distanceKm} km` : "—"} />
                      <Row label="Total Fare" value={formatCurrency(open.fare || 0)} highlight />
                    </div>
                    {totalOtherFees > 0 && (
                      <div className="pt-1">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Other Fees</p>
                        {open.otherFees?.map((f) => (
                          <div key={f.id} className="flex justify-between text-xs py-0.5">
                            <span className="text-muted-foreground">{f.label}</span>
                            <span className="font-medium">{formatCurrency(f.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs pt-1 border-t border-brand-border/60 font-semibold">
                          <span>Total Other Fees</span><span>{formatCurrency(totalOtherFees)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </Section>

                {/* ── Client & Receiver ── */}
                <Section title="Client & Receiver" icon={<Building2 className="w-3.5 h-3.5" />}>
                  <Grid2>
                    <Row label="Client / Account" value={client?.name || "—"} />
                    <Row label="Client Contact" value={client?.contactPerson ? `${client.contactPerson} · ${client.phone}` : "—"} />
                    <Row label="Customer / Deliver To" value={open.customerName ?? open.consigneeName ?? "—"} />
                    <Row label="Receiver Contact" value={open.customerContact ?? open.consigneeContact ?? "—"} />
                  </Grid2>
                </Section>

                {/* ── Vehicle ── */}
                <Section title="Vehicle" icon={<Car className="w-3.5 h-3.5" />}>
                  {vehicle ? (
                    <Grid2>
                      <Row label="Plate No." value={vehicle.plate} mono />
                      <Row label="Type" value={vehicle.type} />
                      <Row label="Brand / Model" value={`${vehicle.brand} ${vehicle.model} (${vehicle.year})`} />
                      <Row label="Color" value={vehicle.color} />
                      <Row label="Capacity" value={vehicle.capacity} />
                      <Row label="Ownership" value={vehicle.ownership === "subcon" ? "Subcontractor" : "Company"} />
                    </Grid2>
                  ) : <p className="text-muted-foreground text-xs">No vehicle assigned</p>}
                </Section>

                {/* ── Personnel & Rates ── */}
                {isSubcon ? (
                  <Section title="Subcon Partner & Rates" icon={<DollarSign className="w-3.5 h-3.5" />}>
                    <Grid2>
                      <Row label="Partner Name" value={partner!.name} />
                      <Row label="Contact Person" value={partner!.contactPerson || "—"} />
                      <Row label="Phone" value={partner!.phone || "—"} />
                      <Row label="Partner Status" value={partner!.status} />
                    </Grid2>
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-violet-50 border border-violet-200 p-3">
                      <RateBox label="Subcon Payout Rate" value={open.partnerRate ? formatCurrency(open.partnerRate) : "—"} />
                      <RateBox label="Commission %" value={open.commissionPct ? `${open.commissionPct}%` : "—"} />
                    </div>
                  </Section>
                ) : (
                  <Section title="Driver, Helper & Rates" icon={<DollarSign className="w-3.5 h-3.5" />}>
                    <Grid2>
                      <Row label="Driver Name" value={driver?.name || "—"} />
                      <Row label="Driver Phone" value={driver?.phone || "—"} />
                      <Row label="License No." value={driver?.licenseNumber || "—"} />
                      <Row label="License Class" value={driver?.licenseClass || "—"} />
                    </Grid2>
                    {helper && (
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <Row label="Helper Name" value={helper.name} />
                        <Row label="Helper Phone" value={helper.phone || "—"} />
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-brand-teal-light border border-brand-teal/30 p-3">
                      <RateBox label="Driver Rate" value={open.driverRate ? formatCurrency(open.driverRate) : "—"} />
                      <RateBox label="Helper Rate" value={open.helperRate ? formatCurrency(open.helperRate) : helper ? "Not set" : "—"} />
                      <RateBox label="Commission %" value={open.commissionPct ? `${open.commissionPct}%` : "—"} />
                      <RateBox label="Helper Trip Fee" value={open.helperFee ? formatCurrency(open.helperFee) : "—"} />
                    </div>
                  </Section>
                )}

                {/* ── Notes ── */}
                {open.notes && (
                  <Section title="Trip Notes" icon={<FileText className="w-3.5 h-3.5" />}>
                    <p className="text-sm text-brand-navy bg-gray-50 rounded p-2 border border-brand-border/60">{open.notes}</p>
                  </Section>
                )}

                {/* ── Approval Action ── */}
                <div className="border-t border-brand-border/60 pt-4">
                  <Label className="font-semibold">{rejectMode ? "❌ Rejection Reason (required)" : "✅ Approval Notes (optional)"}</Label>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    placeholder={rejectMode
                      ? "Explain clearly why these rates cannot be approved..."
                      : "Add any notes for the dispatcher or record (optional)..."}
                  />
                </div>
              </div>
            );
          })()}

          <DialogFooter className="gap-2 pt-2 border-t border-brand-border/60">
            {rejectMode ? (
              <>
                <Button variant="outline" onClick={() => setRejectMode(false)}>← Back</Button>
                <Button onClick={handleReject} className="bg-status-danger hover:bg-status-danger/90 text-white">
                  <XCircle className="w-4 h-4" /> Confirm Reject
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRejectMode(true)} className="text-status-danger border-status-danger/30">
                  <XCircle className="w-4 h-4" /> Reject Rates
                </Button>
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Release to Dispatch
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <div className="bg-gray-50/70 border border-brand-border/60 rounded-lg p-3">
        {children}
      </div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-6 gap-y-1">{children}</div>;
}

function Row({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex flex-col py-1 border-b border-brand-border/40 last:border-0">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`font-medium text-brand-navy ${mono ? "font-mono text-xs" : "text-sm"} ${highlight ? "text-emerald-700 font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function RateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
      <p className="text-lg font-bold text-brand-navy">{value}</p>
    </div>
  );
}
