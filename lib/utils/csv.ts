// Pure-browser CSV export. Zero deps. Used by Reports + Subcon Payables.

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  // RFC 4180: wrap in quotes if it contains comma, quote, newline, or CR.
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (rows.length === 0 && !headers) return "";
  const cols =
    headers ??
    (Object.keys(rows[0] ?? {}) as (keyof T)[]).map((k) => ({ key: k, label: String(k) }));
  const headerLine = cols.map((c) => escapeCell(c.label)).join(",");
  const bodyLines = rows.map((r) => cols.map((c) => escapeCell(r[c.key])).join(","));
  return [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  // Prepend BOM so Excel recognizes UTF-8 (e.g. ₱ glyph).
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[]
): void {
  downloadCsv(filename, toCsv(rows, headers));
}
