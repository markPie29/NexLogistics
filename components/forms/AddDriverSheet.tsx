"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDriverStore, useFleetStore } from "@/lib/store";
import { toast } from "sonner";
import type { Driver } from "@/lib/types";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Phone required"),
  licenseNumber: z.string().min(4, "License number required"),
  licenseClass: z.string().min(1, "License class required"),
  licenseExpiry: z.string().min(1, "Expiry required"),
  hireDate: z.string().min(1, "Hire date required"),
  status: z.enum(["active", "off_duty", "on_leave"]),
  assignedVehicleId: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editDriver?: Driver | null; // when provided, enters edit mode
}

export function AddDriverSheet({ open, onOpenChange, editDriver }: Props) {
  const addDriver = useDriverStore((s) => s.addDriver);
  const updateDriver = useDriverStore((s) => s.updateDriver);
  const vehicles = useFleetStore((s) => s.vehicles);
  const isEditMode = !!editDriver;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "active",
      licenseClass: "Restriction 1,2,3",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (open && editDriver) {
      reset({
        name: editDriver.name,
        email: editDriver.email,
        phone: editDriver.phone,
        licenseNumber: editDriver.licenseNumber,
        licenseClass: editDriver.licenseClass,
        licenseExpiry: editDriver.licenseExpiry,
        hireDate: editDriver.hireDate,
        status: editDriver.status,
        assignedVehicleId: editDriver.assignedVehicleId ?? "",
        address: editDriver.address ?? "",
        emergencyContact: editDriver.emergencyContact ?? "",
      });
    } else if (open && !editDriver) {
      reset({ status: "active", licenseClass: "Restriction 1,2,3" });
    }
  }, [open, editDriver, reset]);

  const currentStatus = watch("status");
  const currentVehicle = watch("assignedVehicleId");

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      assignedVehicleId: values.assignedVehicleId || undefined,
      address: values.address || undefined,
      emergencyContact: values.emergencyContact || undefined,
    };

    if (isEditMode && editDriver) {
      updateDriver(editDriver.id, payload);
      toast.success(`Driver ${values.name} updated`);
    } else {
      addDriver({
        ...payload,
        rating: 4.5,
        onTimePercent: 90,
        totalTrips: 0,
      } as Omit<Driver, "id">);
      toast.success(`Driver ${values.name} added to the roster`);
    }
    reset();
    onOpenChange(false);
  };

  // Available vehicles: unassigned OR currently assigned to this driver
  const availableVehicles = vehicles.filter(
    (v) => !v.assignedDriverId || v.id === editDriver?.assignedVehicleId
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? `Edit Driver — ${editDriver?.name}` : "Add New Driver"}</SheetTitle>
          <SheetDescription>
            {isEditMode ? "Update driver information and assignment." : "Register a new driver to your fleet roster."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Full Name" error={errors.name?.message}>
              <Input placeholder="Juan Dela Cruz" {...register("name")} />
            </Field>
            <Field label="Status">
              <Select value={currentStatus} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="juan@nexlogistics.demo" {...register("email")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input placeholder="0917 123 4567" {...register("phone")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="License Number" error={errors.licenseNumber?.message}>
              <Input placeholder="N01-25-123456" {...register("licenseNumber")} />
            </Field>
            <Field label="License Class" error={errors.licenseClass?.message}>
              <Input placeholder="Restriction 1,2,3" {...register("licenseClass")} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="License Expiry" error={errors.licenseExpiry?.message}>
              <Input type="date" {...register("licenseExpiry")} />
            </Field>
            <Field label="Hire Date" error={errors.hireDate?.message}>
              <Input type="date" {...register("hireDate")} />
            </Field>
          </div>

          <Field label="Assign Vehicle">
            <Select
              value={currentVehicle || "_none"}
              onValueChange={(v) => setValue("assignedVehicleId", v === "_none" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="— Unassigned —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— Unassigned —</SelectItem>
                {availableVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Address">
            <Input placeholder="Quezon City, Metro Manila" {...register("address")} />
          </Field>

          <Field label="Emergency Contact">
            <Input placeholder="Maria Santos — 0917 555 1234" {...register("emergencyContact")} />
          </Field>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? "Save Changes" : "Add Driver"}
            </Button>
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
