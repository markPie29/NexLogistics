"use client";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F8FAFC",
          padding: "1rem",
        }}>
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <div style={{
              width: "4rem", height: "4rem", margin: "0 auto 1.5rem",
              borderRadius: "1rem", background: "#FEF2F2",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AlertTriangle style={{ width: "2rem", height: "2rem", color: "#EF4444" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.5rem" }}>
              Application Error
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#64748B", marginBottom: "1.5rem" }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={reset}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.625rem 1rem", background: "#0B1220", color: "white",
                fontSize: "0.875rem", fontWeight: 600, borderRadius: "0.5rem",
                border: "none", cursor: "pointer",
              }}
            >
              <RotateCcw style={{ width: "1rem", height: "1rem" }} /> Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
