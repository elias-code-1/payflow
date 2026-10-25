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
  AdvancedAnalytics,
  BackupDocument,
  BackupMetadata,
  CatalogItem,
  CustomerProfile,
  ManualPayment,
  ManualPaymentHistory,
  PaymentLinkHistory,
  Reminder,
  ReminderLink,
} from "../types";

type QueryInput = Record<string, string | number | boolean | null | undefined>;

function queryString(input: QueryInput = {}): string {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

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

async function download(path: string): Promise<Blob> {
  const response = await fetch(path, { credentials: "same-origin" });
  if (!response.ok) {
    let message = "Le téléchargement a échoué.";
    try {
      const body = await response.json() as { message?: string };
      if (body.message) message = body.message;
    } catch { /* Le serveur peut répondre sans corps JSON. */ }
    throw new Error(message);
  }
  return response.blob();
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
  getPaymentLinks: (filters: QueryInput = {}) => request<PaymentLink[]>(`/api/payment-links${queryString(filters)}`),
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
  updatePaymentLinkStatus: (id: number, status: PaymentLinkStatus, reason = "") => request<{ ok: boolean; status: PaymentLinkStatus }>(`/api/payment-links/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, reason }),
  }),
  duplicatePaymentLink: (id: number) => request<{ ok: boolean; id: number; identifier: string; paymentUrl: string }>(`/api/payment-links/${id}/duplicate`, { method: "POST" }),
  changePaymentLinkLifecycle: (id: number, input: { archived?: boolean; expiresAt?: string | null; reason?: string }) => request<PaymentLink>(`/api/payment-links/${id}/lifecycle`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  getPaymentLinkHistory: (id: number) => request<PaymentLinkHistory[]>(`/api/payment-links/${id}/history`),
  bulkArchivePaymentLinks: (ids: number[]) => request<{ archived: number }>("/api/payment-links/bulk-archive", {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
  }),
  getManualPayments: (filters: QueryInput = {}) => request<ManualPayment[]>(`/api/manual-payments${queryString(filters)}`),
  createManualPayment: (input: Partial<ManualPayment> & { paymentLinkId?: number | null; customerId?: number | null; paidAt: string }) => request<ManualPayment>("/api/manual-payments", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  updateManualPayment: (id: number, input: Partial<ManualPayment> & { paymentLinkId?: number | null; customerId?: number | null; paidAt: string; reason: string }) => request<ManualPayment>(`/api/manual-payments/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  setManualPaymentStatus: (id: number, status: "confirmed" | "void", reason: string) => request<ManualPayment>(`/api/manual-payments/${id}/status`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reason }),
  }),
  getManualPaymentHistory: (id: number) => request<ManualPaymentHistory[]>(`/api/manual-payments/${id}/history`),
  getCustomerProfiles: (filters: QueryInput = {}) => request<CustomerProfile[]>(`/api/customer-profiles${queryString(filters)}`),
  getCustomerProfile: (id: number) => request<{ customer: CustomerProfile; links: PaymentLink[]; receipts: ManualPayment[]; totals: Array<{ currency: string; amount: number; count: number }> }>(`/api/customer-profiles/${id}`),
  createCustomerProfile: (input: Partial<CustomerProfile>) => request<{ customer: CustomerProfile; potentialDuplicates: CustomerProfile[] }>("/api/customer-profiles", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      fullName: input.full_name, phoneNumber: input.phone_number, email: input.email, company: input.company,
      address: input.address, tags: input.tags, notes: input.notes,
    }),
  }),
  updateCustomerProfile: (id: number, input: Partial<CustomerProfile>) => request<{ customer: CustomerProfile; potentialDuplicates: CustomerProfile[] }>(`/api/customer-profiles/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      fullName: input.full_name, phoneNumber: input.phone_number, email: input.email, company: input.company,
      address: input.address, tags: input.tags, notes: input.notes,
    }),
  }),
  setCustomerArchived: (id: number, archived: boolean) => request<CustomerProfile>(`/api/customer-profiles/${id}/archive`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived }),
  }),
  deleteCustomer: (id: number, mode: "delete" | "anonymize") => request<{ deleted?: boolean; anonymized?: boolean }>(`/api/customer-profiles/${id}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode }),
  }),
  previewCustomerMerge: (targetId: number, sourceIds: number[]) => request<{ target: CustomerProfile; sources: CustomerProfile[]; links: number; receipts: number }>("/api/customer-profiles/merge-preview", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, sourceIds }),
  }),
  mergeCustomers: (targetId: number, sourceIds: number[]) => request<{ targetId: number; mergedIds: number[]; links: number; receipts: number }>("/api/customer-profiles/merge", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId, sourceIds }),
  }),
  getCatalogItems: (filters: QueryInput = {}) => request<CatalogItem[]>(`/api/catalog${queryString(filters)}`),
  getCatalogItem: (id: number) => request<{ item: CatalogItem; links: PaymentLink[]; sales: Array<{ currency: string; count: number; amount: number }> }>(`/api/catalog/${id}`),
  createCatalogItem: (input: Partial<CatalogItem>) => request<CatalogItem>("/api/catalog", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  updateCatalogItem: (id: number, input: Partial<CatalogItem>) => request<CatalogItem>(`/api/catalog/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  duplicateCatalogItem: (id: number) => request<CatalogItem>(`/api/catalog/${id}/duplicate`, { method: "POST" }),
  setCatalogArchived: (id: number, archived: boolean) => request<CatalogItem>(`/api/catalog/${id}/archive`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ archived }),
  }),
  getAnalytics: (from?: string, to?: string) => request<AdvancedAnalytics>(`/api/analytics${queryString({ from, to })}`),
  getReminders: () => request<{ eligible: ReminderLink[]; history: Reminder[] }>("/api/reminders"),
  createReminder: (input: { paymentLinkId: number; message: string; channel: string; status: "prepared" | "sent" }) => request<Reminder>("/api/reminders", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  updateReminder: (id: number, input: { message?: string; channel?: string; status: "prepared" | "sent" }) => request<Reminder>(`/api/reminders/${id}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }),
  previewExport: (type: string, filters: QueryInput = {}) => request<{ type: string; count: number; generatedAt: string; filters: QueryInput }>(`/api/exports/preview${queryString({ ...filters, type })}`),
  downloadExport: (type: string, format: "csv" | "json", filters: QueryInput = {}) => download(`/api/exports/${encodeURIComponent(type)}${queryString({ ...filters, format })}`),
  getBackups: () => request<BackupMetadata[]>("/api/backups"),
  createBackup: () => request<{ id: number; checksum: string; schemaVersion: number; sizeBytes: number; createdAt: string; fileName: string | null; document: BackupDocument }>("/api/backups", { method: "POST" }),
  getBackup: (id: number) => request<BackupDocument>(`/api/backups/${id}`),
  verifyBackup: (document: BackupDocument) => request<{ valid: boolean; checksum: string; schemaVersion: number; generatedAt: string; counts: Record<string, number> }>("/api/backups/verify", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document }),
  }),
  restoreBackup: (document: BackupDocument) => request<{ restored: boolean; safetyBackupCreated: boolean; counts: Record<string, number> }>("/api/backups/restore", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document, confirmed: true }),
  }),
  restoreLatestAutomaticBackup: () => request<{ restored: boolean; safetyBackupCreated: boolean; counts: Record<string, number> }>("/api/backups/restore-latest-automatic", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmed: true }),
  }),
};
