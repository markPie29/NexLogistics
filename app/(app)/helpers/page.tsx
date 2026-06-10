"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Star, Activity, Search, Plus, Phone,
  MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, X,
  UserCheck, UserMinus, Calendar, Truck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useHelperStore, useDriverStore, useFleetStore, useTripStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddHelperSheet } from "@/components/forms/AddHelperSheet";
import { toast } from "sonner";
import {
  computeHelperCounts,
  filterHelpers,
  resolveHelperVehicle,
  formatRating,
  getHelperTripCount,
} from "@/lib/services/helper-utils";
import type { Helper } from "@/lib/types";

const STATUS_VARIANT: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function HelpersPage() {
  const helpers = useHelperStore((s) => s.helpers);
  const updateHelper = useHelperStore((s) => s.updateHelper);
  const deleteHelper = useHelperStore((s) => s.deleteHelper);
  const drivers = useDriverStore((s) => s.drivers);
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingHelper, setEditingHelper] = useState<Helper | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Helper | null>(null);

  const openAdd = () => { setEditingHelper(null); setSheetOpen(true); };
  const openEdit = (h: Helper) => { setEditingHelper(h); setSheetOpen(true); };
  const closeSheet = (v: boolean) => { setSheetOpen(v); if (!v) setEditingHelper(null); };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteHelper(deleteTarget.id);
    toast.success(`Helper ${deleteTarget.name} removed`);
    setDeleteTarget(null);
  };

  const setStatus = (h: Helper, status: Helper["status"]) => {
    updateHelper(h.id, { status });
    toast.success(`${h.name} marked as ${status.replace("_", " ")}`);
  };

  // Trip count map by helper
  const tripCountByHelper = useMemo(() => {
    const map: Record<string, number> = {};
    trips.forEach((t) => { if (t.helperId) map[t.helperId] = (map[t.helperId] ?? 0) + 1; });
    return map;
  }, [trips]);

  // Computed values
  const counts = useMemo(() => computeHelperCounts(helpers), [helpers]);
  const filtered = useMemo(() => filterHelpers(helpers, search, statusFilter), [helpers, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Helper Management"
        subtitle="Manage loaders, helpers, and assistant crew assigned to drivers"
        breadcrumbs={[{ label: "Operations" }, { label: "Helpers" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Helper</Button>}
      />

      {/* KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Helpers" value={counts.total} icon={Users} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[3, 4, 4, 5, 5, 5, 5, 5]} />
        <KpiCard label="Active" value={counts.active} icon={Activity} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[2, 3, 3, 4, 4, 4, 4, 4]} sparklineColor="#10B981" />
        <KpiCard label="Off Duty" value={counts.off_duty} icon={Truck} iconColor="text-gray-500" iconBg="bg-gray-100" sparklineData={[1, 1, 1, 1, 1, 1, 1, 1]} sparklineColor="#9CA3AF" />
        <KpiCard label="On Leave" value={counts.on_leave} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[0, 0, 0, 0, 0, 0, 0, 0]} sparklineColor="#F59E0B" />
      </div>

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="pl-10"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                  <th className="py-3 px-4 font-medium">Helper</th>
                  <th className="py-3 px-4 font-medium">Assigned Driver</th>
                  <th className="py-3 px-4 font-medium">Vehicle</th>
                  <th className="py-3 px-4 font-medium">Rating</th>
                  <th className="py-3 px-4 font-medium">On-Time</th>
                  <th className="py-3 px-4 font-medium">Trips</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                      <p className="text-muted-foreground font-medium">No helpers found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || statusFilter !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "Add your first helper to get started"}
                      </p>
                      {!search && statusFilter === "all" && (
                        <Button size="sm" className="mt-4" onClick={openAdd}>
                          <Plus className="w-4 h-4" /> Add Helper
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
                {filtered.map((h) => {
                  const { driver, vehicle } = resolveHelperVehicle(h, drivers, vehicles);
                  const rating = h.rating ?? 0;
                  const onTimePercent = h.onTimePercent ?? 100;
                  const tripCount = getHelperTripCount(h, tripCountByHelper);

                  return (
                    <tr key={h.id} className="border-b border-brand-border/60 hover:bg-gray-50 transition-colors">
                      {/* Helper (avatar + name + phone) */}
                      <td className="py-3 px-4">
                        <Link href={`/helpers/${h.id}`} className="flex items-center gap-3 group">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-brand-navy text-white text-xs font-bold">
                              {initials(h.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-brand-navy group-hover:text-brand-teal transition-colors">{h.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {h.phone}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Assigned Driver */}
                      <td className="py-3 px-4">
                        {driver
                          ? <Badge variant="info">{driver.name}</Badge>
                          : <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        }
                      </td>

                      {/* Vehicle (resolved) */}
                      <td className="py-3 px-4">
                        {vehicle
                          ? <Badge variant="info">{vehicle.plate}</Badge>
                          : <span className="text-xs text-muted-foreground">—</span>
                        }
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {formatRating(rating)}
                        </span>
                      </td>

                      {/* On-Time % */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-teal rounded-full" style={{ width: `${onTimePercent}%` }} />
                          </div>
                          <span className="text-xs font-bold">{onTimePercent}%</span>
                        </div>
                      </td>

                      {/* Trips */}
                      <td className="py-3 px-4 font-medium text-muted-foreground">{tripCount}</td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_VARIANT[h.status]}>{h.status.replace("_", " ")}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/helpers/${h.id}`)}>
                              <Eye className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(h)}>
                              <Pencil className="w-4 h-4" /> Edit Helper
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {h.status !== "active" && (
                              <DropdownMenuItem onClick={() => setStatus(h, "active")}>
                                <UserCheck className="w-4 h-4 text-emerald-600" /> Set Active
                              </DropdownMenuItem>
                            )}
                            {h.status !== "off_duty" && (
                              <DropdownMenuItem onClick={() => setStatus(h, "off_duty")}>
                                <UserMinus className="w-4 h-4 text-gray-500" /> Set Off Duty
                              </DropdownMenuItem>
                            )}
                            {h.status !== "on_leave" && (
                              <DropdownMenuItem onClick={() => setStatus(h, "on_leave")}>
                                <Calendar className="w-4 h-4 text-amber-600" /> Set On Leave
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => setDeleteTarget(h)}>
                              <Trash2 className="w-4 h-4" /> Delete Helper
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Result Count Footer */}
          {helpers.length > 0 && (
            <div className="px-4 py-3 border-t border-brand-border/60 text-xs text-muted-foreground">
              Showing {filtered.length} of {helpers.length} helper{helpers.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Helper Sheet */}
      <AddHelperSheet open={sheetOpen} onOpenChange={closeSheet} editHelper={editingHelper} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Remove Helper
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the roster?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove Helper</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
