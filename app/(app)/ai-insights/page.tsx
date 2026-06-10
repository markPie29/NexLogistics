"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap, Brain,
  Send, X, Loader2, Fuel, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUiStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import type { AiInsight } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  richContent?: React.ReactNode;
  timestamp: Date;
}

// ─── Severity Styles ───────────────────────────────────────────────────────────
const SEVERITY_STYLES: Record<AiInsight["severity"], { bg: string; text: string; icon: any; label: string }> = {
  positive: { bg: "bg-emerald-50", text: "text-emerald-700", icon: TrendingUp, label: "Opportunity" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle, label: "Warning" },
  critical: { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle, label: "Critical" },
  info: { bg: "bg-sky-50", text: "text-sky-700", icon: Lightbulb, label: "Info" },
};

// ─── Suggestion Chips ──────────────────────────────────────────────────────────
const SUGGESTION_CHIPS = [
  "📊 Show fuel efficiency report",
  "👨‍✈️ Which driver needs attention?",
  "🚛 Route optimization for today",
  "🔧 Predict maintenance needs",
  "💰 Fleet profit analysis",
  "📈 Cost reduction opportunities",
  "⚠️ Driver safety scores",
  "⏱️ Delivery time predictions",
];

// ─── Pre-loaded Sample Conversation ────────────────────────────────────────────
function buildPreloadedGreeting(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy">Good morning! I&apos;ve completed your overnight fleet analysis. Here&apos;s what I found:</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-amber-500">🔧</span>
          <span><span className="font-bold">3 vehicles</span> need attention</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-500">⛽</span>
          <span>Fuel costs are <span className="font-bold text-emerald-600">trending down 4%</span> this week</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand-teal">⭐</span>
          <span>Mark Santos has maintained a <span className="font-bold">96% on-time streak</span></span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">What would you like to explore?</p>
    </div>
  );
}

function buildPreloadedFuelResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">**Fleet Fuel Analysis (This Quarter)**</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">•</span>
          <span>Average fleet cost: <span className="font-bold text-brand-navy">₱6.2/km</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-500">•</span>
          <span>Best performer: <VehicleBadge plate="NEX-109" /> at <span className="font-bold text-emerald-600">₱5.1/km</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-500">•</span>
          <span>Needs attention: <VehicleBadge plate="NEX-104" /> at <span className="font-bold text-red-600">₱7.8/km</span> (+26% above average)</span>
        </div>
      </div>
      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100 mt-2">
        <p className="text-xs font-bold text-amber-800 mb-1">💡 Recommendation:</p>
        <p className="text-xs text-amber-700">Schedule ECU diagnostic for NEX-104 and consider driver coaching on fuel-efficient driving techniques.</p>
        <p className="text-xs font-medium text-emerald-700 mt-1">Estimated savings: ₱18,000/month</p>
      </div>
    </div>
  );
}

const PRELOADED_MESSAGES: ChatMessage[] = [
  {
    id: "preload-ai-1",
    role: "ai",
    content: "greeting",
    richContent: buildPreloadedGreeting(),
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "preload-user-1",
    role: "user",
    content: "Tell me about fuel efficiency",
    timestamp: new Date(Date.now() - 240000),
  },
  {
    id: "preload-ai-2",
    role: "ai",
    content: "fuel-analysis",
    richContent: buildPreloadedFuelResponse(),
    timestamp: new Date(Date.now() - 200000),
  },
];

// ─── Generated Insights (sidebar) ─────────────────────────────────────────────
const SIDEBAR_INSIGHTS: AiInsight[] = [
  { id: "side-001", category: "fuel", severity: "warning", title: "NEX-107 diesel consumption anomaly", description: "Vehicle averaging ₱7.3/km — 18% above fleet mean. Possible injector issue.", confidence: 87, affectedEntity: "NEX-107" },
  { id: "side-002", category: "route", severity: "positive", title: "SLEX corridor efficiency improved", description: "New departure schedule reducing average transit by 22 minutes.", confidence: 91, affectedEntity: "SLEX Corridor" },
  { id: "side-003", category: "maintenance", severity: "critical", title: "NEX-107 tire tread below DOTr minimum", description: "Dispatch blocked until replacement. Estimated cost: ₱12,800.", confidence: 97, affectedEntity: "NEX-107" },
  { id: "side-004", category: "driver", severity: "warning", title: "Edwin Ramos fatigue pattern detected", description: "3 consecutive days exceeding 10hr driving. Mandatory rest recommended.", confidence: 84, affectedEntity: "Edwin Ramos" },
  { id: "side-005", category: "cost", severity: "positive", title: "Batched corridor dispatch opportunity", description: "Grouping 4 Laguna-bound trips saves ₱38K/month in fuel and labor.", confidence: 89, affectedEntity: "Laguna Route" },
];

