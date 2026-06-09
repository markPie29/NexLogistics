"use client";

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { useMaintenanceStore, useFleetStore } from "@/lib/store";
import { filterRecords, sortRecords, paginateRecords } from "@/lib/services/pms-filters";
import { exportPmsReport, generateCsv } from "@/lib/services/pms-export";
import { toast } from "sonner";

import { PmsKpiPanel } from "@/components/pms/PmsKpiPanel";
import { PmsAlertBanner } from "@/components/pms/PmsAlertBanner";
import { PmsToolbar } from "@/components/pms/PmsToolbar";
import { PmsBulkActionToolbar } from "@/components/pms/PmsBulkActionToolbar";
import { PmsDataTable } from "@/components/pms/PmsDataTable";
import { PmsCalendarView } from "@/components/pms/PmsCalendarView";
import { PmsScheduleModal } from "@/components/pms/PmsScheduleModal";
import { PmsVehicleHistoryPanel } from "@/components/pms/PmsVehicleHistoryPanel";
import { PmsCostAnalytics } from "@/components/pms/PmsCostAnalytics";
import { PmsRecordDetailModal } from "@/components/pms/PmsRecordDetailModal";

import type { MaintenanceRecord, MaintenanceStatus } from "@/lib/types";
import type { PmsSort } from "@/lib/services/pms-types";

// ─── Session storage helpers ─────────────────────────────────────────────────

function getSessionBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") return defaultValue;
  const stored = sessionStorage.getItem(key);
  if (stored === null) return defaultValue;
  return stored === "true";
}

// ─── Page Component ──────────────────────────────────────────────────────────

