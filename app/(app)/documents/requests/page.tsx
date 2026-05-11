"use client";
import { useState, useMemo } from "react";
import {
  FileQuestion, Plus, Search, CheckCircle2, Clock, MoreVertical,
  X, Send
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDocumentStore } from "@/lib/store/documents";
import { toast } from "sonner";

export default function DocumentRequestsPage() {
  const requests = useDocumentStore(s => s.requests);
  const addRequest = useDocumentStore(s => s.addRequest);
  const updateRequest = useDocumentStore(s => s.updateRequest);

  const [search, setSearch] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    requestedFrom: "",
    requestedFromEmail: "",
    notes: "",
    dueDate: "",
    priority: "medium" as "low" | "medium" | "high",
  });

  const filtered = useMemo(() => {
    if (!search) return requests;
    const q = search.toLowerCase();
    return requests.filter(r => r.title.toLowerCase().includes(q) || r.requestedFrom.toLowerCase().includes(q));
  }, [requests, search]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    completed: requests.filter(r => r.status === "completed").length,
    cancelled: requests.filter(r => r.status === "cancelled").length,
  }), [requests]);

  const handleSubmit = () => {
    if (!form.title || !form.requestedFrom) {
      toast.error("Title and Requested From are required");
      return;
    }

    addRequest({
      id: `req-${Date.now()}`,
      ...form,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    toast.success(`Request "${form.title}" created`);
    setForm({
      title: "",
      requestedFrom: "",
      requestedFromEmail: "",
      notes: "",
      dueDate: "",
      priority: "medium",
    });
    setNewRequestOpen(false);
  };

  const priorityBadge = (p: string) => {
    if (p === "high") return "bg-red-100 text-red-700";
    if (p === "medium") return "bg-amber-100 text-amber-700";
    return "bg-gray-100 text-gray-600";
  };

  const statusBadge = (s: string) => {
    if (s === "completed") {
      return { cls: "bg-emerald-100/60 text-emerald-700", icon: <CheckCircle2 className="w-3 h-3" />, label: "Completed" };
    }
    if (s === "cancelled") {
      return { cls: "bg-red-100 text-red-700", icon: <X className="w-3 h-3" />, label: "Cancelled" };
    }
    return { cls: "bg-amber-100/60 text-amber-700", icon: <Clock className="w-3 h-3" />, label: "Pending" };
  };

  return (
    <div className="space-y-6 pb-10" onClick={() => setMenuId(null)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Document Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">Request documents from employees, clients, or vendors.</p>
        </div>
        <Button className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-4 text-xs font-semibold" onClick={() => setNewRequestOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> New Request
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats.total, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Pending", value: stats.pending, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Completed", value: stats.completed, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Cancelled", value: stats.cancelled, color: "text-red-500", bg: "bg-red-50" },
        ].map(s => (
          <Card key={s.label} className="border-gray-200 rounded-xl shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                <div className={`text-2xl font-extrabold mt-1 ${s.color}`}>{s.value}</div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.bg}`}>
                <FileQuestion className={`w-5 h-5 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, recipient..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left font-bold text-gray-700 border-b border-gray-100 bg-white">
                  <th className="py-3 px-5">Request Title</th>
                  <th className="py-3 px-4">Requested From</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((req) => {
                  const sb = statusBadge(req.status);
                  return (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 font-semibold text-gray-800">
                          <FileQuestion className="w-4 h-4 text-amber-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{req.title}</span>
                        </div>
                        {req.notes && <div className="text-[10px] text-gray-400 mt-0.5 pl-6 truncate max-w-[220px]">{req.notes}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-gray-700">{req.requestedFrom}</div>
                        {req.requestedFromEmail && <div className="text-[10px] text-blue-500">{req.requestedFromEmail}</div>}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${priorityBadge(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      <td className="py-4 px-4 text-gray-600">{req.dueDate ? new Date(req.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-"}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${sb.cls}`}>
                          {sb.icon} {sb.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        {req.status === "pending" && (
                          <>
                            <button
                              className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto"
                              onClick={(e) => { e.stopPropagation(); setMenuId(menuId === req.id ? null : req.id); }}>
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {menuId === req.id && (
                              <div className="absolute right-4 top-10 z-20 w-44 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-700 hover:bg-emerald-50" onClick={() => { updateRequest(req.id, { status: "completed" }); toast.success("Marked as complete"); setMenuId(null); }}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark Complete
                                </button>
                                <div className="border-t border-gray-100" />
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { updateRequest(req.id, { status: "cancelled" }); toast.info("Request cancelled"); setMenuId(null); }}>
                                  <X className="w-3.5 h-3.5" /> Cancel Request
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-xs text-gray-400">No requests found. Create your first request.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 text-xs text-gray-500">Showing {filtered.length} of {requests.length} requests</div>
        </CardContent>
      </Card>

      {newRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                  <FileQuestion className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">New Document Request</h3>
                  <p className="text-[11px] text-gray-500">Request a document from an employee, client, or vendor</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setNewRequestOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Request Title <span className="text-red-500">*</span></label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Driver License Renewal" className="h-9 text-xs border-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Requested From <span className="text-red-500">*</span></label>
                  <Input value={form.requestedFrom} onChange={e => setForm(f => ({ ...f, requestedFrom: e.target.value }))} placeholder="e.g. Juan Dela Cruz" className="h-9 text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Email Address</label>
                  <Input value={form.requestedFromEmail} onChange={e => setForm(f => ({ ...f, requestedFromEmail: e.target.value }))} type="email" placeholder="e.g. juan@example.com" className="h-9 text-xs border-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Due Date</label>
                  <Input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} type="date" className="h-9 text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as "low" | "medium" | "high" }))} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none bg-white">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Additional context or instructions..." className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setNewRequestOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs font-semibold bg-[#008A56] hover:bg-[#007045] text-white" onClick={handleSubmit}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Send Request
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
