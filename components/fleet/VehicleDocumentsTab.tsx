"use client";
import { useState, useMemo } from "react";
import { Plus, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { VehicleDocument, VehiclePermit } from "@/lib/types";
import { useVehicleDocumentStore } from "@/lib/store";
import { computeSummaryCounts } from "@/lib/utils/vehicle-documents";
import { DocumentsSummaryBar } from "./DocumentsSummaryBar";
import { VehicleDocumentCard } from "./VehicleDocumentCard";
import { VehiclePermitCard } from "./VehiclePermitCard";
import { DocumentFormSheet } from "./DocumentFormSheet";
import { PermitFormSheet } from "./PermitFormSheet";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface VehicleDocumentsTabProps {
  vehicleId: string;
}

export function VehicleDocumentsTab({ vehicleId }: VehicleDocumentsTabProps) {
  const documents = useVehicleDocumentStore((s) => s.documents);
  const permits = useVehicleDocumentStore((s) => s.permits);
  const deleteDocument = useVehicleDocumentStore((s) => s.deleteDocument);
  const deletePermit = useVehicleDocumentStore((s) => s.deletePermit);

  // Filter by vehicle
  const vehicleDocs = useMemo(
    () =>
      documents
        .filter((d) => d.vehicleId === vehicleId)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()),
    [documents, vehicleId]
  );

  const vehiclePermits = useMemo(
    () =>
      permits
        .filter((p) => p.vehicleId === vehicleId)
        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()),
    [permits, vehicleId]
  );

  const summary = useMemo(
    () => computeSummaryCounts(vehicleDocs, vehiclePermits),
    [vehicleDocs, vehiclePermits]
  );

  // Sheet/dialog state
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [permitSheetOpen, setPermitSheetOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<VehicleDocument | undefined>(undefined);
  const [editingPermit, setEditingPermit] = useState<VehiclePermit | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "document" | "permit";
    id: string;
    category: string;
    number: string;
  } | null>(null);

  // Document CRUD handlers
  const handleAddDoc = () => {
    setEditingDoc(undefined);
    setDocSheetOpen(true);
  };

  const handleEditDoc = (doc: VehicleDocument) => {
    setEditingDoc(doc);
    setDocSheetOpen(true);
  };

  const handleDeleteDoc = (doc: VehicleDocument) => {
    setDeleteTarget({
      type: "document",
      id: doc.id,
      category: doc.category,
      number: doc.documentNumber,
    });
  };

  // Permit CRUD handlers
  const handleAddPermit = () => {
    setEditingPermit(undefined);
    setPermitSheetOpen(true);
  };

  const handleEditPermit = (permit: VehiclePermit) => {
    setEditingPermit(permit);
    setPermitSheetOpen(true);
  };

  const handleDeletePermit = (permit: VehiclePermit) => {
    setDeleteTarget({
      type: "permit",
      id: permit.id,
      category: permit.category,
      number: permit.permitNumber,
    });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "document") {
      deleteDocument(deleteTarget.id);
      toast.success("Document deleted successfully", { duration: 5000 });
    } else {
      deletePermit(deleteTarget.id);
      toast.success("Permit deleted successfully", { duration: 5000 });
    }
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <DocumentsSummaryBar
        total={summary.total}
        expired={summary.expired}
        expiringSoon={summary.expiringSoon}
      />

      {/* Documents Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-navy flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-teal" />
            Documents
          </h3>
          <Button size="sm" onClick={handleAddDoc}>
            <Plus className="w-4 h-4 mr-1" />
            Add Document
          </Button>
        </div>

        {vehicleDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No documents added yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleAddDoc}>
              <Plus className="w-4 h-4 mr-1" />
              Add your first document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehicleDocs.map((doc) => (
              <VehicleDocumentCard
                key={doc.id}
                document={doc}
                onEdit={handleEditDoc}
                onDelete={handleDeleteDoc}
              />
            ))}
          </div>
        )}
      </section>

      {/* Permits Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-navy flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-teal" />
            Permits
          </h3>
          <Button size="sm" onClick={handleAddPermit}>
            <Plus className="w-4 h-4 mr-1" />
            Add Permit
          </Button>
        </div>

        {vehiclePermits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-brand-border p-8 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No permits added yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleAddPermit}>
              <Plus className="w-4 h-4 mr-1" />
              Add your first permit
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vehiclePermits.map((permit) => (
              <VehiclePermitCard
                key={permit.id}
                permit={permit}
                onEdit={handleEditPermit}
                onDelete={handleDeletePermit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Form Sheets */}
      <DocumentFormSheet
        open={docSheetOpen}
        onOpenChange={setDocSheetOpen}
        vehicleId={vehicleId}
        document={editingDoc}
        onSuccess={() => {}}
      />

      <PermitFormSheet
        open={permitSheetOpen}
        onOpenChange={setPermitSheetOpen}
        vehicleId={vehicleId}
        permit={editingPermit}
        onSuccess={() => {}}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        itemType={deleteTarget?.type || "document"}
        itemCategory={deleteTarget?.category || ""}
        itemNumber={deleteTarget?.number || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
