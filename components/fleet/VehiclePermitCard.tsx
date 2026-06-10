"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileIcon, MapPin } from "lucide-react";
import type { VehiclePermit } from "@/lib/types";
import { ExpiryIndicator } from "./ExpiryIndicator";
import { formatFileSize } from "@/lib/utils/vehicle-documents";

interface VehiclePermitCardProps {
  permit: VehiclePermit;
  onEdit: (permit: VehiclePermit) => void;
  onDelete: (permit: VehiclePermit) => void;
}

export function VehiclePermitCard({ permit, onEdit, onDelete }: VehiclePermitCardProps) {
  return (
    <Card className="rounded-2xl border-brand-border shadow-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">{permit.category}</Badge>
            <ExpiryIndicator expiryDate={permit.expiryDate} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-w-[44px] min-h-[44px]"
              onClick={() => onEdit(permit)}
              aria-label={`Edit ${permit.category} permit ${permit.permitNumber}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-w-[44px] min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(permit)}
              aria-label={`Delete ${permit.category} permit ${permit.permitNumber}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">Permit #: </span>
            <span className="font-medium text-brand-navy">{permit.permitNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Authority: </span>
            <span className="text-brand-navy truncate">{permit.issuingAuthority}</span>
          </div>
          {permit.coverageArea && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Coverage: </span>
              <span className="text-brand-navy">{permit.coverageArea}</span>
            </div>
          )}
          <div className="flex gap-4">
            <div>
              <span className="text-muted-foreground">Issued: </span>
              <span className="text-brand-navy">{new Date(permit.issuedDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expires: </span>
              <span className="text-brand-navy">{new Date(permit.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {permit.fileAttachment && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-brand-border/60">
            <FileIcon className="w-3.5 h-3.5" />
            <span className="truncate">{permit.fileAttachment.fileName}</span>
            <span className="shrink-0">({formatFileSize(permit.fileAttachment.fileSize)})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
