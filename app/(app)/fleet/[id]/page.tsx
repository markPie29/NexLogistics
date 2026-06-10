"use client";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, Wrench, DollarSign, MapPin, FileText, User as UserIcon, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFleetStore, useDriverStore, useTripStore, useMaintenanceStore, useExpenseStore } from "@/lib/store";
import { formatCurrency, initials, relativeTime } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { VehicleDocumentsTab } from "@/components/fleet/VehicleDocumentsTab";

export default function VehicleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const vehicle = useFleetStore((s) => s.vehicles.find((v) => v.id === params.id));
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);
  const maintenance = useMaintenanceStore((s) => s.records);
  const expenses = useExpenseStore((s) => s.expenses);

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Vehicle not found.</p>
        <Button className="mt-4" onClick={() => router.push("/fleet")}><ArrowLeft className="w-4 h-4" /> Back to Fleet</Button>
      </div>
    );
  }

  const driver = drivers.find((d) => d.id === vehicle.assignedDriverId);
  const vTrips = trips.filter((t) => t.vehicleId === vehicle.id);
  const currentTrip = vTrips.find((t) => ["in_transit", "loaded", "vehicle_dispatched", "driver_assigned"].includes(t.status));
  const vMaint = maintenance.filter((m) => m.vehicleId === vehicle.id);
  const vExpenses = expenses.filter((e) => e.vehicleId === vehicle.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={vehicle.plate}
        subtitle={`${vehicle.brand} ${vehicle.model} · ${vehicle.year} · ${vehicle.color}`}
        breadcrumbs={[{ label: "Operations" }, { label: "Fleet", href: "/fleet" }, { label: vehicle.plate }]}
        actions={<Button variant="outline" onClick={() => router.push("/fleet")}><ArrowLeft className="w-4 h-4" /> Back</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat label="Status" value={vehicle.status.replace("_", " ")} icon={Activity} />
        <Stat label="Odometer" value={`${vehicle.odometer.toLocaleString()} km`} icon={Truck} />
        <Stat label="Maintenance Records" value={vMaint.length} icon={Wrench} />
        <Stat label="Total Trips" value={vTrips.length} icon={MapPin} />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="driver">Driver</TabsTrigger>
          <TabsTrigger value="trip">Current Trip</TabsTrigger>
          <TabsTrigger value="docs">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>Vehicle Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <Detail label="Plate" value={vehicle.plate} />
              <Detail label="Type" value={vehicle.type} />
              <Detail label="Brand / Model" value={`${vehicle.brand} ${vehicle.model}`} />
              <Detail label="Year" value={vehicle.year} />
              <Detail label="Color" value={vehicle.color} />
              <Detail label="Capacity" value={vehicle.capacity} />
              <Detail label="Fuel Type" value={vehicle.fuelType} />
              <Detail label="Odometer" value={`${vehicle.odometer.toLocaleString()} km`} />
              <Detail label="Registration Expiry" value={`${new Date(vehicle.registrationExpiry).toLocaleDateString()} (${relativeTime(vehicle.registrationExpiry)})`} />
              <Detail label="Insurance Expiry" value={`${new Date(vehicle.insuranceExpiry).toLocaleDateString()} (${relativeTime(vehicle.insuranceExpiry)})`} />
              <Detail label="Permit Expiry" value={`${new Date(vehicle.permitExpiry).toLocaleDateString()} (${relativeTime(vehicle.permitExpiry)})`} />
              <Detail label="GPS Device" value={vehicle.gpsDeviceId || "Not installed"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50">
                <th className="py-3 px-4">Type</th><th className="py-3 px-4">Due</th><th className="py-3 px-4">Cost</th><th className="py-3 px-4">Status</th>
              </tr></thead>
              <tbody>
                {vMaint.map((m) => (
                  <tr key={m.id} className="border-b border-brand-border/60">
                    <td className="py-3 px-4 font-medium">{m.type}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(m.dueDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{m.cost ? formatCurrency(m.cost) : "—"}</td>
                    <td className="py-3 px-4"><Badge variant={m.status === "overdue" ? "danger" : m.status === "due_soon" ? "warning" : m.status === "completed" ? "success" : "info"}>{m.status.replace("_", " ")}</Badge></td>
                  </tr>
                ))}
                {vMaint.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No maintenance records.</td></tr>}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50">
                <th className="py-3 px-4">Date</th><th className="py-3 px-4">Category</th><th className="py-3 px-4">Vendor</th><th className="py-3 px-4 text-right">Amount</th>
              </tr></thead>
              <tbody>
                {vExpenses.map((e) => (
                  <tr key={e.id} className="border-b border-brand-border/60">
                    <td className="py-3 px-4">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 capitalize">{e.category}</td>
                    <td className="py-3 px-4 text-muted-foreground">{e.vendor || "—"}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
                {vExpenses.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No expenses.</td></tr>}
              </tbody>
            </table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="driver">
          <Card>
            <CardContent className="p-6">
              {driver ? (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-navy text-white text-xl font-bold flex items-center justify-center">{initials(driver.name)}</div>
                  <div>
                    <div className="text-lg font-bold text-brand-navy">{driver.name}</div>
                    <div className="text-sm text-muted-foreground">{driver.phone} · {driver.email}</div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span>License: <b>{driver.licenseNumber}</b></span>
                      <span>Rating: <b>{driver.rating}/5</b></span>
                      <span>On-time: <b>{driver.onTimePercent}%</b></span>
                    </div>
                  </div>
                </div>
              ) : <p className="text-muted-foreground">No driver assigned.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip">
          <Card>
            <CardContent className="p-6">
              {currentTrip ? (
                <div className="space-y-2">
                  <div className="text-lg font-bold text-brand-navy">{currentTrip.id}</div>
                  <div className="text-sm">{currentTrip.pickup.address} → {currentTrip.dropoff.address}</div>
                  <Badge variant="info">{currentTrip.status.replace(/_/g, " ")}</Badge>
                </div>
              ) : <p className="text-muted-foreground">No active trip.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <VehicleDocumentsTab vehicleId={params.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-card flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-teal-light flex items-center justify-center"><Icon className="w-5 h-5 text-brand-teal" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-base font-bold text-brand-navy capitalize">{value}</div>
      </div>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-brand-navy mt-0.5">{value}</div>
    </div>
  );
}
