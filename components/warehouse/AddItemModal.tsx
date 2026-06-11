"use client";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { InventoryItem, Category, WarehouseLocation, InventoryStatus } from "@/app/(app)/warehouse/page";

// ─── Helper ───────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">{label}</label>
      {children}
    </div>
  );
}

const selectCls =
  "w-full h-9 px-3 rounded-md border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A56] bg-white dark:bg-white/5 dark:text-white";

function deriveStatus(qty: number, reserved: number): InventoryStatus {
  const available = qty - reserved;
  if (qty === 0) return "Out of Stock";
  if (available <= Math.max(10, qty * 0.05)) return "Low Stock";
  return "In Stock";
}

function generateSku(existingSkus: string[]): string {
  const nums = existingSkus
    .map((s) => parseInt(s.replace("SKU-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SKU-${String(next).padStart(3, "0")}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSkus: string[];
  onAdd: (item: InventoryItem) => void;
}

const CATEGORIES: Category[] = ["Parcels", "Pallets", "Containers", "Documents"];
const LOCATIONS: WarehouseLocation[] = ["Warehouse A", "Warehouse B", "Warehouse C"];

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function AddItemModal({ open, onOpenChange, existingSkus, onAdd }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Parcels");
  const [location, setLocation] = useState<WarehouseLocation>("Warehouse A");
  const [qtyInStock, setQtyInStock] = useState("");
  const [reserved, setReserved] = useState("");
  const [loading, setLoading] = useState(false);

  const qty = parseInt(qtyInStock) || 0;
  const res = parseInt(reserved) || 0;
  const available = Math.max(0, qty - res);

  const resetForm = () => {
    setName("");
    setCategory("Parcels");
    setLocation("Warehouse A");
    setQtyInStock("");
    setReserved("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSave = () => {
    if (!name.trim()) {
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

    setLoading(true);
    // Simulate a brief async save (matches UX feel of the rest of the app)
    setTimeout(() => {
      const sku = generateSku(existingSkus);
      const newItem: InventoryItem = {
        sku,
        name: name.trim(),
        category,
        location,
        qtyInStock: qty,
        reserved: res,
        available,
        status: deriveStatus(qty, res),
      };
      onAdd(newItem);
      toast.success(`Item "${name.trim()}" added`, {
        description: `${sku} · ${location}`,
      });
      setLoading(false);
      handleClose();
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg dark:bg-brand-navy-light dark:border-white/10 dark:text-white">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Add Inventory Item</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Item Name — full width */}
          <div className="col-span-2">
            <Field label="Item Name *">
              <Input
                placeholder="e.g. Samsung Galaxy A15 (Bulk)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9"
                autoFocus
              />
            </Field>
          </div>

          {/* Category */}
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className={selectCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-brand-navy-light text-brand-navy dark:text-white">
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Warehouse Location */}
          <Field label="Warehouse Location">
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as WarehouseLocation)}
              className={selectCls}
            >
              {LOCATIONS.map((l) => (
                <option key={l} value={l} className="bg-white dark:bg-brand-navy-light text-brand-navy dark:text-white">
                  {l}
                </option>
              ))}
            </select>
          </Field>

          {/* Qty In Stock */}
          <Field label="Qty In Stock">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={qtyInStock}
              onChange={(e) => setQtyInStock(e.target.value)}
              className="h-9"
            />
          </Field>

          {/* Reserved */}
          <Field label="Reserved Qty">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={reserved}
              onChange={(e) => setReserved(e.target.value)}
              className="h-9"
            />
          </Field>
        </div>

        {/* Live Preview strip */}
        <div className="rounded-lg bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/10 px-4 py-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="font-bold text-brand-navy dark:text-white text-base">{qty.toLocaleString()}</div>
            <div className="text-muted-foreground">In Stock</div>
          </div>
          <div>
            <div className="font-bold text-amber-600 dark:text-amber-400 text-base">{res.toLocaleString()}</div>
            <div className="text-muted-foreground">Reserved</div>
          </div>
          <div>
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{available.toLocaleString()}</div>
            <div className="text-muted-foreground">Available</div>
          </div>
        </div>

        {/* Auto-derived status hint */}
        <p className="text-[11px] text-muted-foreground -mt-1">
          Status will be automatically set to{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-300">{deriveStatus(qty, res)}</span> based on
          the quantities above.
        </p>

        <DialogFooter className="pt-2 border-t border-gray-100 dark:border-white/10">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-brand-navy hover:bg-brand-navy/90 text-white dark:bg-brand-teal dark:hover:bg-brand-teal-dark dark:text-brand-navy"
          >
            {loading ? "Saving…" : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
