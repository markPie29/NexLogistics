import type { VehicleProfitability } from "./types";

function escapeCSV(val: string | number | null): string {
  if (val === null) return "N/A";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateProfitCenterCSV(data: VehicleProfitability[]): string {
  const headers = [
    "Vehicle Plate",
    "Vehicle Type",
    "Revenue",
    "Fuel Cost",
    "Maintenance Cost",
    "Driver Pay",
    "Helper Fees",
    "Other Costs",
    "Total Expenses",
    "Net Profit/Loss",
    "Margin (%)",
  ];

  const rows = data.map((v) => [
    escapeCSV(v.plate),
    escapeCSV(v.type),
    v.revenue.toFixed(2),
    v.fuelCost.toFixed(2),
    v.maintenanceCost.toFixed(2),
    v.driverPay.toFixed(2),
    v.helperFees.toFixed(2),
    v.otherCosts.toFixed(2),
    v.totalExpenses.toFixed(2),
    v.netProfit.toFixed(2),
    v.margin !== null ? v.margin.toFixed(1) : "N/A",
  ]);

  // Summary row
  const totalRevenue = data.reduce((s, v) => s + v.revenue, 0);
  const totalFuel = data.reduce((s, v) => s + v.fuelCost, 0);
  const totalMaint = data.reduce((s, v) => s + v.maintenanceCost, 0);
  const totalDriver = data.reduce((s, v) => s + v.driverPay, 0);
  const totalHelper = data.reduce((s, v) => s + v.helperFees, 0);
  const totalOther = data.reduce((s, v) => s + v.otherCosts, 0);
  const totalExpenses = data.reduce((s, v) => s + v.totalExpenses, 0);
  const netProfit = totalRevenue - totalExpenses;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "N/A";

  const summary = [
    "FLEET TOTAL",
    "",
    totalRevenue.toFixed(2),
    totalFuel.toFixed(2),
    totalMaint.toFixed(2),
    totalDriver.toFixed(2),
    totalHelper.toFixed(2),
    totalOther.toFixed(2),
    totalExpenses.toFixed(2),
    netProfit.toFixed(2),
    String(margin),
  ];

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(",")), summary.join(",")].join(
    "\n"
  );

  return csvContent;
}

export function downloadCSV(csvContent: string): void {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const filename = `profit-center-${dateStr}.csv`;

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
