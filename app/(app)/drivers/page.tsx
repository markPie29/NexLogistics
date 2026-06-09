"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Star, Truck, Activity, Search, Plus, Phone,
  MoreHorizontal, Pencil, Trash2, Eye, AlertTriangle, X,
  UserCheck, UserMinus, Calendar,
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
import { useDriverStore, useFleetStore, useTripStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddDriverSheet } from "@/components/forms/AddDriverSheet";
import { toast } from "sonner";
import type { Driver } from "@/lib/types";

const STATUS_VARIANT: Record<string, "success" | "neutral" | "warning"> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function DriversPage() {
  const drivers = useDriverStore((s) => s.drivers);
  const deleteDriver = useDriverStore((s) => s.deleteDriver);
  const updateDriver = useDriverStore((s) => s.updateDriver);
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sheet state — null = closed (add mode), Driver = edit mode
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);

  const openAdd = () => { setEditingDriver(null); setSheetOpen(true); };
  const openEdit = (d: Driver) => { setEditingDriver(d); setSheetOpen(true); };
  const closeSheet = (v: boolean) => { setSheetOpen(v); if (!v) setEditingDriver(null); };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteDriver(deleteTarget.id);
    toast.success(`Driver ${deleteTarget.name} removed`);
    setDeleteTarget(null);
  };

  const setStatus = (d: Driver, status: Driver["status"]) => {
    updateDriver(d.id, { status });
    toast.success(`${d.name} marked as ${status.replace("_", " ")}`);
  };

  // Live trip counts per driver from trips store
  const tripCountByDriver = useMemo(() => {
    const map: Record<string, number> = {};
    trips.forEach((t) => { if (t.driverId) map[t.driverId] = (map[t.driverId] ?? 0) + 1; });
    return map;
  }, [trips]);

  const filtered = useMemo(() => drivers.filter((d) => {
    const q = search.toLowerCase();
    if (q && !d.name.toLowerCase().includes(q) && !d.licenseNumber.toLowerCase().includes(q)) return false;
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    return true;
  }), [drivers, search, statusFilter]);

  const counts = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === "active").length,
    off_duty: drivers.filter((d) => d.status === "off_duty").length,
    on_leave: drivers.filter((d) => d.status === "on_leave").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Management"
        subtitle="Manage drivers, monitor performance, and assign vehicles"
        breadcrumbs={[{ label: "Operations" }, { label: "Drivers" }]}
        actions={<Button size="sm" onClick={openAdd}><Plus className="w-4 h-4" /> Add Driver</Button>}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Drivers" value={counts.total} icon={Users} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[8,9,9,10,10,10,10,10]} />
        <KpiCard label="Active" value={counts.active} icon={Activity} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[6,7,7,8,8,8,8,8]} sparklineColor="#10B981" />
        <KpiCard label="Off Duty" value={counts.off_duty} icon={Truck} iconColor="text-gray-500" iconBg="bg-gray-100" sparklineData={[1,1,1,1,1,1,1,1]} sparklineColor="#9CA3AF" />
        <KpiCard label="On Leave" value={counts.on_leave} icon={Calendar} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[0,1,1,1,1,1,1,1]} sparklineColor="#F59E0B" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or license number..."
            className="pl-10"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}> 
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
      </div>
      {/* Driver Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-4 font-medium">Driver</th>
                  <th className="py-3 px-4 font-medium">License</th>
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
                      <p className="text-muted-foreground font-medium">No drivers found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || statusFilter !== "all" ? "Try adjusting your search or filter" : "Add your first driver to get started"}
                      </p>
                      {!search && statusFilter === "all" && (
                        <Button size="sm" className="mt-4" onClick={openAdd}><Plus className="w-4 h-4" /> Add Driver</Button>
                      )}
                    </td>
                  </tr>
                )}
                {filtered.map((d) => {
                  const vehicle = vehicles.find((v) => v.id === d.assignedVehicleId);
                  const tripCount = tripCountByDriver[d.id] ?? d.totalTrips;
                  return (
                      <tr key={d.id} className="border-b border-brand-border/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/drivers/${d.id}`} className="flex items-center gap-3 group">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="bg-brand-navy text-white text-xs font-bold">
                              {initials(d.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-brand-navy group-hover:text-brand-teal transition-colors dark:text-white">{d.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" /> {d.phone}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-xs">{d.licenseNumber}</div>
                        <div className="text-xs text-muted-foreground">{d.licenseClass}</div>
                      </td>
                      <td className="py-3 px-4">
                        {vehicle
                          ? <Badge variant="info">{vehicle.plate}</Badge>
                          : <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        }
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          {d.rating.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-teal rounded-full" style={{ width: `${d.onTimePercent}%` }} />
                          </div>
                          <span className="text-xs font-bold">{d.onTimePercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-muted-foreground">{tripCount}</td>
                      <td className="py-3 px-4">
                        <Badge variant={STATUS_VARIANT[d.status]}>{d.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push(`/drivers/${d.id}`)}>
                              <Eye className="w-4 h-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(d)}>
                              <Pencil className="w-4 h-4" /> Edit Driver
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {d.status !== "active" && (
                              <DropdownMenuItem onClick={() => setStatus(d, "active")}>
                                <UserCheck className="w-4 h-4 text-emerald-600" /> Set Active
                              </DropdownMenuItem>
                            )}
                            {d.status !== "off_duty" && (
                              <DropdownMenuItem onClick={() => setStatus(d, "off_duty")}>
                                <UserMinus className="w-4 h-4 text-gray-500" /> Set Off Duty
                              </DropdownMenuItem>
                            )}
                            {d.status !== "on_leave" && (
                              <DropdownMenuItem onClick={() => setStatus(d, "on_leave")}>
                                <Calendar className="w-4 h-4 text-amber-600" /> Set On Leave
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => setDeleteTarget(d)}>
                              <Trash2 className="w-4 h-4" /> Delete Driver
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
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t border-brand-border/60 text-xs text-muted-foreground">
              Showing {filtered.length} of {drivers.length} driver{drivers.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Driver Sheet */}
      <AddDriverSheet open={sheetOpen} onOpenChange={closeSheet} editDriver={editingDriver} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Remove Driver
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the roster?
              This action cannot be undone. Any trip assignments will be unaffected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove Driver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

