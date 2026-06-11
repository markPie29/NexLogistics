"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Truck, User as UserIcon, Package, Clock, CheckCircle2, FileText, Handshake, Receipt, AlertTriangle, Users, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input, Textarea, Label } from "@/components/ui/input";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useTripStore, useDriverStore, useFleetStore, useClientStore, usePodStore, usePartnerStore, useHelperStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { TripStatus } from "@/lib/types";
import Link from "next/link";

const NEXT_STATUS: Partial<Record<TripStatus, TripStatus>> = {
  scheduled: "driver_assigned",
  driver_assigned: "vehicle_dispatched",
  vehicle_dispatched: "loaded",
  loaded: "in_transit",
  in_transit: "delivered",
  delivered: "completed",
};

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === params.id));
  const setStatus = useTripStore((s) => s.setStatus);
  const updateTrip = useTripStore((s) => s.updateTrip);
  const deleteTrip = useTripStore((s) => s.deleteTrip);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const partners = usePartnerStore((s) => s.partners);
  const pods = usePodStore((s) => s.pods);
  const helpers = useHelperStore((s) => s.helpers);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    documentNo: "",
    customerName: "",
    customerContact: "",
    notes: "",
    fare: 0,
    distanceKm: 0,
    eta: "",
  });

  if (!trip) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Trip not found.</p>
        <Button className="mt-4" onClick={() => router.push("/trips")}><ArrowLeft className="w-4 h-4" /> Back to Trips</Button>
      </div>
    );
  }

  const driver = drivers.find((d) => d.id === trip.driverId);
  const vehicle = vehicles.find((v) => v.id === trip.vehicleId);
  const client = clients.find((c) => c.id === trip.clientId);
  const partner = partners.find((p) => p.id === trip.partnerId);
  const pod = pods.find((p) => p.tripId === trip.id);
  const helper = helpers.find((h) => h.id === trip.helperId);
  const next = NEXT_STATUS[trip.status];
  const otherFeesTotal = trip.otherFees?.reduce((a, f) => a + f.amount, 0) ?? 0;
  const grandTotal = trip.fare + otherFeesTotal;

  const advance = () => {
    if (!next) return;
    setStatus(trip.id, next, "dispatcher", `Advanced to ${next}`);
    toast.success(`Status → ${next.replace(/_/g, " ")}`);
  };

  const openEdit = () => {
    setEditForm({
      documentNo: trip.documentNo || "",
      customerName: trip.customerName || "",
      customerContact: trip.customerContact || "",
      notes: trip.notes || "",
      fare: trip.fare,
      distanceKm: trip.distanceKm,
      eta: trip.eta ? trip.eta.slice(0, 16) : "",
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    updateTrip(trip.id, {
      documentNo: editForm.documentNo,
      customerName: editForm.customerName,
      customerContact: editForm.customerContact,
      notes: editForm.notes,
      fare: editForm.fare,
      distanceKm: editForm.distanceKm,
      eta: editForm.eta ? new Date(editForm.eta).toISOString() : undefined,
    });
    setEditOpen(false);
    toast.success("Trip updated successfully");
  };

  const handleDelete = () => {
    deleteTrip(trip.id);
    toast.success("Trip deleted");
    router.push("/trips");
  };

  return (
    <div className="space-y-6">
      {trip.approvalStatus === "pending_rate_approval" && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 text-amber-800 rounded-xl px-5 py-3 text-sm font-medium">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>This trip is <strong>awaiting Super Admin rate approval</strong> before it can be dispatched.</span>
        </div>
      )}
      <PageHeader
        title={trip.id}
        subtitle={`${trip.pickup.address} → ${trip.dropoff.address}`}
        breadcrumbs={[{ label: "Trips", href: "/trips" }, { label: trip.id }]}
        actions={
          <>
            <Button variant="outline" onClick={() => router.push("/trips")}><ArrowLeft className="w-4 h-4" /> Back</Button>
            <Button variant="outline" onClick={openEdit}><Pencil className="w-4 h-4" /> Edit</Button>
            {next && <Button onClick={advance}><CheckCircle2 className="w-4 h-4" /> Advance to {next.replace(/_/g, " ")}</Button>}
            <Button variant="outline" asChild><Link href={`/pod/${trip.id}`}>Capture POD</Link></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="w-4 h-4" /> Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete trip {trip.id}? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Trip Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Detail icon={MapPin} label="Warehouse / Pickup" value={trip.pickup.address} sub={`Load: ${new Date(trip.pickup.scheduledAt).toLocaleString()}`} />
              <Detail icon={MapPin} label="Delivery Address" value={trip.dropoff.address} sub={`Unload: ${new Date(trip.dropoff.scheduledAt).toLocaleString()}`} />
              {partner ? (
                <Detail icon={Handshake} label="Subcon Partner" value={partner.name} sub={partner.contactPerson} />
              ) : (
                <Detail icon={UserIcon} label="Driver" value={driver?.name || "—"} sub={driver?.phone} />
              )}
              <Detail icon={Truck} label="Vehicle / Plate #" value={vehicle?.plate || (partner ? "Subcon-owned" : "—")} sub={vehicle ? `${vehicle.brand} ${vehicle.model}` : ""} />
              <Detail icon={Package} label="Item / Cargo" value={trip.cargo.type} sub={`${trip.cargo.weightKg} kg · ${trip.cargo.units} units (QTY)`} />
              <Detail icon={Clock} label="Rate" value={formatCurrency(trip.fare)} sub={otherFeesTotal > 0 ? `Total incl. fees: ${formatCurrency(grandTotal)}` : `${trip.distanceKm} km`} />
            </div>
            <div className="border-t border-brand-border pt-4">
              <div className="text-xs text-muted-foreground mb-1">Client</div>
              <div className="font-semibold text-brand-navy">{client?.name || "—"}</div>
              <div className="text-xs text-muted-foreground">{client?.contactPerson} · {client?.phone}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="info" className="text-base px-3 py-1">{trip.status.replace(/_/g, " ")}</Badge>
            <div className="text-xs text-muted-foreground">ETA: {trip.eta ? new Date(trip.eta).toLocaleString() : "—"}</div>
            {partner && trip.partnerPayoutStatus && (
              <div className="pt-2 border-t border-brand-border/60">
                <div className="text-xs text-muted-foreground">Subcon Payout</div>
                <Badge variant={trip.partnerPayoutStatus === "paid" ? "success" : "warning"}>{trip.partnerPayoutStatus}</Badge>
              </div>
            )}
            {/* Rates breakdown */}
            <div className="pt-2 border-t border-brand-border/60 space-y-1 text-xs">
              <div className="font-semibold text-brand-navy text-sm mb-1">Trip Rates</div>
              {partner ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Subcon Payout</span><span className="font-medium">{trip.partnerRate ? formatCurrency(trip.partnerRate) : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="font-medium">{trip.commissionPct ? `${trip.commissionPct}%` : "—"}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground">Driver Rate</span><span className="font-medium">{trip.driverRate ? formatCurrency(trip.driverRate) : "—"}</span></div>
                  {helper && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Helper</span><span className="font-medium">{helper.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Helper Rate</span><span className="font-medium">{trip.helperRate ? formatCurrency(trip.helperRate) : "—"}</span></div>
                    </>
                  )}
                </>
              )}
              {trip.approvalStatus === "approved" && trip.rateApprovedBy && (
                <div className="flex items-center gap-1 text-emerald-600 pt-1"><CheckCircle2 className="w-3 h-3" /> Rates approved by {trip.rateApprovedBy}</div>
              )}
              {trip.approvalStatus === "pending_rate_approval" && (
                <div className="flex items-center gap-1 text-amber-600 pt-1"><AlertTriangle className="w-3 h-3" /> Pending rate confirmation</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document & Customer Info */}
      {(trip.documentNo || trip.customerName || trip.consigneeName || trip.notes) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="w-4 h-4 text-brand-teal" /> Document & Customer Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">DR# / Document #</div>
              <div className="font-mono font-medium text-brand-navy">{trip.documentNo || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Customer / Client (Deliver To)</div>
              <div className="font-medium text-brand-navy">{trip.customerName ?? trip.consigneeName ?? "—"}</div>
              {(trip.customerContact ?? trip.consigneeContact) && <div className="text-xs text-muted-foreground">{trip.customerContact ?? trip.consigneeContact}</div>}
            </div>
            {trip.notes && (
              <div className="md:col-span-3">
                <div className="text-xs text-muted-foreground">Notes</div>
                <div className="text-sm text-brand-navy whitespace-pre-line">{trip.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Other Fees */}
      {trip.otherFees && trip.otherFees.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="w-4 h-4 text-brand-teal" /> Other Fees</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border">
                <th className="py-2 font-medium">Label</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr></thead>
              <tbody>
                {trip.otherFees.map((f) => (
                  <tr key={f.id} className="border-b border-brand-border/60">
                    <td className="py-2">{f.label}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(f.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 font-bold text-brand-navy">Subtotal Other Fees</td>
                  <td className="py-2 text-right font-bold text-brand-navy">{formatCurrency(otherFeesTotal)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-muted-foreground">Trip Rate</td>
                  <td className="py-2 text-right">{formatCurrency(trip.fare)}</td>
                </tr>
                <tr className="border-t border-brand-border">
                  <td className="py-2 font-bold text-brand-navy">Grand Total</td>
                  <td className="py-2 text-right font-bold text-brand-teal text-base">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
        <CardContent>
          <ol className="relative border-l-2 border-brand-border ml-3">
            {trip.statusLogs.map((log, i) => (
              <li key={i} className="ml-6 mb-5 last:mb-0">
                <div className="absolute -left-2 w-4 h-4 rounded-full bg-brand-teal border-4 border-white shadow" />
                <div className="text-sm font-bold text-brand-navy capitalize">{log.status.replace(/_/g, " ")}</div>
                <div className="text-xs text-muted-foreground">{new Date(log.at).toLocaleString()} {log.by ? `· by ${log.by}` : ""}</div>
                {log.note && <div className="text-xs text-muted-foreground italic mt-0.5">{log.note}</div>}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {pod && (
        <Card>
          <CardHeader><CardTitle>Proof of Delivery</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm"><b>Receiver:</b> {pod.receiverName} {pod.receiverContact ? `(${pod.receiverContact})` : ""}</div>
            <div className="text-xs text-muted-foreground">Captured {new Date(pod.timestamp).toLocaleString()} · GPS {pod.gps.lat.toFixed(4)}, {pod.gps.lng.toFixed(4)}</div>
            {pod.signatureDataUrl && <img src={pod.signatureDataUrl} alt="Signature" className="border border-brand-border rounded-lg max-w-xs bg-white" />}
            <div className="grid grid-cols-3 gap-2">
              {pod.photoDataUrls.map((url, i) => <img key={i} src={url} alt={`POD ${i}`} className="rounded-lg border border-brand-border" />)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Trip Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Edit Trip</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-documentNo">Document Number</Label>
              <Input id="edit-documentNo" value={editForm.documentNo} onChange={(e) => setEditForm((f) => ({ ...f, documentNo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-customerName">Customer Name</Label>
              <Input id="edit-customerName" value={editForm.customerName} onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-customerContact">Customer Contact</Label>
              <Input id="edit-customerContact" value={editForm.customerContact} onChange={(e) => setEditForm((f) => ({ ...f, customerContact: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea id="edit-notes" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-fare">Fare</Label>
              <Input id="edit-fare" type="number" min={0} step={0.01} value={editForm.fare} onChange={(e) => setEditForm((f) => ({ ...f, fare: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-distanceKm">Distance KM</Label>
              <Input id="edit-distanceKm" type="number" min={0} step={0.1} value={editForm.distanceKm} onChange={(e) => setEditForm((f) => ({ ...f, distanceKm: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-eta">ETA</Label>
              <Input id="edit-eta" type="datetime-local" value={editForm.eta} onChange={(e) => setEditForm((f) => ({ ...f, eta: e.target.value }))} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }: any) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-teal-light flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-brand-teal" /></div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium text-brand-navy">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}
