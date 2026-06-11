"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { useClientTrips, useClientInvoices } from "@/lib/hooks/client-portal";
import { STATUS_BADGE_VARIANT, TRIP_STATUS_LABELS } from "@/lib/utils/client-portal";
import type { TripStatus } from "@/lib/types";

const CATEGORY_OPTIONS = ["Shipment", "Billing", "Documents", "System"] as const;
const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

function PriorityBadge({ priority }: { priority: string }) {
  const cls =
    priority === "high"
      ? "bg-red-100 text-red-700"
      : priority === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-700";
  return (
    <Badge className={`text-[10px] uppercase font-bold ${cls}`}>
      {priority}
    </Badge>
  );
}

export default function ClientPortalSupportPage() {
  const tickets = useClientPortalStore((s) => s.tickets);
  const addTicket = useClientPortalStore((s) => s.addTicket);
  const { trips } = useClientTrips();
  const { invoices } = useClientInvoices();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "Shipment" as (typeof CATEGORY_OPTIONS)[number],
    priority: "medium" as (typeof PRIORITY_OPTIONS)[number],
    details: "",
    shipmentRef: "",
    invoiceRef: "",
  });

  const handleSubmit = () => {
    if (!form.subject.trim() || !form.details.trim()) return;
    addTicket({
      subject: form.subject,
      details: form.details,
      category: form.category,
      priority: form.priority,
      ...(form.shipmentRef ? { shipmentRef: form.shipmentRef } : {}),
      ...(form.invoiceRef ? { invoiceRef: form.invoiceRef } : {}),
    });
    setForm({
      subject: "",
      category: "Shipment",
      priority: "medium",
      details: "",
      shipmentRef: "",
      invoiceRef: "",
    });
    setDialogOpen(false);
  };

  const resolveTripStatus = (shipmentRef: string): string | null => {
    const trip = trips.find((t) => t.id === shipmentRef);
    if (!trip) return null;
    return TRIP_STATUS_LABELS[trip.status as TripStatus] ?? trip.status;
  };

  const getTripStatusVariant = (shipmentRef: string): string => {
    const trip = trips.find((t) => t.id === shipmentRef);
    if (!trip) return "bg-gray-100 text-gray-700";
    return STATUS_BADGE_VARIANT[trip.status] ?? "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-navy">Support Tickets</h2>
        <Button
          className="bg-brand-teal hover:bg-brand-teal-dark text-white focus-visible:ring-2 focus-visible:ring-brand-teal"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tickets yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4 py-3 text-xs">Subject</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Category</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Priority</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Status</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Assigned To</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Shipment Status</TableHead>
              <TableHead scope="col" className="px-4 py-3 text-xs">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id} className="h-12">
                <TableCell className="px-4 py-3 text-sm font-medium text-brand-navy">
                  {ticket.subject}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">{ticket.category}</TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  <Badge
                    className={`text-[10px] uppercase font-bold ${
                      STATUS_BADGE_VARIANT[ticket.status] ?? "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {ticket.assignedTo ?? "—"}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {ticket.shipmentRef ? (
                    <Badge
                      className={`text-[10px] uppercase font-bold ${getTripStatusVariant(ticket.shipmentRef)}`}
                    >
                      {resolveTripStatus(ticket.shipmentRef) ?? "Unknown"}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm">
                  {new Date(ticket.createdAt).toLocaleDateString("en-PH", {
                    timeZone: "Asia/Manila",
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-navy mb-1 block">
                Subject
              </label>
              <Input
                value={form.subject}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject: e.target.value }))
                }
                placeholder="Brief description of the issue"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-navy mb-1 block">
                  Category
                </label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      category: v as (typeof CATEGORY_OPTIONS)[number],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-navy mb-1 block">
                  Priority
                </label>
                <Select
                  value={form.priority}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      priority: v as (typeof PRIORITY_OPTIONS)[number],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-brand-navy mb-1 block">
                Details
              </label>
              <textarea
                value={form.details}
                onChange={(e) =>
                  setForm((f) => ({ ...f, details: e.target.value }))
                }
                rows={4}
                placeholder="Describe your issue in detail..."
                className="w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-gray placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus:border-brand-teal resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-brand-navy mb-1 block">
                  Shipment Reference (optional)
                </label>
                <Select
                  value={form.shipmentRef}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, shipmentRef: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-brand-navy mb-1 block">
                  Invoice Reference (optional)
                </label>
                <Select
                  value={form.invoiceRef}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, invoiceRef: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {invoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.invoiceNumber}>
                        {inv.invoiceNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <Button variant="outline" className="focus-visible:ring-2 focus-visible:ring-brand-teal" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-brand-teal hover:bg-brand-teal-dark text-white focus-visible:ring-2 focus-visible:ring-brand-teal"
                onClick={handleSubmit}
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
