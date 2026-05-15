"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { ArrowLeft, Phone, Mail, MapPin, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHelperStore, useDriverStore, useTripStore } from "@/lib/store";
import { initials, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { toast } from "sonner";
import type { EmploymentType } from "@/lib/types";

export default function HelperDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const helper = useHelperStore((s) => s.helpers.find((h) => h.id === params.id));
  const updateHelper = useHelperStore((s) => s.updateHelper);
  const deleteHelper = useHelperStore((s) => s.deleteHelper);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);

  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState(helper);

  const helperTrips = useMemo(
    () => trips.filter((t) => t.helperId === params.id).slice(0, 20),
    [trips, params.id]
  );

  if (!helper) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/helpers")}><ArrowLeft className="w-4 h-4" /> Back</Button>
        <Card><CardContent className="p-8 text-center text-muted-foreground">Helper not found.</CardContent></Card>
      </div>
    );
  }

  const cur = (edit ? draft : helper)!;
  const drv = drivers.find((d) => d.id === cur.assignedDriverId);

  const save = () => {
    if (!draft) return;
    updateHelper(helper.id, draft);
    setEdit(false);
    toast.success("Helper updated");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={cur.name}
        subtitle={`Helper · ${(cur.employmentType || "per_trip").replace("_", " ")}`}
        breadcrumbs={[{ label: "Operations" }, { label: "Helpers", href: "/helpers" }, { label: cur.name }]}
        actions={
          <>
            {edit ? (
              <>
                <Button variant="outline" size="sm" onClick={() => { setDraft(helper); setEdit(false); }}>Cancel</Button>
                <Button size="sm" onClick={save}><Save className="w-4 h-4" /> Save</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => { setDraft(helper); setEdit(true); }}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => { deleteHelper(helper.id); toast.success("Helper deleted"); router.push("/helpers"); }}><Trash2 className="w-4 h-4 text-status-danger" /></Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16"><AvatarFallback>{initials(cur.name)}</AvatarFallback></Avatar>
              <div>
                <div className="font-bold text-brand-navy text-lg">{cur.name}</div>
                <Badge variant={cur.status === "active" ? "success" : cur.status === "on_leave" ? "warning" : "neutral"}>
                  {cur.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" /> {cur.phone}</div>
              {cur.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /> {cur.email}</div>}
              {cur.address && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-4 h-4" /> {cur.address}</div>}
              {drv && <div className="text-xs">Assigned to: <span className="font-semibold text-brand-navy">{drv.name}</span></div>}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-brand-navy">Employment & Rates</h3>
            {edit && draft ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
                  <div><Label>Phone</Label><Input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
                  <div><Label>Address</Label><Input value={draft.address || ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="off_duty">Off Duty</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assigned Driver</Label>
                    <Select value={draft.assignedDriverId || "__none__"} onValueChange={(v) => setDraft({ ...draft, assignedDriverId: v === "__none__" ? undefined : v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <Select value={draft.employmentType || "per_trip"} onValueChange={(v) => setDraft({ ...draft, employmentType: v as EmploymentType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_trip">Per Trip</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Monthly Salary (₱)</Label><Input type="number" value={draft.monthlyBaseSalary || ""} onChange={(e) => setDraft({ ...draft, monthlyBaseSalary: Number(e.target.value) || undefined })} /></div>
                  <div><Label>Per Trip Rate (₱)</Label><Input type="number" value={draft.baseRatePerTrip || ""} onChange={(e) => setDraft({ ...draft, baseRatePerTrip: Number(e.target.value) || undefined })} /></div>
                  <div><Label>Commission %</Label><Input type="number" value={draft.commissionPercent || ""} onChange={(e) => setDraft({ ...draft, commissionPercent: Number(e.target.value) || undefined })} /></div>
                </div>
                <div><Label>Notes</Label><Textarea rows={2} value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Stat label="Employment" value={(cur.employmentType || "per_trip").replace("_", " ")} />
                <Stat label="Monthly Salary" value={cur.monthlyBaseSalary ? formatCurrency(cur.monthlyBaseSalary) : "—"} />
                <Stat label="Per-Trip Rate" value={cur.baseRatePerTrip ? formatCurrency(cur.baseRatePerTrip) : "—"} />
                <Stat label="Per-KM Rate" value={cur.ratePerKm ? `₱${cur.ratePerKm}` : "—"} />
                <Stat label="Commission %" value={cur.commissionPercent ? `${cur.commissionPercent}%` : "—"} />
                <Stat label="Hire Date" value={cur.hireDate || "—"} />
                {cur.notes && <div className="col-span-2"><Label>Notes</Label><p className="text-muted-foreground">{cur.notes}</p></div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold text-brand-navy mb-3">Recent Trips ({helperTrips.length})</h3>
          {helperTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground">No trips assigned to this helper yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-muted-foreground border-b border-brand-border">
                  <th className="py-2 px-2 text-left font-medium">Trip ID</th>
                  <th className="py-2 px-2 text-left font-medium">Date</th>
                  <th className="py-2 px-2 text-left font-medium">Customer</th>
                  <th className="py-2 px-2 text-right font-medium">Helper Rate</th>
                  <th className="py-2 px-2 text-left font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {helperTrips.map((t) => (
                    <tr key={t.id} className="border-b border-brand-border/60">
                      <td className="py-2 px-2 font-mono text-xs">{t.id}</td>
                      <td className="py-2 px-2 text-xs">{new Date(t.pickup.scheduledAt).toLocaleDateString()}</td>
                      <td className="py-2 px-2">{t.customerName ?? t.consigneeName ?? "—"}</td>
                      <td className="py-2 px-2 text-right font-mono">{formatCurrency(t.helperRate || t.helperFee || 0)}</td>
                      <td className="py-2 px-2"><Badge variant="neutral">{t.status.replace("_", " ")}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold text-brand-navy">{value}</div>
    </div>
  );
}
