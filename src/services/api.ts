import type {
  AuthResponse,
  AuthStatus,
  Credentials,
  CreatePaymentLinkInput,
  CreatePaymentLinkResponse,
  Customer,
  DashboardStats,
  PaymentLink,
  PaymentLinkStatus,
  PaymentRecord,
  PaymentSettingsStatus,
} from "../types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  const body = await response.text();
  let data: unknown;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error("Réponse serveur invalide. Vérifiez que le serveur local est démarré.");
  }

  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
      ? data.message
      : "La requête a échoué.";
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  getSession: () => request<AuthResponse>("/api/auth/session"),
  getAuthStatus: () => request<AuthStatus>("/api/auth/status"),
  register: (credentials: Credentials) => request<AuthResponse>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }),
  login: (credentials: Credentials) => request<AuthResponse>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  getStats: () => request<DashboardStats>("/api/stats"),
  getPayments: () => request<PaymentRecord[]>("/api/payments"),
  getPaymentLinks: () => request<PaymentLink[]>("/api/payment-links"),
  getCustomers: () => request<Customer[]>("/api/customers"),
  getPaymentSettings: () => request<PaymentSettingsStatus>("/api/settings/payment"),
  savePaymentSettings: (apiToken: string) => request<{ ok: boolean; configured: boolean }>("/api/settings/payment", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiToken }),
  }),
  createPaymentLink: (payment: CreatePaymentLinkInput) => request<CreatePaymentLinkResponse>("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  }),
  updatePaymentLinkStatus: (id: number, status: PaymentLinkStatus) => request<{ ok: boolean; status: PaymentLinkStatus }>(`/api/payment-links/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }),
};
