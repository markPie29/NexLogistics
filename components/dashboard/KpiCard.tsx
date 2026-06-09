"use client";
import { motion } from "framer-motion";
import { type LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  href?: string;
  footerLabel?: string;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-brand-teal",
  iconBg = "bg-brand-teal-light",
  trend,
  trendLabel,
  sparklineData,
  sparklineColor,
  href,
  footerLabel,
  delay = 0,
}: KpiCardProps) {
  const positive = trend !== undefined && trend >= 0;
  const Tag = href ? Link : ("div" as any);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="h-full"
    >
      <Tag
        href={href || "#"}
        className="flex flex-col h-full rounded-2xl border border-brand-border dark:border-white/10 bg-white dark:bg-brand-navy-light p-4 xl:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 dark:bg-white/10", iconBg)}>
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-muted-foreground leading-snug">{label}</div>
            <div
              title={String(value)}
              className={cn(
                "font-black text-brand-navy dark:text-white mt-0.5 leading-none tracking-tight truncate",
                String(value).length > 12 ? "text-base" :
                String(value).length > 9  ? "text-lg" :
                String(value).length > 6  ? "text-xl" :
                "text-2xl xl:text-3xl"
              )}
            >{value}</div>
          </div>
        </div>
        
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 min-h-[32px]">
          <div className="text-xs text-muted-foreground leading-snug flex-1 min-w-0 break-words">
            {footerLabel}
          </div>
          
          {trend !== undefined && !sparklineData && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold shrink-0",
                positive ? "text-emerald-500" : "text-red-500"
              )}
            >
              {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}% {trendLabel}
            </span>
          )}

          {sparklineData && (
            <div className="ml-auto flex items-end shrink-0 w-10 xl:w-[48px] relative top-1">
              <Sparkline data={sparklineData} color={sparklineColor || "#66B2B2"} />
            </div>
          )}
        </div>
      </Tag>
    </motion.div>
  );
}
