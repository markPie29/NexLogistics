"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { motion } from "framer-motion";

interface PreviewPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  features: { title: string; description: string }[];
  breadcrumbs?: { label: string; href?: string }[];
}

export function PreviewPage({ title, subtitle, icon: Icon, features, breadcrumbs }: PreviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} breadcrumbs={breadcrumbs || [{ label: title }]} />

      <div className="relative overflow-hidden">
        <Card className="bg-gradient-to-br from-brand-navy via-brand-navy to-brand-teal-dark text-white border-0">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-teal/20 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-teal text-white text-xs font-bold rounded-bl-xl uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Coming in Full Version
          </div>
          <CardContent className="p-8 relative">
            <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }} className="w-16 h-16 rounded-2xl bg-brand-teal/30 flex items-center justify-center mb-4 backdrop-blur-sm">
              <Icon className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-white/80 max-w-2xl">{subtitle}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full hover:shadow-card-hover transition group">
              <CardContent className="p-5">
                <Badge variant="preview" className="mb-3">Preview</Badge>
                <div className="font-bold text-brand-navy">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.description}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">This module is part of the full Nex Logistics platform. The MVP includes core operations: Fleet, Drivers, Trips, GPS, PMS, Expenses, Payroll, POD, and Reports.</p>
        </CardContent>
      </Card>
    </div>
  );
}
