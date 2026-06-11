"use client";
import { useState, useMemo } from "react";
import {
  Warehouse, Package, Search, Plus, Clock,
  ArrowDownToLine, ArrowUpFromLine
} from "lucide-react";
import { AddItemModal } from "@/components/warehouse/AddItemModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";

// ─── Inventory Types (exported so AddItemModal can import them) ───────────────
export type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";
export type Category = "Parcels" | "Pallets" | "Containers" | "Documents";
export type WarehouseLocation = "Warehouse A" | "Warehouse B" | "Warehouse C";

export interface InventoryItem {
  sku: string;
  name: string;
  category: Category;
  location: WarehouseLocation;
  qtyInStock: number;
  reserved: number;
  available: number;
  status: InventoryStatus;
}

const WAREHOUSE_LABELS: Record<WarehouseLocation, string> = {
  "Warehouse A": "Manila North Harbor",
  "Warehouse B": "Cavite Industrial",
  "Warehouse C": "Laguna SLEX",
};

const INVENTORY_DATA: InventoryItem[] = [
  { sku: "SKU-001", name: "Samsung Galaxy A15 (Bulk)", category: "Parcels", location: "Warehouse A", qtyInStock: 240, reserved: 60, available: 180, status: "In Stock" },
  { sku: "SKU-002", name: "Nestlé Bear Brand Boxes", category: "Pallets", location: "Warehouse B", qtyInStock: 480, reserved: 120, available: 360, status: "In Stock" },
  { sku: "SKU-003", name: "Portland Cement (40kg bags)", category: "Pallets", location: "Warehouse C", qtyInStock: 150, reserved: 140, available: 10, status: "Low Stock" },
  { sku: "SKU-004", name: "Frozen Chicken Cuts (CDO)", category: "Containers", location: "Warehouse A", qtyInStock: 320, reserved: 80, available: 240, status: "In Stock" },
  { sku: "SKU-005", name: "Biogesic Paracetamol Cartons", category: "Parcels", location: "Warehouse B", qtyInStock: 0, reserved: 0, available: 0, status: "Out of Stock" },
  { sku: "SKU-006", name: "Toyota Genuine Oil Filters", category: "Parcels", location: "Warehouse C", qtyInStock: 85, reserved: 20, available: 65, status: "In Stock" },
  { sku: "SKU-007", name: "Uniqlo Retail Stock (Assorted)", category: "Containers", location: "Warehouse A", qtyInStock: 560, reserved: 200, available: 360, status: "In Stock" },
  { sku: "SKU-008", name: "BDO Legal Documents Bundle", category: "Documents", location: "Warehouse B", qtyInStock: 45, reserved: 10, available: 35, status: "In Stock" },
  { sku: "SKU-009", name: "Lucky Me Instant Noodles", category: "Pallets", location: "Warehouse A", qtyInStock: 720, reserved: 600, available: 120, status: "In Stock" },
  { sku: "SKU-010", name: "Daikin Aircon Units", category: "Containers", location: "Warehouse C", qtyInStock: 18, reserved: 15, available: 3, status: "Low Stock" },
  { sku: "SKU-011", name: "PhilHealth Claim Forms", category: "Documents", location: "Warehouse B", qtyInStock: 200, reserved: 50, available: 150, status: "In Stock" },
  { sku: "SKU-012", name: "Emperador Brandy Cases", category: "Pallets", location: "Warehouse A", qtyInStock: 0, reserved: 0, available: 0, status: "Out of Stock" },
  { sku: "SKU-013", name: "Honda Genuine Brake Pads", category: "Parcels", location: "Warehouse C", qtyInStock: 42, reserved: 8, available: 34, status: "In Stock" },
  { sku: "SKU-014", name: "Globe Prepaid SIM Cards", category: "Parcels", location: "Warehouse A", qtyInStock: 1200, reserved: 300, available: 900, status: "In Stock" },
  { sku: "SKU-015", name: "Del Monte Pineapple Juice", category: "Pallets", location: "Warehouse B", qtyInStock: 30, reserved: 28, available: 2, status: "Low Stock" },
];

// ─── Dock Schedule Seed Data ───────────────────────────────────────────────────
type DockStatus = "Scheduled" | "In Progress" | "Completed";
type DockType = "Inbound" | "Outbound";

interface DockEntry {
  id: string;
  timeSlot: string;
  vehicle: string;
  type: DockType;
  status: DockStatus;
  client: string;
}

const DOCK_SCHEDULE: DockEntry[] = [
  { id: "dock-1", timeSlot: "05:00 – 06:00", vehicle: "NEX-101", type: "Inbound", status: "Completed", client: "Nestlé Philippines" },
  { id: "dock-2", timeSlot: "06:00 – 07:00", vehicle: "NEX-103", type: "Outbound", status: "Completed", client: "SM Retail Inc." },
  { id: "dock-3", timeSlot: "07:30 – 08:30", vehicle: "NEX-105", type: "Inbound", status: "Completed", client: "CDO Foodsphere" },
  { id: "dock-4", timeSlot: "09:00 – 10:00", vehicle: "NEX-102", type: "Outbound", status: "In Progress", client: "Mercury Drug Corp." },
  { id: "dock-5", timeSlot: "10:30 – 11:30", vehicle: "NEX-107", type: "Inbound", status: "Scheduled", client: "Toyota Motor PH" },
  { id: "dock-6", timeSlot: "13:00 – 14:00", vehicle: "NEX-109", type: "Outbound", status: "Scheduled", client: "Uniqlo Philippines" },
  { id: "dock-7", timeSlot: "14:30 – 15:30", vehicle: "NEX-104", type: "Inbound", status: "Scheduled", client: "Globe Telecom" },
  { id: "dock-8", timeSlot: "16:00 – 17:00", vehicle: "NEX-110", type: "Outbound", status: "Scheduled", client: "BDO Unibank" },
];

