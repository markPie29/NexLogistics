"use client";
import { useState, useMemo } from "react";
import {
  FileText, Search, Download, MoreVertical, SlidersHorizontal,
  Share2, X, Eye, FileEdit, AlertTriangle, Send, Link2, ShieldOff
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDocumentStore, type DocumentItem, type ShareAccess } from "@/lib/store/documents";
import { toast } from "sonner";

export default function SharedDocumentsPage() {
  const documents = useDocumentStore(s => s.documents);
  const shareDocument = useDocumentStore(s => s.shareDocument);
  const revokeShare = useDocumentStore(s => s.revokeShare);

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  // Share modal
  const [shareTarget, setShareTarget] = useState<DocumentItem | null>(null);
  const [shareWith, setShareWith] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareAccess, setShareAccess] = useState<ShareAccess>("view");
  const [shareExpiry, setShareExpiry] = useState("");

  // Revoke confirm
  const [revokeTarget, setRevokeTarget] = useState<DocumentItem | null>(null);

  const sharedDocs = useMemo(() => {
    return documents.filter(d => (d.sharedBy || d.sharedWith) && d.status !== "deleted");
  }, [documents]);

  const filtered = useMemo(() => {
    if (!search) return sharedDocs;
    const q = search.toLowerCase();
    return sharedDocs.filter(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));
  }, [sharedDocs, search]);

  const stats = useMemo(() => ({
    sharedWithMe: sharedDocs.filter(d => d.sharedBy && d.sharedBy !== "You").length,
    sharedByMe: sharedDocs.filter(d => d.sharedBy === "You").length,
    pendingAccess: 18,
    expiredLinks: sharedDocs.filter(d => d.shareStatus === "expired").length,
  }), [sharedDocs]);

  const selected = selectedId ? sharedDocs.find(d => d.id === selectedId) : null;

  const openShare = (doc: DocumentItem) => {
    setShareTarget(doc);
    setShareWith(""); setShareEmail(""); setShareAccess("view"); setShareExpiry("");
  };

  const handleShare = () => {
    if (!shareTarget || !shareWith || !shareEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    shareDocument(shareTarget.id, { sharedWith: shareWith, sharedWithEmail: shareEmail, shareAccess, expiryDate: shareExpiry || undefined });
    toast.success(`"${shareTarget.name}" shared with ${shareWith}`);
    setShareTarget(null);
    setShareWith(""); setShareEmail(""); setShareAccess("view"); setShareExpiry("");
  };

  const handleRevoke = () => {
    if (!revokeTarget) return;
    revokeShare(revokeTarget.id);
    toast.success("Share access revoked");
    setRevokeTarget(null);
    if (selectedId === revokeTarget.id) setSelectedId(null);
  };

  return (
    <div className="space-y-6 pb-10" onClick={() => setMenuId(null)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Shared Documents</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage documents that have been shared with you or by you.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Shared With Me" value={320} icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50" trend={12.4} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Shared By Me" value={156} icon={Share2} iconColor="text-[#008A56]" iconBg="bg-emerald-50" trend={8.7} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Pending Access" value={stats.pendingAccess} icon={FileEdit} iconColor="text-amber-500" iconBg="bg-amber-50" trend={-10.3} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Expired Links" value={stats.expiredLinks} icon={FileText} iconColor="text-purple-500" iconBg="bg-purple-50" trend={-5.1} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-100">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by document name, owner, type..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> More Filters
                </Button>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-[#008A56] rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-2" /> Export
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left font-bold text-gray-700 border-b border-gray-100 bg-white">
                    <th className="py-3 px-5 w-10"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" /></th>
                    <th className="py-3 px-2">Document Name</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Shared By / With</th>
                    <th className="py-3 px-2">Access</th>
                    <th className="py-3 px-2">Shared On</th>
                    <th className="py-3 px-2">Expiry</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-4 text-center w-14">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d) => (
                    <tr key={d.id}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedId === d.id ? "bg-green-50/30" : ""}`}
                      onClick={() => setSelectedId(d.id)}>
                      <td className="py-4 px-5"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${d.type === "PDF" ? "bg-red-500" : d.type === "DOCX" ? "bg-blue-500" : d.type === "XLSX" ? "bg-green-500" : d.type === "ZIP" ? "bg-purple-500" : "bg-amber-500"}`}>
                            {d.type}
                          </div>
                          <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={d.name}>{d.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-gray-600">{d.category}</td>
                      <td className="py-4 px-2">
                        <div className="text-gray-800 font-medium truncate max-w-[120px]">{d.sharedBy === "You" ? d.sharedWith : d.sharedBy}</div>
                        <div className="text-[10px] text-gray-500">{d.sharedBy === "You" ? "Shared by you" : "Shared with you"}</div>
                      </td>
                      <td className="py-4 px-2 capitalize text-gray-600">{d.shareAccess === "view" ? "View Only" : "Edit"}</td>
                      <td className="py-4 px-2 text-gray-600">
                        {d.sharedOn ? new Date(d.sharedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-4 px-2 text-gray-600">
                        {d.expiryDate ? new Date(d.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${d.shareStatus === "active" ? "bg-emerald-100/60 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {d.shareStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        <button
                          className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto"
                          onClick={(e) => { e.stopPropagation(); setMenuId(menuId === d.id ? null : d.id); }}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {menuId === d.id && (
                          <div className="absolute right-4 top-10 z-20 w-40 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { setSelectedId(d.id); setMenuId(null); }}>
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { openShare(d); setMenuId(null); }}>
                              <Share2 className="w-3.5 h-3.5 text-blue-400" /> Share Again
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { toast.success("Download started"); setMenuId(null); }}>
                              <Download className="w-3.5 h-3.5 text-gray-400" /> Download
                            </button>
                            <div className="border-t border-gray-100" />
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setRevokeTarget(d); setMenuId(null); }}>
                              <ShieldOff className="w-3.5 h-3.5" /> Revoke Access
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="py-12 text-center text-xs text-gray-400">No shared documents found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
              <div>Showing {filtered.length} of {sharedDocs.length} documents</div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selected && (
          <Card className="border-gray-200 shadow-xl rounded-xl sticky top-6 h-fit overflow-hidden bg-white">
            <CardHeader className="p-4 border-b border-gray-100 flex flex-row items-start justify-between pb-4">
              <div className="flex gap-3 items-start pr-4">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1 ${selected.type === "PDF" ? "bg-red-500" : selected.type === "DOCX" ? "bg-blue-500" : selected.type === "XLSX" ? "bg-green-500" : selected.type === "ZIP" ? "bg-purple-500" : "bg-amber-500"}`}>
                  {selected.type}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">{selected.name}</h3>
                  <div className="text-xs text-gray-500 mt-1">{selected.category} • {selected.sizeMB} MB</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${selected.shareStatus === "active" ? "bg-emerald-100/60 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                      {selected.shareStatus}
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition" onClick={() => setSelectedId(null)}>
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 flex gap-2 border-b border-gray-100 bg-gray-50/50">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold bg-white" onClick={() => toast.info("Preview not available in MVP")}>
                  <Eye className="w-3.5 h-3.5 mr-2" /> Preview
                </Button>
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold bg-white" onClick={() => toast.success("Download started")}>
                  <Download className="w-3.5 h-3.5 mr-2" /> Download
                </Button>
              </div>
              <div className="p-4 flex gap-2 border-b border-gray-100">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => openShare(selected)}>
                  <Share2 className="w-3.5 h-3.5 mr-2" /> Share Again
                </Button>
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" onClick={() => setRevokeTarget(selected)}>
                  <ShieldOff className="w-3.5 h-3.5 mr-2" /> Revoke
                </Button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Shared By</div>
                  <div className="text-gray-900 font-semibold">{selected.sharedBy}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Shared With</div>
                  <div>
                    <div className="text-gray-900 font-semibold">{selected.sharedWith}</div>
                    {selected.sharedWithEmail && <div className="text-blue-600 text-[10px] mt-0.5">{selected.sharedWithEmail}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Access Level</div>
                  <div className="text-gray-900 font-semibold capitalize">{selected.shareAccess === "view" ? "View Only" : "Edit"}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Shared On</div>
                  <div className="text-gray-900 font-semibold">{selected.sharedOn ? new Date(selected.sharedOn).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Expiry Date</div>
                  <div className="text-gray-900 font-semibold">{selected.expiryDate ? new Date(selected.expiryDate).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</div>
                </div>
                <div className="pt-2">
                  <div className="text-gray-500 font-medium mb-1.5">Description</div>
                  <div className="text-gray-900 leading-relaxed bg-gray-50 p-2.5 rounded border border-gray-100">{selected.description}</div>
                </div>
                <div className="pt-2">
                  <div className="text-gray-500 font-medium mb-1.5">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-100">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Share Modal ── */}
      {shareTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Share Document</h3>
                  <p className="text-[11px] text-gray-500 truncate max-w-[280px]">{shareTarget.name}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setShareTarget(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Share With <span className="text-red-500">*</span></label>
                <Input value={shareWith} onChange={e => setShareWith(e.target.value)} placeholder="e.g. ABC Construction Inc." className="h-9 text-xs border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></label>
                <Input value={shareEmail} onChange={e => setShareEmail(e.target.value)} type="email" placeholder="e.g. contact@example.com" className="h-9 text-xs border-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Access Level</label>
                  <select value={shareAccess} onChange={e => setShareAccess(e.target.value as ShareAccess)} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none bg-white">
                    <option value="view">View Only</option>
                    <option value="edit">Can Edit</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Expires On</label>
                  <Input value={shareExpiry} onChange={e => setShareExpiry(e.target.value)} type="date" className="h-9 text-xs border-gray-200" />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <p className="text-[10px] text-blue-700">A secure share link will be sent to the recipient&apos;s email.</p>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setShareTarget(null)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs font-semibold bg-[#008A56] hover:bg-[#007045] text-white" onClick={handleShare}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Send Share Link
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revoke Confirm Modal ── */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Revoke Share Access</h3>
                  <p className="text-xs text-gray-500">The recipient will lose access immediately.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100">
                <div className="text-xs font-semibold text-gray-800">{revokeTarget.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Shared with: {revokeTarget.sharedWith}</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setRevokeTarget(null)}>Cancel</Button>
                <Button className="flex-1 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white" onClick={handleRevoke}>
                  <ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Revoke Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
