"use client";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {b.href ? (
                  <Link href={b.href} className="hover:text-brand-teal">{b.label}</Link>
                ) : (
                  <span className="text-brand-gray font-medium dark:text-gray-300">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3" />}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-navy tracking-tight dark:text-white">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
