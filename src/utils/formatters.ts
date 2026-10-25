import type { CurrencyCode } from "../types";

export function formatMoney(value: number | string | null | undefined, currency: CurrencyCode = "XOF"): string {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency === "XOF" ? "FCFA" : currency}`;
}

export function parseAppDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  let normalized = trimmed;
  if (!trimmed.includes("T") && /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(trimmed)) {
    normalized = `${trimmed.replace(/\s+/, "T")}Z`;
  } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
    normalized = `${trimmed}Z`;
  }
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  const date = parseAppDate(value);
  if (!date) return "—";
  const hasTimeOption = Boolean(
    options.timeStyle !== undefined ||
    options.hour !== undefined ||
    options.minute !== undefined ||
    options.second !== undefined,
  );
  try {
    return hasTimeOption
      ? date.toLocaleString("fr-FR", options)
      : date.toLocaleDateString("fr-FR", options);
  } catch {
    return date.toLocaleString("fr-FR");
  }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function createIdentifier(): string {
  return `payflow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