// ─── Rich Response Builders ────────────────────────────────────────────────────
function buildFleetResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">Here&apos;s your fleet performance summary for Q2 2026:</p>
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Active Vehicles" value="9" color="text-brand-teal" />
        <MiniStat label="Revenue" value="₱442,600" color="text-emerald-600" />
        <MiniStat label="Profit Margin" value="80%" color="text-emerald-600" />
        <MiniStat label="Delivery Success" value="96%" color="text-brand-teal" />
      </div>
      <div className="space-y-1.5 mt-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-600">▲</span>
          <span>Top vehicle: <VehicleBadge plate="NEX-109" /> — ₱38,500/trip avg</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-red-500">▼</span>
          <span>Underperformer: <VehicleBadge plate="NEX-108" /> — ₱7,400/trip avg</span>
        </div>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-2">
        <p className="text-xs font-bold text-sky-800 mb-1">📊 Industry Comparison:</p>
        <p className="text-xs text-sky-700">Fleet is performing <span className="font-bold">12% above</span> industry average. Consider reassigning NEX-108 to higher-margin corridors for an estimated ₱24,000/month uplift.</p>
      </div>
    </div>
  );
}

function buildFuelResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">⛽ Fuel Anomaly Report — 2 vehicles flagged:</p>
      <div className="space-y-2">
        <div className="p-2.5 bg-red-50 rounded-lg border border-red-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-red-700"><VehicleBadge plate="NEX-104" /> — <span className="font-bold">22% above average</span></span>
            <Badge className="bg-red-100 text-red-700 border-0 text-xs">Critical</Badge>
          </div>
          <p className="text-xs text-red-600 mt-1">₱7.3/km consumption rate | Fleet avg: ₱5.8/km</p>
        </div>
        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-700"><VehicleBadge plate="NEX-107" /> — <span className="font-bold">18% above average</span></span>
            <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Warning</Badge>
          </div>
          <p className="text-xs text-amber-600 mt-1">₱6.9/km consumption rate | Fleet avg: ₱5.8/km</p>
        </div>
      </div>
      <div className="mt-2 p-2.5 bg-sky-50 rounded-lg border border-sky-100">
        <p className="text-xs font-bold text-sky-800 mb-1">💡 Recommendations:</p>
        <ul className="text-xs text-sky-700 space-y-0.5 list-disc list-inside">
          <li>Schedule ECU diagnostic for both vehicles</li>
          <li>Enroll drivers in fuel efficiency coaching program</li>
          <li>Check tire pressure alignment (contributes to 8% excess)</li>
          <li>Consider route reassignment to flatter terrain corridors</li>
        </ul>
        <p className="text-xs font-medium text-emerald-700 mt-1.5">Estimated monthly savings: ₱32,000</p>
      </div>
    </div>
  );
}

function buildRouteResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">🚛 Optimized Route Plan for Today:</p>
      <div className="space-y-1.5">
        <RouteRow time="04:00" route="Manila → Pampanga" trips={3} revenue="₱67,500" />
        <RouteRow time="05:30" route="Cavite → Laguna" trips={2} revenue="₱38,000" />
        <RouteRow time="03:00" route="Batangas → Quezon City" trips={1} revenue="₱19,500" />
      </div>
      <div className="p-2 bg-emerald-50 rounded-lg mt-2">
        <p className="text-sm font-medium text-emerald-700">Total Estimated Revenue: <span className="font-bold">₱125,000</span></p>
      </div>
      <div className="p-2 bg-amber-50 rounded-lg flex items-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs text-amber-700">Avoid EDSA corridor 07:00–09:00 (average 38-min delay)</p>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-1">
        <p className="text-xs font-bold text-sky-800 mb-1">⚡ Optimization Applied:</p>
        <p className="text-xs text-sky-700">By batching Laguna-bound deliveries and shifting Pampanga departures 30 min earlier, estimated <span className="font-bold">₱12,400 savings</span> in fuel and overtime costs.</p>
      </div>
    </div>
  );
}

function buildDriverResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">👨‍✈️ Driver Safety & Performance Scores:</p>
      <div className="space-y-1.5">
        <DriverRow rank={1} name="Mark Santos" onTime="96%" rating="4.8★" status="excellent" />
        <DriverRow rank={2} name="Allan Reyes" onTime="94%" rating="4.6★" status="excellent" />
        <DriverRow rank={3} name="John Cruz" onTime="91%" rating="4.5★" status="good" />
      </div>
      <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 mt-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span className="text-sm font-medium text-red-700">⚠️ Driver Needing Attention: Edwin Ramos</span>
        </div>
        <p className="text-xs text-red-600 mt-1">3 consecutive days exceeding 10hr driving time. Safety score dropped to 72%. Mandatory rest period recommended per DOTr compliance.</p>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-1">
        <p className="text-xs font-bold text-sky-800 mb-1">📋 Action Items:</p>
        <ul className="text-xs text-sky-700 space-y-0.5 list-disc list-inside">
          <li>Schedule mandatory rest day for Edwin Ramos (tomorrow)</li>
          <li>Review overtime policy adherence fleet-wide</li>
          <li>Consider performance bonus for Mark Santos (3rd consecutive month top rated)</li>
        </ul>
      </div>
    </div>
  );
}

function buildMaintenanceResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">🔧 Predictive Maintenance Report — 3 Critical, 2 Upcoming:</p>
      <div className="space-y-1.5">
        <MaintenanceRow vehicle="NEX-107" item="Tire replacement (front axle)" urgency="IMMEDIATE" cost="₱12,800" />
        <MaintenanceRow vehicle="NEX-104" item="Reefer compressor service" urgency="7 days" cost="₱8,400" />
        <MaintenanceRow vehicle="NEX-110" item="Registration renewal (LTO)" urgency="14 days" cost="₱10,000" />
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-2">
        <p className="text-sm text-sky-700">Estimated total cost: <span className="font-bold">₱31,200</span></p>
      </div>
      <div className="mt-2">
        <p className="text-xs font-medium text-brand-navy mb-1">📅 Predicted (next 30 days):</p>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
          <li><VehicleBadge plate="NEX-102" /> — Brake pad replacement (est. 21 days)</li>
          <li><VehicleBadge plate="NEX-105" /> — Transmission fluid change (est. 28 days)</li>
          <li><VehicleBadge plate="NEX-109" /> — Oil change due at 45,000 km (est. 18 days)</li>
        </ul>
      </div>
      <div className="p-2 bg-emerald-50 rounded-lg mt-1">
        <p className="text-xs text-emerald-700">💡 <span className="font-bold">Tip:</span> Scheduling NEX-107 and NEX-104 together at Manila depot saves ₱2,800 in logistics and downtime costs.</p>
      </div>
    </div>
  );
}

function buildProfitResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">💰 Fleet Profit Analysis (Q2 2026):</p>
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Gross Revenue" value="₱442,600" color="text-emerald-600" />
        <MiniStat label="Total Expenses" value="₱88,430" color="text-red-500" />
        <MiniStat label="Net Profit" value="₱354,170" color="text-emerald-600" />
        <MiniStat label="Profit Margin" value="80%" color="text-brand-teal" />
      </div>
      <div className="space-y-1.5 mt-2">
        <p className="text-xs font-bold text-brand-navy">Revenue by Corridor:</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-600">▲</span>
          <span>Manila–Pampanga: <span className="font-bold">₱187,500</span> (42%)</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-emerald-600">▲</span>
          <span>Cavite–Laguna: <span className="font-bold">₱128,000</span> (29%)</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand-teal">→</span>
          <span>Batangas–QC: <span className="font-bold">₱127,100</span> (29%)</span>
        </div>
      </div>
      <div className="p-2 bg-amber-50 rounded-lg mt-2 flex items-center gap-2">
        <Fuel className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs text-amber-700">Fuel accounts for <span className="font-bold">76.7%</span> of total expenses (₱67,830)</p>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg">
        <p className="text-xs text-sky-700">💡 <span className="font-bold">Growth opportunity:</span> Adding 1 vehicle on Manila–Pampanga could yield ₱62,500/month additional revenue at current demand levels.</p>
      </div>
    </div>
  );
}

function buildCostResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">📈 Cost Reduction Opportunities Identified:</p>
      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 mb-2">
        <p className="text-sm font-bold text-emerald-700">Total Potential Savings: ₱248K/month</p>
        <p className="text-xs text-emerald-600 mt-0.5">Based on analysis of 47 trips, 9 vehicles, and 12 drivers</p>
      </div>
      <div className="space-y-1.5">
        <SavingRow label="Route optimization (batch Laguna trips)" amount="₱126K" pct="51%" />
        <SavingRow label="Fuel efficiency training (3 drivers)" amount="₱54K" pct="22%" />
        <SavingRow label="Batched corridor dispatch" amount="₱38K" pct="15%" />
        <SavingRow label="Weekend overtime reduction" amount="₱30K" pct="12%" />
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-2">
        <p className="text-xs font-bold text-sky-800 mb-1">📋 Implementation Plan:</p>
        <ul className="text-xs text-sky-700 space-y-0.5 list-disc list-inside">
          <li>Week 1: Implement batched Laguna dispatch (immediate ₱38K/mo)</li>
          <li>Week 2: Enroll drivers in fuel coaching (₱54K/mo in 30 days)</li>
          <li>Week 3-4: Route optimization rollout (₱126K/mo full effect)</li>
        </ul>
        <p className="text-xs font-medium text-emerald-700 mt-1.5">ROI timeline: <span className="font-bold">2–4 weeks</span> for full implementation</p>
      </div>
    </div>
  );
}

function buildSafetyResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">⚠️ Driver Safety Scores (Fleet Average: 84/100):</p>
      <div className="space-y-1.5">
        <DriverRow rank={1} name="Mark Santos" onTime="96%" rating="92/100" status="excellent" />
        <DriverRow rank={2} name="Allan Reyes" onTime="94%" rating="89/100" status="excellent" />
        <DriverRow rank={3} name="John Cruz" onTime="91%" rating="85/100" status="good" />
      </div>
      <div className="p-2.5 bg-red-50 rounded-lg border border-red-100 mt-2">
        <p className="text-xs font-bold text-red-700 mb-1">⚠️ Drivers Below Safety Threshold (80/100):</p>
        <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
          <li>Edwin Ramos — 72/100 (fatigue violations, 3 consecutive days &gt; 10hr)</li>
          <li>Roberto Villanueva — 76/100 (2 hard-braking events this week)</li>
        </ul>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg mt-1">
        <p className="text-xs font-bold text-sky-800 mb-1">📋 Safety Actions Required:</p>
        <ul className="text-xs text-sky-700 space-y-0.5 list-disc list-inside">
          <li>Mandatory rest day for Edwin Ramos (DOTr compliance)</li>
          <li>Defensive driving refresher for Roberto Villanueva</li>
          <li>Fleet-wide safety briefing scheduled for Monday 7:00 AM</li>
        </ul>
      </div>
    </div>
  );
}

function buildDeliveryPredictionResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy font-medium">⏱️ Delivery Time Predictions (Today):</p>
      <div className="space-y-1.5">
        <div className="p-2 bg-white rounded-lg border text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">04:30</span>
            <span className="font-medium text-brand-navy">Manila → Pampanga</span>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">On Time (ETA 06:45)</Badge>
        </div>
        <div className="p-2 bg-white rounded-lg border text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">05:30</span>
            <span className="font-medium text-brand-navy">Cavite → Laguna</span>
          </div>
          <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[10px]">On Time (ETA 07:15)</Badge>
        </div>
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">07:00</span>
            <span className="font-medium text-amber-700">Makati → Quezon City</span>
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">Delayed +25min</Badge>
        </div>
      </div>
      <div className="p-2 bg-amber-50 rounded-lg flex items-center gap-2 mt-1">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <p className="text-xs text-amber-700">EDSA congestion predicted 07:00–09:30. Recommend NLEX bypass for northbound trips.</p>
      </div>
      <div className="p-2 bg-sky-50 rounded-lg">
        <p className="text-xs text-sky-700">📊 <span className="font-bold">Weekly prediction accuracy:</span> 91.4% (based on 47 deliveries)</p>
      </div>
    </div>
  );
}

function buildDefaultResponse(): React.ReactNode {
  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-navy">I analyzed your fleet data across <span className="font-bold">9 active vehicles</span>. Here&apos;s a quick overview:</p>
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Revenue (Q2)" value="₱442,600" color="text-emerald-600" />
        <MiniStat label="Profit Margin" value="80%" color="text-brand-teal" />
        <MiniStat label="Maintenance Due" value="3 items" color="text-amber-600" />
        <MiniStat label="Safety Score" value="84/100" color="text-brand-teal" />
      </div>
      <p className="text-xs text-muted-foreground">What would you like to explore further? Try asking about fuel efficiency, route optimization, driver safety, or maintenance predictions.</p>
    </div>
  );
}

