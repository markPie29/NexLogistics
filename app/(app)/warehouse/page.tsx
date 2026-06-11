"use client";
import { useState, useMemo } from "react";
import {
  Warehouse, Package, Search, Plus, Clock,
  ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────
type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";
type Category = "Parcels" | "Pallets" | "Containers" | "Documents";
type WarehouseLocation = "Warehouse A" | "Warehouse B" | "Warehouse C";

interface InventoryItem {
  sku: string;
  name: string;
  category: Category;
  location: WarehouseLocation;
  qtyInStock: number;
  reserved: number;
  available: number;
  status: InventoryStatus;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const WAREHOUSE_LABELS: Record<WarehouseLocation, string> = {
  "Warehouse A": "Manila North Harbor",
  "Warehouse B": "Cavite Industrial",
  "Warehouse C": "Laguna SLEX",
};

const CATEGORIES: Category[] = ["Parcels", "Pallets", "Containers", "Documents"];
const LOCATIONS: WarehouseLocation[] = ["Warehouse A", "Warehouse B", "Warehouse C"];

// ─── Seed Data ─────────────────────────────────────────────────────────────────
const SEED_INVENTORY: InventoryItem[] = [
  { sku: "SKU-001", name: "Samsung Galaxy A15 (Bulk)",       category: "Parcels",    location: "Warehouse A", qtyInStock: 240,  reserved: 60,  available: 180, status: "In Stock"     },
  { sku: "SKU-002", name: "Nestlé Bear Brand Boxes",         category: "Pallets",    location: "Warehouse B", qtyInStock: 480,  reserved: 120, available: 360, status: "In Stock"     },
  { sku: "SKU-003", name: "Portland Cement (40kg bags)",     category: "Pallets",    location: "Warehouse C", qtyInStock: 150,  reserved: 140, available: 10,  status: "Low Stock"    },
  { sku: "SKU-004", name: "Frozen Chicken Cuts (CDO)",       category: "Containers", location: "Warehouse A", qtyInStock: 320,  reserved: 80,  available: 240, status: "In Stock"     },
  { sku: "SKU-005", name: "Biogesic Paracetamol Cartons",    category: "Parcels",    location: "Warehouse B", qtyInStock: 0,    reserved: 0,   available: 0,   status: "Out of Stock" },
  { sku: "SKU-006", name: "Toyota Genuine Oil Filters",      category: "Parcels",    location: "Warehouse C", qtyInStock: 85,   reserved: 20,  available: 65,  status: "In Stock"     },
  { sku: "SKU-007", name: "Uniqlo Retail Stock (Assorted)",  category: "Containers", location: "Warehouse A", qtyInStock: 560,  reserved: 200, available: 360, status: "In Stock"     },
  { sku: "SKU-008", name: "BDO Legal Documents Bundle",      category: "Documents",  location: "Warehouse B", qtyInStock: 45,   reserved: 10,  available: 35,  status: "In Stock"     },
  { sku: "SKU-009", name: "Lucky Me Instant Noodles",        category: "Pallets",    location: "Warehouse A", qtyInStock: 720,  reserved: 600, available: 120, status: "In Stock"     },
  { sku: "SKU-010", name: "Daikin Aircon Units",             category: "Containers", location: "Warehouse C", qtyInStock: 18,   reserved: 15,  available: 3,   status: "Low Stock"    },
  { sku: "SKU-011", name: "PhilHealth Claim Forms",          category: "Documents",  location: "Warehouse B", qtyInStock: 200,  reserved: 50,  available: 150, status: "In Stock"     },
  { sku: "SKU-012", name: "Emperador Brandy Cases",          category: "Pallets",    location: "Warehouse A", qtyInStock: 0,    reserved: 0,   available: 0,   status: "Out of Stock" },
  { sku: "SKU-013", name: "Honda Genuine Brake Pads",        category: "Parcels",    location: "Warehouse C", qtyInStock: 42,   reserved: 8,   available: 34,  status: "In Stock"     },
  { sku: "SKU-014", name: "Globe Prepaid SIM Cards",         category: "Parcels",    location: "Warehouse A", qtyInStock: 1200, reserved: 300, available: 900, status: "In Stock"     },
  { sku: "SKU-015", name: "Del Monte Pineapple Juice",       category: "Pallets",    location: "Warehouse B", qtyInStock: 30,   reserved: 28,  available: 2,   status: "Low Stock"    },
];

type DockStatus = "Scheduled" | "In Progress" | "Completed";
type DockType   = "Inbound" | "Outbound";

interface DockEntry {
  id: string;
  timeSlot: string;
  vehicle: string;
  type: DockType;
  status: DockStatus;
  client: string;
}

const DOCK_SCHEDULE: DockEntry[] = [
  { id: "dock-1", timeSlot: "05:00 – 06:00", vehicle: "NEX-101", type: "Inbound",  status: "Completed",   client: "Nestlé Philippines"  },
  { id: "dock-2", timeSlot: "06:00 – 07:00", vehicle: "NEX-103", type: "Outbound", status: "Completed",   client: "SM Retail Inc."       },
  { id: "dock-3", timeSlot: "07:30 – 08:30", vehicle: "NEX-105", type: "Inbound",  status: "Completed",   client: "CDO Foodsphere"       },
  { id: "dock-4", timeSlot: "09:00 – 10:00", vehicle: "NEX-102", type: "Outbound", status: "In Progress", client: "Mercury Drug Corp."   },
  { id: "dock-5", timeSlot: "10:30 – 11:30", vehicle: "NEX-107", type: "Inbound",  status: "Scheduled",   client: "Toyota Motor PH"      },
  { id: "dock-6", timeSlot: "13:00 – 14:00", vehicle: "NEX-109", type: "Outbound", status: "Scheduled",   client: "Uniqlo Philippines"   },
  { id: "dock-7", timeSlot: "14:30 – 15:30", vehicle: "NEX-104", type: "Inbound",  status: "Scheduled",   client: "Globe Telecom"        },
  { id: "dock-8", timeSlot: "16:00 – 17:00", vehicle: "NEX-110", type: "Outbound", status: "Scheduled",   client: "BDO Unibank"          },
];

// ─── Badge style maps — light + dark variants ──────────────────────────────────
const INVENTORY_STATUS_STYLES: Record<InventoryStatus, string> = {
  "In Stock":     "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  "Low Stock":    "bg-amber-50   text-amber-700   dark:bg-amber-900/20   dark:text-amber-400",
  "Out of Stock": "bg-red-50     text-red-700     dark:bg-red-900/20     dark:text-red-400",
};

const DOCK_STATUS_STYLES: Record<DockStatus, string> = {
  "Scheduled":   "bg-sky-50    text-sky-700    dark:bg-sky-900/20    dark:text-sky-400",
  "In Progress": "bg-amber-50  text-amber-700  dark:bg-amber-900/20  dark:text-amber-400",
  "Completed":   "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const DOCK_TYPE_STYLES: Record<DockType, string> = {
  "Inbound":  "bg-blue-50   text-blue-700   dark:bg-blue-900/20   dark:text-blue-400",
  "Outbound": "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function deriveStatus(qty: number, reserved: number): InventoryStatus {
  if (qty === 0) return "Out of Stock";
  if ((qty - reserved) <= Math.max(10, qty * 0.05)) return "Low Stock";
  return "In Stock";
}

function nextSku(items: InventoryItem[]): string {
  const nums = items
    .map((i) => parseInt(i.sku.replace("SKU-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SKU-${String(next).padStart(3, "0")}`;
}

// ─── Form blank ────────────────────────────────────────────────────────────────
const BLANK_FORM = {
  name:       "",
  category:   "Parcels"     as Category,
  location:   "Warehouse A" as WarehouseLocation,
  qtyInStock: "",
  reserved:   "",
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function WarehousePage() {
  // ── inventory list is stateful so new items appear immediately ──────────────
  const [inventory, setInventory] = useState<InventoryItem[]>(SEED_INVENTORY);
  const [searchQuery, setSearchQuery]   = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);

  // ── filtered list for search ────────────────────────────────────────────────
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q),
    );
  }, [searchQuery, inventory]);

  // ── KPIs — reactive to inventory changes ────────────────────────────────────
  const totalSkus      = inventory.length;
  const totalInStock   = inventory.reduce((s, i) => s + i.qtyInStock, 0);
  const pendingInbound = DOCK_SCHEDULE.filter((d) => d.type === "Inbound"  && d.status !== "Completed").length;
  const pendingOutbound= DOCK_SCHEDULE.filter((d) => d.type === "Outbound" && d.status !== "Completed").length;

  // ── derived live preview values ─────────────────────────────────────────────
  const qty       = parseInt(form.qtyInStock) || 0;
  const res       = parseInt(form.reserved)   || 0;
  const available = Math.max(0, qty - res);
  const derivedStatus = deriveStatus(qty, res);

  // ── open / close ─────────────────────────────────────────────────────────────
  const openModal  = () => { setForm(BLANK_FORM); setAddModalOpen(true); };
  const closeModal = () => setAddModalOpen(false);

  // ── submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Item name is required.");
      return;
    }
    if (qty < 0) {
      toast.error("Quantity cannot be negative.");
      return;
    }
    if (res < 0) {
      toast.error("Reserved quantity cannot be negative.");
      return;
    }
    if (res > qty) {
      toast.error("Reserved quantity cannot exceed total quantity.");
      return;
    }

    const sku = nextSku(inventory);
    const newItem: InventoryItem = {
      sku,
      name:       form.name.trim(),
      category:   form.category,
      location:   form.location,
      qtyInStock: qty,
      reserved:   res,
      available,
      status:     derivedStatus,
    };

    setInventory((prev) => [newItem, ...prev]);
    toast.success(`"${newItem.name}" added`, {
      description: `${sku} · ${newItem.location} · ${newItem.status}`,
    });
    closeModal();
  };

  // ── field helper ─────────────────────────────────────────────────────────────
  const set = (k: keyof typeof BLANK_FORM) =>
    (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse Management"
        subtitle="Multi-location inventory and dock operations"
        breadcrumbs={[{ label: "Others" }, { label: "Warehouse" }]}
      />

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total SKUs"        value={totalSkus}                    icon={Package}         iconColor="text-brand-teal"    iconBg="bg-brand-teal-light"  footerLabel="Across 3 warehouses"     delay={0}    />
        <KpiCard label="Items In Stock"    value={totalInStock.toLocaleString()} icon={Warehouse}       iconColor="text-brand-navy"    iconBg="bg-brand-navy/10"     footerLabel="Total units tracked"     delay={0.05} />
        <KpiCard label="Pending Inbound"   value={pendingInbound}               icon={ArrowDownToLine} iconColor="text-blue-600"      iconBg="bg-blue-50"           footerLabel="Dock appointments today" delay={0.1}  />
        <KpiCard label="Pending Outbound"  value={pendingOutbound}              icon={ArrowUpFromLine} iconColor="text-purple-600"    iconBg="bg-purple-50"         footerLabel="Dispatches remaining"    delay={0.15} />
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="dock">Dock Schedule</TabsTrigger>
        </TabsList>

        {/* ── Inventory Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base">Warehouse Inventory</CardTitle>
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
                  <Button size="sm" onClick={openModal} className="bg-brand-navy hover:bg-brand-navy/90 text-white dark:text-white">
                    <Plus className="w-4 h-4 mr-1" />
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
                      {["SKU","Item Name","Category","Location","Qty","Reserved","Available","Status"].map((h, i) => (
                        <th
                          key={h}
                          className={`font-semibold text-brand-navy dark:text-white px-4 py-3 ${i >= 4 && i <= 6 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.sku} className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-brand-navy dark:text-white">{item.sku}</td>
                        <td className="px-4 py-3 font-medium text-brand-navy dark:text-white">{item.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className="bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border-0 text-[10px]">
                            {item.category}
                          </Badge>
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
                          <Badge variant="neutral" className={`${INVENTORY_STATUS_STYLES[item.status]} border-0 text-[10px]`}>
                            {item.status}
                          </Badge>
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

        {/* ── Dock Schedule Tab ─────────────────────────────────────────────── */}
        <TabsContent value="dock">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
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
                      {["Time Slot","Vehicle","Type","Status","Client"].map((h) => (
                        <th key={h} className="text-left font-semibold text-brand-navy dark:text-white px-4 py-3">{h}</th>
                      ))}
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
                            {entry.type === "Inbound"
                              ? <ArrowDownToLine className="w-3 h-3 mr-1" />
                              : <ArrowUpFromLine className="w-3 h-3 mr-1" />}
                            {entry.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" className={`${DOCK_STATUS_STYLES[entry.status]} border-0 text-[10px]`}>
                            {entry.status}
                          </Badge>
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

      {/* ═══════════════════════════════════════════════════════════════════════
          ADD ITEM MODAL
      ════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={addModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Item Name */}
            <div className="space-y-1.5">
              <Label htmlFor="item-name">Item Name *</Label>
              <Input
                id="item-name"
                placeholder="e.g. Samsung Galaxy A15 (Bulk)"
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
                autoFocus
              />
            </div>

            {/* Category + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={set("category")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={set("location")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>{l} – {WAREHOUSE_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Qty + Reserved */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Qty In Stock</Label>
                <Input
                  id="qty"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.qtyInStock}
                  onChange={(e) => set("qtyInStock")(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reserved">Reserved Qty</Label>
                <Input
                  id="reserved"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.reserved}
                  onChange={(e) => set("reserved")(e.target.value)}
                />
              </div>
            </div>

            {/* Live preview strip */}
            <div className="rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 px-4 py-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-bold text-brand-navy dark:text-white text-base">{qty.toLocaleString()}</p>
                <p className="text-muted-foreground">In Stock</p>
              </div>
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400 text-base">{res.toLocaleString()}</p>
                <p className="text-muted-foreground">Reserved</p>
              </div>
              <div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{available.toLocaleString()}</p>
                <p className="text-muted-foreground">Available</p>
              </div>
            </div>

            {/* Derived status hint */}
            <p className="text-[11px] text-muted-foreground">
              Status will be set to{" "}
              <span className="font-semibold text-foreground">{derivedStatus}</span> based on quantities.
            </p>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-brand-navy hover:bg-brand-navy/90 text-white dark:text-white">
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
