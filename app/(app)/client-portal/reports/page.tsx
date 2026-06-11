"use client";

import { useMemo, useState } from "react";
import { FileBarChart2, Package, Clock3, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useClientTrips, useClientInvoices } from "@/lib/hooks/client-portal";
import { computeOnTimeRate, computeTopLanes } from "@/lib/utils/client-portal";
import { useClientPortalStore } from "@/lib/store/client-portal";
import { formatCurrency } from "@/lib/utils";

export default function ClientPortalReportsPage() {
  const { trips } = useClientTrips();
  const { invoices } = useClientInvoices();
  const exports = useClientPortalStore((s) => s.exports);
  const addReportExport = useClientPortalStore((s) => s.addReportExport);

  const [exportFormat, setExportFormat] = useState<"CSV" | "PDF">("PDF");

  // KPI computations
  const totalShipments = trips.length;
  const onTimeRate = useMemo(() => computeOnTimeRate(trips as any), [trips]);
  const totalSpend = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    [invoices]
  );

  // Top Lanes
  const topLanes = useMemo(() => computeTopLanes(trips as any), [trips]);

  const handleExport = () => {
    addReportExport("Client Performance Report", exportFormat);
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Shipments</p>
              <Package className="h-5 w-5 text-brand-teal" />
            </div>
            <p className="text-3xl font-extrabold text-brand-navy mt-2">
              {totalShipments}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                On-Time Delivery Rate
              </p>
              <Clock3 className="h-5 w-5 text-brand-teal" />
            </div>
            <p className="text-3xl font-extrabold text-brand-navy mt-2">
              {onTimeRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Spend</p>
              <Wallet className="h-5 w-5 text-brand-teal" />
            </div>
            <p className="text-3xl font-extrabold text-brand-navy mt-2">
              {formatCurrency(totalSpend)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Lanes Table */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-4">Top Lanes</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4 py-3 text-xs">Route</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-xs">Shipment Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topLanes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-6">
                    No lane data available.
                  </TableCell>
                </TableRow>
              ) : (
                topLanes.map((lane) => (
                  <TableRow key={lane.route} className="h-12">
                    <TableCell className="px-4 py-3 text-sm font-medium">{lane.route}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{lane.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export Report Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-4">
            Export Report
          </h2>
          <div className="flex items-center gap-4">
            <Select
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as "CSV" | "PDF")}
            >
              <SelectTrigger className="w-[140px] focus-visible:ring-2 focus-visible:ring-brand-teal">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CSV">CSV</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              className="bg-brand-teal hover:bg-brand-teal-dark text-white focus-visible:ring-2 focus-visible:ring-brand-teal"
            >
              <FileBarChart2 className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export History Table */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-brand-navy mb-4">
            Export History
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4 py-3 text-xs">Report Name</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-xs">Format</TableHead>
                <TableHead scope="col" className="px-4 py-3 text-xs">Generated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    No exports yet.
                  </TableCell>
                </TableRow>
              ) : (
                exports.map((exp) => (
                  <TableRow key={exp.id} className="h-12">
                    <TableCell className="px-4 py-3 text-sm font-medium">
                      {exp.reportName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{exp.format}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {new Date(exp.generatedAt).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
