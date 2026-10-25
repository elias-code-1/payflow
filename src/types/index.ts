export type PaymentLinkStatus = "pending" | "paid" | "cancelled";
export type DashboardPageId = "overview" | "transactions" | "links" | "customers" | "analytics" | "settings" | "support";
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
}

export interface PaymentRecord {
  id: number;
  tx_reference?: string;
  identifier?: string;
  status: number;
  amount: number;
  payment_method?: string;
  phone_number?: string;
  created_at: string;
  source?: undefined;
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

export interface DashboardStats {
  payments: number;
  completed: number;
  links: number;
  pending: number;
  customers: number;
  revenue: number;
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
