"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LiveMapDynamic } from "@/components/maps/LiveMapDynamic";
import { useFleetStore, useDriverStore, useTripStore } from "@/lib/store";
import { useAuthStore } from "@/lib/store/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Truck, Search, CheckCircle2, PauseCircle, PowerOff, AlertTriangle,
  MapPin, Phone, MessageSquare, Compass, Gauge, Fuel, Signal, Filter,
  X, Clock, Play, ChevronLeft, ChevronRight, Route as RouteIcon,
  CircleDot, History, Activity, Bell, Navigation2, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GpsPage() {
  const user      = useAuthStore((s) => s.user);
  const vehicles  = useFleetStore((s) => s.vehicles);
  const drivers   = useDriverStore((s) => s.drivers);
  const trips     = useTripStore((s) => s.trips);

  // All hooks must be declared before any conditional return
  const [activeTab, setActiveTab] = useState<"all" | "active" | "in_trip">("all");
  const [search, setSearch] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Group vehicles by status
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === "in_trip" || v.status === "available").length;
  const inTripCount = vehicles.filter(v => v.status === "in_trip").length;
  const idleCount = vehicles.filter(v => v.status === "available").length;
  const offlineCount = vehicles.filter(v => v.status === "maintenance").length;
  const alertsCount = 5; // Mock

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      let matchTab = true;
      if (activeTab === "active") matchTab = (v.status === "in_trip" || v.status === "available");
      if (activeTab === "in_trip") matchTab = v.status === "in_trip";

      let matchSearch = true;
      if (search) {
        matchSearch = v.plate.toLowerCase().includes(search.toLowerCase());
      }
      return matchTab && matchSearch;
    });
  }, [vehicles, activeTab, search]);

  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === selectedVehicleId), [vehicles, selectedVehicleId]);
  const activeDriver = selectedVehicle?.assignedDriverId ? drivers.find(d => d.id === selectedVehicle?.assignedDriverId) : null;

  // ── Driver role → render mobile GPS view ──
  if (user?.role === "driver") {
    return <DriverGpsView user={user} vehicles={vehicles} drivers={drivers} trips={trips} />;
  }

  // ── Admin / dispatcher view (unchanged) ──

  return (
    <div className="space-y-4 lg:space-y-6 h-full flex flex-col pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Live GPS Tracking</h1>
            <Badge variant="danger" className="animate-pulse shadow-sm">
              <CircleDot className="w-3 h-3 mr-1" /> Live
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">Real-time location of all active vehicles</p>
        </div>
        <Select defaultValue="history">
          <SelectTrigger className="w-[180px]">
            <History className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Vehicle History" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="history">Vehicle History</SelectItem>
            <SelectItem value="settings">Settings</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 shrink-0">
        <KpiBlock icon={Truck} title="Total Vehicles" value={totalCount} valueColor="text-brand-navy" sub={<span className="text-brand-teal font-medium hover:underline cursor-pointer">View all vehicles</span>} />
        <KpiBlock icon={CheckCircle2} title="Active" value={activeCount} valueColor="text-brand-teal" sub={`${((activeCount / totalCount) * 100).toFixed(1)}% of total`} />
        <KpiBlock icon={RouteIcon} title="In Trip" value={inTripCount} valueColor="text-blue-500" sub={`${((inTripCount / totalCount) * 100).toFixed(1)}% of total`} />
        <KpiBlock icon={PauseCircle} title="Idle" value={idleCount} valueColor="text-amber-500" sub={`${((idleCount / totalCount) * 100).toFixed(1)}% of total`} />
        <KpiBlock icon={PowerOff} title="Offline" value={offlineCount} valueColor="text-gray-400" sub={`${((offlineCount / totalCount) * 100).toFixed(1)}% of total`} />
        <KpiBlock icon={AlertTriangle} title="Alerts" value={alertsCount} valueColor="text-red-500" sub={<span className="text-red-500 font-medium hover:underline cursor-pointer">View alerts</span>} />
      </div>

      {/* Map Layout */}
      <div className="grid lg:grid-cols-4 gap-4 flex-1 min-h-0 items-start">
        {/* Left Sidebar Vehicles List */}
        <Card className="lg:col-span-1 h-[65vh] lg:h-[800px] flex flex-col shadow-sm border-brand-border">
          <div className="p-4 border-b border-brand-border/60 shrink-0 space-y-4">
            <h2 className="font-semibold text-base">All Vehicles ({totalCount})</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-10 pr-10" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-brand-navy" />
            </div>
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-md text-sm dark:bg-slate-900/75">
              <button 
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-white shadow-sm text-brand-navy dark:bg-slate-700 dark:text-white' : 'text-muted-foreground hover:text-brand-navy hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'}`}
                onClick={() => setActiveTab('all')}
              >
                All ({totalCount})
              </button>
              <button 
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-white shadow-sm text-brand-navy dark:bg-slate-700 dark:text-white' : 'text-muted-foreground hover:text-brand-navy hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'}`}
                onClick={() => setActiveTab('active')}
              >
                Active ({activeCount})
              </button>
              <button 
                className={`flex-1 py-1.5 rounded-sm font-medium transition-colors ${activeTab === 'in_trip' ? 'bg-white shadow-sm text-brand-navy dark:bg-slate-700 dark:text-white' : 'text-muted-foreground hover:text-brand-navy hover:bg-slate-50 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'}`}
                onClick={() => setActiveTab('in_trip')}
              >
                In Trip ({inTripCount})
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
            {filteredVehicles.map(v => {
              const d = drivers.find(d => d.id === v.assignedDriverId);
              const isSelected = selectedVehicleId === v.id;
              
              let statusLabel = "Offline";
              let statusVariant: "neutral"|"success"|"warning"|"info"|"danger" = "neutral";
              
              if (v.status === "in_trip") { statusLabel = "In Transit"; statusVariant = "info"; }
              else if (v.status === "available") { statusLabel = "Idle"; statusVariant = "success"; }
              else if (v.status === "maintenance") { statusLabel = "Maintenance"; statusVariant = "warning"; }

              return (
                <div 
                  key={v.id} 
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected 
                      ? "border-brand-teal bg-brand-teal/5 shadow-sm" 
                      : "border-brand-border/60 hover:bg-slate-100 hover:border-slate-300 dark:hover:bg-slate-800 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                        statusVariant === "info" ? "bg-blue-100 text-blue-600" :
                        statusVariant === "success" ? "bg-green-100 text-green-600" :
                        statusVariant === "warning" ? "bg-orange-100 text-orange-600" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-brand-navy dark:text-white truncate">{v.plate}</div>
                        <div className="text-xs text-muted-foreground truncate">{d?.name || "Unassigned"}</div>
                      </div>
                    </div>
                    <Badge variant={statusVariant} className="text-[10px] leading-tight ml-2 shrink-0">{statusLabel}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> {(Math.random() * 40 + 20).toFixed(0)} km/h</span>
                    <span>TRP-2024-{(Math.random() * 800 + 100).toFixed(0)}</span>
                  </div>
                </div>
              )
            })}
            {filteredVehicles.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">No vehicles found.</div>
            )}
          </div>

          <div className="p-3 border-t border-brand-border/60 flex flex-wrap gap-2 items-center justify-between text-xs text-muted-foreground bg-gray-50 dark:bg-brand-navy/10 dark:border-white/10 dark:text-slate-300 shrink-0 rounded-b-lg">
            <span>1-{filteredVehicles.length > 8 ? 8 : filteredVehicles.length} of {filteredVehicles.length}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="w-6 h-6"><ChevronLeft className="w-3 h-3" /></Button>
              <Button variant="outline" size="icon" className="w-6 h-6"><ChevronRight className="w-3 h-3" /></Button>
            </div>
          </div>
        </Card>

        {/* Map Container */}
        <Card className="lg:col-span-3 h-[65vh] lg:h-[800px] overflow-hidden relative shadow-sm border-brand-border rounded-xl">
          <div className="absolute inset-0">
            <LiveMapDynamic />
          </div>

          {/* Floating Vehicle Detail Panel */}
          {selectedVehicle && (
            <div className="absolute top-4 right-4 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-brand-border z-10 flex flex-col max-h-[calc(100%-2rem)] overflow-y-auto animate-in slide-in-from-right-4 fade-in duration-200">
              {/* Header */}
              <div className="p-4 border-b border-brand-border/60 flex justify-between items-start bg-gray-50/80 sticky top-0 z-20">
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base truncate">{selectedVehicle.plate}</h3>
                    <Badge variant={selectedVehicle.status === "in_trip" ? "info" : "success"} className="shrink-0">
                      {selectedVehicle.status === "in_trip" ? "In Transit" : "Idle"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{selectedVehicle.type} • TRP-2024-{(Math.random() * 800 + 100).toFixed(0)}</p>
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 -mt-1 -mr-1 shrink-0" onClick={() => setSelectedVehicleId(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Driver Info */}
              <div className="p-4 border-b border-brand-border/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-brand-teal/10 flex items-center justify-center font-bold text-brand-teal">
                    {activeDriver?.name ? activeDriver.name.charAt(0) : "?"}
                  </div>
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold truncate">{activeDriver?.name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{activeDriver?.phone || "+63 900 000 0000"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-full text-brand-teal border-brand-teal/30 hover:bg-brand-teal/10"><Phone className="w-3.5 h-3.5" /></Button>
                  <Button variant="outline" size="icon" className="w-8 h-8 rounded-full text-brand-teal border-brand-teal/30 hover:bg-brand-teal/10"><MessageSquare className="w-3.5 h-3.5" /></Button>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="p-4 grid grid-cols-2 gap-y-4 gap-x-2 text-sm border-b border-brand-border/60 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Location</span></div>
                  <p className="font-medium truncate" title="EDSA, Quezon City">EDSA, Quezon City</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><Gauge className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Speed / Heading</span></div>
                  <p className="font-medium truncate">{(Math.random() * 40 + 20).toFixed(0)} km/h <span className="text-muted-foreground">NE</span></p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><Clock className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Last Update</span></div>
                  <p className="font-medium truncate">Today, 08:45 AM</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><Activity className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Engine</span></div>
                  <p className="font-medium text-green-600 truncate">ON</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><Signal className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">GPS Signal</span></div>
                  <p className="font-medium truncate">Strong</p>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs"><Fuel className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">Fuel Level</span></div>
                  <div className="flex items-center gap-2 font-medium">
                    70%
                    <div className="w-10 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0"><div className="h-full bg-green-500 w-[70%]" /></div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-gray-50/80 rounded-b-xl text-center shrink-0">
                <Button variant="link" className="text-brand-teal w-full font-semibold">View Full Details &rarr;</Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 shrink-0 mt-4">
        <Card className="shadow-sm border-brand-border">
          <CardHeader className="pb-2 border-b border-brand-border/60">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold dark:text-white">Recent Alerts</CardTitle>
              <Badge variant="danger" className="rounded-full">5</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-brand-border/60">
              <div className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-white truncate">Geofence Exit (NEX-101)</p>
                    <p className="text-xs text-muted-foreground truncate">Vehicle left designated route.</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">2m ago</span>
                </div>
              </div>
              <div className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Gauge className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-white truncate">High Speed (NEX-104)</p>
                    <p className="text-xs text-muted-foreground truncate">Speed exceeded 80 km/h.</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">15m ago</span>
                </div>
              </div>
              <div className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><Fuel className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-brand-navy dark:text-white truncate">Low Fuel (NEX-109)</p>
                    <p className="text-xs text-muted-foreground truncate">Fuel level below 15%.</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap pt-0.5">1h ago</span>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-brand-border/60 text-center bg-gray-50 rounded-b-lg">
              <Button variant="link" className="text-brand-teal h-auto p-0" size="sm">View All Alerts &rarr;</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-brand-border flex flex-col">
          <CardHeader className="pb-2 border-b border-brand-border/60 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-base font-semibold dark:text-white">Traffic Overview</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-brand-teal mt-0">Refresh</Button>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex-1 w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center border border-gray-200 overflow-hidden relative min-h-[140px]">
              {/* Fake Traffic Map Image Placeholder */}
              <div className="absolute inset-0 bg-blue-50/50 flex flex-col items-center justify-center text-muted-foreground">
                <MapPin className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-medium">Live Traffic Layer</span>
              </div>
              {/* Decal routes to look like traffic */}
              <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M10,90 Q30,40 50,50 T90,10" fill="none" stroke="#ef4444" strokeWidth="2" />
                <path d="M20,90 Q40,60 60,70 T90,30" fill="none" stroke="#22c55e" strokeWidth="2" />
                <path d="M30,90 Q50,70 70,60 T90,50" fill="none" stroke="#f97316" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-medium shrink-0 flex-wrap">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500 shrink-0"></div>Fast</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500 shrink-0"></div>Moderate</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500 shrink-0"></div>Heavy</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-brand-border md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 border-b border-brand-border/60 shrink-0">
            <CardTitle className="text-base font-semibold dark:text-white">Replay History</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Select defaultValue="nex101">
                <SelectTrigger className="w-full sm:flex-1 text-sm h-9">
                  <SelectValue placeholder="Vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nex101">NEX-101</SelectItem>
                  <SelectItem value="nex102">NEX-102</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="today">
                <SelectTrigger className="w-full sm:flex-1 text-sm h-9">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today, May 24</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between text-xs font-medium bg-gray-50 p-2 rounded-md border text-muted-foreground w-full overflow-hidden">
              <span className="text-brand-navy truncate">12:00 AM</span>
              <span>-</span>
              <span className="text-brand-navy truncate">11:59 PM</span>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <Button size="icon" className="w-10 h-10 rounded-full shrink-0 shadow-sm bg-brand-teal hover:bg-brand-teal/90 text-white"><Play className="w-4 h-4 ml-1" /></Button>
              <div className="flex-1 px-1 min-w-0">
                <Slider defaultValue={[45]} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium overflow-hidden">
                  <span className="truncate">12 AM</span>
                  <span className="truncate">12 PM</span>
                  <span className="truncate w-10 text-right">11:59 PM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function KpiBlock({ icon: Icon, title, value, valueColor, sub }: { icon: any, title: string, value: string | number, valueColor: string, sub: React.ReactNode }) {
  return (
    <Card className="shadow-sm border-brand-border p-3 xl:p-4 flex flex-col gap-2 overflow-hidden bg-white hover:bg-gray-50/50 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-xs lg:text-sm font-medium text-muted-foreground truncate pr-2" title={title}>{title}</h3>
        <div className={`p-1.5 rounded-md bg-gray-50 shrink-0 ${valueColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="min-w-0">
        <div className={`text-xl lg:text-3xl font-bold truncate ${valueColor}`}>{value}</div>
        <div className="text-xs text-muted-foreground mt-1 truncate max-w-full block">{sub}</div>
      </div>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
// Driver Mobile GPS View
// ─────────────────────────────────────────────────────────────
function DriverGpsView({ user, vehicles, drivers, trips }: {
  user: any;
  vehicles: any[];
  drivers: any[];
  trips: any[];
}) {
  const router = useRouter();

  const driverId  = user?.driverId ?? drivers[0]?.id;
  const myDriver  = drivers.find((d) => d.id === driverId) ?? drivers[0];
  const myVehicle = vehicles.find((v) => v.id === myDriver?.assignedVehicleId);
  const activeTrip = trips.find((t) => t.driverId === driverId && !["completed", "cancelled"].includes(t.status));

  const statusLabel = myVehicle?.status === "in_trip" ? "In Transit" :
                      myVehicle?.status === "available" ? "Idle" :
                      myVehicle?.status === "maintenance" ? "Maintenance" : "Offline";
  const statusColor = myVehicle?.status === "in_trip" ? "bg-blue-100 text-blue-700" :
                      myVehicle?.status === "available" ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-500";

  return (
    <div className="max-w-sm -mt-6 -mx-6 min-h-screen flex flex-col bg-gray-50 sm:mx-auto">
      {/* Sticky header */}
      <header className="sticky top-0 z-30 bg-[#0B1C2E] h-14 px-4 flex items-center justify-between shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center leading-none">
          <p className="text-white font-extrabold text-sm tracking-tight">
            NE<span className="text-teal-400">X</span>
          </p>
          <p className="text-[8px] tracking-[0.25em] text-teal-400/80 font-semibold">LOGISTICS</p>
        </div>
        <button
          onClick={() => {}}
          className="w-9 h-9 flex items-center justify-center"
          aria-label="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-white" />
        </button>
      </header>

      {/* Page title bar */}
      <div className="bg-[#0B1C2E] px-5 pb-5 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg">My Location</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/60">Live Tracking</span>
            </div>
          </div>
          {myVehicle && (
            <span className={cn("text-xs px-3 py-1.5 rounded-full font-semibold", statusColor)}>
              {statusLabel}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto pb-6">
        {/* Map */}
        <div className="relative h-[55vw] min-h-52 max-h-72 bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 flex flex-col items-center justify-center">
          <LiveMapDynamic />
          {/* Overlay badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-white/60">
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3 h-3 text-red-500 animate-pulse" />
              <span className="text-[11px] font-bold text-[#0B1C2E]">LIVE</span>
            </div>
          </div>
          {myVehicle && (
            <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow border border-white/60">
              <p className="text-[11px] font-bold text-[#0B1C2E]">{myVehicle.plate}</p>
            </div>
          )}
        </div>

        <div className="px-4 space-y-4 mt-4">
          {/* Vehicle card */}
          {myVehicle ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#0B1C2E]">{myVehicle.plate}</p>
                  <p className="text-xs text-gray-500">{myVehicle.brand} {myVehicle.model}</p>
                </div>
                <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold", statusColor)}>
                  {statusLabel}
                </span>
              </div>

              {/* Telemetry grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Gauge,     label: "Speed",      value: "42 km/h",      color: "text-blue-600 bg-blue-50" },
                  { icon: Fuel,      label: "Fuel",       value: "70%",          color: "text-emerald-600 bg-emerald-50" },
                  { icon: Signal,    label: "GPS Signal", value: "Strong",       color: "text-teal-600 bg-teal-50" },
                  { icon: Activity,  label: "Engine",     value: "Running",      color: "text-green-600 bg-green-50" },
                  { icon: Compass,   label: "Heading",    value: "NE",           color: "text-amber-600 bg-amber-50" },
                  { icon: Clock,     label: "Last Ping",  value: "Just now",     color: "text-gray-600 bg-gray-50" },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-2.5 flex flex-col gap-1.5">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", item.color)}>
                      <item.icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[10px] text-gray-400">{item.label}</p>
                    <p className="text-xs font-bold text-[#0B1C2E]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
              <Truck className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="font-bold text-[#0B1C2E]">No vehicle assigned</p>
              <p className="text-sm text-gray-400 mt-1">Contact your dispatcher.</p>
            </div>
          )}

          {/* Current route */}
          {activeTrip && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="font-bold text-sm text-[#0B1C2E] mb-3">Current Route</h3>
              <div className="flex gap-3 items-stretch">
                <div className="flex flex-col items-center pt-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400" />
                  <span className="w-0.5 flex-1 bg-gray-200 my-1" />
                  <span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white ring-1 ring-red-400" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-bold text-sm text-[#0B1C2E]">{activeTrip.pickup.address.split(",")[0]}</p>
                    <p className="text-xs text-gray-400">Pick-up</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#0B1C2E]">{activeTrip.dropoff.address.split(",")[0]}</p>
                    <p className="text-xs text-gray-400">Drop-off</p>
                  </div>
                </div>
                <div className="text-right space-y-3 pt-0.5">
                  <div>
                    <p className="text-[10px] text-gray-400">Distance</p>
                    <p className="font-bold text-sm text-[#0B1C2E]">{activeTrip.distanceKm} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">ETA</p>
                    <p className="font-bold text-sm text-[#0B1C2E]">
                      {activeTrip.eta
                        ? new Date(activeTrip.eta).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })
                        : "10:30 AM"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push("/driver")}
                className="mt-4 w-full h-11 bg-[#0B6E4F] hover:bg-[#0a5f44] active:scale-[0.98] text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <Navigation2 className="w-4 h-4" /> View Trip Details
              </button>
            </div>
          )}

          {/* Location history placeholder */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-bold text-sm text-[#0B1C2E] mb-3">Today's Route History</h3>
            <div className="space-y-2">
              {[
                { time: "08:00 AM", place: "Depot — Manila Port",           km: "0" },
                { time: "09:45 AM", place: "EDSA — Caloocan",               km: "18" },
                { time: "11:00 AM", place: "NLEX — Marilao",                km: "36" },
                { time: "12:30 PM", place: "NLEX — San Fernando",           km: "78" },
              ].map((item) => (
                <div key={item.time} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0B1C2E] truncate">{item.place}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-500">{item.km} km</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
