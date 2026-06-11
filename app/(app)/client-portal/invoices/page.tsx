"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useClientInvoices, useClientPayments } from "@/lib/hooks/client-portal";
import {
  STATUS_BADGE_VARIANT,
  filterBySearchAndStatus,
} from "@/lib/utils/client-portal";
import { formatCurrency } from "@/lib/utils";

type InvoiceStatus = "paid" | "sent" | "overdue" | "partially_paid" | "draft";

export default function ClientPortalInvoicesPage() {
  const { invoices } = useClientInvoices();
  const { payments } = useClientPayments();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<(typeof invoices)[number] | null>(null);

  const filteredInvoices = useMemo(
    () =>
      filterBySearchAndStatus(
        invoices,
        searchQuery,
        statusFilter,
        (inv) => inv.status,
        (inv) => [inv.invoiceNumber]
      ),
    [invoices, searchQuery, statusFilter]
  );

  // Find payments for the selected invoice
  const selectedInvoicePayments = useMemo(
    () =>
      selectedInvoice
        ? payments.filter((p) => p.invoiceId === selectedInvoice.id)
        : [],
    [payments, selectedInvoice]
  );

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number"
            className="h-10 focus-visible:ring-2 focus-visible:ring-brand-teal"
            aria-label="Search invoices by invoice number"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as "all" | InvoiceStatus)}
        >
          <SelectTrigger className="w-[180px] focus-visible:ring-2 focus-visible:ring-brand-teal" aria-label="Filter by status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partially_paid">Partially Paid</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No invoices found.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4 py-3 text-xs">Invoice #</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Date</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Amount</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Status</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                className="h-12 cursor-pointer hover:bg-brand-teal-light focus-visible:ring-2 focus-visible:ring-brand-teal"
                tabIndex={0}
                onClick={() => setSelectedInvoice(invoice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedInvoice(invoice);
                  }
                }}
              >
                <TableCell className="px-4 py-3 text-sm font-semibold text-brand-navy">
                  {invoice.invoiceNumber}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {new Date(invoice.invoiceDate).toLocaleDateString("en-PH")}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-semibold">
                  {formatCurrency(invoice.totalAmount)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    {invoice.status === "overdue" && (
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" aria-hidden="true" />
                    )}
                    <Badge
                      className={`text-[10px] uppercase font-bold ${STATUS_BADGE_VARIANT[invoice.status] ?? "bg-gray-100 text-gray-700"}`}
                    >
                      {invoice.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm font-semibold">
                  {formatCurrency(invoice.balance)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Invoice Detail Dialog */}
      <Dialog
        open={!!selectedInvoice}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice metadata */}
              <div className="flex items-center gap-3">
                <Badge
                  className={`text-[10px] uppercase font-bold ${STATUS_BADGE_VARIANT[selectedInvoice.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {selectedInvoice.status.replaceAll("_", " ")}
                </Badge>
                {selectedInvoice.status === "overdue" && (
                  <span className="text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Payment overdue
                  </span>
                )}
              </div>

              {/* Line Items Table */}
              <div>
                <h3 className="text-sm font-semibold text-brand-navy mb-2">
                  Line Items
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="px-4 py-3 text-xs">Description</TableHead>
                      <TableHead scope="col" className="px-4 py-3 text-xs text-right">Qty</TableHead>
                      <TableHead scope="col" className="px-4 py-3 text-xs text-right">Unit Price</TableHead>
                      <TableHead scope="col" className="px-4 py-3 text-xs text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items?.map((item, idx) => (
                      <TableRow key={idx} className="h-12">
                        <TableCell className="px-4 py-3 text-sm">{item.description}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right">{item.quantity}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right font-semibold">
                          {formatCurrency(item.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals Summary */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold text-brand-navy">
                    {formatCurrency(selectedInvoice.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    VAT ({((selectedInvoice.vatRate ?? 0.12) * 100).toFixed(0)}%)
                  </span>
                  <span className="font-semibold text-brand-navy">
                    {formatCurrency(selectedInvoice.vatAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="font-semibold text-brand-navy">Total</span>
                  <span className="font-bold text-brand-navy">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid Amount</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(selectedInvoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="font-semibold text-brand-navy">
                    Outstanding Balance
                  </span>
                  <span
                    className={`font-bold ${selectedInvoice.balance > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {formatCurrency(selectedInvoice.balance)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
