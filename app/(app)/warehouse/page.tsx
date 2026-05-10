"use client";
import { Warehouse } from "lucide-react";
import { PreviewPage } from "@/components/layout/PreviewPage";

export default function WarehousePage() {
  return (
    <PreviewPage
      title="Warehouse Management"
      subtitle="Multi-location inventory, dock scheduling, and cross-docking workflows for 3PL operations."
      icon={Warehouse}
      breadcrumbs={[{ label: "Others" }, { label: "Warehouse" }]}
      features={[
        { title: "Multi-Warehouse Inventory", description: "Real-time stock levels across all depots with bin-level tracking." },
        { title: "Inbound/Outbound Manifests", description: "Generate gate passes, BOLs, and dispatch sheets with barcode scanning." },
        { title: "Dock Scheduling", description: "Slot management for inbound trucks to prevent congestion and idle time." },
        { title: "Cross-Docking", description: "Direct pickup-to-delivery routing without storage to speed up logistics." },
        { title: "Cycle Counting", description: "Scheduled inventory counts with variance reporting and reconciliation." },
        { title: "WMS Integration", description: "API connectors for SAP, Oracle, and major ERP/WMS platforms." },
      ]}
    />
  );
}
