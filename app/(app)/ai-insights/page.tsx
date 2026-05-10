"use client";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Zap, Brain, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUiStore } from "@/lib/store";
import { motion } from "framer-motion";
import type { AiInsight } from "@/lib/types";

const SEVERITY_STYLES: Record<AiInsight["severity"], { bg: string; text: string; icon: any; label: string }> = {
  positive: { bg: "bg-emerald-50", text: "text-emerald-700", icon: TrendingUp, label: "Opportunity" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", icon: AlertTriangle, label: "Warning" },
  critical: { bg: "bg-red-50", text: "text-red-700", icon: AlertTriangle, label: "Critical" },
  info: { bg: "bg-sky-50", text: "text-sky-700", icon: Lightbulb, label: "Info" },
};

export default function AiInsightsPage() {
  const insights = useUiStore((s) => s.insights);

  return (
    <div className="space-y-6">
      <PageHeader title="AI Insights" subtitle="Predictive analytics and actionable recommendations powered by NexAI" breadcrumbs={[{ label: "Reports" }, { label: "AI Insights" }]} />

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
              <Button className="bg-white text-brand-navy hover:bg-white/90"><Zap className="w-4 h-4" /> Run Deep Analysis</Button>
              <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">View History</Button>
            </div>
          </div>
          <div className="space-y-3">
            <BigStat label="Predicted Savings" value="₱248K" sub="next 30 days" />
            <BigStat label="Insights Generated" value={String(insights.length)} sub="this month" />
            <BigStat label="Confidence" value="94%" sub="model accuracy" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PredictiveCard icon={Target} color="text-brand-teal" bg="bg-brand-teal-light" title="Predictive Maintenance" desc="3 vehicles likely to need engine service within 14 days based on telematics patterns." metric="89% accuracy" />
        <PredictiveCard icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" title="Fuel Anomaly Detection" desc="NEX-104 consuming 15% above baseline — recommend ECU diagnostic & driver coaching." metric="Saves ₱18K/mo" />
        <PredictiveCard icon={Lightbulb} color="text-amber-600" bg="bg-amber-50" title="Route Optimization" desc="Reordering 4 daily Quezon City stops can shorten route by 23 km and 47 minutes." metric="−₱4.2K/day" />
      </div>

      <div>
        <h3 className="text-lg font-bold text-brand-navy mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-teal" /> Insight Feed</h3>
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const style = SEVERITY_STYLES[insight.severity];
            return (
              <motion.div key={insight.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
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
                        <Button size="sm" variant="outline">Take Action</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
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
