"use client";
import { useState, useCallback } from "react";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap, Brain, Target, Send, X, History, Loader2 } from "lucide-react";
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

const SEVERITY_STYLES: Record<AiInsight["severity"], { bg: string; text: string; icon: any; label: string }> = {
  positive: { bg: "bg-emerald-50", text: "text-emerald-700", icon: TrendingUp, label: "Opportunity" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle, label: "Warning" },
  critical: { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle, label: "Critical" },
  info: { bg: "bg-sky-50", text: "text-sky-700", icon: Lightbulb, label: "Info" },
};

const AI_RESPONSES: Record<string, string> = {
  fuel: "Analysis: Your fleet averages ₱6.2/km fuel cost. NEX-104 and NEX-107 are 18% above average. Recommend: ECU diagnostics + driver fuel efficiency training.",
  driver: "Top performers: Mark Santos (96% on-time), Allan Reyes (94%). Concern: Edwin Ramos has 3 fatigue flags this week.",
  route: "Manila→Pampanga corridor showing 38-min average delay. Suggest 04:00-05:00 departure. Cavite→Laguna route is optimal.",
  maintenance: "3 vehicles due for PMS within 14 days: NEX-104 (reefer compressor), NEX-110 (registration), NEX-107 (tires). Estimated cost: ₱31,200.",
  profit: "Fleet profit margin: 80%. Top earner: NEX-109 (₱38,500 revenue/trip). Lowest: NEX-108 at ₱7,400/trip. Consider reassigning low-margin routes.",
};
const AI_DEFAULT_RESPONSE = "I analyzed your fleet data. Key findings: 9 active vehicles, 80% profit margin, 3 maintenance items pending. Ask about fuel, drivers, routes, or maintenance for detailed insights.";

const GENERATED_INSIGHTS: AiInsight[] = [
  { id: "gen-001", category: "fuel", severity: "warning", title: "NEX-107 diesel consumption anomaly detected", description: "Vehicle averaging ₱7.3/km — 18% above fleet mean. Possible injector issue or aggressive driving pattern.", confidence: 87, affectedEntity: "NEX-107" },
  { id: "gen-002", category: "route", severity: "positive", title: "SLEX corridor efficiency improved", description: "New departure schedule reducing average transit by 22 minutes. Recommend applying same pattern to NLEX routes.", confidence: 91, affectedEntity: "SLEX Corridor" },
  { id: "gen-003", category: "maintenance", severity: "warning", title: "NEX-112 brake pad replacement recommended", description: "Telematics show 12% longer stopping distance vs. baseline. Schedule inspection within 5 days.", confidence: 85, affectedEntity: "NEX-112" },
];

const ACTION_RESPONSES: Record<string, string> = {
  fuel: "Scheduled ECU diagnostic for affected vehicle",
  driver: "Flagged driver for performance review meeting",
  maintenance: "Scheduled maintenance service appointment",
  route: "Flagged route for optimization review",
  cost: "Sent cost report to finance team for review",
};

const ANALYSIS_HISTORY = [
  { date: "2026-05-09 08:30", summary: "Full fleet analysis — 12 insights generated, 3 critical items flagged" },
  { date: "2026-05-08 14:15", summary: "Route optimization scan — Manila→Pampanga delay pattern identified" },
  { date: "2026-05-07 09:00", summary: "Driver performance review — fatigue risk detected for 1 driver" },
  { date: "2026-05-06 16:45", summary: "Fuel anomaly detection — NEX-104 flagged for high consumption" },
  { date: "2026-05-05 10:00", summary: "Predictive maintenance run — 3 vehicles queued for PMS" },
];

