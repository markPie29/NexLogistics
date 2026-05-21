"use client";
import { useMemo, useState } from "react";
import { Search, Download, Receipt, CreditCard, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientPortalStore, type PortalInvoice } from "@/lib/store/client-portal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export default function ClientPortalInvoicesPage() {
	const invoices = useClientPortalStore((s) => s.invoices);
	const markInvoicePaid = useClientPortalStore((s) => s.markInvoicePaid);

	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | PortalInvoice["status"]>("all");
	const [selectedId, setSelectedId] = useState<string | null>(invoices[0]?.id ?? null);
	const [paying, setPaying] = useState<PortalInvoice | null>(null);

	const filtered = useMemo(() => {
		return invoices.filter((invoice) => {
			const q = query.trim().toLowerCase();
			const byQuery =
				!q ||
				invoice.invoiceNumber.toLowerCase().includes(q) ||
				invoice.id.toLowerCase().includes(q);
			const byStatus = statusFilter === "all" || invoice.status === statusFilter;
			return byQuery && byStatus;
		});
	}, [invoices, query, statusFilter]);

	const selected = filtered.find((i) => i.id === selectedId) ?? filtered[0] ?? null;

	const stats = useMemo(() => {
		const outstanding = invoices.filter((i) => i.balance > 0).reduce((sum, i) => sum + i.balance, 0);
		const paid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0);
		const overdue = invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.balance, 0);
		const draft = invoices.filter((i) => i.status === "unpaid").length;
		return { outstanding, paid, overdue, draft };
	}, [invoices]);

	const confirmPayment = () => {
		if (!paying) return;
		markInvoicePaid(paying.id);
		toast.success(`${paying.invoiceNumber} marked as paid`);
		setPaying(null);
	};

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
				<StatCard label="Total Outstanding" value={formatCurrency(stats.outstanding)} color="text-blue-600" />
				<StatCard label="Paid (This Period)" value={formatCurrency(stats.paid)} color="text-emerald-600" />
				<StatCard label="Overdue" value={formatCurrency(stats.overdue)} color="text-red-600" />
				<StatCard label="Unpaid Invoices" value={stats.draft} color="text-violet-600" />
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
				<Card className="border-gray-200">
					<CardContent className="p-4 space-y-3">
						<div className="flex flex-wrap items-center gap-2">
							<div className="relative flex-1 min-w-[240px]">
								<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="h-9 pl-9 text-xs"
									placeholder="Search by invoice number"
								/>
							</div>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as "all" | PortalInvoice["status"])}
								className="h-9 px-3 rounded-md border border-gray-200 text-xs"
							>
								<option value="all">All Status</option>
								<option value="paid">Paid</option>
								<option value="unpaid">Unpaid</option>
								<option value="overdue">Overdue</option>
							</select>
							<Button
								variant="outline"
								className="h-9 text-xs"
								onClick={() => toast.success("Invoice export generated")}
							>
								<Download className="w-3.5 h-3.5 mr-1.5" /> Export
							</Button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead>
									<tr className="text-left border-b border-gray-100 text-gray-600">
										<th className="py-3 px-2">Invoice Number</th>
										<th className="py-3 px-2">Issue Date</th>
										<th className="py-3 px-2">Due Date</th>
										<th className="py-3 px-2">Amount</th>
										<th className="py-3 px-2">Status</th>
										<th className="py-3 px-2 text-right">Actions</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((invoice) => (
										<tr
											key={invoice.id}
											onClick={() => setSelectedId(invoice.id)}
											className="border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer"
										>
											<td className="py-3 px-2 font-semibold text-[#0B1220]">{invoice.invoiceNumber}</td>
											<td className="py-3 px-2 text-gray-600">{new Date(invoice.issueDate).toLocaleDateString()}</td>
											<td className="py-3 px-2 text-gray-600">{new Date(invoice.dueDate).toLocaleDateString()}</td>
											<td className="py-3 px-2 text-gray-700 font-semibold">{formatCurrency(invoice.amount)}</td>
											<td className="py-3 px-2"><StatusBadge status={invoice.status} /></td>
											<td className="py-3 px-2 text-right">
												<div className="inline-flex items-center gap-1">
													<Button
														variant="ghost"
														className="h-8 px-2"
														onClick={(e) => {
															e.stopPropagation();
															toast.success(`Downloading ${invoice.invoiceNumber}`);
														}}
													>
														<Download className="w-4 h-4" />
													</Button>
													{invoice.balance > 0 && (
														<Button
															variant="ghost"
															className="h-8 px-2"
															onClick={(e) => {
																e.stopPropagation();
																setPaying(invoice);
															}}
														>
															Pay
														</Button>
													)}
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
						{!selected && <div className="text-gray-500">Select an invoice to view details.</div>}
						{selected && (
							<div className="space-y-4">
								<div>
									<div className="text-lg font-bold text-[#0B1220]">{selected.invoiceNumber}</div>
									<StatusBadge status={selected.status} />
								</div>
								<DetailRow label="Amount" value={formatCurrency(selected.amount)} />
								<DetailRow label="Balance" value={formatCurrency(selected.balance)} />
								<DetailRow label="Issue Date" value={new Date(selected.issueDate).toLocaleDateString()} />
								<DetailRow label="Due Date" value={new Date(selected.dueDate).toLocaleDateString()} />
								<DetailRow label="Shipment" value={`NEX-TRK-00012${selected.id.replace("inv-", "")}`} />
								<div className="pt-1 grid grid-cols-1 gap-2">
									<Button
										variant="outline"
										className="h-9 text-xs"
										onClick={() => toast.success(`Invoice download started for ${selected.invoiceNumber}`)}
									>
										<Download className="w-3.5 h-3.5 mr-1.5" /> Download Invoice
									</Button>
									<Button
										variant="outline"
										className="h-9 text-xs"
										onClick={() => toast.success(`Invoice ${selected.invoiceNumber} opened`)}
									>
										View Invoice
									</Button>
									<Button
										className="h-9 text-xs bg-[#008A56] hover:bg-[#007045]"
										onClick={() => setPaying(selected)}
										disabled={selected.balance <= 0}
									>
										<CreditCard className="w-3.5 h-3.5 mr-1.5" /> Make Payment
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{paying && (
				<div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-md rounded-xl border border-gray-200 shadow-2xl">
						<div className="p-4 border-b border-gray-100 flex items-center justify-between">
							<h3 className="text-sm font-bold text-[#0B1220]">Confirm Payment</h3>
							<button onClick={() => setPaying(null)} className="text-gray-400 hover:text-gray-700">
								<X className="w-4 h-4" />
							</button>
						</div>
						<div className="p-4 text-xs text-gray-600">
							Confirm payment of <span className="font-semibold text-[#0B1220]">{formatCurrency(paying.balance)}</span> for
							<span className="font-semibold text-[#0B1220]"> {paying.invoiceNumber}</span>?
						</div>
						<div className="p-4 pt-0 flex gap-2">
							<Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setPaying(null)}>
								Cancel
							</Button>
							<Button className="flex-1 h-9 text-xs bg-[#008A56] hover:bg-[#007045]" onClick={confirmPayment}>
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
						<Receipt className={`w-3.5 h-3.5 ${color}`} />
					</div>
				</div>
				<div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status }: { status: PortalInvoice["status"] }) {
	const cls =
		status === "paid"
			? "bg-emerald-100 text-emerald-700"
			: status === "overdue"
				? "bg-red-100 text-red-700"
				: "bg-amber-100 text-amber-700";
	return <Badge className={`text-[10px] uppercase font-bold ${cls}`}>{status}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-[92px_1fr] gap-2">
			<div className="text-gray-500">{label}</div>
			<div className="font-semibold text-[#0B1220]">{value}</div>
		</div>
	);
}
