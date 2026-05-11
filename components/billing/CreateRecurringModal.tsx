"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecurringInvoiceStore, useClientStore } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";
import type { RecurringFrequency } from "@/lib/types";

export function CreateRecurringModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addRecurring = useRecurringInvoiceStore((s) => s.addRecurring);
  const clients = useClientStore((s) => s.clients);

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDate, setNextDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);

  const handleSave = () => {
    if (!clientId) return toast.error("Please select a client.");
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice < 0)) return toast.error("Please provide valid template items.");

    const processedItems = items.map(i => ({ ...i, amount: i.quantity * i.unitPrice }));
    const amount = processedItems.reduce((acc, i) => acc + i.amount, 0);

    addRecurring({
      clientId,
      frequency,
      nextDate: new Date(nextDate).toISOString(),
      templateItems: processedItems,
      amount,
      status: "active",
      totalGenerated: 0,
    });

    toast.success("Recurring invoice profile created.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Recurring Invoice</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A56]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A56]"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">First Issue Date</label>
            <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Template Items</h3>
            <Button variant="outline" size="sm" onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0 }])} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].description = e.target.value;
                    setItems(newItems);
                  }}
                  className="flex-1 h-9"
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity || ""}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].quantity = Number(e.target.value);
                    setItems(newItems);
                  }}
                  className="w-20 h-9"
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={item.unitPrice || ""}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[idx].unitPrice = Number(e.target.value);
                    setItems(newItems);
                  }}
                  className="w-32 h-9"
                />
                <div className="w-24 text-right text-sm font-semibold text-gray-700">
                  ₱{((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-9 w-9 text-red-500 hover:bg-red-50" disabled={items.length === 1}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#008A56] hover:bg-[#007045] text-white">Create Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