function buildDeepAnalysisReport(): React.ReactNode {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">Deep Analysis Complete</span>
        </div>
        <p className="text-xs text-emerald-600">Scanned 9 vehicles, 47 trips, 12 drivers — 5 actionable findings</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Revenue" value="₱442,600" color="text-emerald-600" />
        <MiniStat label="Expenses" value="₱88,430" color="text-red-500" />
        <MiniStat label="Profit Margin" value="80%" color="text-brand-teal" />
        <MiniStat label="Safety Score" value="84/100" color="text-brand-navy" />
      </div>
      <div className="mt-2 space-y-2">
        <p className="text-xs font-bold text-brand-navy">🎯 Categorized Findings:</p>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Safety & Compliance</p>
          <FindingRow severity="critical" text="NEX-107 tires below DOTr minimum — dispatch blocked" />
          <FindingRow severity="warning" text="Edwin Ramos fatigue pattern — 3 days exceeding 10hr" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Operational Efficiency</p>
          <FindingRow severity="critical" text="Manila→Pampanga route avg 38min delay — reroute via NLEX" />
          <FindingRow severity="warning" text="NEX-104 fuel 22% above fleet average — ECU diagnostic required" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Growth Opportunities</p>
          <FindingRow severity="positive" text="Batched Laguna dispatch can save ₱38K/month" />
        </div>
      </div>
      <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100 mt-2">
        <p className="text-xs font-bold text-sky-800 mb-1">📋 Recommended Action Items:</p>
        <ul className="text-xs text-sky-700 space-y-0.5 list-disc list-inside">
          <li>Replace NEX-107 front tires immediately (₱12,800)</li>
          <li>Enforce mandatory rest for Edwin Ramos</li>
          <li>Schedule ECU diagnostic for NEX-104</li>
          <li>Implement batched Laguna dispatch starting Monday</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Response Matcher ──────────────────────────────────────────────────────────
function getAiResponse(query: string): { content: string; richContent: React.ReactNode } {
  const q = query.toLowerCase();
  if (q.includes("fleet") || q.includes("performing") || q.includes("performance")) {
    return { content: "fleet", richContent: buildFleetResponse() };
  }
  if (q.includes("fuel") || q.includes("anomal") || q.includes("consumption") || q.includes("efficiency report")) {
    return { content: "fuel", richContent: buildFuelResponse() };
  }
  if (q.includes("route") || q.includes("optimization") || q.includes("deliver")) {
    return { content: "route", richContent: buildRouteResponse() };
  }
  if (q.includes("driver") || q.includes("attention") || q.includes("who")) {
    return { content: "driver", richContent: buildDriverResponse() };
  }
  if (q.includes("maintenance") || q.includes("predict") || q.includes("pms")) {
    return { content: "maintenance", richContent: buildMaintenanceResponse() };
  }
  if (q.includes("profit") || q.includes("margin") || q.includes("money")) {
    return { content: "profit", richContent: buildProfitResponse() };
  }
  if (q.includes("cost") || q.includes("saving") || q.includes("reduction") || q.includes("opportunit")) {
    return { content: "cost", richContent: buildCostResponse() };
  }
  if (q.includes("safety") || q.includes("score")) {
    return { content: "safety", richContent: buildSafetyResponse() };
  }
  if (q.includes("time") || q.includes("prediction") || q.includes("eta") || q.includes("delivery time")) {
    return { content: "delivery", richContent: buildDeliveryPredictionResponse() };
  }
  return { content: "default", richContent: buildDefaultResponse() };
}

// ─── Deep Analysis Steps ───────────────────────────────────────────────────────
const ANALYSIS_STEPS = [
  "Scanning fleet data...",
  "Analyzing patterns...",
  "Generating recommendations...",
  "Complete!",
];

// ─── Action Responses ──────────────────────────────────────────────────────────
const ACTION_RESPONSES: Record<string, string> = {
  fuel: "Scheduled ECU diagnostic for affected vehicle",
  driver: "Flagged driver for performance review meeting",
  maintenance: "Scheduled maintenance service appointment",
  route: "Flagged route for optimization review",
  cost: "Sent cost report to finance team for review",
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function AiInsightsPage() {
  const storeInsights = useUiStore((s) => s.insights);
  const [sidebarInsights] = useState<AiInsight[]>([...SIDEBAR_INSIGHTS, ...storeInsights]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ChatMessage[]>(PRELOADED_MESSAGES);
  const [query, setQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const visibleInsights = sidebarInsights.filter((i) => !dismissedIds.has(i.id));

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Send a message and get AI response
  const sendMessage = useCallback((text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsThinking(true);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const { content, richContent } = getAiResponse(text);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "ai",
        content,
        richContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsThinking(false);
    }, delay);
  }, []);

  const handleSend = useCallback(() => {
    if (!query.trim()) return;
    sendMessage(query.trim());
  }, [query, sendMessage]);

  const handleChipClick = useCallback((chip: string) => {
    sendMessage(chip);
  }, [sendMessage]);

  // Deep Analysis with progress stepper
  const handleRunAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    const stepDuration = 1000;
    for (let i = 1; i <= ANALYSIS_STEPS.length; i++) {
      setTimeout(() => {
        setAnalysisStep(i);
        if (i === ANALYSIS_STEPS.length) {
          setTimeout(() => {
            const aiMsg: ChatMessage = {
              id: `analysis-${Date.now()}`,
              role: "ai",
              content: "deep-analysis",
              richContent: buildDeepAnalysisReport(),
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, aiMsg]);
            setIsAnalyzing(false);
            setAnalysisStep(0);
            toast.success("Deep analysis complete", { description: "5 actionable findings generated across 3 categories" });
          }, 400);
        }
      }, stepDuration * i);
    }
  }, []);

  const handleTakeAction = useCallback((insight: AiInsight) => {
    const response = ACTION_RESPONSES[insight.category] || "Action queued for review";
    toast.success("Action Taken", { description: `${response} — ${insight.affectedEntity || insight.title}` });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="Predictive analytics and actionable recommendations powered by NexAI"
        breadcrumbs={[{ label: "Reports" }, { label: "AI Insights" }]}
      />

      {/* Hero Stats Bar */}
      <Card className="bg-gradient-to-r from-brand-navy to-brand-teal-dark text-white border-0">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand-teal" />
            </div>
            <div>
              <h2 className="text-lg font-bold">NexAI Intelligence Assistant</h2>
              <p className="text-xs text-white/70">Fleet performing 12% above industry average</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <HeroStat label="Predicted Savings" value="₱248K" />
            <HeroStat label="Model Accuracy" value="94%" />
            <HeroStat label="Active Vehicles" value="9" />
            <Button
              className="bg-white text-brand-navy hover:bg-white/90 text-sm"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              size="sm"
            >
              {isAnalyzing ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Analyzing...</> : <><Zap className="w-3.5 h-3.5 mr-1" /> Run Deep Analysis</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deep Analysis Progress Stepper */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-brand-teal/30 bg-brand-teal/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-teal" />
                  <span className="text-sm font-medium text-brand-navy">Running Deep Analysis...</span>
                </div>
                <div className="space-y-2">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i < analysisStep ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : i === analysisStep ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-gray-300" />
                      )}
                      <span className={`text-xs ${i < analysisStep ? "text-emerald-600 font-medium" : i === analysisStep ? "text-brand-teal font-medium" : "text-muted-foreground"}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress value={(analysisStep / ANALYSIS_STEPS.length) * 100} className="mt-3" />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content: Chat + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Chat Interface (60%) */}
        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                Chat with NexAI
                <Badge variant="neutral" className="bg-emerald-50 text-emerald-700 border-0 text-[10px] ml-auto">Online</Badge>
              </CardTitle>
            </CardHeader>

            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-brand-navy text-white rounded-br-md"
                        : "bg-gray-50 border border-gray-100 rounded-bl-md"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm">{msg.content}</p>
                      ) : (
                        <div>{msg.richContent}</div>
                      )}
                      <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-white/50" : "text-muted-foreground"}`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex justify-start"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-teal to-brand-navy flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>

            {/* Suggestion Chips + Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="px-2.5 py-1.5 text-[11px] bg-gray-50 hover:bg-brand-teal/10 border border-gray-200 hover:border-brand-teal/30 rounded-full text-brand-navy transition-colors whitespace-nowrap shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about your fleet..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1"
                  disabled={isThinking}
                />
                <Button onClick={handleSend} disabled={isThinking || !query.trim()} size="sm" className="bg-brand-navy hover:bg-brand-navy/90">
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Insight Feed Sidebar (40%) */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-2 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                Insight Feed
                <Badge variant="neutral" className="bg-brand-teal/10 text-brand-teal border-0 text-[10px] ml-auto">{visibleInsights.length} active</Badge>
              </CardTitle>
            </CardHeader>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <AnimatePresence>
                {visibleInsights.map((insight, i) => {
                  const style = SEVERITY_STYLES[insight.severity];
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ delay: i * 0.03 }}
                      layout
                    >
                      <div className="p-3 rounded-xl border hover:shadow-sm transition bg-white">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center shrink-0`}>
                            <style.icon className={`w-4 h-4 ${style.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="neutral" className={`${style.bg} ${style.text} border-0 text-[10px] capitalize`}>{style.label}</Badge>
                              {insight.affectedEntity && <span className="text-[10px] text-muted-foreground truncate">{insight.affectedEntity}</span>}
                            </div>
                            <p className="text-sm font-medium text-brand-navy mt-1 leading-tight">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{insight.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex-1">
                                <Progress value={insight.confidence} className="h-1.5" />
                              </div>
                              <span className="text-[10px] font-medium text-brand-navy">{insight.confidence}%</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600" onClick={() => handleTakeAction(insight)}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500" onClick={() => handleDismiss(insight.id)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────
function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center px-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-white/60 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 bg-white rounded-lg border">
      <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
      <div className={`text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}

function VehicleBadge({ plate }: { plate: string }) {
  return <span className="inline-flex items-center px-1.5 py-0.5 bg-brand-navy/10 text-brand-navy text-[11px] font-mono font-bold rounded">{plate}</span>;
}

function RouteRow({ time, route, trips, revenue }: { time: string; route: string; trips: number; revenue: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded-lg border text-sm">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{time}</span>
        <span className="font-medium text-brand-navy">{route}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="neutral" className="bg-sky-50 text-sky-700 border-0 text-[10px]">{trips}x</Badge>
        <span className="text-xs font-bold text-emerald-600">{revenue}</span>
      </div>
    </div>
  );
}

function DriverRow({ rank, name, onTime, rating, status }: { rank: number; name: string; onTime: string; rating: string; status: "excellent" | "good" }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded-lg border text-sm">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-brand-teal/10 text-brand-teal text-[10px] font-bold flex items-center justify-center">{rank}</span>
        <span className="font-medium text-brand-navy">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{onTime} on-time</span>
        <Badge variant="neutral" className={`border-0 text-[10px] ${status === "excellent" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{rating}</Badge>
      </div>
    </div>
  );
}

function MaintenanceRow({ vehicle, item, urgency, cost }: { vehicle: string; item: string; urgency: string; cost: string }) {
  const isImmediate = urgency === "IMMEDIATE";
  return (
    <div className={`p-2 rounded-lg border text-sm ${isImmediate ? "bg-red-50 border-red-200" : "bg-white"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <VehicleBadge plate={vehicle} />
          <span className="text-brand-navy">{item}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="neutral" className={`border-0 text-[10px] ${isImmediate ? "bg-red-100 text-red-700" : "bg-amber-50 text-amber-700"}`}>{urgency}</Badge>
          <span className="text-xs font-bold text-brand-navy">{cost}</span>
        </div>
      </div>
    </div>
  );
}

function SavingRow({ label, amount, pct }: { label: string; amount: string; pct: string }) {
  return (
    <div className="flex items-center justify-between p-2 bg-white rounded-lg border text-sm">
      <span className="text-brand-navy">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-emerald-600">{amount}</span>
        <span className="text-[10px] text-muted-foreground">{pct}</span>
      </div>
    </div>
  );
}

function FindingRow({ severity, text }: { severity: "critical" | "warning" | "positive"; text: string }) {
  const colors = {
    critical: "bg-red-100 text-red-700",
    warning: "bg-amber-100 text-amber-700",
    positive: "bg-emerald-100 text-emerald-700",
  };
  const labels = { critical: "CRITICAL", warning: "WARNING", positive: "OPPORTUNITY" };
  return (
    <div className="flex items-start gap-2 text-xs">
      <Badge className={`${colors[severity]} border-0 text-[9px] px-1.5 shrink-0`}>{labels[severity]}</Badge>
      <span className="text-brand-navy">{text}</span>
    </div>
  );
}