export default function AiInsightsPage() {
  const storeInsights = useUiStore((s) => s.insights);
  const [localInsights, setLocalInsights] = useState<AiInsight[]>(storeInsights);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const visibleInsights = localInsights.filter((i) => !dismissedIds.has(i.id));

  const handleRunAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const now = Date.now();
      const newInsights = GENERATED_INSIGHTS.map((ins, idx) => ({
        ...ins,
        id: `gen-${now}-${idx}`,
      }));
      setLocalInsights((prev) => [...newInsights, ...prev]);
      setIsAnalyzing(false);
      toast.success("Deep analysis complete", { description: `${newInsights.length} new insights generated` });
    }, 2000);
  }, []);

  const handleTakeAction = useCallback((insight: AiInsight) => {
    const response = ACTION_RESPONSES[insight.category] || "Action queued for review";
    const entitySuffix = insight.affectedEntity ? ` — ${insight.affectedEntity}` : "";
    toast.success("Action Taken", { description: `${response}${entitySuffix}` });
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const handleAskAi = useCallback(() => {
    if (!query.trim()) return;
    setIsThinking(true);
    setAiResponse(null);
    const q = query.toLowerCase();
    setTimeout(() => {
      const matchedKey = Object.keys(AI_RESPONSES).find((key) => q.includes(key));
      setAiResponse(matchedKey ? AI_RESPONSES[matchedKey] : AI_DEFAULT_RESPONSE);
      setIsThinking(false);
    }, 1200);
  }, [query]);

  return (
    <div className="space-y-6">
      <PageHeader title="AI Insights" subtitle="Predictive analytics and actionable recommendations powered by NexAI" breadcrumbs={[{ label: "Reports" }, { label: "AI Insights" }]} />

      {/* AI Query Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-brand-teal" />
            <span className="text-sm font-medium text-brand-navy">Ask NexAI about your fleet</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ask about fuel, drivers, routes, maintenance, or profit..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskAi()}
              className="flex-1"
            />
            <Button onClick={handleAskAi} disabled={isThinking || !query.trim()} size="sm">
              {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <AnimatePresence>
            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
                  <p className="text-sm text-brand-navy">{aiResponse}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Hero Card */}
      <Card className="bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark text-white border-0 overflow-hidden relative">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-teal text-white text-xs font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" /> Coming in Full Version
        </div>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-brand-teal" />
              <span className="text-sm font-medium text-brand-teal">NexAI Engine</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Your fleet is performing 12% above industry average.</h2>
            <p className="text-white/80 max-w-2xl">NexAI continuously analyzes your fleet data — driver behavior, fuel patterns, maintenance trends, and route efficiency — to surface actionable insights that drive cost reduction and operational excellence.</p>
            <div className="flex gap-2 mt-5">
              <Button className="bg-white text-brand-navy hover:bg-white/90" onClick={handleRunAnalysis} disabled={isAnalyzing}>
                {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Zap className="w-4 h-4" /> Run Deep Analysis</>}
              </Button>
              <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={() => setShowHistory((v) => !v)}>
                <History className="w-4 h-4" /> View History
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <BigStat label="Predicted Savings" value="₱248K" sub="next 30 days" />
            <BigStat label="Insights Generated" value={String(visibleInsights.length)} sub="this month" />
            <BigStat label="Confidence" value="94%" sub="model accuracy" />
          </div>
        </CardContent>
      </Card>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4 text-brand-teal" /> Analysis History</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {ANALYSIS_HISTORY.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition">
                      <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">{item.date}</span>
                      <span className="text-sm text-brand-navy">{item.summary}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Predictive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PredictiveCard icon={Target} color="text-brand-teal" bg="bg-brand-teal-light" title="Predictive Maintenance" desc="3 vehicles likely to need engine service within 14 days based on telematics patterns." metric="89% accuracy" />
        <PredictiveCard icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" title="Fuel Anomaly Detection" desc="NEX-104 consuming 15% above baseline — recommend ECU diagnostic & driver coaching." metric="Saves ₱18K/mo" />
        <PredictiveCard icon={Lightbulb} color="text-amber-600" bg="bg-amber-50" title="Route Optimization" desc="Reordering 4 daily Quezon City stops can shorten route by 23 km and 47 minutes." metric="−₱4.2K/day" />
      </div>

      {/* Insight Feed */}
      <div>
        <h3 className="text-lg font-bold text-brand-navy mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-teal" /> Insight Feed</h3>
        <div className="space-y-3">
          <AnimatePresence>
            {visibleInsights.map((insight, i) => {
              const style = SEVERITY_STYLES[insight.severity];
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.02 }}
                  layout
                >
                  <Card className="hover:shadow-card-hover transition">
                    <CardContent className="p-4 flex gap-4">
                      <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                        <style.icon className={`w-5 h-5 ${style.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="neutral" className={`${style.bg} ${style.text} border-0 capitalize`}>{insight.category}</Badge>
                          <Badge variant="neutral" className={`${style.bg} ${style.text} border-0`}>{style.label}</Badge>
                          {insight.affectedEntity && <span className="text-xs text-muted-foreground">· {insight.affectedEntity}</span>}
                        </div>
                        <div className="font-bold text-brand-navy mt-1.5">{insight.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{insight.description}</div>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex-1 max-w-xs">
                            <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Confidence</span><span className="font-bold text-brand-navy">{insight.confidence}%</span></div>
                            <Progress value={insight.confidence} />
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleTakeAction(insight)}>Take Action</Button>
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-600" onClick={() => handleDismiss(insight.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
      <div className="text-xs text-white/70 uppercase tracking-wider">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-white/60">{sub}</div>
    </div>
  );
}

function PredictiveCard({ icon: Icon, color, bg, title, desc, metric }: any) {
  return (
    <Card className="hover:shadow-card-hover transition">
      <CardContent className="p-5">
        <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
        <div className="font-bold text-brand-navy">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{desc}</div>
        <Badge variant="preview" className="mt-3">{metric}</Badge>
      </CardContent>
    </Card>
  );
}
