"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBillingPaymentStore, useInvoiceStore } from "@/lib/store";
import { toast } from "sonner";
import type { PaymentMethod } from "@/lib/types";

export function RecordPaymentModal({ 
  open, 
  onOpenChange, 
  defaultInvoiceId 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  defaultInvoiceId?: string;
}) {
  const addPayment = useBillingPaymentStore((s) => s.addPayment);
  const { invoices, updateInvoice } = useInvoiceStore();

  const activeInvoices = invoices.filter(i => ["sent", "partially_paid", "overdue"].includes(i.status));

  const [invoiceId, setInvoiceId] = useState(defaultInvoiceId || (activeInvoices[0]?.id || ""));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState<number | "">("");
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-fill amount when invoice changes
  useEffect(() => {
    if (invoiceId) {
      const inv = invoices.find(i => i.id === invoiceId);
      if (inv) setAmount(inv.balance);
    }
  }, [invoiceId, invoices]);

  // Pre-fill when modal opens
  useEffect(() => {
    if (open && defaultInvoiceId) setInvoiceId(defaultInvoiceId);
  }, [open, defaultInvoiceId]);

  const handleSave = () => {
    if (!invoiceId) return toast.error("Please select an invoice.");
    if (!amount || amount <= 0) return toast.error("Please enter a valid amount.");

    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    if (Number(amount) > invoice.balance) return toast.error("Payment amount cannot exceed balance.");

    addPayment({
      paymentId: `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      type: "received",
      clientId: invoice.clientId,
      invoiceId,
      referenceNo: referenceNo || "N/A",
      paymentDate: new Date(paymentDate).toISOString(),
      method,
      status: "completed",
      amount: Number(amount),
      notes,
    });

    const newPaidAmount = invoice.paidAmount + Number(amount);
    const newBalance = invoice.totalAmount - newPaidAmount;
    
    updateInvoice(invoice.id, {
      paidAmount: newPaidAmount,
      balance: newBalance,
      status: newBalance <= 0 ? "paid" : "partially_paid"
    });

    toast.success("Payment recorded successfully.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Invoice</label>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A56]"
              disabled={!!defaultInvoiceId}
            >
              <option value="">Select Invoice...</option>
              {activeInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - Balance: ₱{inv.balance.toLocaleString()}</option>
              ))}
              {/* Also show the default invoice if it's already paid so it doesn't break */}
              {defaultInvoiceId && !activeInvoices.find(i => i.id === defaultInvoiceId) && (
                <option value={defaultInvoiceId}>{invoices.find(i => i.id === defaultInvoiceId)?.invoiceNumber}</option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Payment Date</label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Amount Received</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-9" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#008A56]"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="gcash">GCash</option>
                <option value="credit_card">Credit Card</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Reference / Check #</label>
              <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. TRX-123" className="h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Notes (Optional)</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details..." className="h-9" />
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-gray-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[#008A56] hover:bg-[#007045] text-white">Save Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
