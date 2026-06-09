"use client";
import { useMemo, useState } from "react";
import {
  Users, Search, Building2, TrendingUp, AlertTriangle, DollarSign, MoreHorizontal,
  Eye, Mail, Phone, MapPin, FileText, Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useClientStore, useInvoiceStore, useBillingPaymentStore } from "@/lib/store";
import { formatCurrency, initials } from "@/lib/utils";
import { toast } from "sonner";

export default function BillingCustomersPage() {
  const clients = useClientStore((s) => s.clients);
  const invoices = useInvoiceStore((s) => s.invoices);
  const payments = useBillingPaymentStore((s) => s.payments);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const customerData = useMemo(() => {
    return clients.map((c) => {
      const cInvoices = invoices.filter((i) => i.clientId === c.id);
      const cPayments = payments.filter((p) => p.clientId === c.id);
      const totalInvoiced = cInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const totalPaid = cInvoices.reduce((s, i) => s + i.paidAmount, 0);
      const outstanding = cInvoices.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0);
      const overdue = cInvoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.balance, 0);
      const invoiceCount = cInvoices.length;
      const lastPayment = cPayments
        .filter((p) => p.status === "completed")
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
      return { ...c, totalInvoiced, totalPaid, outstanding, overdue, invoiceCount, lastPayment };
    });
  }, [clients, invoices, payments]);

  const filtered = useMemo(() => {
    if (!search) return customerData;
    const q = search.toLowerCase();
    return customerData.filter((c) => c.name.toLowerCase().includes(q) || c.contactPerson.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q));
  }, [customerData, search]);

  const totalOutstanding = customerData.reduce((s, c) => s + c.outstanding, 0);
  const totalOverdue = customerData.reduce((s, c) => s + c.overdue, 0);
  const totalInvoiced = customerData.reduce((s, c) => s + c.totalInvoiced, 0);
  const selected = selectedId ? customerData.find((c) => c.id === selectedId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Manage billing customers and accounts receivable."
        breadcrumbs={[{ label: "Finance" }, { label: "Billing & Invoices", href: "/billing" }, { label: "Customers" }]}
        actions={<Button size="sm" onClick={() => toast.info("Add customer — coming soon")}><Plus className="w-4 h-4" /> Add Customer</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Customers" value={clients.length} icon={Users} iconColor="text-brand-teal" iconBg="bg-brand-teal-light" />
        <KpiCard label="Total Invoiced" value={formatCurrency(totalInvoiced)} icon={DollarSign} iconColor="text-sky-600" iconBg="bg-sky-50" />
        <KpiCard label="Outstanding" value={formatCurrency(totalOutstanding)} icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50" />
        <KpiCard label="Overdue" value={formatCurrency(totalOverdue)} icon={AlertTriangle} iconColor="text-red-500" iconBg="bg-red-50" />
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-[1fr_380px]" : "grid-cols-1"}`}>
        <Card className="border-brand-border shadow-sm">
          <CardContent className="p-0">
            <div className="p-4 border-b border-brand-border">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customer name, contact, or industry..." className="pl-10" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-brand-border dark:border-white/10">
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Industry</th>
                    <th className="py-3 px-4 font-medium text-center">Invoices</th>
                    <th className="py-3 px-4 font-medium text-right">Total Invoiced</th>
                    <th className="py-3 px-4 font-medium text-right">Paid</th>
                    <th className="py-3 px-4 font-medium text-right">Outstanding</th>
                    <th className="py-3 px-4 font-medium text-right">Overdue</th>
                    <th className="py-3 px-4 font-medium">Last Payment</th>
                    <th className="py-3 px-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id}
                      className={`border-b border-brand-border/60 hover:bg-gray-50 transition cursor-pointer ${selectedId === c.id ? "bg-brand-teal-light/30" : ""}`}
                      onClick={() => setSelectedId(c.id)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback></Avatar>
                          <div>
                            <div className="font-bold text-brand-navy">{c.name}</div>
                            <div className="text-xs text-muted-foreground">{c.contactPerson}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{c.industry}</Badge></td>
                      <td className="py-3 px-4 text-center font-semibold">{c.invoiceCount}</td>
                      <td className="py-3 px-4 text-right font-semibold">{formatCurrency(c.totalInvoiced)}</td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{formatCurrency(c.totalPaid)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(c.outstanding)}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-500">{c.overdue > 0 ? formatCurrency(c.overdue) : "—"}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {c.lastPayment ? new Date(c.lastPayment.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selected && (
          <Card className="border-brand-border shadow-sm sticky top-6 h-fit">
            <CardHeader className="pb-3 border-b border-brand-border flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-brand-navy dark:text-white">Customer Details</CardTitle>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-md hover:bg-gray-100">
                <span className="sr-only">Close</span>✕
              </button>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14"><AvatarFallback className="text-lg">{initials(selected.name)}</AvatarFallback></Avatar>
                <div>
                  <div className="text-lg font-bold text-brand-navy dark:text-white">{selected.name}</div>
                  <Badge variant="outline">{selected.industry}</Badge>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="w-3.5 h-3.5" /> {selected.contactPerson}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {selected.email}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {selected.phone}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> {selected.address}</div>
              </div>

              <div className="border-t border-brand-border pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Invoiced</span><span className="font-bold">{formatCurrency(selected.totalInvoiced)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Paid</span><span className="font-bold text-emerald-600">{formatCurrency(selected.totalPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Outstanding</span><span className="font-bold text-amber-600">{formatCurrency(selected.outstanding)}</span></div>
                {selected.overdue > 0 && (
                  <div className="flex justify-between"><span className="text-red-500">Overdue</span><span className="font-bold text-red-500">{formatCurrency(selected.overdue)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Invoices</span><span className="font-bold">{selected.invoiceCount}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" size="sm"><Eye className="w-4 h-4" /> View Invoices</Button>
                <Button variant="outline" size="sm"><FileText className="w-4 h-4" /> Statement</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
