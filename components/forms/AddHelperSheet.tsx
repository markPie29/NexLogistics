"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useHelperStore, useDriverStore } from "@/lib/store";
import { toast } from "sonner";
import type { Helper } from "@/lib/types";

const helperSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  status: z.enum(["active", "off_duty", "on_leave"]),
  assignedDriverId: z.string().optional(),
  employmentType: z.enum(["per_trip", "monthly", "hybrid"]),
  monthlyBaseSalary: z.number().min(0, "Must be a positive number").optional(),
  baseRatePerTrip: z.number().min(0, "Must be a positive number").optional(),
  ratePerKm: z.number().min(0, "Must be a positive number").optional(),
  commissionPercent: z.number().min(0).max(100, "Must be between 0 and 100").optional(),
  notes: z.string().max(500, "Maximum 500 characters").optional(),
});

type FormValues = z.infer<typeof helperSchema>;

interface AddHelperSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editHelper?: Helper | null;
}

export function AddHelperSheet({ open, onOpenChange, editHelper }: AddHelperSheetProps) {
  const addHelper = useHelperStore((s) => s.addHelper);
  const updateHelper = useHelperStore((s) => s.updateHelper);
  const drivers = useDriverStore((s) => s.drivers);
  const isEditMode = !!editHelper;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(helperSchema),
    defaultValues: {
      status: "active",
      employmentType: "per_trip",
    },
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (open && editHelper) {
      reset({
        name: editHelper.name,
        phone: editHelper.phone,
        email: editHelper.email ?? "",
        address: editHelper.address ?? "",
        emergencyContact: editHelper.emergencyContact ?? "",
        status: editHelper.status,
        assignedDriverId: editHelper.assignedDriverId ?? "",
        employmentType: editHelper.employmentType ?? "per_trip",
        monthlyBaseSalary: editHelper.monthlyBaseSalary,
        baseRatePerTrip: editHelper.baseRatePerTrip,
        ratePerKm: editHelper.ratePerKm,
        commissionPercent: editHelper.commissionPercent,
        notes: editHelper.notes ?? "",
      });
    } else if (open && !editHelper) {
      reset({
        status: "active",
        employmentType: "per_trip",
        name: "",
        phone: "",
        email: "",
        address: "",
        emergencyContact: "",
        assignedDriverId: "",
        monthlyBaseSalary: undefined,
        baseRatePerTrip: undefined,
        ratePerKm: undefined,
        commissionPercent: undefined,
        notes: "",
      });
    }
  }, [open, editHelper, reset]);

  const currentStatus = watch("status");
  const currentDriverId = watch("assignedDriverId");
  const employmentType = watch("employmentType");

  const showMonthlySalary = employmentType === "monthly" || employmentType === "hybrid";
  const showPerTripRate = employmentType === "per_trip" || employmentType === "hybrid";

  const onSubmit = (values: FormValues) => {
    const payload = {
      ...values,
      assignedDriverId: values.assignedDriverId || undefined,
      address: values.address || undefined,
      emergencyContact: values.emergencyContact || undefined,
      email: values.email || undefined,
      notes: values.notes || undefined,
      monthlyBaseSalary: values.monthlyBaseSalary ?? undefined,
      baseRatePerTrip: values.baseRatePerTrip ?? undefined,
      ratePerKm: values.ratePerKm ?? undefined,
      commissionPercent: values.commissionPercent ?? undefined,
    };

    if (isEditMode && editHelper) {
      updateHelper(editHelper.id, payload);
      toast.success(`Helper ${values.name} updated`);
    } else {
      addHelper({
        ...payload,
        rating: 0,
        onTimePercent: 100,
        totalTrips: 0,
      } as Omit<Helper, "id" | "createdAt">);
      toast.success(`Helper ${values.name} added`);
    }
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? "Edit Helper" : "Add Helper"}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Update helper information and assignment."
              : "Register a new helper to your crew roster."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name" error={errors.name?.message}>
              <Input placeholder="Helper name" {...register("name")} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <Input placeholder="0917 123 4567" {...register("phone")} />
            </Field>
          </div>

          {/* Email & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="helper@example.com" {...register("email")} />
            </Field>
            <Field label="Status">
              <Select value={currentStatus} onValueChange={(v: any) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Address */}
          <Field label="Address">
            <Input placeholder="Quezon City, Metro Manila" {...register("address")} />
          </Field>

          {/* Emergency Contact */}
          <Field label="Emergency Contact">
            <Input placeholder="Maria Santos — 0917 555 1234" {...register("emergencyContact")} />
          </Field>

          {/* Assigned Driver */}
          <Field label="Assigned Driver">
            <Select
              value={currentDriverId || "_none"}
              onValueChange={(v) => setValue("assignedDriverId", v === "_none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="— None —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">— None —</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Employment Type */}
          <Field label="Employment Type">
            <Select
              value={employmentType}
              onValueChange={(v: any) => setValue("employmentType", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="per_trip">Per Trip</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Conditional: Monthly Salary */}
          {showMonthlySalary && (
            <Field label="Monthly Salary" error={errors.monthlyBaseSalary?.message}>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("monthlyBaseSalary", { valueAsNumber: true })}
              />
            </Field>
          )}

          {/* Conditional: Per Trip Rate */}
          {showPerTripRate && (
            <Field label="Per Trip Rate" error={errors.baseRatePerTrip?.message}>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("baseRatePerTrip", { valueAsNumber: true })}
              />
            </Field>
          )}

          {/* Rate per KM & Commission % */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Rate per KM" error={errors.ratePerKm?.message}>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                {...register("ratePerKm", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Commission %" error={errors.commissionPercent?.message}>
              <Input
                type="number"
                placeholder="0"
                min={0}
                max={100}
                {...register("commissionPercent", { valueAsNumber: true })}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes" error={errors.notes?.message}>
            <Textarea
              placeholder="Additional notes about this helper..."
              rows={3}
              {...register("notes")}
            />
          </Field>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditMode ? "Save Changes" : "Add Helper"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
