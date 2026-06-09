"use client";

import { useState, useMemo } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { usePartnerRequestStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Plus, CircleDollarSign, Fuel, Banknote, MoreHorizontal } from "lucide-react";
import type { PartnerRequestStatus, PartnerRequestType } from "@/lib/types";

const TYPE_LABELS: Record<PartnerRequestType, string> = {
  diesel: "Diesel",
  cash_advance: "Cash Advance",
  other: "Others",
};

const TYPE_ICONS: Record<PartnerRequestType, React.ReactNode> = {
  diesel: <Fuel className="h-3.5 w-3.5" />,
  cash_advance: <Banknote className="h-3.5 w-3.5" />,
  other: <MoreHorizontal className="h-3.5 w-3.5" />,
};

const STATUS_VARIANT: Record<PartnerRequestStatus, "warning" | "info" | "danger" | "success"> = {
  pending: "warning",
  approved: "info",
  rejected: "danger",
  released: "success",
};

export default function PartnerRequestsPage() {
  const user = useAuthStore((s) => s.user);
  const requests = usePartnerRequestStore((s) => s.requests);
  const addRequest = usePartnerRequestStore((s) => s.addRequest);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const partnerId = user?.partnerId ?? "";

  // Filter requests belonging to the current partner
  const partnerRequests = useMemo(
    () =>
      requests
        .filter((r) => r.partnerId === partnerId)
        .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()),
    [requests, partnerId]
  );

  // Apply status filter
  const filteredRequests = useMemo(
    () =>
      statusFilter === "all"
        ? partnerRequests
        : partnerRequests.filter((r) => r.status === statusFilter),
    [partnerRequests, statusFilter]
  );

  function resetForm() {
    setType("");
    setAmount("");
    setReason("");
  }

  function handleSubmit() {
    if (!type) {
      toast.error("Please select a request type.");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Amount must be greater than 0.");
      return;
    }

    addRequest({
      partnerId,
      type: type as PartnerRequestType,
      amount: parsedAmount,
      reason: reason.trim() || undefined,
    });

    toast.success("Request submitted successfully.");
    setDialogOpen(false);
    resetForm();
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#0B1220]">Requests</h2>
        <Button onClick={() => setDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Request
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="released">Released</TabsTrigger>
        </TabsList>

        {/* We use a single TabsContent for "all" and render conditionally */}
        {["all", "pending", "approved", "rejected", "released"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CircleDollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">
                    No requests found{tab !== "all" ? ` with status "${tab}"` : ""}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredRequests.map((req) => (
                  <Card key={req.id}>
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {TYPE_ICONS[req.type]}
                          <Badge variant="neutral" className="text-xs">
                            {TYPE_LABELS[req.type]}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {formatDate(req.requestedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {req.reason && (
                          <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">
                            {req.reason}
                          </span>
                        )}
                        <span className="text-sm font-medium whitespace-nowrap">
                          {formatCurrency(req.amount)}
                        </span>
                        <Badge variant={STATUS_VARIANT[req.status]}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0B1220]">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="cash_advance">Cash Advance</SelectItem>
                  <SelectItem value="other">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0B1220]">Amount (₱)</label>
              <Input
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#0B1220]">Reason (optional)</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal disabled:opacity-50 resize-none"
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
