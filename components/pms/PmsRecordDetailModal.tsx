"use client";

import { Wrench, Calendar, Gauge, DollarSign, FileText, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { MaintenanceRecord, Vehicle, MaintenanceStatus } from "@/lib/services/pms-types";

const STATUS_VARIANT: Record<MaintenanceStatus, "danger" | "warning" | "info" | "success"> = {
  overdue: "danger",
  due_soon: "warning",
  upcoming: "info",
  completed: "success",
};

const STATUS_LABEL: Record<MaintenanceStatus, string> = {
  overdue: "Overdue",
  due_soon: "Due Soon",
  upcoming: "Upcoming",
  completed: "Completed",
};

const STATUS_ICON: Record<MaintenanceStatus, typeof AlertTriangle> = {
  overdue: AlertTriangle,
  due_soon: Clock,
  upcoming: Wrench,
  completed: CheckCircle2,
};

export interface PmsRecordDetailModalProps {
  record: MaintenanceRecord | null;
  vehicle: Vehicle | undefined;
  open: boolean;
  onClose: () => void;
  onEdit: (record: MaintenanceRecord) => void;
  onDelete: (id: string) => void;
  onMarkComplete: (id: string) => void;
}

export function PmsRecordDetailModal({
  record,
  vehicle,
  open,
  onClose,
  onEdit,
  onDelete,
  onMarkComplete,
}: PmsRecordDetailModalProps) {
  if (!record) return null;

  const StatusIcon = STATUS_ICON[record.status];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[480px] sm:max-w-[480px] flex flex-col">
        <SheetHeader className="pb-4 border-b border-brand-border dark:border-white/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg">Maintenance Details</SheetTitle>
            <Badge variant={STATUS_VARIANT[record.status]}>
              {STATUS_LABEL[record.status]}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Vehicle Info Card */}
          <div className="rounded-xl bg-brand-bg dark:bg-white/[0.04] border border-brand-border dark:border-white/10 p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</p>
            <p className="text-lg font-bold text-brand-navy dark:text-white">
              {vehicle?.plate || record.vehicleId}
            </p>
            {vehicle && (
              <p className="text-sm text-muted-foreground">
                {vehicle.brand} {vehicle.model} · {vehicle.year} · {vehicle.odometer.toLocaleString()} km
              </p>
            )}
          </div>

          {/* Detail Fields */}
          <div className="space-y-4">
            <DetailRow
              icon={Wrench}
              label="Service Type"
              value={record.type}
            />
            <DetailRow
              icon={Calendar}
              label="Due Date"
              value={new Date(record.dueDate).toLocaleDateString("en-PH", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            {record.dueOdometer != null && (
              <DetailRow
                icon={Gauge}
                label="Due Odometer"
                value={`${record.dueOdometer.toLocaleString()} km`}
              />
            )}
            {record.cost != null && (
              <DetailRow
                icon={DollarSign}
                label="Estimated Cost"
                value={formatCurrency(record.cost)}
              />
            )}
            {record.completedAt && (
              <DetailRow
                icon={CheckCircle2}
                label="Completed At"
                value={new Date(record.completedAt).toLocaleDateString("en-PH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            )}
            {record.notes && (
              <DetailRow
                icon={FileText}
                label="Notes"
                value={record.notes}
              />
            )}
          </div>

          {/* Status Banner */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/30 dark:bg-white/[0.02] p-4">
            <StatusIcon className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {record.status === "overdue" && "This service is overdue and requires immediate attention."}
                {record.status === "due_soon" && "This service is due soon. Schedule it promptly."}
                {record.status === "upcoming" && "This service is scheduled for an upcoming date."}
                {record.status === "completed" && "This service has been completed."}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-brand-border dark:border-white/10 space-y-3">
          {record.status !== "completed" && (
            <Button
              className="w-full"
              onClick={() => { onMarkComplete(record.id); onClose(); }}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Completed
            </Button>
          )}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { onEdit(record); onClose(); }}
            >
              Edit Schedule
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => { onDelete(record.id); onClose(); }}
            >
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Wrench; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
