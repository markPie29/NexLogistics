"use client";
import { useState, useMemo } from "react";
import {
  FileText, Search, MoreVertical, SlidersHorizontal,
  Trash2, RotateCcw, Calendar, X, AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDocumentStore, type DocumentItem } from "@/lib/store/documents";
import { toast } from "sonner";

export default function RecycleBinPage() {
  const documents = useDocumentStore(s => s.documents);
  const restoreDocument = useDocumentStore(s => s.restoreDocument);
  const permanentlyDeleteDocument = useDocumentStore(s => s.permanentlyDeleteDocument);
  const emptyRecycleBin = useDocumentStore(s => s.emptyRecycleBin);
  
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  // Confirm modals
  const [emptyBinConfirm, setEmptyBinConfirm] = useState(false);
  const [permDeleteTarget, setPermDeleteTarget] = useState<DocumentItem | null>(null);

  const deletedDocs = useMemo(() => {
    return documents.filter(d => d.status === "deleted");
  }, [documents]);

  const filtered = useMemo(() => {
    return deletedDocs.filter(d => {
      if (search) {
        const q = search.toLowerCase();
        return d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [deletedDocs, search]);

  const stats = useMemo(() => {
    return {
      total: deletedDocs.length,
      restorable: deletedDocs.filter(d => (d.daysLeft || 0) > 0).length,
      permanentlyDeleted: 8,
      autoDeleted: 12,
    };
  }, [deletedDocs]);

  const selected = selectedId ? deletedDocs.find(d => d.id === selectedId) : null;

  const handleRestore = (id: string) => {
    restoreDocument(id);
    toast.success("Document restored successfully");
    if (selectedId === id) setSelectedId(null);
  };

  const handlePermDelete = () => {
    if (!permDeleteTarget) return;
    permanentlyDeleteDocument(permDeleteTarget.id);
    toast.error(`"${permDeleteTarget.name}" permanently deleted`);
    if (selectedId === permDeleteTarget.id) setSelectedId(null);
    setPermDeleteTarget(null);
  };

  const handleEmptyBin = () => {
    emptyRecycleBin();
    toast.success("Recycle Bin emptied — all documents permanently deleted");
    setSelectedId(null);
    setEmptyBinConfirm(false);
  };

  return (
    <div className="space-y-6 pb-10" onClick={() => setMenuId(null)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Recycle Bin</h1>
          <p className="text-sm text-muted-foreground mt-1">View and restore or permanently delete documents from the recycle bin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white shadow-sm border-gray-200 h-9 px-3 text-xs font-semibold text-[#0B1220]">
            <Calendar className="w-4 h-4 mr-2 text-gray-500" /> May 16 - May 31, 2024
          </Button>
          <Button variant="outline" className="bg-white shadow-sm border-gray-200 h-9 px-3 text-xs font-semibold text-[#0B1220]">
          </Button>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm h-9 px-4 text-xs font-semibold bg-white" onClick={() => setEmptyBinConfirm(true)} disabled={deletedDocs.length === 0}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Empty Recycle Bin
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Documents" value={stats.total} icon={FileText} iconColor="text-blue-500" iconBg="bg-blue-50" trend={12.5} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Restorable" value={stats.restorable} icon={RotateCcw} iconColor="text-amber-500" iconBg="bg-amber-50" trend={8.7} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Permanently Deleted" value={stats.permanentlyDeleted} icon={Trash2} iconColor="text-red-500" iconBg="bg-red-50" trend={-20.0} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Auto Deleted (30+ Days)" value={stats.autoDeleted} icon={Calendar} iconColor="text-purple-500" iconBg="bg-purple-50" trend={5.1} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
      </div>

      <div className={`grid gap-6 ${selected ? "grid-cols-1 xl:grid-cols-[1fr_360px]" : "grid-cols-1"}`}>
        <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-100">
              <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by document name, type, category..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
                </div>
                <select className="h-9 px-3 text-xs border border-gray-200 font-medium text-gray-600 rounded-lg focus:outline-none bg-white">
                  <option>All Types</option>
                </select>
                <select className="h-9 px-3 text-xs border border-gray-200 font-medium text-gray-600 rounded-lg focus:outline-none bg-white">
                  <option>All Categories</option>
                </select>
                <select className="h-9 px-3 text-xs border border-gray-200 font-medium text-gray-600 rounded-lg focus:outline-none bg-white">
                  <option>Deleted By</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-600 rounded-lg">
                  <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> More Filters
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-gray-400 rounded-lg cursor-not-allowed">
                  <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restore
                </Button>
                <Button variant="outline" className="h-9 px-3 text-xs border-red-100 font-medium text-red-500 rounded-lg bg-red-50 hover:bg-red-100 hover:text-red-600 border">
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Permanently
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left font-bold text-gray-700 border-b border-gray-100 bg-white">
                    <th className="py-3 px-5 w-10"><input type="checkbox" className="accent-[#008A56] w-3.5 h-3.5 rounded-sm border-gray-300" /></th>
                    <th className="py-3 px-2">Document Name</th>
                    <th className="py-3 px-2">Type</th>
                    <th className="py-3 px-2">Category</th>
                    <th className="py-3 px-2">Deleted By</th>
                    <th className="py-3 px-2">Deleted On <span className="inline-block translate-y-[2px]">↓</span></th>
                    <th className="py-3 px-2">Days Left ⓘ</th>
                    <th className="py-3 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d) => (
                    <tr key={d.id} 
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer group ${selectedId === d.id ? "bg-red-50/30" : ""}`}
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
                      <td className="py-4 px-2 font-medium text-gray-700">{d.type}</td>
                      <td className="py-4 px-2 text-gray-600">{d.category}</td>
                      <td className="py-4 px-2 text-gray-800 font-medium">{d.deletedBy}</td>
                      <td className="py-4 px-2 text-gray-600">
                        {d.deletedOn ? (
                          <>
                            <div>{new Date(d.deletedOn).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                            <div className="text-[10px] text-gray-400">{new Date(d.deletedOn).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                          </>
                        ) : "—"}
                      </td>
                      <td className="py-4 px-2">
                        <span className={`inline-flex items-center font-bold ${d.daysLeft && d.daysLeft < 7 ? "text-red-500" : "text-amber-500"}`}>
                          {d.daysLeft} days left
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="relative">
                          <button className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center mx-auto" onClick={(e) => { e.stopPropagation(); setMenuId(menuId === d.id ? null : d.id); }}>
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          {menuId === d.id && (
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { handleRestore(d.id); setMenuId(null); }}>
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" /> Restore Document
                              </button>
                              <div className="border-t border-gray-100" />
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setPermDeleteTarget(d); setMenuId(null); }}>
                                <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
              <div>Showing 1 to {filtered.length} of {deletedDocs.length} documents</div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">&lt;</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-[#008A56] text-white border-[#008A56] hover:bg-[#007045]">1</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">2</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">3</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">...</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">7</Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 border-gray-200">&gt;</Button>
              </div>
              <div>10 / page</div>
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
                  <div className="text-xs text-gray-500 mt-1">{selected.category} • {selected.type} • {selected.sizeMB} MB</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100/60 text-amber-700 border border-amber-200/50">
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition" onClick={() => setSelectedId(null)}>
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-5 space-y-4 text-xs">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Deleted By</div>
                  <div className="text-gray-900 font-semibold">{selected.deletedBy}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Deleted On</div>
                  <div className="text-gray-900 font-semibold">{selected.deletedOn ? new Date(selected.deletedOn).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Original Location</div>
                  <div className="text-gray-900 font-semibold truncate" title={selected.originalLocation}>{selected.originalLocation}</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Days Left</div>
                  <div className="text-red-500 font-bold bg-red-50 inline-block px-1.5 py-0.5 rounded border border-red-100">{selected.daysLeft} days left</div>
                </div>
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <div className="text-gray-500 font-medium">Status</div>
                  <div className="text-gray-900 font-semibold">Restorable</div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="text-gray-500 font-medium mb-1.5">Description</div>
                  <div className="text-gray-900 leading-relaxed">{selected.description}</div>
                </div>

                <div className="pt-2">
                  <div className="text-gray-500 font-medium mb-1.5">Tags</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex flex-col gap-2 bg-gray-50">
                <Button variant="outline" className="w-full h-10 text-xs font-semibold bg-white text-gray-700 border-gray-200" onClick={() => handleRestore(selected.id)}>
                  <RotateCcw className="w-4 h-4 mr-2 text-gray-400" /> Restore Document
                </Button>
                <Button variant="outline" className="w-full h-10 text-xs font-semibold bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700" onClick={() => setPermDeleteTarget(selected)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Permanent Delete Confirmation ── */}
      {permDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Permanently Delete</h3>
                  <p className="text-xs text-gray-500">This cannot be undone. The file will be lost forever.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100">
                <div className="text-xs font-semibold text-gray-800">{permDeleteTarget.name}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{permDeleteTarget.category} • {permDeleteTarget.sizeMB} MB</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setPermDeleteTarget(null)}>Cancel</Button>
                <Button className="flex-1 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white" onClick={handlePermDelete}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Forever
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty Bin Confirmation ── */}
      {emptyBinConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Empty Recycle Bin</h3>
                  <p className="text-xs text-gray-500">All {deletedDocs.length} documents will be permanently deleted.</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 mb-5 border border-red-100 text-xs text-red-700 font-medium">
                ⚠ This action is irreversible. Files cannot be recovered after emptying.
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setEmptyBinConfirm(false)}>Cancel</Button>
                <Button className="flex-1 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white" onClick={handleEmptyBin}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Empty Bin ({deletedDocs.length})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
