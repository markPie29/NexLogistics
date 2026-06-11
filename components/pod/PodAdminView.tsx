"use client";

/**
 * POD Admin View
 *
 * Orchestrates the full Admin_View layout vertically with 24px gap:
 * PageHeader → PodKpiPanel → PodFilterBar → PodDataTable → PodDetailDrawer
 *
 * Manages all local UI state (filters, sorting, pagination, drawer) and
 * derives table data from trips/pods/drivers via pod-helpers utilities.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.7, 3.8, 4.4, 4.5, 10.2, 10.5, 12.5
 */

import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PodKpiPanel } from "@/components/pod/PodKpiPanel";
import { PodFilterBar } from "@/components/pod/PodFilterBar";
import { PodDataTable } from "@/components/pod/PodDataTable";
import { PodDetailDrawer } from "@/components/pod/PodDetailDrawer";
import { PodCaptureModal } from "@/components/pod/PodCaptureModal";
import type { CaptureData } from "@/components/pod/PodCaptureModal";
import { cn } from "@/lib/utils";
import {
  computePodKpis,
  deriveAwaitingRows,
  deriveCapturedRows,
  filterPodRows,
  sortPodRows,
  resolveDriverName,
} from "@/lib/utils/pod-helpers";
import { usePodStore, useTripStore } from "@/lib/store";
import type { Trip, ProofOfDelivery, Driver } from "@/lib/types";

interface PodAdminViewProps {
  trips: Trip[];
  pods: ProofOfDelivery[];
  drivers: Driver[];
}

