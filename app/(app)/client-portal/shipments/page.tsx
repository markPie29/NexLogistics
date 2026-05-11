"use client";
import { useMemo, useState } from "react";
import { Search, Download, MessageSquare, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientPortalStore, type PortalShipment } from "@/lib/store/client-portal";
import { toast } from "sonner";

export default function ClientPortalShipmentsPage() {
	const shipments = useClientPortalStore((s) => s.shipments);
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | PortalShipment["status"]>("all");
	const [selectedId, setSelectedId] = useState<string | null>(shipments[0]?.id ?? null);

	const filtered = useMemo(() => {
		return shipments.filter((shipment) => {
			const q = query.trim().toLowerCase();
			const byQuery =
				!q ||
				shipment.trackingNumber.toLowerCase().includes(q) ||
				shipment.origin.toLowerCase().includes(q) ||
				shipment.destination.toLowerCase().includes(q) ||
				shipment.cargoType.toLowerCase().includes(q);
			const byStatus = statusFilter === "all" || shipment.status === statusFilter;
			return byQuery && byStatus;
		});
	}, [shipments, query, statusFilter]);

	const selected = filtered.find((s) => s.id === selectedId) ?? filtered[0] ?? null;

	const kpis = useMemo(() => {
		return {
			total: shipments.length,
			inTransit: shipments.filter((s) => s.status === "in_transit").length,
			delivered: shipments.filter((s) => s.status === "delivered").length,
			pending: shipments.filter((s) => s.status === "pending").length,
			exception: shipments.filter((s) => s.status === "exception").length,
		};
	}, [shipments]);

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
				<StatCard label="Total Shipments" value={kpis.total} color="text-blue-600" />
				<StatCard label="In Transit" value={kpis.inTransit} color="text-emerald-600" />
				<StatCard label="Delivered" value={kpis.delivered} color="text-amber-600" />
				<StatCard label="Pending" value={kpis.pending} color="text-violet-600" />
				<StatCard label="Exception" value={kpis.exception} color="text-red-600" />
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
									placeholder="Search by tracking number, origin, destination, or cargo"
								/>
							</div>
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value as "all" | PortalShipment["status"])}
								className="h-9 px-3 rounded-md border border-gray-200 text-xs"
							>
								<option value="all">All Status</option>
								<option value="in_transit">In Transit</option>
								<option value="delivered">Delivered</option>
								<option value="pending">Pending</option>
								<option value="exception">Exception</option>
							</select>
							<Button
								variant="outline"
								className="h-9 text-xs"
								onClick={() => toast.success("Shipment export prepared")}
							>
								<Download className="w-3.5 h-3.5 mr-1.5" /> Export
							</Button>
						</div>

						<div className="overflow-x-auto">
							<table className="w-full text-xs">
								<thead>
									<tr className="text-left border-b border-gray-100 text-gray-600">
										<th className="py-3 px-2">Tracking</th>
										<th className="py-3 px-2">Route</th>
										<th className="py-3 px-2">Mode</th>
										<th className="py-3 px-2">Status</th>
										<th className="py-3 px-2">ETA / Delivered</th>
										<th className="py-3 px-2 text-right">Action</th>
									</tr>
								</thead>
								<tbody>
									{filtered.map((shipment) => (
										<tr
											key={shipment.id}
											onClick={() => setSelectedId(shipment.id)}
											className="border-b border-gray-50 hover:bg-gray-50/70 cursor-pointer"
										>
											<td className="py-3 px-2 font-semibold text-[#0B1220]">{shipment.trackingNumber}</td>
											<td className="py-3 px-2 text-gray-700">
												{shipment.origin} to {shipment.destination}
											</td>
											<td className="py-3 px-2 text-gray-600">Ground</td>
											<td className="py-3 px-2">
												<StatusBadge status={shipment.status} />
											</td>
											<td className="py-3 px-2 text-gray-600">
												{shipment.deliveredAt
													? new Date(shipment.deliveredAt).toLocaleString()
													: new Date(shipment.eta).toLocaleString()}
											</td>
											<td className="py-3 px-2 text-right">
												<Button
													variant="ghost"
													className="h-8 px-2"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedId(shipment.id);
													}}
												>
													View
												</Button>
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
						{!selected && <div className="text-gray-500">Select a shipment to view details.</div>}
						{selected && (
							<div className="space-y-4">
								<div>
									<div className="text-lg font-bold text-[#0B1220]">{selected.trackingNumber}</div>
									<div className="text-gray-500">Reference: PO-{selected.id.replace("sh-", "78")}</div>
								</div>
								<div className="grid grid-cols-2 gap-2">
									<div>
										<div className="text-gray-500">Origin</div>
										<div className="font-semibold text-[#0B1220]">{selected.origin}</div>
									</div>
									<div>
										<div className="text-gray-500">Destination</div>
										<div className="font-semibold text-[#0B1220]">{selected.destination}</div>
									</div>
								</div>
								<DetailRow label="Status" value={selected.status.replaceAll("_", " ")} />
								<DetailRow label="Cargo" value={selected.cargoType} />
								<DetailRow label="Weight" value={`${selected.weightKg.toLocaleString()} kg`} />
								<DetailRow label="Current" value={selected.currentLocation} />
								<DetailRow label="Last Update" value={new Date(selected.lastUpdate).toLocaleString()} />
								<div className="grid grid-cols-2 gap-2 pt-1">
									<Button
										variant="outline"
										className="h-9 text-xs"
										onClick={() => toast.success(`BOL download queued for ${selected.trackingNumber}`)}
									>
										<Download className="w-3.5 h-3.5 mr-1.5" /> Download BOL
									</Button>
									<Button
										className="h-9 text-xs bg-[#008A56] hover:bg-[#007045]"
										onClick={() => toast.success(`Support ticket draft opened for ${selected.trackingNumber}`)}
									>
										<MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Contact Support
									</Button>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
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
						<Truck className={`w-3.5 h-3.5 ${color}`} />
					</div>
				</div>
				<div className={`text-2xl font-extrabold mt-1 ${color}`}>{value}</div>
			</CardContent>
		</Card>
	);
}

function StatusBadge({ status }: { status: PortalShipment["status"] }) {
	const cls =
		status === "delivered"
			? "bg-emerald-100 text-emerald-700"
			: status === "in_transit"
				? "bg-blue-100 text-blue-700"
				: status === "pending"
					? "bg-amber-100 text-amber-700"
					: "bg-red-100 text-red-700";
	return <Badge className={`text-[10px] uppercase font-bold ${cls}`}>{status.replaceAll("_", " ")}</Badge>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-[88px_1fr] gap-2">
			<div className="text-gray-500">{label}</div>
			<div className="font-semibold text-[#0B1220]">{value}</div>
		</div>
	);
}
