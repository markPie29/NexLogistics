"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateProfitCenterCSV, downloadCSV } from "@/lib/profit-center/export-csv";
import type { VehicleProfitability } from "@/lib/profit-center/types";

interface ExportButtonProps {
  data: VehicleProfitability[];
}

export function ExportButton({ data }: ExportButtonProps) {
  const handleExport = () => {
    const vehiclesWithData = data.filter((v) => v.tripCount > 0 || v.totalExpenses > 0);

    if (vehiclesWithData.length === 0) {
      toast.info("No data to export for the selected period");
      return;
    }

    const csv = generateProfitCenterCSV(vehiclesWithData);
    downloadCSV(csv);
    toast.success("Profitability report exported successfully", { duration: 5000 });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-9 gap-2"
      onClick={handleExport}
      aria-label="Export profitability data as CSV"
    >
      <Download className="w-4 h-4" />
      Export
    </Button>
  );
}
