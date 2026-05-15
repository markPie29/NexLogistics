"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, ChevronLeft, Check, Plus, Trash2, Handshake, User as UserIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore, useDriverStore, useFleetStore, useClientStore, usePartnerStore, useHelperStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { TripFee } from "@/lib/types";

const schema = z.object({
  clientId: z.string().min(1, "Client is required"),
  pickupAddress: z.string().min(1),
  pickupAt: z.string().min(1),
  dropoffAddress: z.string().min(1),
  dropoffAt: z.string().min(1),
  cargoType: z.string().min(1),
  weightKg: z.coerce.number().min(0),
  units: z.coerce.number().min(0),
  description: z.string().optional(),
  documentNo: z.string().optional(),
  consigneeName: z.string().optional(),
  consigneeContact: z.string().optional(),
  notes: z.string().optional(),
  driverId: z.string().optional(),
  helperId: z.string().optional(),
  vehicleId: z.string().optional(),
  partnerId: z.string().optional(),
  fare: z.coerce.number().min(0),
  distanceKm: z.coerce.number().min(0),
  driverRate: z.coerce.number().min(0).optional(),
  helperRate: z.coerce.number().min(0).optional(),
  commissionPct: z.coerce.number().min(0).max(100).optional(),
  partnerRate: z.coerce.number().min(0).optional(),
});
type FormValues = z.infer<typeof schema>;

const STEPS = ["Pickup & Dropoff", "Cargo & Documents", "Assignment & Fees", "Review"];

