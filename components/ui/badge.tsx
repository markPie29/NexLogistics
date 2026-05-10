import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-brand-teal-light text-brand-teal-dark",
        success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
        warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
        danger: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
        info: "bg-sky-50 text-sky-700 ring-1 ring-sky-200/60",
        neutral: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60",
        purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
        outline: "border border-brand-border text-brand-gray",
        preview:
          "bg-brand-teal/15 text-brand-teal-dark ring-1 ring-brand-teal/30 font-semibold",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
