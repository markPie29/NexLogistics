"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useFleetStore, useDriverStore } from "@/lib/store";
import { toast } from "sonner";
import type { Vehicle } from "@/lib/types";

const schema = z.object({
  plate: z.string().min(2, "Plate required"),
  type: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.coerce.number().min(1990).max(2030),
  color: z.string().min(1),
  capacity: z.string().min(1),
  fuelType: z.enum(["Diesel", "Gasoline", "Electric", "Hybrid"]),
  odometer: z.coerce.number().min(0),
  status: z.enum(["available", "in_trip", "maintenance", "inactive"]),
  assignedDriverId: z.string().optional(),
  registrationExpiry: z.string().min(1),
  insuranceExpiry: z.string().min(1),
  permitExpiry: z.string().min(1),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AddVehicleSheet({ open, onOpenChange }: Props) {
  const addVehicle = useFleetStore((s) => s.addVehicle);
  const drivers = useDriverStore((s) => s.drivers);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "Truck",
      fuelType: "Diesel",
      status: "available",
      year: 2024,
      odometer: 0,
    },
  });

  const onSubmit = (values: FormValues) => {
    addVehicle({
      ...values,
      assignedDriverId: values.assignedDriverId || undefined,
    } as Omit<Vehicle, "id" | "createdAt">);
    toast.success(`Vehicle ${values.plate} added`);
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Vehicle</SheetTitle>
          <SheetDescription>Register a new vehicle in your fleet.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plate Number" error={errors.plate?.message}>
              <Input placeholder="NEX-111" {...register("plate")} />
            </Field>
            <Field label="Vehicle Type" error={errors.type?.message}>
              <Select defaultValue="Truck" onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Truck", "Van", "Pickup", "Trailer", "Motorcycle"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand" error={errors.brand?.message}><Input placeholder="Isuzu" {...register("brand")} /></Field>
            <Field label="Model" error={errors.model?.message}><Input placeholder="FTR" {...register("model")} /></Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Year" error={errors.year?.message}><Input type="number" {...register("year")} /></Field>
            <Field label="Color" error={errors.color?.message}><Input placeholder="White" {...register("color")} /></Field>
            <Field label="Capacity" error={errors.capacity?.message}><Input placeholder="5T" {...register("capacity")} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fuel Type" error={errors.fuelType?.message}>
              <Select defaultValue="Diesel" onValueChange={(v: any) => setValue("fuelType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Diesel", "Gasoline", "Electric", "Hybrid"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Odometer (km)" error={errors.odometer?.message}><Input type="number" {...register("odometer")} /></Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <Select defaultValue="available" onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="in_trip">In Trip</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned Driver">
              <Select onValueChange={(v) => setValue("assignedDriverId", v === "_none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">— Unassigned —</SelectItem>
                  {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Registration Expiry" error={errors.registrationExpiry?.message}><Input type="date" {...register("registrationExpiry")} /></Field>
            <Field label="Insurance Expiry" error={errors.insuranceExpiry?.message}><Input type="date" {...register("insuranceExpiry")} /></Field>
            <Field label="Permit Expiry" error={errors.permitExpiry?.message}><Input type="date" {...register("permitExpiry")} /></Field>
          </div>

          <Field label="Notes"><Textarea rows={3} {...register("notes")} /></Field>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>Add Vehicle</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
