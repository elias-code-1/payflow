export type PaymentLinkStatus = "pending" | "paid" | "cancelled";
export type DashboardPageId = "overview" | "transactions" | "links" | "manualPayments" | "customers" | "catalog" | "qrCodes" | "exports" | "backups" | "analytics" | "reminders" | "downloads" | "settings" | "support";
export type CurrencyCode = "XOF" | "EUR" | "USD";

export interface User {
  id: number;
  email: string;
  created_at?: string;
}

export interface PaymentLink {
  id: number;
  identifier: string;
  description: string;
  amount: number;
  display_amount?: number | null;
  currency: CurrencyCode;
  payment_method: string;
  phone_number: string;
  payment_url: string;
  status: PaymentLinkStatus;
  status_updated_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  archived_at?: string | null;
  customer_id?: number | null;
  catalog_item_id?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  catalog_item_name?: string | null;
}

export interface PaymentRecord {
  id: number | string;
  tx_reference?: string;
  identifier?: string;
  status: number | string;
  amount: number;
  currency?: CurrencyCode;
  payment_method?: string;
  phone_number?: string;
  created_at: string;
  source?: "manual_receipt" | "manual_link";
}

export interface ManualLinkTransaction {
  id: string;
  tx_reference: string;
  identifier: string;
  status: 1;
  amount: number;
  payment_method: string;
  phone_number: string;
  created_at: string;
  source: "manual_link";
}

export type TransactionRow = PaymentRecord | ManualLinkTransaction;
export type ConfirmedPayment = Omit<PaymentLink, "status"> & { status: 1 };

export interface Customer {
  phone_number: string;
  last_seen: string;
  payment_count: number;
}

export interface CustomerProfile {
  id: number;
  full_name: string;
  phone_number: string;
  email: string;
  company: string;
  address: string;
  tags: string;
  notes: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  link_count?: number;
  receipt_count?: number;
  last_activity?: string | null;
}

export interface CatalogItem {
  id: number;
  name: string;
  description: string;
  sku: string;
  amount: number;
  currency: CurrencyCode;
  category: string;
  archived_at?: string | null;
  created_at: string;
  updated_at: string;
  link_count?: number;
  paid_link_count?: number;
}

export type ManualPaymentStatus = "confirmed" | "void";

export interface ManualPayment {
  id: number;
  payment_link_id: number | null;
  customer_id: number | null;
  amount: number;
  currency: CurrencyCode;
  method: string;
  reference: string;
  paid_at: string;
  note: string;
  status: ManualPaymentStatus;
  created_at: string;
  updated_at: string;
  link_identifier?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
}

export interface ManualPaymentHistory {
  id: number;
  reason: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  changed_at: string;
}

export interface PaymentLinkHistory {
  id: number;
  action: string;
  old_value: unknown;
  new_value: unknown;
  reason: string;
  created_at: string;
}

export interface Reminder {
  id: number;
  payment_link_id: number;
  identifier?: string;
  message: string;
  channel: string;
  status: "prepared" | "sent";
  sent_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReminderLink extends PaymentLink {
  customer_name?: string | null;
  customer_email?: string | null;
  catalog_item_name?: string | null;
}

export interface AnalyticsCurrencySummary {
  currency: CurrencyCode;
  linksCreated: number;
  paidLinks: number;
  eligibleLinks: number;
  receiptCount: number;
  revenue: number;
  pendingAmount: number;
  cancelledAmount: number;
  previousRevenue: number;
  conversionRate: number;
  revenueChange: number | null;
}

export interface AdvancedAnalytics {
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  currencies: AnalyticsCurrencySummary[];
  daily: Array<{ currency: CurrencyCode; date: string; amount: number }>;
  monthly: Array<{ currency: CurrencyCode; month: string; amount: number }>;
  methods: Array<{ currency: CurrencyCode; method: string; amount: number }>;
  products: Array<{ currency: CurrencyCode; itemId: number; name: string; amount: number }>;
  customers: Array<{ currency: CurrencyCode; customerId: number; name: string; amount: number }>;
}

export interface BackupMetadata {
  id: number;
  checksum: string;
  schema_version: number;
  size_bytes: number;
  source: string;
  created_at: string;
}

export interface BackupDocument {
  format: "payflow-account-backup";
  schemaVersion: number;
  generatedAt: string;
  checksum: string;
  data: Record<string, unknown[]>;
}

export interface DashboardStats {
  payments: number;
  completed: number;
  links: number;
  pending: number;
  customers: number;
  revenue: number;
  revenueByCurrency?: Record<string, number>;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export interface CreatePaymentLinkInput {
  description: string;
  phone_number: string;
  amount: number;
  display_amount: number;
  currency: CurrencyCode;
  network: string;
  identifier: string;
  customer_id?: number | null;
  catalog_item_id?: number | null;
  expires_at?: string | null;
}

export interface CreatePaymentLinkResponse {
  ok: boolean;
  id?: number;
  identifier: string;
  paymentUrl: string;
  amount: number;
  display_amount: number;
  currency: CurrencyCode;
  network: string;
}

export interface PaymentSettingsStatus {
  configured: boolean;
}

export interface AuthStatus {
  hasAccounts: boolean;
}
