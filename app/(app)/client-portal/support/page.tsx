"use client";
import { useMemo, useState } from "react";
import { CircleX, Clock3, LifeBuoy, MoreVertical, Plus, Search, Send, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { toast } from "sonner";

export default function ClientPortalSupportPage() {
  const tickets = useClientPortalStore((s) => s.tickets);
  const addTicket = useClientPortalStore((s) => s.addTicket);
  const updateTicketStatus = useClientPortalStore((s) => s.updateTicketStatus);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Shipment" | "Billing" | "Documents" | "System">("all");
  const [selectedId, setSelectedId] = useState<string | null>(tickets[0]?.id ?? null);
  const [newOpen, setNewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "activity" | "messages" | "attachments">("details");
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({ subject: "", details: "", category: "Shipment" as "Shipment" | "Billing" | "Documents" | "System", priority: "medium" as "low" | "medium" | "high" });

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved").length;
    return {
      total: tickets.length,
      open,
      inProgress,
      resolved,
      closed: Math.max(0, resolved - 1),
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const byText = (value: string) => value.toLowerCase().includes(search.toLowerCase());
    const q = search.toLowerCase();
    return tickets.filter((t) => {
      const matchText = !q || byText(t.subject) || byText(t.id);
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      const matchPriority = priorityFilter === "all" || t.priority === priorityFilter;
      const matchCategory = categoryFilter === "all" || t.category === categoryFilter;
      return matchText && matchStatus && matchPriority && matchCategory;
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter]);

  const selected = selectedId ? tickets.find((t) => t.id === selectedId) : filtered[0] ?? null;

  const onCreate = () => {
    if (!form.subject || !form.details) {
      toast.error("Subject and details are required");
      return;
    }
    addTicket(form);
    toast.success("Support ticket created");
    setForm({ subject: "", details: "", category: "Shipment", priority: "medium" });
    setNewOpen(false);
  };

  const submitMessage = () => {
    if (!newMessage.trim()) {
      toast.error("Enter a message");
      return;
    }
    toast.success("Message added to ticket thread");
    setNewMessage("");
    setMessageModalOpen(false);
  };

  const closeTicket = () => {
    if (!selected) return;
    updateTicketStatus(selected.id, "resolved");
    toast.success("Ticket status updated to resolved");
    setCloseModalOpen(false);
  };

  const relatedTo = (subject: string) => {
    if (subject.toLowerCase().includes("inv")) return "INV-2026-0156";
    if (subject.toLowerCase().includes("delivery")) return "NEX-TRK-000122";
    return "NEX-TRK-000123";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Total Tickets" value={stats.total} color="text-blue-600" icon={LifeBuoy} />
        <StatCard label="Open" value={stats.open} color="text-emerald-600" icon={Clock3} />
        <StatCard label="In Progress" value={stats.inProgress} color="text-amber-600" icon={Clock3} />
        <StatCard label="Resolved" value={stats.resolved} color="text-violet-600" icon={LifeBuoy} />
        <StatCard label="Closed" value={stats.closed} color="text-red-600" icon={CircleX} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
      <Card className="border-gray-200">
        <CardHeader className="pb-3 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base font-bold">Tickets & Support</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by ticket ID, subject, or shipment..." className="pl-9 h-9 text-xs" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="h-9 rounded-md border border-gray-200 px-3 text-xs">
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as typeof priorityFilter)} className="h-9 rounded-md border border-gray-200 px-3 text-xs">
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)} className="h-9 rounded-md border border-gray-200 px-3 text-xs">
                <option value="all">All Categories</option>
                <option value="Shipment">Shipment</option>
                <option value="Billing">Billing</option>
                <option value="Documents">Documents</option>
                <option value="System">System</option>
              </select>
              <Button className="h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={() => setNewOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Ticket
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-gray-100 text-gray-600">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Related To</th>
                <th className="py-3 px-4">Created On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSelectedId(t.id)} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  <td className="py-3 px-4 font-semibold text-[#0B1220]">{t.id.toUpperCase()}</td>
                  <td className="py-3 px-4 text-gray-700">{t.subject}</td>
                  <td className="py-3 px-4 text-gray-600">{t.category}</td>
                  <td className="py-3 px-4"><PriorityBadge priority={t.priority} /></td>
                  <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                  <td className="py-3 px-4 text-gray-600">{relatedTo(t.subject)}</td>
                  <td className="py-3 px-4 text-gray-600">{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" className="h-8 px-2" onClick={(e) => { e.stopPropagation(); setSelectedId(t.id); }}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-gray-200 h-fit">
        <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Ticket Details</CardTitle>
          {selected && <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>}
        </CardHeader>
        <CardContent className="p-4 text-xs">
          {!selected && <div className="text-gray-500">Select a ticket to view and update status.</div>}
          {selected && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] text-gray-500">{selected.id.toUpperCase()}</div>
                  <div className="font-bold text-[#0B1220] text-lg leading-tight">{selected.subject}</div>
                </div>
                <StatusBadge status={selected.status} />
              </div>
              <div className="flex items-center gap-3 border-b border-gray-100 pb-2">
                <button className={`font-semibold ${activeTab === "details" ? "text-[#008A56]" : "text-gray-500"}`} onClick={() => setActiveTab("details")}>Details</button>
                <button className={`font-semibold ${activeTab === "activity" ? "text-[#008A56]" : "text-gray-500"}`} onClick={() => setActiveTab("activity")}>Activity</button>
                <button className={`font-semibold ${activeTab === "messages" ? "text-[#008A56]" : "text-gray-500"}`} onClick={() => setActiveTab("messages")}>Messages ({selected.messageCount})</button>
                <button className={`font-semibold ${activeTab === "attachments" ? "text-[#008A56]" : "text-gray-500"}`} onClick={() => setActiveTab("attachments")}>Attachments (1)</button>
              </div>

              {activeTab === "details" && (
                <div className="space-y-2.5">
                  <DetailRow label="Shipment" value={relatedTo(selected.subject)} />
                  <DetailRow label="Created On" value={new Date(selected.createdAt).toLocaleString()} />
                  <DetailRow label="Priority" value={selected.priority} />
                  <DetailRow label="Category" value={selected.category} />
                  <DetailRow label="Assign To" value="Support Team" />
                  <DetailRow label="Status" value={selected.status.replaceAll("_", " ")} />
                  <div>
                    <div className="text-gray-500 mb-1">Description</div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-gray-700 leading-relaxed">{selected.details}</div>
                  </div>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">Ticket created and queued for triage.</div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">Support agent reviewed shipment metadata.</div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">Next follow-up expected in 2 hours.</div>
                </div>
              )}

              {activeTab === "messages" && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">Support: We are verifying updated ETA with dispatcher.</div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">Client: Please provide revised delivery window.</div>
                </div>
              )}

              {activeTab === "attachments" && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5">shipment-delay-screenshot.png</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="outline" className="h-9 text-xs" onClick={() => setMessageModalOpen(true)}>Add Message</Button>
                <Button className="h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={() => setCloseModalOpen(true)}>Close Ticket</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {newOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1220]">Create Support Ticket</h3>
              <button onClick={() => setNewOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Subject</label>
                <Input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} className="h-9 text-xs mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as typeof form.category }))} className="w-full h-9 text-xs mt-1 rounded-md border border-gray-200 px-3">
                    <option value="Shipment">Shipment</option>
                    <option value="Billing">Billing</option>
                    <option value="Documents">Documents</option>
                    <option value="System">System</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof form.priority }))} className="w-full h-9 text-xs mt-1 rounded-md border border-gray-200 px-3">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Details</label>
                <textarea value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))} rows={4} className="w-full mt-1 rounded-md border border-gray-200 px-3 py-2 text-xs resize-none" />
              </div>
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setNewOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={onCreate}>Submit Ticket</Button>
            </div>
          </div>
        </div>
      )}

      {messageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1220]">Add Message</h3>
              <button onClick={() => setMessageModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={4} className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs resize-none" placeholder="Write an update to this ticket..." />
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setMessageModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={submitMessage}><Send className="w-3.5 h-3.5 mr-1.5" /> Send</Button>
            </div>
          </div>
        </div>
      )}

      {closeModalOpen && selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0B1220]">Close Ticket</h3>
              <button onClick={() => setCloseModalOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 text-xs text-gray-600">Mark <span className="font-semibold text-[#0B1220]">{selected.id.toUpperCase()}</span> as resolved?</div>
            <div className="p-4 pt-0 flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setCloseModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={closeTicket}>Confirm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
        </div>
        <div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "resolved" ? "bg-emerald-100 text-emerald-700" : status === "in_progress" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
  return <Badge className={`text-[10px] uppercase font-bold ${cls}`}>{status.replaceAll("_", " ")}</Badge>;
}

function PriorityBadge({ priority }: { priority: string }) {
  const cls = priority === "high" ? "bg-red-100 text-red-700" : priority === "medium" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700";
  return <Badge className={`text-[10px] uppercase font-bold ${cls}`}>{priority}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[85px_1fr] gap-2">
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold text-[#0B1220]">{value}</div>
    </div>
  );
}
