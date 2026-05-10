"use client";
import { GitBranch } from "lucide-react";
import { PreviewPage } from "@/components/layout/PreviewPage";

export default function RoutesPage() {
  return (
    <PreviewPage
      title="Route Optimization"
      subtitle="AI-powered multi-stop routing, traffic-aware ETAs, and fuel-efficient path planning."
      icon={GitBranch}
      breadcrumbs={[{ label: "Others" }, { label: "Route Optimization" }]}
      features={[
        { title: "Multi-Stop VRP Solver", description: "Optimize 50+ stops per route with capacity, time-window, and skill constraints." },
        { title: "Real-Time Traffic", description: "Waze and Google Traffic integration for dynamic re-routing on congestion." },
        { title: "Fuel-Efficient Paths", description: "Minimize distance and tolls while respecting truck restrictions and bridges." },
        { title: "Driver Auto-Assignment", description: "Match trips to drivers based on proximity, skills, and current load." },
        { title: "What-If Simulations", description: "Compare scenarios before publishing routes to drivers in the field." },
        { title: "Heat Maps", description: "Visualize delivery density and identify under-served zones for expansion." },
      ]}
    />
  );
}
