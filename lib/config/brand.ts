/**
 * Brand & Tenant Configuration
 * ─────────────────────────────────────────────────────────────────────────
 * Single source of truth for all customer-facing brand strings, locale,
 * and currency. To white-label this product for a new client:
 *
 *   1. Set NEXT_PUBLIC_BRAND_* environment variables (.env.local), OR
 *   2. Edit the defaults below.
 *
 * Every page/component should read brand info from here — never hardcode.
 */

const env = (key: string, fallback: string): string => {
  if (typeof process !== "undefined" && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const BRAND = {
  /** Short brand name, e.g. "NexLogistics" */
  name:        env("NEXT_PUBLIC_BRAND_NAME",        "NexLogistics"),
  /** Display title, e.g. "Nex Logistics" */
  title:       env("NEXT_PUBLIC_BRAND_TITLE",       "Nex Logistics"),
  /** Marketing tagline */
  tagline:     env("NEXT_PUBLIC_BRAND_TAGLINE",     "Enterprise Fleet & Trip Management"),
  /** Legal company name shown on invoices, headers */
  company:     env("NEXT_PUBLIC_BRAND_COMPANY",     "NEX Logistics Inc."),
  /** Tenant code used as localStorage key prefix (lowercase, no spaces) */
  storeKey:    env("NEXT_PUBLIC_BRAND_STORE_KEY",   "nex"),
  /** Vendor / publisher of the product */
  vendor:      env("NEXT_PUBLIC_BRAND_VENDOR",      "NexVision Innovations"),
  /** Support email shown in the UI */
  supportEmail: env("NEXT_PUBLIC_BRAND_SUPPORT_EMAIL", "support@nexlogistics.example"),
  /** Description used for SEO + open graph */
  description: env(
    "NEXT_PUBLIC_BRAND_DESCRIPTION",
    "Premium logistics, fleet, dispatch, GPS tracking, payroll and analytics platform.",
  ),
} as const;

export const LOCALE = {
  /** BCP-47 locale tag */
  tag:      env("NEXT_PUBLIC_LOCALE",         "en-PH"),
  /** ISO-4217 currency code */
  currency: env("NEXT_PUBLIC_CURRENCY",       "PHP"),
  /** Currency symbol shown in tables / KPIs */
  currencySymbol: env("NEXT_PUBLIC_CURRENCY_SYMBOL", "₱"),
  /** International phone country code */
  phoneCountryCode: env("NEXT_PUBLIC_PHONE_CC", "+63"),
  /** IANA timezone */
  timezone: env("NEXT_PUBLIC_TIMEZONE",       "Asia/Manila"),
} as const;

/** Format a number as the configured currency. */
export function formatCurrency(amount: number, opts?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(LOCALE.tag, {
      style: "currency",
      currency: LOCALE.currency,
      maximumFractionDigits: 2,
      ...opts,
    }).format(amount);
  } catch {
    return `${LOCALE.currencySymbol}${amount.toLocaleString()}`;
  }
}
