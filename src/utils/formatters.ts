import type { CurrencyCode } from "../types";

export function formatMoney(value: number | string | null | undefined, currency: CurrencyCode = "XOF"): string {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency === "XOF" ? "FCFA" : currency}`;
}

export function formatDate(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
): string {
  if (!value) return "—";
  const date = new Date(value.includes?.("T") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR", options);
}

export function createIdentifier(): string {
  return `payflow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
