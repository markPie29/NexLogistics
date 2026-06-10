"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  GitBranch,
  MapPin,
  Clock,
  Fuel,
  TrendingUp,
  Search,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// ─── Seed Data ────────────────────────────────────────────────────────────────

interface RouteCorridor {
  id: string;
  origin: string;
  destination: string;
  distanceKm: number;
  avgDuration: string;
  tripsThisMonth: number;
  avgRevenue: number;
  performance: "Excellent" | "Good" | "Needs Attention";
}

const ROUTE_CORRIDORS: RouteCorridor[] = [
  { id: "RT-001", origin: "Manila Port", destination: "Pampanga", distanceKm: 96, avgDuration: "2h 15m", tripsThisMonth: 142, avgRevenue: 28500, performance: "Excellent" },
  { id: "RT-002", origin: "Cavite Industrial", destination: "Laguna", distanceKm: 62, avgDuration: "1h 20m", tripsThisMonth: 98, avgRevenue: 18200, performance: "Good" },
  { id: "RT-003", origin: "Makati", destination: "Batangas", distanceKm: 88, avgDuration: "2h 05m", tripsThisMonth: 76, avgRevenue: 24800, performance: "Excellent" },
  { id: "RT-004", origin: "Quezon City", destination: "Bulacan", distanceKm: 47, avgDuration: "1h 05m", tripsThisMonth: 184, avgRevenue: 12400, performance: "Good" },
  { id: "RT-005", origin: "Makati", destination: "Rizal", distanceKm: 38, avgDuration: "0h 55m", tripsThisMonth: 112, avgRevenue: 9800, performance: "Good" },
  { id: "RT-006", origin: "Batangas Port", destination: "Quezon City", distanceKm: 130, avgDuration: "3h 10m", tripsThisMonth: 54, avgRevenue: 38200, performance: "Needs Attention" },
  { id: "RT-007", origin: "Manila", destination: "Laguna via SLEX", distanceKm: 68, avgDuration: "1h 30m", tripsThisMonth: 126, avgRevenue: 15600, performance: "Excellent" },
  { id: "RT-008", origin: "Pampanga", destination: "QC via NLEX", distanceKm: 88, avgDuration: "1h 50m", tripsThisMonth: 94, avgRevenue: 22100, performance: "Good" },
  { id: "RT-009", origin: "Cavite", destination: "Batangas", distanceKm: 52, avgDuration: "1h 10m", tripsThisMonth: 68, avgRevenue: 14500, performance: "Needs Attention" },
  { id: "RT-010", origin: "Manila", destination: "Bulacan via NLEX", distanceKm: 42, avgDuration: "0h 50m", tripsThisMonth: 156, avgRevenue: 8200, performance: "Needs Attention" },
];

interface OptimizationRecommendation {
  id: string;
  description: string;
  savings: string;
  applied: boolean;
}

const RECOMMENDATIONS: OptimizationRecommendation[] = [
  { id: "opt-1", description: "Batch Laguna-bound deliveries from Cavite & Manila", savings: "Saves 23 km/day", applied: false },
  { id: "opt-2", description: "Shift Pampanga departure to 04:00 AM to avoid NLEX congestion", savings: "Avoids 38 min delay", applied: false },
  { id: "opt-3", description: "Consolidate Rizal and QC routes on return leg", savings: "Saves ₱4,200/week in fuel", applied: false },
  { id: "opt-4", description: "Re-route Batangas Port via STAR Tollway during peak hours", savings: "Saves 22 min per trip", applied: false },
  { id: "opt-5", description: "Assign 6-wheeler to Manila–Bulacan for higher capacity", savings: "Reduces 3 trips/day", applied: false },
];

