"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileIcon } from "lucide-react";
import type { VehicleDocument } from "@/lib/types";
import { ExpiryIndicator } from "./ExpiryIndicator";
import { formatFileSize } from "@/lib/utils/vehicle-documents";

interface VehicleDocumentCardProps {
  document: VehicleDocument;
  onEdit: (doc: VehicleDocument) => void;
  onDelete: (doc: VehicleDocument) => void;
}

export function VehicleDocumentCard({ document, onEdit, onDelete }: VehicleDocumentCardProps) {
  return (
    <Card className="rounded-2xl border-brand-border shadow-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">{document.category}</Badge>
            <ExpiryIndicator expiryDate={document.expiryDate} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-w-[44px] min-h-[44px]"
              onClick={() => onEdit(document)}
              aria-label={`Edit ${document.category} document ${document.documentNumber}`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 min-w-[44px] min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(document)}
              aria-label={`Delete ${document.category} document ${document.documentNumber}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">Doc #: </span>
            <span className="font-medium text-brand-navy">{document.documentNumber}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Authority: </span>
            <span className="text-brand-navy truncate">{document.issuingAuthority}</span>
          </div>
          <div className="flex gap-4">
            <div>
              <span className="text-muted-foreground">Issued: </span>
              <span className="text-brand-navy">{new Date(document.issuedDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expires: </span>
              <span className="text-brand-navy">{new Date(document.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {document.fileAttachment && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-brand-border/60">
            <FileIcon className="w-3.5 h-3.5" />
            <span className="truncate">{document.fileAttachment.fileName}</span>
            <span className="shrink-0">({formatFileSize(document.fileAttachment.fileSize)})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