// ─── Status Badge Styles ───────────────────────────────────────────────────────
const INVENTORY_STATUS_STYLES: Record<InventoryStatus, string> = {
  "In Stock": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Low Stock": "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  "Out of Stock": "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
};

const DOCK_STATUS_STYLES: Record<DockStatus, string> = {
  "Scheduled": "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400",
  "In Progress": "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  "Completed": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const DOCK_TYPE_STYLES: Record<DockType, string> = {
  "Inbound": "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  "Outbound": "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function WarehousePage() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INVENTORY_DATA);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q)
    );
  }, [searchQuery, inventory]);

  // Computed KPIs (reactive — recalculate when inventory changes)
  const totalSkus = inventory.length;
  const totalInStock = inventory.reduce((sum, i) => sum + i.qtyInStock, 0);
  const pendingInbound = DOCK_SCHEDULE.filter((d) => d.type === "Inbound" && d.status !== "Completed").length;
  const pendingOutbound = DOCK_SCHEDULE.filter((d) => d.type === "Outbound" && d.status !== "Completed").length;

  const handleAddItem = (item: InventoryItem) => {
    setInventory((prev) => [item, ...prev]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Management"
        subtitle="Multi-location inventory and dock operations"
        breadcrumbs={[{ label: "Others" }, { label: "Warehouse" }]}
      />

      {/* Add Item Modal */}
      <AddItemModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        existingSkus={inventory.map((i) => i.sku)}
        onAdd={handleAddItem}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total SKUs"
          value={totalSkus}
          icon={Package}
          iconColor="text-brand-teal"
          iconBg="bg-brand-teal-light"
          footerLabel="Across 3 warehouses"
          delay={0}
        />
        <KpiCard
          label="Items In Stock"
          value={totalInStock.toLocaleString()}
          icon={Warehouse}
          iconColor="text-brand-navy"
          iconBg="bg-brand-navy/10"
          footerLabel="Total units tracked"
          delay={0.05}
        />
        <KpiCard
          label="Pending Inbound"
          value={pendingInbound}
          icon={ArrowDownToLine}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          footerLabel="Dock appointments today"
          delay={0.1}
        />
        <KpiCard
          label="Pending Outbound"
          value={pendingOutbound}
          icon={ArrowUpFromLine}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          footerLabel="Dispatches remaining"
          delay={0.15}
        />
      </div>

      {/* Tabs: Inventory / Dock Schedule */}
      <Tabs defaultValue="inventory">
        <TabsList className="bg-gray-100 dark:bg-brand-navy-light">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="dock">Dock Schedule</TabsTrigger>
        </TabsList>

        {/* ─── Inventory Tab ──────────────────────────────────────────── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base dark:text-white">Warehouse Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search SKU or item name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-[240px]"
                    />
                  </div>
                  <Button size="sm" onClick={() => setAddModalOpen(true)} className="p-5 bg-brand-navy hover:bg-brand-navy/90 dark:bg-brand-teal dark:hover:bg-brand-teal/90 dark:text-brand-navy">
                    <Plus className="w-4 h-4 mr-1 text-white dark:text-brand-navy" />
                    Add Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/50 dark:bg-white/[0.02]">
                      <th className="text-left font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">SKU</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Item Name</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Category</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Location</th>
                      <th className="text-right font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Qty</th>
                      <th className="text-right font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Reserved</th>
                      <th className="text-right font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Available</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-brand-teal px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.sku} className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand-navy dark:text-white">{item.sku}</td>
                        <td className="px-4 py-3 font-medium text-brand-navy dark:text-white">{item.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className="bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border-0 text-[10px]">{item.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-brand-navy dark:text-white text-xs font-medium">{item.location}</span>
                            <span className="text-[10px] text-muted-foreground">{WAREHOUSE_LABELS[item.location]}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{item.qtyInStock.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{item.reserved.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-medium">{item.available.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className={`${INVENTORY_STATUS_STYLES[item.status]} border-0 text-[10px]`}>{item.status}</Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                          No items found matching &ldquo;{searchQuery}&rdquo;
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Dock Schedule Tab ──────────────────────────────────────── */}
        <TabsContent value="dock">
          <Card>
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2 dark:text-white">
                  <Clock className="w-4 h-4 text-brand-teal" />
                  Today&apos;s Dock Schedule
                </CardTitle>
                <Badge variant="neutral" className="bg-brand-teal/10 text-brand-teal border-0 text-xs">
                  {DOCK_SCHEDULE.length} appointments
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50/50 dark:bg-white/[0.02]">
                      <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Time Slot</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Vehicle</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Type</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Status</th>
                      <th className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DOCK_SCHEDULE.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-brand-navy dark:text-white">{entry.timeSlot}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-brand-navy/10 dark:bg-white/10 text-brand-navy dark:text-white text-[11px] font-mono font-bold rounded">
                            {entry.vehicle}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className={`${DOCK_TYPE_STYLES[entry.type]} border-0 text-[10px]`}>
                            {entry.type === "Inbound" ? (
                              <ArrowDownToLine className="w-3 h-3 mr-1" />
                            ) : (
                              <ArrowUpFromLine className="w-3 h-3 mr-1" />
                            )}
                            {entry.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className={`${DOCK_STATUS_STYLES[entry.status]} border-0 text-[10px]`}>{entry.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-navy dark:text-white">{entry.client}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
