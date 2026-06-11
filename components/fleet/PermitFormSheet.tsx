"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import type { VehiclePermit, PermitCategory, FileAttachment } from "@/lib/types";
import { useVehicleDocumentStore } from "@/lib/store";
import {
  PERMIT_CATEGORIES,
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
} from "@/lib/utils/vehicle-documents";

// ─── Schema ─────────────────────────────────────────────────

const permitFormSchema = z.object({
  category: z.enum([
    "City Permit", "Barangay Clearance", "Mayor's Permit",
    "Special Permit (Hazmat)", "Special Permit (Overweight)", "Special Permit (Oversized)",
  ] as const, {
    required_error: "Category is required",
  }),
  permitNumber: z.string().min(1, "Required").max(50, "Maximum 50 characters"),
  issuedDate: z.string().min(1, "Required"),
  expiryDate: z.string().min(1, "Required"),
  issuingAuthority: z.string().min(1, "Required").max(100, "Maximum 100 characters"),
  coverageArea: z.string().max(100, "Maximum 100 characters").optional(),
  notes: z.string().max(500, "Maximum 500 characters").optional(),
}).refine(
  (data) => !data.issuedDate || !data.expiryDate || new Date(data.expiryDate) > new Date(data.issuedDate),
  { message: "Expiry date must be after issued date", path: ["expiryDate"] }
);

type PermitFormValues = z.infer<typeof permitFormSchema>;

// ─── Props ──────────────────────────────────────────────────

interface PermitFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  permit?: VehiclePermit;
  onSuccess: () => void;
}

export function PermitFormSheet({ open, onOpenChange, vehicleId, permit, onSuccess }: PermitFormSheetProps) {
  const addPermit = useVehicleDocumentStore((s) => s.addPermit);
  const updatePermit = useVehicleDocumentStore((s) => s.updatePermit);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!permit;

  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
      category: undefined,
      permitNumber: "",
      issuedDate: "",
      expiryDate: "",
      issuingAuthority: "",
      coverageArea: "",
      notes: "",
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isDirty } } = form;

  const [fileAttachment, setFileAttachment] = useState<FileAttachment | undefined>(undefined);
  const [fileError, setFileError] = useState<string>("");

  useEffect(() => {
    if (open) {
      if (permit) {
        reset({
          category: permit.category,
          permitNumber: permit.permitNumber,
          issuedDate: permit.issuedDate,
          expiryDate: permit.expiryDate,
          issuingAuthority: permit.issuingAuthority,
          coverageArea: permit.coverageArea || "",
          notes: permit.notes || "",
        });
        setFileAttachment(permit.fileAttachment);
      } else {
        reset({
          category: undefined,
          permitNumber: "",
          issuedDate: "",
          expiryDate: "",
          issuingAuthority: "",
          coverageArea: "",
          notes: "",
        });
        setFileAttachment(undefined);
      }
      setFileError("");
    }
  }, [open, permit, reset]);

  const watchCategory = watch("category");
  const showCoverageArea = watchCategory === "City Permit";

  const onSubmit = (data: PermitFormValues) => {
    const payload = {
      ...data,
      category: data.category as PermitCategory,
      coverageArea: showCoverageArea ? data.coverageArea : undefined,
      fileAttachment,
    };

    if (isEdit && permit) {
      updatePermit(permit.id, payload);
      toast.success("Permit updated successfully", { duration: 5000 });
    } else {
      addPermit({ vehicleId, ...payload });
      toast.success("Permit added successfully", { duration: 5000 });
    }
    onOpenChange(false);
    onSuccess();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size must not exceed 10 MB");
      e.target.value = "";
      return;
    }

    setFileError("");
    setFileAttachment({
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    });
  };

  const removeFile = () => {
    setFileAttachment(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Permit" : "Add Permit"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Update the permit details below." : "Fill in the permit details below."}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Category *</label>
            <Select
              value={watchCategory || ""}
              onValueChange={(val) => setValue("category", val as PermitCategory, { shouldValidate: true, shouldDirty: true })}
            >
              <SelectTrigger
                aria-invalid={!!errors.category}
                aria-describedby={errors.category ? "permit-category-error" : undefined}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PERMIT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p id="permit-category-error" className="text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Permit Number */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Permit Number *</label>
            <Input
              {...register("permitNumber")}
              maxLength={50}
              placeholder="e.g., CP-MNL-2024-1122"
              aria-invalid={!!errors.permitNumber}
              aria-describedby={errors.permitNumber ? "permitnum-error" : undefined}
            />
            {errors.permitNumber && (
              <p id="permitnum-error" className="text-xs text-red-600">{errors.permitNumber.message}</p>
            )}
          </div>

          {/* Issued Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Issued Date *</label>
            <Input
              type="date"
              {...register("issuedDate")}
              aria-invalid={!!errors.issuedDate}
              aria-describedby={errors.issuedDate ? "permit-issued-error" : undefined}
            />
            {errors.issuedDate && (
              <p id="permit-issued-error" className="text-xs text-red-600">{errors.issuedDate.message}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Expiry Date *</label>
            <Input
              type="date"
              {...register("expiryDate")}
              aria-invalid={!!errors.expiryDate}
              aria-describedby={errors.expiryDate ? "permit-expiry-error" : undefined}
            />
            {errors.expiryDate && (
              <p id="permit-expiry-error" className="text-xs text-red-600">{errors.expiryDate.message}</p>
            )}
          </div>

          {/* Issuing Authority */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Issuing Authority *</label>
            <Input
              {...register("issuingAuthority")}
              maxLength={100}
              placeholder="e.g., City of Manila"
              aria-invalid={!!errors.issuingAuthority}
              aria-describedby={errors.issuingAuthority ? "permit-authority-error" : undefined}
            />
            {errors.issuingAuthority && (
              <p id="permit-authority-error" className="text-xs text-red-600">{errors.issuingAuthority.message}</p>
            )}
          </div>

          {/* Coverage Area (only for City Permit) */}
          {showCoverageArea && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-brand-navy">Coverage Area</label>
              <Input
                {...register("coverageArea")}
                maxLength={100}
                placeholder="e.g., Quezon City, Manila, Makati"
                aria-invalid={!!errors.coverageArea}
                aria-describedby={errors.coverageArea ? "coverage-error" : undefined}
              />
              {errors.coverageArea && (
                <p id="coverage-error" className="text-xs text-red-600">{errors.coverageArea.message}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">Notes</label>
            <textarea
              {...register("notes")}
              maxLength={500}
              rows={3}
              placeholder="Optional notes..."
              className="flex w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal resize-none"
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "permit-notes-error" : undefined}
            />
            {errors.notes && (
              <p id="permit-notes-error" className="text-xs text-red-600">{errors.notes.message}</p>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-brand-navy">File Attachment</label>
            {fileAttachment ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-brand-border bg-gray-50">
                <Upload className="w-4 h-4 text-brand-teal" />
                <span className="text-sm truncate flex-1">{fileAttachment.fileName}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(fileAttachment.fileSize)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={removeFile}
                  aria-label="Remove file attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  aria-label="Upload file attachment"
                />
                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-brand-border hover:border-brand-teal transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload (PDF, JPEG, PNG — max 10 MB)</span>
                </div>
              </div>
            )}
            {fileError && (
              <p className="text-xs text-red-600">{fileError}</p>
            )}
          </div>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isEdit && !isDirty && fileAttachment === permit?.fileAttachment}>
              {isEdit ? "Save Changes" : "Add Permit"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
