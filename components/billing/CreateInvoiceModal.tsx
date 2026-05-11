"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInvoiceStore, useClientStore } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Trash } from "lucide-react";

export function CreateInvoiceModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addInvoice = useInvoiceStore((s) => s.addInvoice);
  const clients = useClientStore((s) => s.clients);

  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [referenceNo, setReferenceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]);
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [vatRate, setVatRate] = useState(12);
  const [paymentTerms, setPaymentTerms] = useState("Net 15");

  const handleSave = () => {
    if (!clientId) return toast.error("Please select a client.");
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unitPrice < 0)) return toast.error("Please provide valid items.");

    const processedItems = items.map(i => ({ ...i, amount: i.quantity * i.unitPrice }));
    const subtotal = processedItems.reduce((acc, i) => acc + i.amount, 0);
    const vatAmount = subtotal * (vatRate / 100);
    const totalAmount = subtotal + vatAmount;

    addInvoice({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      clientId,
      referenceNo: referenceNo || "N/A",
      invoiceDate,
      dueDate,
      status: "draft",
      items: processedItems,
      subtotal,
      vatRate,
      vatAmount,
      totalAmount,
      paidAmount: 0,
      balance: totalAmount,
      salesperson: "System User",
      paymentTerms,
    });

    toast.success("Invoice created successfully.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
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
            <label className="text-xs font-semibold text-gray-600">Reference / PO #</label>
            <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. PO-12345" className="h-9" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Invoice Date</label>
            <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-9" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Line Items</h3>
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
          <Button onClick={handleSave} className="bg-[#008A56] hover:bg-[#007045] text-white">Save Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
