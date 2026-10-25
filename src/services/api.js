async function request(path, options) {
  const response = await fetch(path, { credentials: "same-origin", ...options });
  const body = await response.text();
  let data;

  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new Error("Réponse serveur invalide. Vérifiez que le serveur local est démarré.");
  }

  if (!response.ok) {
    throw new Error(data.message || "La requête a échoué.");
  }

  return data;
}

export const api = {
  getSession: () => request("/api/auth/session"),
  getAuthStatus: () => request("/api/auth/status"),
  register: (credentials) => request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }),
  login: (credentials) => request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  getStats: () => request("/api/stats"),
  getPayments: () => request("/api/payments"),
  getPaymentLinks: () => request("/api/payment-links"),
  getCustomers: () => request("/api/customers"),
  getPaymentSettings: () => request("/api/settings/payment"),
  savePaymentSettings: (apiToken) => request("/api/settings/payment", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiToken }),
  }),
  createPaymentLink: (payment) => request("/api/payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payment),
  }),
  updatePaymentLinkStatus: (id, status) => request(`/api/payment-links/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  }),
};
