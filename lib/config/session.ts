/**
 * Session Configuration
 * ─────────────────────────────────────────────────────────────────────────
 * Configures the idle timeout and warning duration for all authenticated
 * users. Values are in minutes and seconds respectively.
 */

const env = (key: string, fallback: string): string => {
  if (typeof process !== "undefined" && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const SESSION_CONFIG = {
  /** Minutes of inactivity before the warning modal appears */
  timeoutMinutes: parseInt(env("NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES", "30"), 10),
  /** Seconds the warning modal stays visible before automatic logout */
  warningSeconds: parseInt(env("NEXT_PUBLIC_SESSION_WARNING_SECONDS", "60"), 10),
} as const;
