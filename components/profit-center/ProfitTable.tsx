"use client";

import { useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";
import type { VehicleProfitability, SortColumn, SortDirection } from "@/lib/profit-center/types";
import {
  sortVehicleData,
  searchVehicleData,
  paginateData,
  getTotalPages,
} from "@/lib/profit-center/computations";

interface ProfitTableProps {
  data: VehicleProfitability[];
  onVehicleClick: (vehicleId: string) => void;
}

const COLUMNS: { key: SortColumn; label: string; hideOnMobile?: boolean }[] = [
  { key: "plate", label: "Vehicle" },
  { key: "revenue", label: "Revenue" },
  { key: "fuelCost", label: "Fuel", hideOnMobile: true },
  { key: "maintenanceCost", label: "Maint.", hideOnMobile: true },
  { key: "driverPay", label: "Driver", hideOnMobile: true },
  { key: "helperFees", label: "Helper", hideOnMobile: true },
  { key: "otherCosts", label: "Other", hideOnMobile: true },
  { key: "totalExpenses", label: "Expenses" },
  { key: "netProfit", label: "Net P/L" },
  { key: "margin", label: "Margin" },
];

export function ProfitTable({ data, onVehicleClick }: ProfitTableProps) {
  const [sortCol, setSortCol] = useState<SortColumn>("netProfit");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filtered = searchVehicleData(data, search);
  const sorted = sortVehicleData(filtered, sortCol, sortDir);
  const totalPages = getTotalPages(sorted.length, pageSize);
  const pageData = paginateData(sorted, page, pageSize);

  // Summary totals
  const totals = {
    revenue: data.reduce((s, v) => s + v.revenue, 0),
    fuelCost: data.reduce((s, v) => s + v.fuelCost, 0),
    maintenanceCost: data.reduce((s, v) => s + v.maintenanceCost, 0),
    driverPay: data.reduce((s, v) => s + v.driverPay, 0),
    helperFees: data.reduce((s, v) => s + v.helperFees, 0),
    otherCosts: data.reduce((s, v) => s + v.otherCosts, 0),
    totalExpenses: data.reduce((s, v) => s + v.totalExpenses, 0),
    netProfit: data.reduce((s, v) => s + v.netProfit, 0),
  };
  const totalMargin =
    totals.revenue > 0
      ? Math.round(((totals.netProfit / totals.revenue) * 100) * 10) / 10
      : null;

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: SortColumn }) => {
    if (sortCol !== col) return <ChevronsUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const getMarginBadge = (margin: number | null) => {
    if (margin === null) return <Badge variant="neutral">N/A</Badge>;
    if (margin > 20) return <Badge variant="success">{margin.toFixed(1)}%</Badge>;
    if (margin >= 0) return <Badge variant="warning">{margin.toFixed(1)}%</Badge>;
    return <Badge variant="danger">{margin.toFixed(1)}%</Badge>;
  };

  return (
    <Card className="border-brand-border shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-white/5">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search plate number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows:</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "py-3 px-3 font-semibold cursor-pointer hover:text-brand-navy select-none whitespace-nowrap",
                    col.hideOnMobile && "hidden lg:table-cell"
                  )}
                  scope="col"
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {pageData.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="py-12 text-center text-muted-foreground">
                  No vehicles found for the selected period.
                </td>
              </tr>
            )}
            {pageData.map((v) => (
              <tr
                key={v.vehicleId}
                className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => onVehicleClick(v.vehicleId)}
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") onVehicleClick(v.vehicleId); }}
              >
                <td className="py-3 px-3">
                  <div className="font-bold text-brand-navy dark:text-white">{v.plate}</div>
                  <div className="text-xs text-muted-foreground">{v.type}</div>
                </td>
                <td className="py-3 px-3 font-medium">{formatCurrency(v.revenue)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(v.fuelCost)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(v.maintenanceCost)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(v.driverPay)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(v.helperFees)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(v.otherCosts)}</td>
                <td className="py-3 px-3 font-medium">{formatCurrency(v.totalExpenses)}</td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      "font-bold",
                      v.netProfit >= 0 ? "text-emerald-600" : "text-red-500"
                    )}
                  >
                    {v.netProfit >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(v.netProfit))}
                  </span>
                </td>
                <td className="py-3 px-3">{getMarginBadge(v.margin)}</td>
              </tr>
            ))}
          </tbody>
          {/* Footer totals */}
          {pageData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 dark:bg-white/[0.03] border-t-2 border-brand-border font-bold text-sm">
                <td className="py-3 px-3 text-brand-navy dark:text-white">Fleet Total</td>
                <td className="py-3 px-3">{formatCurrency(totals.revenue)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(totals.fuelCost)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(totals.maintenanceCost)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(totals.driverPay)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(totals.helperFees)}</td>
                <td className="py-3 px-3 hidden lg:table-cell">{formatCurrency(totals.otherCosts)}</td>
                <td className="py-3 px-3">{formatCurrency(totals.totalExpenses)}</td>
                <td className="py-3 px-3">
                  <span className={totals.netProfit >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {totals.netProfit >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(totals.netProfit))}
                  </span>
                </td>
                <td className="py-3 px-3">{getMarginBadge(totalMargin)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
        {pageData.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No vehicles found for the selected period.
          </div>
        )}
        {pageData.map((v) => (
          <div
            key={v.vehicleId}
            className="p-4 hover:bg-gray-50/50 cursor-pointer"
            onClick={() => onVehicleClick(v.vehicleId)}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-bold text-brand-navy dark:text-white">{v.plate}</span>
                <span className="text-xs text-muted-foreground ml-2">{v.type}</span>
              </div>
              {getMarginBadge(v.margin)}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Revenue</span>
                <div className="font-semibold">{formatCurrency(v.revenue)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Expenses</span>
                <div className="font-semibold">{formatCurrency(v.totalExpenses)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Net P/L</span>
                <div className={cn("font-bold", v.netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                  {v.netProfit >= 0 ? "+" : "−"}{formatCurrency(Math.abs(v.netProfit))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5">
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} ({sorted.length} vehicles)
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
