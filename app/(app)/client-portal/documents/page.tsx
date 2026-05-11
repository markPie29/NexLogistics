"use client";
import { useMemo, useState } from "react";
import { Search, Eye, Download, Share2, Trash2, FileText, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientPortalStore, type PortalDocument } from "@/lib/store/client-portal";
import { toast } from "sonner";

type DocModalAction = "preview" | "download" | "share" | "delete";

export default function ClientPortalDocumentsPage() {
	const documents = useClientPortalStore((s) => s.documents);
	const [query, setQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | PortalDocument["type"]>("all");
	const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
	const [modal, setModal] = useState<{ action: DocModalAction; doc: PortalDocument } | null>(null);

	const filtered = useMemo(() => {
		return documents.filter((doc) => {
			const q = query.trim().toLowerCase();
			const byQuery =
				!q ||
				doc.name.toLowerCase().includes(q) ||
				doc.category.toLowerCase().includes(q) ||
				doc.uploadedBy.toLowerCase().includes(q);
			const byType = typeFilter === "all" || doc.type === typeFilter;
			return byQuery && byType;
		});
	}, [documents, query, typeFilter]);

	const selected = filtered.find((d) => d.id === selectedId) ?? filtered[0] ?? null;

	const stats = useMemo(() => {
		return {
			total: documents.length,
			recent: documents.filter((d) => d.isNew).length,
			pdf: documents.filter((d) => d.type === "PDF").length,
			compliance: documents.filter((d) => d.category === "Compliance").length,
			delivery: documents.filter((d) => d.category === "Delivery").length,
		};
	}, [documents]);

	const runAction = () => {
		if (!modal) return;
		const label = `${modal.doc.name} (${modal.doc.type})`;
		if (modal.action === "preview") toast.success(`Preview opened for ${label}`);
		if (modal.action === "download") toast.success(`Download started for ${label}`);
		if (modal.action === "share") toast.success(`Share link copied for ${label}`);
		if (modal.action === "delete") toast.success(`Delete request submitted for ${label}`);
		setModal(null);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
				<StatCard label="Total Documents" value={stats.total} color="text-blue-600" />
				<StatCard label="Recently Added" value={stats.recent} color="text-emerald-600" />
				<StatCard label="PDF Files" value={stats.pdf} color="text-amber-600" />
				<StatCard label="Compliance" value={stats.compliance} color="text-violet-600" />
				<StatCard label="Delivery Docs" value={stats.delivery} color="text-cyan-600" />
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
				<Card className="border-gray-200">
					<CardContent className="p-4 space-y-3">
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative flex-1 min-w-[260px]">
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="h-9 pl-9 text-xs"
									placeholder="Search by name, category, or uploaded by"
								/>
							</div>
							<select
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value as "all" | PortalDocument["type"])}
								className="h-9 px-3 rounded-md border border-gray-200 text-xs"
							>
								<option value="all">All Types</option>
								<option value="PDF">PDF</option>
								<option value="DOCX">DOCX</option>
								<option value="XLSX">XLSX</option>
							</select>
							<Button
								className="h-9 text-xs bg-[#008A56] hover:bg-[#007045]"
								onClick={() => toast.success("Upload modal opened")}
							>
								Upload Document
							</Button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead>
									<tr className="text-left border-b border-gray-100 text-gray-600">
										<th className="py-3 px-2">Document Name</th>
										<th className="py-3 px-2">Type</th>
										<th className="py-3 px-2">Category</th>
										<th className="py-3 px-2">Uploaded By</th>
										<th className="py-3 px-2">Uploaded On</th>
										<th className="py-3 px-2 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((doc) => (
										<tr
											key={doc.id}
											onClick={() => setSelectedId(doc.id)}
											className="border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer"
										>
											<td className="py-3 px-2 font-semibold text-[#0B1220]">{doc.name}</td>
											<td className="py-3 px-2"><Badge className="bg-gray-100 text-gray-700 text-[10px]">{doc.type}</Badge></td>
											<td className="py-3 px-2 text-gray-600">{doc.category}</td>
											<td className="py-3 px-2 text-gray-600">{doc.uploadedBy}</td>
											<td className="py-3 px-2 text-gray-600">{new Date(doc.uploadedAt).toLocaleString()}</td>
											<td className="py-3 px-2 text-right">
												<div className="inline-flex items-center gap-1">
													<Button
														variant="ghost"
														className="h-8 px-2"
														onClick={(e) => {
															e.stopPropagation();
															setModal({ action: "preview", doc });
														}}
													>
														<Eye className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														className="h-8 px-2"
														onClick={(e) => {
															e.stopPropagation();
															setModal({ action: "download", doc });
														}}
													>
														<Download className="w-4 h-4" />
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<Card className="border-gray-200 h-fit">
					<CardContent className="p-4 text-xs">
						{!selected && <div className="text-gray-500">Select a document to view details.</div>}
						{selected && (
							<div className="space-y-4">
								<div className="flex items-start justify-between gap-3">
									<div>
										<div className="text-lg font-bold text-[#0B1220]">{selected.name}</div>
										<div className="text-gray-500">{selected.type} - {Math.round(selected.sizeKb / 1024) || 1} MB</div>
									</div>
									{selected.isNew && <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">New</Badge>}
								</div>
								<DetailRow label="Type" value={selected.type} />
								<DetailRow label="Category" value={selected.category} />
								<DetailRow label="Shipment" value={selected.uploadedBy} />
								<DetailRow label="Uploaded" value={new Date(selected.uploadedAt).toLocaleString()} />
								<DetailRow label="Shared" value="Internal" />
								<div>
									<div className="text-gray-500 mb-1">Description</div>
									<div className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-gray-700 leading-relaxed">
										{selected.notes ?? "Document record available for client portal visibility."}
									</div>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<Button variant="outline" className="h-9 text-xs" onClick={() => setModal({ action: "download", doc: selected })}>
										<Download className="w-3.5 h-3.5 mr-1.5" /> Download
									</Button>
									<Button variant="outline" className="h-9 text-xs" onClick={() => setModal({ action: "share", doc: selected })}>
										<Share2 className="w-3.5 h-3.5 mr-1.5" /> Share
									</Button>
									<Button variant="outline" className="h-9 text-xs" onClick={() => setModal({ action: "preview", doc: selected })}>
										<Eye className="w-3.5 h-3.5 mr-1.5" /> View
									</Button>
									<Button variant="outline" className="h-9 text-xs text-red-600" onClick={() => setModal({ action: "delete", doc: selected })}>
										<Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{modal && (
				<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl">
						<div className="p-4 border-b border-gray-100 flex items-center justify-between">
							<h3 className="text-sm font-bold text-[#0B1220] capitalize">{modal.action} Document</h3>
							<button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">
								<X className="w-4 h-4" />
							</button>
						</div>
						<div className="p-4 text-xs text-gray-600">
							Confirm {modal.action} for <span className="font-semibold text-[#0B1220]">{modal.doc.name}</span>?
						</div>
						<div className="p-4 pt-0 flex gap-2">
							<Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setModal(null)}>
								Cancel
							</Button>
							<Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={runAction}>
								Confirm
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
	return (
		<Card className="border-gray-200">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div className="text-xs text-gray-500">{label}</div>
					<div className="w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center">
						<FileText className={`w-3.5 h-3.5 ${color}`} />
					</div>
				</div>
				<div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
			</CardContent>
		</Card>
	);
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-[88px_1fr] gap-2">
			<div className="text-gray-500">{label}</div>
			<div className="font-semibold text-[#0B1220]">{value}</div>
		</div>
	);
}