export function PodAdminView({ trips, pods, drivers }: PodAdminViewProps) {
  // ─── Local State ─────────────────────────────────────────────
  const [activeTab, setActiveTab] = React.useState<"awaiting" | "captured">("awaiting");
  const [search, setSearch] = React.useState("");
  const [driverFilter, setDriverFilter] = React.useState<string | null>(null);
  const [sortColumn, setSortColumn] = React.useState("deliveryDate");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedPodId, setSelectedPodId] = React.useState<string | null>(null);
  const [captureModalOpen, setCaptureModalOpen] = React.useState(false);
  const [captureTripId, setCaptureTripId] = React.useState<string | null>(null);

  // Store actions for capture
  const addPod = usePodStore((s) => s.addPod);
  const setTripStatus = useTripStore((s) => s.setStatus);

  // ─── KPI Computation ─────────────────────────────────────────
  const kpis = React.useMemo(() => computePodKpis(trips, pods), [trips, pods]);

  // ─── Derive Table Rows ───────────────────────────────────────
  const awaitingRows = React.useMemo(
    () => deriveAwaitingRows(trips, pods, drivers),
    [trips, pods, drivers]
  );

  const capturedRows = React.useMemo(
    () => deriveCapturedRows(trips, pods, drivers),
    [trips, pods, drivers]
  );

  // ─── Filter → Sort Pipeline ───────────────────────────────────
  // Resolve driverId to driver name for the filter function
  const resolvedDriverFilter = React.useMemo(
    () => (driverFilter ? resolveDriverName(driverFilter, drivers) : null),
    [driverFilter, drivers]
  );

  const filteredAwaitingRows = React.useMemo(
    () => filterPodRows(awaitingRows, { search, driverFilter: resolvedDriverFilter }, "awaiting"),
    [awaitingRows, search, resolvedDriverFilter]
  );

  const filteredCapturedRows = React.useMemo(
    () => filterPodRows(capturedRows, { search, driverFilter: resolvedDriverFilter }, "captured"),
    [capturedRows, search, resolvedDriverFilter]
  );

  const sortedAwaitingRows = React.useMemo(
    () => sortPodRows(filteredAwaitingRows, { column: sortColumn, direction: sortDirection }),
    [filteredAwaitingRows, sortColumn, sortDirection]
  );

  const sortedCapturedRows = React.useMemo(
    () => sortPodRows(filteredCapturedRows, { column: sortColumn, direction: sortDirection }),
    [filteredCapturedRows, sortColumn, sortDirection]
  );

  // totalCount for filter bar result count announcement
  const totalCount = activeTab === "awaiting" ? sortedAwaitingRows.length : sortedCapturedRows.length;

  // ─── Selected POD for Drawer ─────────────────────────────────
  const selectedPod = React.useMemo(() => {
    if (!selectedPodId) return null;
    return pods.find((p) => p.id === selectedPodId) ?? null;
  }, [selectedPodId, pods]);

  const selectedTripId = React.useMemo(() => {
    if (!selectedPod) return null;
    return selectedPod.tripId;
  }, [selectedPod]);

  // ─── Handlers ────────────────────────────────────────────────

  const handleTabChange = React.useCallback((tab: "awaiting" | "captured") => {
    setActiveTab(tab);
    setCurrentPage(1);
    // Update default sort column based on tab
    setSortColumn(tab === "awaiting" ? "deliveryDate" : "captureDate");
    setSortDirection("desc");
  }, []);

  const handleSort = React.useCallback(
    (column: string) => {
      if (column === sortColumn) {
        // Toggle direction if same column
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // New column, set to ascending
        setSortColumn(column);
        setSortDirection("asc");
      }
    },
    [sortColumn]
  );

  const handleSearchChange = React.useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const handleDriverFilterChange = React.useCallback((driverId: string | null) => {
    setDriverFilter(driverId);
    setCurrentPage(1);
  }, []);

  const handlePageChange = React.useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleViewPod = React.useCallback((podId: string) => {
    setSelectedPodId(podId);
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = React.useCallback(() => {
    setDrawerOpen(false);
    setSelectedPodId(null);
  }, []);

  // ─── Capture Modal Handlers ──────────────────────────────────

  const captureTrip = React.useMemo(() => {
    if (!captureTripId) return null;
    return trips.find((t) => t.id === captureTripId) ?? null;
  }, [captureTripId, trips]);

  const captureDriverName = React.useMemo(() => {
    if (!captureTrip) return "Unassigned";
    return resolveDriverName(captureTrip.driverId, drivers);
  }, [captureTrip, drivers]);

  const handleOpenCapture = React.useCallback((tripId: string) => {
    setCaptureTripId(tripId);
    setCaptureModalOpen(true);
  }, []);

  const handleCaptureModalClose = React.useCallback(() => {
    setCaptureModalOpen(false);
    setCaptureTripId(null);
  }, []);

  const handleConfirmCapture = React.useCallback((tripId: string, data: CaptureData) => {
    // Add POD to store
    addPod({
      tripId,
      receiverName: data.receiverName,
      receiverContact: data.receiverContact,
      signatureDataUrl: data.signatureDataUrl,
      photoDataUrls: data.photoDataUrls,
      notes: data.notes,
      gps: data.gps,
    });
    // Update trip status to completed
    setTripStatus(tripId, "completed", "admin", "POD captured via modal");
    // Close modal
    setCaptureModalOpen(false);
    setCaptureTripId(null);
  }, [addPod, setTripStatus]);

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className={cn("space-y-6 min-w-0 overflow-hidden")}>
      <PageHeader
        breadcrumbs={[
          { label: "Operations" },
          { label: "Proof of Delivery" },
        ]}
        title="Proof of Delivery"
        subtitle="Manage delivery confirmations across all drivers"
      />

      <PodKpiPanel
        awaitingCount={kpis.awaitingCount}
        capturedTodayCount={kpis.capturedTodayCount}
        completionRate={kpis.completionRate}
      />

      <PodFilterBar
        search={search}
        onSearchChange={handleSearchChange}
        driverFilter={driverFilter}
        onDriverFilterChange={handleDriverFilterChange}
        drivers={drivers}
        resultCount={totalCount}
      />

      <PodDataTable
        activeTab={activeTab}
        onTabChange={handleTabChange}
        awaitingRecords={sortedAwaitingRows}
        capturedRecords={sortedCapturedRows}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onViewPod={handleViewPod}
        onCapture={handleOpenCapture}
      />

      <PodDetailDrawer
        open={drawerOpen}
        pod={selectedPod}
        tripId={selectedTripId}
        onClose={handleDrawerClose}
      />

      <PodCaptureModal
        open={captureModalOpen}
        trip={captureTrip}
        driverName={captureDriverName}
        onClose={handleCaptureModalClose}
        onConfirmCapture={handleConfirmCapture}
      />
    </div>
  );
}
