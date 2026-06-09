"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Label } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateScheduleForm, isFormDirty } from "@/lib/services/pms-validation";
import type {
  ScheduleFormData,
  ScheduleFormErrors,
  MaintenanceRecord,
  Vehicle,
} from "@/lib/services/pms-types";

// ─── Constants ───────────────────────────────────────────────────────────────

const SERVICE_TYPE_SUGGESTIONS = [
  "Oil Change",
  "Tire Replacement",
  "Brake Check",
  "Engine Inspection",
  "Transmission Service",
  "Registration Renewal",
  "Trailer Axle Service",
] as const;

const ALLOWED_VEHICLE_STATUSES = ["available", "in_trip", "maintenance"] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

export interface PmsScheduleModalProps {
  open: boolean;
  mode: "add" | "edit";
  record?: MaintenanceRecord;
  vehicles: Vehicle[];
  onSubmit: (data: Omit<MaintenanceRecord, "id">) => void;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTodayString(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function buildEmptyFormData(): ScheduleFormData {
  return {
    vehicleId: "",
    type: "",
    dueDate: "",
    dueOdometer: undefined,
    cost: undefined,
    notes: undefined,
  };
}

function buildFormDataFromRecord(record: MaintenanceRecord): ScheduleFormData {
  return {
    vehicleId: record.vehicleId,
    type: record.type,
    dueDate: record.dueDate,
    dueOdometer: record.dueOdometer,
    cost: record.cost,
    notes: record.notes,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PmsScheduleModal({
  open,
  mode,
  record,
  vehicles,
  onSubmit,
  onClose,
}: PmsScheduleModalProps) {
  // Filter vehicles: exclude "inactive", sort alphabetically by plate
  const eligibleVehicles = React.useMemo(() => {
    return vehicles
      .filter((v) =>
        (ALLOWED_VEHICLE_STATUSES as readonly string[]).includes(v.status)
      )
      .sort((a, b) => a.plate.localeCompare(b.plate));
  }, [vehicles]);

  // Initial form state (set on open / mode change)
  const initialData = React.useMemo<ScheduleFormData>(() => {
    if (mode === "edit" && record) {
      return buildFormDataFromRecord(record);
    }
    return buildEmptyFormData();
  }, [mode, record]);

  // Form state
  const [formData, setFormData] = React.useState<ScheduleFormData>(initialData);
  const [errors, setErrors] = React.useState<ScheduleFormErrors | null>(null);

  // Reset form when modal opens or mode/record changes
  React.useEffect(() => {
    if (open) {
      setFormData(initialData);
      setErrors(null);
    }
  }, [open, initialData]);

  // Derived state
  const dirty = isFormDirty(formData, initialData);

  // ─── Field Handlers ──────────────────────────────────────────────────────

  function updateField<K extends keyof ScheduleFormData>(
    field: K,
    value: ScheduleFormData[K]
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors?.[field]) {
      setErrors((prev) => (prev ? { ...prev, [field]: undefined } : null));
    }
  }

  // ─── Submit ──────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validateScheduleForm(formData);
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    const submittedRecord: Omit<MaintenanceRecord, "id"> = {
      vehicleId: formData.vehicleId,
      type: formData.type.trim(),
      dueDate: formData.dueDate,
      dueOdometer: formData.dueOdometer,
      cost: formData.cost,
      status: mode === "add" ? "upcoming" : (record?.status ?? "upcoming"),
      notes: formData.notes?.trim() || undefined,
      completedAt: record?.completedAt,
    };

    onSubmit(submittedRecord);
    onClose();
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const todayStr = getTodayString();

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] sm:max-w-[440px] flex flex-col"
      >
        <SheetHeader>
          <SheetTitle>
            {mode === "add" ? "Add Schedule" : "Edit Schedule"}
          </SheetTitle>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 flex-1 overflow-y-auto py-4"
          noValidate
        >
          {/* Vehicle Select */}
          <div className="space-y-2">
            <Label htmlFor="pms-vehicle" className="text-sm font-medium">Vehicle *</Label>
            <Select
              value={formData.vehicleId}
              onValueChange={(val) => updateField("vehicleId", val)}
            >
              <SelectTrigger
                id="pms-vehicle"
                aria-invalid={!!errors?.vehicleId}
                aria-describedby={errors?.vehicleId ? "pms-vehicle-error" : undefined}
              >
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {eligibleVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plate} — {v.brand} {v.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors?.vehicleId && (
              <p id="pms-vehicle-error" className="text-xs text-status-danger mt-1">
                {errors.vehicleId}
              </p>
            )}
          </div>

          {/* Service Type with datalist suggestions */}
          <div className="space-y-2">
            <Label htmlFor="pms-service-type" className="text-sm font-medium">Service Type *</Label>
            <Input
              id="pms-service-type"
              list="pms-service-suggestions"
              value={formData.type}
              onChange={(e) => updateField("type", e.target.value)}
              placeholder="e.g. Oil Change"
              aria-invalid={!!errors?.type}
              aria-describedby={errors?.type ? "pms-type-error" : undefined}
            />
            <datalist id="pms-service-suggestions">
              {SERVICE_TYPE_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {errors?.type && (
              <p id="pms-type-error" className="text-xs text-status-danger mt-1">
                {errors.type}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="pms-due-date" className="text-sm font-medium">Due Date *</Label>
            <Input
              id="pms-due-date"
              type="date"
              min={todayStr}
              value={formData.dueDate}
              onChange={(e) => updateField("dueDate", e.target.value)}
              aria-invalid={!!errors?.dueDate}
              aria-describedby={errors?.dueDate ? "pms-date-error" : undefined}
            />
            {errors?.dueDate && (
              <p id="pms-date-error" className="text-xs text-status-danger mt-1">
                {errors.dueDate}
              </p>
            )}
          </div>

          {/* Due Odometer & Estimated Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pms-odometer" className="text-sm font-medium">Due Odometer</Label>
              <Input
                id="pms-odometer"
                type="number"
                placeholder="km"
                min={0}
                max={9999999}
                value={formData.dueOdometer ?? ""}
                onChange={(e) =>
                  updateField(
                    "dueOdometer",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                aria-invalid={!!errors?.dueOdometer}
                aria-describedby={errors?.dueOdometer ? "pms-odometer-error" : undefined}
              />
              {errors?.dueOdometer && (
                <p id="pms-odometer-error" className="text-xs text-status-danger">
                  {errors.dueOdometer}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="pms-cost" className="text-sm font-medium">Estimated Cost</Label>
              <Input
                id="pms-cost"
                type="number"
                placeholder="₱"
                min={0}
                step={0.01}
                value={formData.cost ?? ""}
                onChange={(e) =>
                  updateField(
                    "cost",
                    e.target.value === "" ? undefined : Number(e.target.value)
                  )
                }
                aria-invalid={!!errors?.cost}
                aria-describedby={errors?.cost ? "pms-cost-error" : undefined}
              />
              {errors?.cost && (
                <p id="pms-cost-error" className="text-xs text-status-danger">
                  {errors.cost}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="pms-notes" className="text-sm font-medium">Notes</Label>
            <Textarea
              id="pms-notes"
              placeholder="Optional notes (max 500 characters)"
              maxLength={500}
              value={formData.notes ?? ""}
              onChange={(e) =>
                updateField(
                  "notes",
                  e.target.value === "" ? undefined : e.target.value
                )
              }
              aria-invalid={!!errors?.notes}
              aria-describedby={errors?.notes ? "pms-notes-error" : undefined}
            />
            {errors?.notes && (
              <p id="pms-notes-error" className="text-xs text-status-danger mt-1">
                {errors.notes}
              </p>
            )}
            {formData.notes && (
              <p className="text-xs text-muted-foreground text-right">
                {formData.notes.length}/500
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto pt-4 border-t border-brand-border">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!dirty}
            >
              {mode === "add" ? "Add Schedule" : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
