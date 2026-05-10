"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTripStore, useDriverStore, useFleetStore, useClientStore } from "@/lib/store";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";

const schema = z.object({
  clientId: z.string().min(1),
  pickupAddress: z.string().min(1),
  pickupAt: z.string().min(1),
  dropoffAddress: z.string().min(1),
  dropoffAt: z.string().min(1),
  cargoType: z.string().min(1),
  weightKg: z.coerce.number().min(0),
  units: z.coerce.number().min(0),
  description: z.string().optional(),
  driverId: z.string().min(1),
  vehicleId: z.string().min(1),
  fare: z.coerce.number().min(0),
  distanceKm: z.coerce.number().min(0),
});
type FormValues = z.infer<typeof schema>;

const STEPS = ["Pickup & Dropoff", "Cargo", "Assignment", "Review"];

export default function NewTripPage() {
  const router = useRouter();
  const addTrip = useTripStore((s) => s.addTrip);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const clients = useClientStore((s) => s.clients);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, setValue, watch, getValues, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fare: 10000, distanceKm: 50 },
  });

  const onSubmit = (v: FormValues) => {
    const trip = addTrip({
      clientId: v.clientId,
      driverId: v.driverId,
      vehicleId: v.vehicleId,
      pickup: { address: v.pickupAddress, scheduledAt: v.pickupAt, lat: 14.5995, lng: 120.9842 },
      dropoff: { address: v.dropoffAddress, scheduledAt: v.dropoffAt, lat: 14.6760, lng: 121.0437 },
      cargo: { type: v.cargoType, weightKg: v.weightKg, units: v.units, description: v.description },
      distanceKm: v.distanceKm,
      fare: v.fare,
      status: "scheduled",
      eta: v.dropoffAt,
    });
    toast.success(`Trip ${trip.id} created`);
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
              <span className={`ml-2 text-xs font-medium ${i === step ? "text-brand-navy" : "text-muted-foreground"}`}>{s}</span>
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
              <Field label="Pickup Address" error={errors.pickupAddress?.message}><Input placeholder="Manila Port Area" {...register("pickupAddress")} /></Field>
              <Field label="Pickup Date/Time" error={errors.pickupAt?.message}><Input type="datetime-local" {...register("pickupAt")} /></Field>
              <Field label="Dropoff Address" error={errors.dropoffAddress?.message}><Input placeholder="San Fernando, Pampanga" {...register("dropoffAddress")} /></Field>
              <Field label="Dropoff Date/Time" error={errors.dropoffAt?.message}><Input type="datetime-local" {...register("dropoffAt")} /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Cargo Type" error={errors.cargoType?.message}><Input placeholder="Frozen Goods" {...register("cargoType")} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Weight (kg)" error={errors.weightKg?.message}><Input type="number" {...register("weightKg")} /></Field>
                <Field label="Units" error={errors.units?.message}><Input type="number" {...register("units")} /></Field>
              </div>
              <Field label="Description"><Textarea rows={3} {...register("description")} /></Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Field label="Driver" error={errors.driverId?.message}>
                <Select onValueChange={(v) => setValue("driverId", v)}>
                  <SelectTrigger><SelectValue placeholder="Assign driver..." /></SelectTrigger>
                  <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Vehicle" error={errors.vehicleId?.message}>
                <Select onValueChange={(v) => setValue("vehicleId", v)}>
                  <SelectTrigger><SelectValue placeholder="Assign vehicle..." /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Distance (km)"><Input type="number" {...register("distanceKm")} /></Field>
                <Field label="Fare (₱)"><Input type="number" {...register("fare")} /></Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <h3 className="font-bold text-brand-navy text-lg">Review</h3>
              <ReviewRow label="Client" value={clients.find(c => c.id === watch("clientId"))?.name} />
              <ReviewRow label="Pickup" value={`${watch("pickupAddress")} · ${watch("pickupAt")}`} />
              <ReviewRow label="Dropoff" value={`${watch("dropoffAddress")} · ${watch("dropoffAt")}`} />
              <ReviewRow label="Cargo" value={`${watch("cargoType")} · ${watch("weightKg")}kg · ${watch("units")} units`} />
              <ReviewRow label="Driver" value={drivers.find(d => d.id === watch("driverId"))?.name} />
              <ReviewRow label="Vehicle" value={vehicles.find(v => v.id === watch("vehicleId"))?.plate} />
              <ReviewRow label="Fare" value={`₱${Number(watch("fare")).toLocaleString()}`} />
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ChevronLeft className="w-4 h-4" /> Back</Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>Next <ChevronRight className="w-4 h-4" /></Button>
            ) : (
              <Button type="submit">Create Trip <Check className="w-4 h-4" /></Button>
            )}
          </div>
        </form>
      </CardContent></Card>
    </div>
  );
}

function Field({ label, error, children }: any) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-status-danger">{error}</p>}</div>;
}
function ReviewRow({ label, value }: any) {
  return <div className="flex justify-between border-b border-brand-border/60 py-2"><span className="text-muted-foreground">{label}</span><span className="font-medium text-brand-navy text-right">{value || "—"}</span></div>;
}
