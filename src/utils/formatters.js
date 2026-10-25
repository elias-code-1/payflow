export function formatMoney(value, currency = "XOF") {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} ${currency === "XOF" ? "FCFA" : currency}`;
}

export function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "—";
  const date = new Date(value.includes?.("T") ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("fr-FR", options);
}

export function createIdentifier() {
  return `payflow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