export default function PmsPage() {
  // ── Global store data ────────────────────────────────────────────────────
  const records = useMaintenanceStore((s) => s.records);
  const addRecord = useMaintenanceStore((s) => s.addRecord);
  const updateRecord = useMaintenanceStore((s) => s.updateRecord);
  const deleteRecord = useMaintenanceStore((s) => s.deleteRecord);
  const vehicles = useFleetStore((s) => s.vehicles);

  // ── Local UI state ───────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus[]>([]);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [sortColumn, setSortColumn] = useState<PmsSort["column"]>("dueDate");
  const [sortDirection, setSortDirection] = useState<PmsSort["direction"]>("asc");
  const [pageSize, setPageSize] = useState<10 | 25 | 50>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<{
    open: boolean;
    mode: "add" | "edit";
    record?: MaintenanceRecord;
  }>({ open: false, mode: "add" });
  const [vehicleHistoryId, setVehicleHistoryId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<MaintenanceRecord | null>(null);
  const [alertDismissed, setAlertDismissed] = useState(() => getSessionBoolean("pms-alert-dismissed", false));
  const [costAnalyticsCollapsed, setCostAnalyticsCollapsed] = useState(() => getSessionBoolean("pms-analytics-collapsed", false));

  // Ref for scrolling to table
  const tableRef = useRef<HTMLDivElement>(null);

  // ── Derived / memoized data ──────────────────────────────────────────────
  const filtered = useMemo(
    () => filterRecords(records, vehicles, { search, statuses: statusFilter, dateRange }),
    [records, vehicles, search, statusFilter, dateRange]
  );

  const sorted = useMemo(
    () => sortRecords(filtered, vehicles, sortColumn, sortDirection),
    [filtered, vehicles, sortColumn, sortDirection]
  );

  const paginated = useMemo(
    () => paginateRecords(sorted, pageSize, currentPage),
    [sorted, pageSize, currentPage]
  );

  const overdueRecords = useMemo(
    () => records.filter((r) => r.status === "overdue"),
    [records]
  );

  const vehicleHistoryRecords = useMemo(
    () => (vehicleHistoryId ? records.filter((r) => r.vehicleId === vehicleHistoryId) : []),
    [records, vehicleHistoryId]
  );

  const historyVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleHistoryId),
    [vehicles, vehicleHistoryId]
  );

  const detailVehicle = useMemo(
    () => detailRecord ? vehicles.find((v) => v.id === detailRecord.vehicleId) : undefined,
    [vehicles, detailRecord]
  );

  // ── Alert reappear logic ─────────────────────────────────────────────────
  const prevOverdueCount = useRef(overdueRecords.length);
  useEffect(() => {
    if (overdueRecords.length !== prevOverdueCount.current) {
      setAlertDismissed(false);
      sessionStorage.setItem("pms-alert-dismissed", "false");
      prevOverdueCount.current = overdueRecords.length;
    }
  }, [overdueRecords.length]);

  // ── Reset page when filters change ──────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateRange, pageSize]);

  // ── Event handlers ───────────────────────────────────────────────────────

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDirection("asc");
      return column as PmsSort["column"];
    });
  }, []);

  const handleBulkMarkComplete = useCallback(() => {
    const now = new Date().toISOString();
    selectedIds.forEach((id) => {
      updateRecord(id, { status: "completed", completedAt: now });
    });
    const count = selectedIds.size;
    setSelectedIds(new Set());
    toast.success(`${count} record${count > 1 ? "s" : ""} marked as completed`);
  }, [selectedIds, updateRecord]);

  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => {
      deleteRecord(id);
    });
    setSelectedIds(new Set());
    toast.success(`${count} record${count > 1 ? "s" : ""} deleted`);
  }, [selectedIds, deleteRecord]);

  const handleBulkExport = useCallback(() => {
    const selectedRecords = records.filter((r) => selectedIds.has(r.id));
    if (selectedRecords.length === 0) return;
    const csv = generateCsv(selectedRecords, vehicles);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const filename = `pms-report-${yyyy}-${mm}-${dd}.csv`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedRecords.length} record${selectedRecords.length > 1 ? "s" : ""} to CSV`);
  }, [records, selectedIds, vehicles]);

  const handleExport = useCallback(
    async (format: "csv" | "pdf") => {
      if (filtered.length === 0) {
        toast.info("No records available to export");
        return;
      }
      try {
        await exportPmsReport({ records: filtered, vehicles, format });
        toast.success(`Report exported as ${format.toUpperCase()}`);
      } catch {
        toast.error("Export could not be completed");
      }
    },
    [filtered, vehicles]
  );

  const handleAddSubmit = useCallback(
    (data: Omit<MaintenanceRecord, "id">) => {
      addRecord(data);
      setModalState({ open: false, mode: "add" });
      toast.success("Maintenance schedule added");
    },
    [addRecord]
  );

  const handleEditSubmit = useCallback(
    (data: Omit<MaintenanceRecord, "id">) => {
      if (!modalState.record) return;
      updateRecord(modalState.record.id, data);
      setModalState({ open: false, mode: "add" });
      toast.success("Maintenance schedule updated");
    },
    [modalState.record, updateRecord]
  );

  const handleDeleteRecord = useCallback(
    (id: string) => {
      deleteRecord(id);
      toast.success("Record deleted");
    },
    [deleteRecord]
  );

  const handleViewAllOverdue = useCallback(() => {
    setStatusFilter(["overdue"]);
    // Scroll to table area
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, []);

  const handleAlertDismiss = useCallback(() => {
    setAlertDismissed(true);
    sessionStorage.setItem("pms-alert-dismissed", "true");
  }, []);

  const handleCostToggle = useCallback(() => {
    setCostAnalyticsCollapsed((prev) => {
      const next = !prev;
      sessionStorage.setItem("pms-analytics-collapsed", String(next));
      return next;
    });
  }, []);

  const handleVehicleClick = useCallback((vehicleId: string) => {
    setVehicleHistoryId(vehicleId);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter([]);
    setDateRange({});
  }, []);

  const handleEditRecord = useCallback((record: MaintenanceRecord) => {
    setModalState({ open: true, mode: "edit", record });
  }, []);

  const handleCalendarEventClick = useCallback((record: MaintenanceRecord) => {
    setModalState({ open: true, mode: "edit", record });
  }, []);

  const handleRowClick = useCallback((record: MaintenanceRecord) => {
    setDetailRecord(record);
  }, []);

  const handleMarkCompleteSingle = useCallback((id: string) => {
    updateRecord(id, { status: "completed", completedAt: new Date().toISOString() });
    toast.success("Marked as completed");
  }, [updateRecord]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Preventive Maintenance"
        subtitle="Track service schedules, repairs, and overdue alerts"
        breadcrumbs={[{ label: "Operations" }, { label: "PMS" }]}
        actions={
          <Button
            size="sm"
            onClick={() => setModalState({ open: true, mode: "add", record: undefined })}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Schedule
          </Button>
        }
      />

      <PmsKpiPanel records={records} />

      <PmsAlertBanner
        overdueRecords={overdueRecords}
        vehicles={vehicles}
        dismissed={alertDismissed}
        onDismiss={handleAlertDismiss}
        onViewAll={handleViewAllOverdue}
      />

      <PmsToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={handleExport}
        filteredCount={filtered.length}
      />

      {selectedIds.size > 0 && (
        <PmsBulkActionToolbar
          selectedCount={selectedIds.size}
          onMarkComplete={handleBulkMarkComplete}
          onDelete={handleBulkDelete}
          onExportSelected={handleBulkExport}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <div ref={tableRef}>
        {viewMode === "table" ? (
          <PmsDataTable
            records={paginated.data}
            vehicles={vehicles}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={paginated.totalPages}
            totalCount={paginated.totalCount}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onVehicleClick={handleVehicleClick}
            onRowClick={handleRowClick}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <PmsCalendarView
            records={filtered}
            vehicles={vehicles}
            onEventClick={handleCalendarEventClick}
          />
        )}
      </div>

      <PmsCostAnalytics
        records={records}
        collapsed={costAnalyticsCollapsed}
        onToggleCollapse={handleCostToggle}
      />

      <PmsScheduleModal
        open={modalState.open}
        mode={modalState.mode}
        record={modalState.record}
        vehicles={vehicles}
        onSubmit={modalState.mode === "edit" ? handleEditSubmit : handleAddSubmit}
        onClose={() => setModalState({ open: false, mode: "add" })}
      />

      <PmsVehicleHistoryPanel
        vehicleId={vehicleHistoryId ?? ""}
        records={vehicleHistoryRecords}
        vehicle={historyVehicle}
        open={vehicleHistoryId !== null}
        onClose={() => setVehicleHistoryId(null)}
      />

      <PmsRecordDetailModal
        record={detailRecord}
        vehicle={detailVehicle}
        open={detailRecord !== null}
        onClose={() => setDetailRecord(null)}
        onEdit={handleEditRecord}
        onDelete={handleDeleteRecord}
        onMarkComplete={handleMarkCompleteSingle}
      />
    </div>
  );
}