export default function NewTripPage() {
  const router = useRouter();
  const addTrip = useTripStore((s) => s.addTrip);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const partners = usePartnerStore((s) => s.partners.filter((p) => p.status === "active"));
  const helpers = useHelperStore((s) => s.helpers.filter((h) => h.status === "active"));
  const [step, setStep] = useState(0);
  const [useSubcon, setUseSubcon] = useState(false);
  const [otherFees, setOtherFees] = useState<TripFee[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fare: 10000, distanceKm: 50 },
  });

  const otherFeesTotal = otherFees.reduce((a, f) => a + (Number(f.amount) || 0), 0);

  const addFeeRow = () =>
    setOtherFees((prev) => [...prev, { id: `fee-${Date.now().toString(36)}-${prev.length}`, label: "", amount: 0 }]);
  const updateFee = (id: string, patch: Partial<TripFee>) =>
    setOtherFees((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeFee = (id: string) => setOtherFees((prev) => prev.filter((f) => f.id !== id));

  const onSubmit = (v: FormValues) => {
    if (useSubcon && !v.partnerId) {
      toast.error("Subcon partner is required when assignment mode is Subcon.");
      return;
    }
    if (!useSubcon && (!v.driverId || !v.vehicleId)) {
      toast.error("Driver and Vehicle are required for in-house assignment.");
      return;
    }
    const cleanFees = otherFees
      .filter((f) => f.label.trim() && Number(f.amount) > 0)
      .map((f) => ({ ...f, amount: Number(f.amount) }));

    const trip = addTrip({
      clientId: v.clientId,
      driverId: useSubcon ? undefined : v.driverId,
      vehicleId: useSubcon ? undefined : v.vehicleId,
      partnerId: useSubcon ? v.partnerId : undefined,
      partnerPayoutStatus: useSubcon ? "pending" : undefined,
      helperId: !useSubcon && v.helperId ? v.helperId : undefined,
      helperName: !useSubcon && v.helperId ? helpers.find((h) => h.id === v.helperId)?.name : undefined,
      helperContact: !useSubcon && v.helperId ? helpers.find((h) => h.id === v.helperId)?.phone : undefined,
      pickup: { address: v.pickupAddress, scheduledAt: v.pickupAt, lat: 14.5995, lng: 120.9842 },
      dropoff: { address: v.dropoffAddress, scheduledAt: v.dropoffAt, lat: 14.6760, lng: 121.0437 },
      cargo: { type: v.cargoType, weightKg: v.weightKg, units: v.units, description: v.description },
      distanceKm: v.distanceKm,
      fare: v.fare,
      driverRate: !useSubcon ? v.driverRate : undefined,
      helperRate: !useSubcon && v.helperId ? v.helperRate : undefined,
      commissionPct: useSubcon ? v.commissionPct : undefined,
      partnerRate: useSubcon ? v.partnerRate : undefined,
      status: "scheduled",
      // 🔒 Phase 5 — every new trip enters Super Admin rate-confirmation queue
      approvalStatus: "pending_rate_approval",
      eta: v.dropoffAt,
      documentNo: v.documentNo || undefined,
      consigneeName: v.consigneeName || undefined,
      consigneeContact: v.consigneeContact || undefined,
      customerName: v.consigneeName || undefined,
      customerContact: v.consigneeContact || undefined,
      notes: v.notes || undefined,
      otherFees: cleanFees.length ? cleanFees : undefined,
    });
    toast.success(`Trip ${trip.id} submitted for rate approval`);
    router.push(`/trips/${trip.id}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Create New Trip" subtitle="Schedule a new delivery in 4 quick steps" breadcrumbs={[{ label: "Trips", href: "/trips" }, { label: "New" }]} />

      <Card><CardContent className="p-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i <= step ? "bg-brand-teal text-white" : "bg-gray-100 text-muted-foreground"}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:inline ${i === step ? "text-brand-navy" : "text-muted-foreground"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${i < step ? "bg-brand-teal" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Client" error={errors.clientId?.message}>
                  <Select onValueChange={(v) => setValue("clientId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                    <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <div />
              </div>
              <Field label="Warehouse / Pickup Point" error={errors.pickupAddress?.message}><Input placeholder="Manila Port Area" {...register("pickupAddress")} /></Field>
              <Field label="Load Date / Time" error={errors.pickupAt?.message}><Input type="datetime-local" {...register("pickupAt")} /></Field>
              <Field label="Delivery Address" error={errors.dropoffAddress?.message}><Input placeholder="San Fernando, Pampanga" {...register("dropoffAddress")} /></Field>
              <Field label="Unload Date / Time" error={errors.dropoffAt?.message}><Input type="datetime-local" {...register("dropoffAt")} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Item / Cargo Type" error={errors.cargoType?.message}><Input placeholder="Frozen Goods" {...register("cargoType")} /></Field>
                <Field label="DR# / Document #"><Input placeholder="DR-2026-0042" {...register("documentNo")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="QTY (units)" error={errors.units?.message}><Input type="number" {...register("units")} /></Field>
                <Field label="Weight (kg)" error={errors.weightKg?.message}><Input type="number" {...register("weightKg")} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Customer / Client (Deliver To)"><Input placeholder="Juan dela Cruz" {...register("consigneeName")} /></Field>
                <Field label="Customer / Client Contact"><Input placeholder="0917XXXXXXX" {...register("consigneeContact")} /></Field>
              </div>
              <Field label="Cargo Description"><Textarea rows={2} {...register("description")} /></Field>
              <Field label="Notes"><Textarea rows={3} placeholder="Special handling, gate access, etc." {...register("notes")} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {/* Subcon toggle */}
              <div className="rounded-lg border border-brand-border/60 bg-gray-50 p-3 space-y-2">
                <p className="text-sm font-bold text-brand-navy">Assignment Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUseSubcon(false)}
                    className={`rounded-md border px-3 py-2 text-left text-sm flex items-center gap-2 transition ${
                      !useSubcon ? "border-brand-teal bg-brand-teal/10 text-brand-navy" : "border-brand-border/60 bg-white text-muted-foreground"
                    }`}
                  >
                    <UserIcon className="w-4 h-4" /> In-House Driver
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseSubcon(true)}
                    className={`rounded-md border px-3 py-2 text-left text-sm flex items-center gap-2 transition ${
                      useSubcon ? "border-brand-teal bg-brand-teal/10 text-brand-navy" : "border-brand-border/60 bg-white text-muted-foreground"
                    }`}
                  >
                    <Handshake className="w-4 h-4" /> Subcon Partner
                  </button>
                </div>
              </div>

              {useSubcon ? (
                <>
                  <Field label="Subcon Partner">
                    <Select onValueChange={(v) => setValue("partnerId", v)}>
                      <SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger>
                      <SelectContent>{partners.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Subcon Payout Rate (₱)"><Input type="number" placeholder="e.g. 8000" {...register("partnerRate")} /></Field>
                    <Field label="Commission % (to subcon)"><Input type="number" placeholder="e.g. 10" {...register("commissionPct")} /></Field>
                  </div>
                </>
              ) : (
                <>
                  <Field label="Driver">
                    <Select onValueChange={(v) => setValue("driverId", v)}>
                      <SelectTrigger><SelectValue placeholder="Assign driver..." /></SelectTrigger>
                      <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Helper (optional)">
                    <Select onValueChange={(v) => setValue("helperId", v === "__none__" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="Assign helper (optional)..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {helpers.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Vehicle (Plate #)">
                    <Select onValueChange={(v) => setValue("vehicleId", v)}>
                      <SelectTrigger><SelectValue placeholder="Assign vehicle..." /></SelectTrigger>
                      <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model} {v.ownership === "subcon" ? "(Subcon)" : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Driver Rate (₱)"><Input type="number" placeholder="e.g. 1500" {...register("driverRate")} /></Field>
                    <Field label="Helper Rate (₱)"><Input type="number" placeholder="e.g. 500" {...register("helperRate")} /></Field>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Distance (km)"><Input type="number" {...register("distanceKm")} /></Field>
                <Field label="Rate / Total Fare (₱)"><Input type="number" {...register("fare")} /></Field>
              </div>

              {/* Other Fees repeater */}
              <div className="rounded-lg border border-brand-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-brand-navy">Other Fees</p>
                    <p className="text-xs text-muted-foreground">Toll, parking, helper, etc. Itemized on payslip & invoice.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={addFeeRow}><Plus className="w-3 h-3" /> Add Row</Button>
                </div>
                {otherFees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No other fees added.</p>
                ) : (
                  <div className="space-y-2">
                    {otherFees.map((f) => (
                      <div key={f.id} className="grid grid-cols-[1fr_120px_32px] gap-2 items-center">
                        <Input placeholder="Label (e.g. Toll - SLEX)" value={f.label} onChange={(e) => updateFee(f.id, { label: e.target.value })} />
                        <Input type="number" placeholder="Amount" value={f.amount || ""} onChange={(e) => updateFee(f.id, { amount: Number(e.target.value) || 0 })} />
                        <Button type="button" size="icon" variant="ghost" onClick={() => removeFee(f.id)}><Trash2 className="w-4 h-4 text-status-danger" /></Button>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-brand-border/60 pt-2 text-sm">
                      <span className="font-medium text-muted-foreground">Subtotal Other Fees</span>
                      <span className="font-bold text-brand-navy">{formatCurrency(otherFeesTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-brand-navy text-lg">Review</h3>
              <ReviewRow label="Client" value={clients.find(c => c.id === watch("clientId"))?.name} />
              <ReviewRow label="DR# / Document" value={watch("documentNo")} />
              <ReviewRow label="Pickup" value={`${watch("pickupAddress")} · ${watch("pickupAt")}`} />
              <ReviewRow label="Dropoff" value={`${watch("dropoffAddress")} · ${watch("dropoffAt")}`} />
              <ReviewRow label="Customer / Client" value={watch("consigneeName") ? `${watch("consigneeName")} · ${watch("consigneeContact") || "—"}` : undefined} />
              <ReviewRow label="Cargo" value={`${watch("cargoType")} · ${watch("weightKg")}kg · ${watch("units")} units`} />
              {useSubcon ? (
                <>
                  <ReviewRow label="Subcon Partner" value={partners.find(p => p.id === watch("partnerId"))?.name} />
                  {watch("partnerRate") ? <ReviewRow label="Subcon Payout Rate" value={formatCurrency(Number(watch("partnerRate")) || 0)} /> : null}
                  {watch("commissionPct") ? <ReviewRow label="Commission %" value={`${watch("commissionPct")}%`} /> : null}
                </>
              ) : (
                <>
                  <ReviewRow label="Driver" value={drivers.find(d => d.id === watch("driverId"))?.name} />
                  <ReviewRow label="Helper" value={helpers.find(h => h.id === watch("helperId"))?.name} />
                  <ReviewRow label="Vehicle" value={vehicles.find(v => v.id === watch("vehicleId"))?.plate} />
                  {watch("driverRate") ? <ReviewRow label="Driver Rate" value={formatCurrency(Number(watch("driverRate")) || 0)} /> : null}
                  {watch("helperRate") ? <ReviewRow label="Helper Rate" value={formatCurrency(Number(watch("helperRate")) || 0)} /> : null}
                </>
              )}
              <ReviewRow label="Distance" value={`${watch("distanceKm")} km`} />
              <ReviewRow label="Total Rate" value={formatCurrency(Number(watch("fare")) || 0)} />
              {otherFees.length > 0 && (
                <ReviewRow label="Other Fees" value={`${otherFees.length} item(s) · ${formatCurrency(otherFeesTotal)}`} />
              )}
              {watch("notes") && <ReviewRow label="Notes" value={watch("notes")} />}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ChevronLeft className="w-4 h-4" /> Back</Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>Next <ChevronRight className="w-4 h-4" /></Button>
            ) : (
              <Button type="submit">Submit for Approval <Check className="w-4 h-4" /></Button>
            )}
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-status-danger">{error}</p>}</div>;
}
function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return <div className="flex justify-between border-b border-brand-border/60 py-2 gap-3"><span className="text-muted-foreground shrink-0">{label}</span><span className="font-medium text-brand-navy text-right">{value || "—"}</span></div>;
}
