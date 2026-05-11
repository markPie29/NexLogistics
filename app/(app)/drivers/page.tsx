"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Star, Truck, Activity, Search, Plus, Phone, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDriverStore, useFleetStore, useTripStore } from "@/lib/store";
import { initials } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddDriverSheet } from "@/components/forms/AddDriverSheet";
import { toast } from "sonner";

const STATUS_VARIANT: Record<string, any> = {
  active: "success",
  off_duty: "neutral",
  on_leave: "warning",
};

export default function DriversPage() {
  const drivers = useDriverStore((s) => s.drivers);
  const deleteDriver = useDriverStore((s) => s.deleteDriver);
  const vehicles = useFleetStore((s) => s.vehicles);
  const trips = useTripStore((s) => s.trips);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => drivers.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
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
        actions={<Button size="sm" onClick={() => setSheetOpen(true)}><Plus className="w-4 h-4" /> Add Driver</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard label="Total Drivers" value={counts.total} icon={Users} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" sparklineData={[8,9,9,10,10,10,10,10]} />
        <KpiCard label="Active" value={counts.active} icon={Activity} iconColor="text-emerald-600" iconBg="bg-emerald-50" sparklineData={[6,7,7,8,8,8,8,8]} sparklineColor="#10B981" />
        <KpiCard label="Off Duty" value={counts.off_duty} icon={Truck} iconColor="text-gray-500" iconBg="bg-gray-100" sparklineData={[1,1,1,1,1,1,1,1]} sparklineColor="#9CA3AF" />
        <KpiCard label="On Leave" value={counts.on_leave} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-50" sparklineData={[0,1,1,1,1,1,1,1]} sparklineColor="#F59E0B" />
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search driver name..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="off_duty">Off Duty</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                  <th className="py-3 px-4 font-medium">Driver</th>
                  <th className="py-3 px-4 font-medium">License</th>
                  <th className="py-3 px-4 font-medium">Assigned Vehicle</th>
                  <th className="py-3 px-4 font-medium">Rating</th>
                  <th className="py-3 px-4 font-medium">On-Time</th>
                  <th className="py-3 px-4 font-medium">Trips</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const vehicle = vehicles.find((v) => v.id === d.assignedVehicleId);
                  return (
                    <tr key={d.id} className="border-b border-brand-border/60 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/drivers/${d.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                          <Avatar className="h-10 w-10"><AvatarFallback>{initials(d.name)}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-semibold text-brand-navy hover:text-brand-teal transition">{d.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{d.licenseNumber}</div>
                        <div className="text-xs text-muted-foreground">{d.licenseClass}</div>
                      </td>
                      <td className="py-3 px-4">{vehicle ? <Badge variant="info">{vehicle.plate}</Badge> : <span className="text-xs text-muted-foreground">Unassigned</span>}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-bold"><Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{d.rating.toFixed(1)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-brand-teal" style={{ width: `${d.onTimePercent}%` }} /></div>
                          <span className="text-xs font-bold">{d.onTimePercent}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{d.totalTrips}</td>
                      <td className="py-3 px-4"><Badge variant={STATUS_VARIANT[d.status]}>{d.status.replace("_", " ")}</Badge></td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><button className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><MoreHorizontal className="w-4 h-4" /></button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/drivers/${d.id}`)}><Eye className="w-4 h-4" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/drivers/${d.id}`)}><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive onClick={() => { deleteDriver(d.id); toast.success("Driver removed"); }}><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <AddDriverSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}