const PERFORMANCE_VARIANT: Record<string, "success" | "warning" | "danger"> = {
  Excellent: "success",
  Good: "warning",
  "Needs Attention": "danger",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const [search, setSearch] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimized, setOptimized] = useState(false);
  const [recommendations, setRecommendations] = useState(RECOMMENDATIONS);

  const filteredRoutes = useMemo(() => {
    if (!search) return ROUTE_CORRIDORS;
    const q = search.toLowerCase();
    return ROUTE_CORRIDORS.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.origin.toLowerCase().includes(q) ||
        r.destination.toLowerCase().includes(q)
    );
  }, [search]);

  const handleRunOptimization = () => {
    setOptimizing(true);
    setOptimized(false);
    setRecommendations(RECOMMENDATIONS.map((r) => ({ ...r, applied: false })));
    setTimeout(() => {
      setOptimizing(false);
      setOptimized(true);
      toast.success("Optimization analysis complete");
    }, 3000);
  };

  const handleApply = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, applied: true } : r))
    );
    const rec = recommendations.find((r) => r.id === id);
    toast.success(`Applied: ${rec?.description ?? "Recommendation"}`);
  };

  // KPI calculations
  const totalActiveRoutes = ROUTE_CORRIDORS.length;
  const avgDistance = Math.round(
    ROUTE_CORRIDORS.reduce((sum, r) => sum + r.distanceKm, 0) / ROUTE_CORRIDORS.length
  );
  const onTimeRate = 87.4;
  const fuelSaved = 12850;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Management"
        subtitle="Manage corridors, optimize stops, and track performance"
        breadcrumbs={[{ label: "Operations" }, { label: "Routes" }]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KpiCard
          label="Active Routes"
          value={totalActiveRoutes}
          icon={GitBranch}
          iconColor="text-brand-teal"
          iconBg="bg-brand-teal-light"
          trend={8.2}
          trendLabel="vs last month"
          delay={0}
        />
        <KpiCard
          label="Avg Distance"
          value={`${avgDistance} km`}
          icon={MapPin}
          iconColor="text-violet-600"
          iconBg="bg-violet-50"
          trend={-3.1}
          trendLabel="optimized"
          delay={0.05}
        />
        <KpiCard
          label="On-Time Rate"
          value={`${onTimeRate}%`}
          icon={Clock}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          trend={2.4}
          trendLabel="vs last month"
          delay={0.1}
        />
        <KpiCard
          label="Fuel Saved (Monthly)"
          value={formatCurrency(fuelSaved)}
          icon={Fuel}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          trend={15.3}
          trendLabel="vs last month"
          delay={0.15}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="corridors">
        <TabsList>
          <TabsTrigger value="corridors">Route Corridors</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* ─── Route Corridors Tab ─── */}
        <TabsContent value="corridors">
          <Card>
            <CardContent className="p-4">
              {/* Search Filter */}
              <div className="relative mb-4 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search routes..."
                  className="pl-10"
                />
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-muted-foreground border-b border-brand-border bg-gray-50/50">
                      <th className="py-3 px-4 font-medium">Route ID</th>
                      <th className="py-3 px-4 font-medium">Corridor</th>
                      <th className="py-3 px-4 font-medium">Distance</th>
                      <th className="py-3 px-4 font-medium">Avg Duration</th>
                      <th className="py-3 px-4 font-medium">Trips This Month</th>
                      <th className="py-3 px-4 font-medium">Avg Revenue</th>
                      <th className="py-3 px-4 font-medium">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <GitBranch className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                          <p className="text-muted-foreground font-medium">No routes found</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Try adjusting your search filter
                          </p>
                        </td>
                      </tr>
                    )}
                    {filteredRoutes.map((route) => (
                      <tr
                        key={route.id}
                        className="border-b border-brand-border/60 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-brand-navy">
                          {route.id}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-brand-navy">{route.origin}</span>
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span className="font-medium text-brand-navy">{route.destination}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">{route.distanceKm} km</td>
                        <td className="py-3 px-4 text-muted-foreground">{route.avgDuration}</td>
                        <td className="py-3 px-4 font-medium">{route.tripsThisMonth}</td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(route.avgRevenue)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={PERFORMANCE_VARIANT[route.performance]}>
                            {route.performance}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredRoutes.length > 0 && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Showing {filteredRoutes.length} of {ROUTE_CORRIDORS.length} routes
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Optimization Tab ─── */}
        <TabsContent value="optimization">
          <div className="space-y-4">
            {/* Run Optimization */}
            <Card>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                    <Zap className="w-5 h-5 text-brand-teal" />
                    Route Optimization Engine
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Analyze all active corridors for distance, time, and fuel savings
                  </p>
                </div>
                <Button
                  onClick={handleRunOptimization}
                  disabled={optimizing}
                  className="shrink-0"
                >
                  {optimizing ? "Analyzing..." : "Run Optimization"}
                </Button>
              </CardContent>
            </Card>

            {/* Loading Animation */}
            {optimizing && (
              <Card>
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <TrendingUp className="w-10 h-10 text-brand-teal" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-sm font-medium text-muted-foreground"
                  >
                    Analyzing 10 corridors across 731 km...
                  </motion.p>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {optimized && !optimizing && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Before vs After */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                      Optimization Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-brand-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Distance</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-red-500 line-through">731 km</span>
                          <span className="text-lg font-bold text-emerald-600">684 km</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium mt-1">↓ 47 km saved daily</p>
                      </div>
                      <div className="rounded-xl border border-brand-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Total Time</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-red-500 line-through">16.2 hrs</span>
                          <span className="text-lg font-bold text-emerald-600">14.5 hrs</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium mt-1">↓ 1.7 hrs saved daily</p>
                      </div>
                      <div className="rounded-xl border border-brand-border p-4">
                        <p className="text-xs text-muted-foreground mb-1">Fuel Cost</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-red-500 line-through">₱18,400</span>
                          <span className="text-lg font-bold text-emerald-600">₱15,200</span>
                        </div>
                        <p className="text-xs text-emerald-600 font-medium mt-1">↓ ₱3,200 saved daily</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center gap-4 rounded-xl border border-brand-border p-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brand-navy">
                              {rec.description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {rec.savings}
                            </p>
                          </div>
                          {rec.applied ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <CheckCircle2 className="w-4 h-4" /> Applied
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApply(rec.id)}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
