"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Truck, CheckCircle2, Wrench, AlertTriangle, Activity, Plus, Filter, Download, Search, MoreHorizontal, ChevronDown, FileText, Eye, Pencil, Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useFleetStore, useDriverStore } from "@/lib/store";
import { initials, relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddVehicleSheet } from "@/components/forms/AddVehicleSheet";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  available: "success",
  in_trip: "info",
  maintenance: "warning",
  inactive: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  available: "Available",
  in_trip: "In Trip",
  maintenance: "Maintenance",
  inactive: "Inactive",
};

export default function FleetPage() {
  const vehicles = useFleetStore((s) => s.vehicles);
  const removeVehicle = useFleetStore((s) => s.deleteVehicle);
  const drivers = useDriverStore((s) => s.drivers);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      if (search && !`${v.plate} ${v.brand} ${v.model}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      return true;
    });
  }, [vehicles, search, statusFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const types = Array.from(new Set(vehicles.map((v) => v.type)));

  // KPI counts
  const counts = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === "available").length,
    in_trip: vehicles.filter((v) => v.status === "in_trip").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    inactive: vehicles.filter((v) => v.status === "inactive").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet Management"
        subtitle="Manage your vehicles, monitor status, and track performance"
        breadcrumbs={[{ label: "Operations" }, { label: "Fleet Management" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
            <Button onClick={() => setSheetOpen(true)} size="sm"><Plus className="w-4 h-4" /> Add Vehicle</Button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 lg:gap-4">
        <KpiCard label="Total Vehicles" value={counts.total} icon={Truck} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[8,9,9,10,10,10,10,10]} />
        <KpiCard label="Available" value={counts.available} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[3,4,4,5,5,6,5,5]} sparklineColor="#10B981" />
        <KpiCard label="In Trip" value={counts.in_trip} icon={Activity} iconColor="text-sky-600" iconBg="bg-sky-50" sparklineData={[2,3,3,4,3,3,4,4]} sparklineColor="#0EA5E9" />
        <KpiCard label="Under Maintenance" value={counts.maintenance} icon={Wrench} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[1,1,1,1,1,1,1,1]} sparklineColor="#F59E0B" />
        <KpiCard label="Inactive" value={counts.inactive} icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50" sparklineData={[0,0,0,0,0,0,0,0]} sparklineColor="#EF4444" />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search plate, brand, model..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="in_trip">In Trip</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Vehicle Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4" /> More Filters</Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                  <th className="py-3 px-4 font-medium">Vehicle</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Assigned Driver</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Odometer</th>
                  <th className="py-3 px-4 font-medium">Insurance</th>
                  <th className="py-3 px-4 font-medium">Registration</th>
                  <th className="py-3 px-4 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((v) => {
                  const driver = drivers.find((d) => d.id === v.assignedDriverId);
                  return (
                    <tr key={v.id} className="border-b border-brand-border/60 hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
                      <td className="py-3 px-4">
                        <Link href={`/fleet/${v.id}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-brand-teal-light flex items-center justify-center">
                            <Truck className="w-5 h-5 text-brand-teal" />
                          </div>
                          <div>
                            <div className="font-semibold text-brand-navy dark:text-white">{v.plate}</div>
                            <div className="text-xs text-muted-foreground">{v.brand} {v.model} · {v.year}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{v.type}</td>
                      <td className="py-3 px-4">
                        {driver ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{initials(driver.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-brand-navy dark:text-white">{driver.name}</div>
                              <div className="text-xs text-muted-foreground">{driver.phone}</div>
                            </div>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[v.status]}>{STATUS_LABEL[v.status]}</Badge></td>
                      <td className="py-3 px-4 text-muted-foreground">{v.odometer.toLocaleString()} km</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{new Date(v.insuranceExpiry).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{relativeTime(v.insuranceExpiry)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{new Date(v.registrationExpiry).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">{relativeTime(v.registrationExpiry)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/fleet/${v.id}`)}><Eye className="w-4 h-4" /> View Detail</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/fleet/${v.id}`)}><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem><FileText className="w-4 h-4" /> Documents</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => { removeVehicle(v.id); toast.success("Vehicle deleted"); }}>
                              <Trash2 className="w-4 h-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {paged.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No vehicles match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-t border-brand-border gap-3 text-sm">
            <div className="text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <span className="px-2 text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddVehicleSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

