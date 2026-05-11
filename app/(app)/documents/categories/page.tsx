"use client";
import { useState, useMemo } from "react";
import {
  FolderTree, Search, Plus, MoreVertical, Download, Folder, FileText, Archive,
  Pencil, Trash2, X, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useDocumentStore, type DocumentCategory } from "@/lib/store/documents";
import { toast } from "sonner";

const EMPTY_FORM = { name: "", description: "", status: "active" as "active" | "inactive" };

export default function DocumentCategoriesPage() {
  const categories = useDocumentStore(s => s.categories);
  const addCategory = useDocumentStore(s => s.addCategory);
  const updateCategory = useDocumentStore(s => s.updateCategory);
  const deleteCategory = useDocumentStore(s => s.deleteCategory);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuId, setMenuId] = useState<string | null>(null);

  // Add / Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentCategory | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<DocumentCategory | null>(null);

  const filtered = useMemo(() => {
    return categories.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [categories, search, statusFilter]);

  const stats = useMemo(() => ({
    total: categories.length,
    active: categories.filter(c => c.status === "active").length,
    documents: categories.reduce((acc, c) => acc + c.documentCount, 0),
  }), [categories]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (cat: DocumentCategory) => {
    setEditTarget(cat);
    setForm({ name: cat.name, description: cat.description, status: cat.status });
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (editTarget) {
      updateCategory(editTarget.id, { name: form.name, description: form.description, status: form.status });
      toast.success(`Category "${form.name}" updated`);
    } else {
      addCategory({
        id: `cat-${Date.now()}`,
        name: form.name,
        description: form.description,
        status: form.status,
        documentCount: 0,
        createdOn: new Date().toISOString(),
        createdBy: "Admin User",
      });
      toast.success(`Category "${form.name}" created`);
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory(deleteTarget.id);
    toast.success(`Category "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6 pb-10" onClick={() => setMenuId(null)}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1220] tracking-tight">Document Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your documents with categories for easy management and quick access.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white shadow-sm border-gray-200 h-9 px-3 text-xs font-semibold text-[#0B1220]">
            May 16 - May 31, 2024
          </Button>
          <Button className="bg-[#008A56] hover:bg-[#007045] text-white shadow-sm h-9 px-4 text-xs font-semibold" onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Category
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Categories" value={stats.total} icon={FolderTree} iconColor="text-blue-500" iconBg="bg-blue-50" trend={12.5} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Active Categories" value={stats.active} icon={Folder} iconColor="text-[#008A56]" iconBg="bg-emerald-50" trend={14.3} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <KpiCard label="Total Documents" value={stats.documents.toLocaleString()} icon={FileText} iconColor="text-amber-500" iconBg="bg-amber-50" trend={10.8} trendLabel="" footerLabel="vs Apr 16 - Apr 30" />
        <Card className="border-gray-200 shadow-sm rounded-xl bg-white overflow-hidden">
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Archive className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-sm font-semibold text-gray-500">Storage Used</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900 tracking-tight">18.7 GB</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">of 100 GB</div>
              </div>
            </div>
            <div className="relative w-14 h-14 mt-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#008A56" strokeWidth="3" strokeDasharray="18.7, 100" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-700">18.7%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 shadow-sm rounded-xl overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="p-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-100">
            <div className="flex items-center gap-2 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories..." className="pl-9 h-9 text-xs border-gray-200 rounded-lg" />
              </div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 text-xs border border-gray-200 font-medium text-gray-600 rounded-lg focus:outline-none bg-white">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <Button variant="outline" className="h-9 px-3 text-xs border-gray-200 font-medium text-[#008A56] rounded-lg">
              <Download className="w-3.5 h-3.5 mr-2" /> Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left font-bold text-gray-700 border-b border-gray-100 bg-white">
                  <th className="py-3 px-5">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Documents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created On</th>
                  <th className="py-3 px-4">Created By</th>
                  <th className="py-3 px-5 text-right w-14">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-semibold text-blue-600">
                        <Folder className="w-4 h-4 text-[#008A56]" />{c.name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{c.description}</td>
                    <td className="py-4 px-4 font-semibold text-gray-800">{c.documentCount}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${c.status === "active" ? "bg-emerald-100/60 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">{new Date(c.createdOn).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-4 px-4 font-medium text-gray-700">{c.createdBy}</td>
                    <td className="py-4 px-5 text-right relative">
                      <button
                        className="w-7 h-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 inline-flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); setMenuId(menuId === c.id ? null : c.id); }}>
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                      {menuId === c.id && (
                        <div className="absolute right-5 top-10 z-20 w-36 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { openEdit(c); setMenuId(null); }}>
                            <Pencil className="w-3.5 h-3.5 text-blue-400" /> Edit
                          </button>
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50" onClick={() => { updateCategory(c.id, { status: c.status === "active" ? "inactive" : "active" }); toast.success("Status updated"); setMenuId(null); }}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Toggle Status
                          </button>
                          <div className="border-t border-gray-100" />
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50" onClick={() => { setDeleteTarget(c); setMenuId(null); }}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-xs text-gray-400">No categories found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 bg-white">
            <div>Showing {filtered.length} of {categories.length} categories</div>
          </div>
        </CardContent>
      </Card>

      {/* ── Add / Edit Category Modal ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Folder className="w-4.5 h-4.5 text-[#008A56]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900">{editTarget ? "Edit Category" : "Add New Category"}</h3>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setFormOpen(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Category Name <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Contracts" className="h-9 text-xs border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Briefly describe this category..." rows={3} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#008A56] resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as "active" | "inactive" }))} className="w-full h-9 px-3 text-xs border border-gray-200 rounded-md focus:outline-none bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs font-semibold bg-[#008A56] hover:bg-[#007045] text-white" onClick={handleSave}>
                {editTarget ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Delete Category</h3>
                  <p className="text-xs text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 mb-5 border border-gray-100 flex items-center gap-2">
                <Folder className="w-4 h-4 text-[#008A56] shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-800">{deleteTarget.name}</div>
                  <div className="text-[10px] text-gray-500">{deleteTarget.documentCount} documents</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-9 text-xs font-semibold" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                <Button className="flex-1 h-9 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
