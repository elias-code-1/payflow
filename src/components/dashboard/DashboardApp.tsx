import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { gsap } from "gsap";
import { api } from "../../services/api";
import { createIdentifier } from "../../utils/formatters";
import { getTransactionRows } from "../../utils/paymentAnalytics";
import AuthPage from "../auth/AuthPage";
import DashboardLayout from "./DashboardLayout";
import PaymentModal from "./PaymentModal";
import HelpCommunityPage from "./HelpCommunityPage";
import { OverviewPage, TransactionsPage, LinksPage, CustomersPage, AnalyticsPage, SettingsPage } from "./DashboardPages";
import type { CurrencyCode, Customer, DashboardPageId, DashboardStats, PaymentLink, PaymentLinkStatus, User } from "../../types";

const EMPTY_STATS: DashboardStats = { payments: 0, completed: 0, links: 0, pending: 0, customers: 0, revenue: 0 };

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export default function DashboardApp() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(true);
  const [page, setPage] = useState<DashboardPageId>("overview");
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(7);
  const pageRef = useRef<HTMLDivElement | null>(null);

  async function refreshData(): Promise<void> {
    const [nextStats, nextLinks, nextCustomers, nextSettings] = await Promise.all([
      api.getStats(),
      api.getPaymentLinks(),
      api.getCustomers(),
      api.getPaymentSettings(),
    ]);
    setStats(nextStats);
    setLinks(nextLinks);
    setCustomers(nextCustomers);
    setConfigured(nextSettings.configured);
  }

  useEffect(() => {
    async function initialize() {
      try {
        const result = await api.getSession();
        setUser(result.user);
        await refreshData();
      } catch (error) {
        if (error instanceof Error && (error.message === "Connectez-vous pour continuer." || error.message === "Cette session n’est plus valide.")) {
          try {
            const state = await api.getAuthStatus();
            setHasAccounts(state.hasAccounts);
          } catch (statusError) {
            setNotice(errorMessage(statusError, "Le serveur local est indisponible."));
            setNoticeError(true);
          }
        } else {
          setNotice(errorMessage(error, "Impossible de charger les données locales."));
          setNoticeError(true);
        }
      } finally {
        setAuthReady(true);
      }
    }
    initialize();
  }, []);

  useEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(pageRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }
  }, [page]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const transactions = getTransactionRows(links);
    if (!normalizedQuery) return transactions;
    return transactions.filter((payment) => `${payment.identifier || ""} ${payment.tx_reference || ""} ${payment.phone_number || ""} ${payment.payment_method || ""}`.toLowerCase().includes(normalizedQuery));
  }, [links, query]);

  const filteredLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return links;
    return links.filter((link) => `${link.identifier} ${link.description} ${link.phone_number} ${link.payment_method}`.toLowerCase().includes(normalizedQuery));
  }, [links, query]);

  async function createLink(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setNoticeError(false);
    const formData = new FormData(event.currentTarget);
    const displayAmount = Number(String(formData.get("amount")).replace(",", "."));
    const selectedCurrency = formData.get("currency");
    const currency: CurrencyCode = selectedCurrency === "EUR" || selectedCurrency === "USD" ? selectedCurrency : "XOF";
    const amountXof = Math.round(currency === "EUR" ? displayAmount * 655.957 : currency === "USD" ? displayAmount * 600 : displayAmount);
    try {
      const result = await api.createPaymentLink({
        description: String(formData.get("description") || ""),
        phone_number: String(formData.get("phone") || ""),
        amount: amountXof,
        display_amount: displayAmount,
        currency,
        network: String(formData.get("network") || "TMONEY"),
        identifier: createIdentifier(),
      });
      setShowPayment(false);
      setPage("links");
      setNotice("Lien de paiement créé et enregistré localement.");
      setNoticeError(false);
      await refreshData();
      setNotice(`${result.paymentUrl}`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La création du lien a échoué.");
      setNoticeError(true);
    } finally {
      setBusy(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSavingSettings(true);
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;
    try {
      await api.savePaymentSettings(String(formData.get("apiToken") || ""));
      setConfigured(true);
      setNotice("Clé API enregistrée dans les paramètres locaux de ce compte.");
      setNoticeError(false);
      form.reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "L’enregistrement de la clé a échoué.");
      setNoticeError(true);
    } finally {
      setSavingSettings(false);
    }
  }

  async function copyLink(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setNotice("Lien copié dans le presse-papiers.");
      setNoticeError(false);
    } catch {
      setNotice("La copie automatique a échoué. Ouvrez le lien pour le copier manuellement.");
      setNoticeError(true);
    }
  }

  async function updateLinkStatus(id: number, status: PaymentLinkStatus): Promise<void> {
    try {
      const result = await api.updatePaymentLinkStatus(id, status);
      setLinks((current) => current.map((link) => link.id === id
        ? { ...link, status: result.status, status_updated_at: new Date().toISOString() }
        : link));
      await refreshData();
      setNotice("Statut du lien mis à jour.");
      setNoticeError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Le statut du lien n’a pas pu être mis à jour.");
      setNoticeError(true);
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.logout();
      setUser(null);
      setStats(EMPTY_STATS);
      setLinks([]);
      setCustomers([]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La déconnexion a échoué.");
      setNoticeError(true);
    }
  }

  if (!authReady) return <main className="auth-shell"><div className="auth-loading">Chargement de votre espace local…</div></main>;
  if (!user) return <AuthPage hasAccounts={hasAccounts} onAuthenticated={async (nextUser) => { setHasAccounts(true); setUser(nextUser); setNotice(""); await refreshData(); }} />;

  let content: ReactNode;
  if (page === "overview") content = <OverviewPage stats={stats} transactions={filteredTransactions} links={links} range={range} onRangeChange={setRange} onCreate={() => setShowPayment(true)} onNavigate={setPage} />;
  if (page === "transactions") content = <TransactionsPage transactions={filteredTransactions} />;
  if (page === "links") content = <LinksPage links={filteredLinks} onCopy={copyLink} onCreate={() => setShowPayment(true)} onStatusChange={updateLinkStatus} />;
  if (page === "customers") content = <CustomersPage customers={customers.filter((customer) => customer.phone_number.toLowerCase().includes(query.trim().toLowerCase()))} />;
  if (page === "analytics") content = <AnalyticsPage stats={stats} links={links} />;
  if (page === "settings") content = <SettingsPage configured={configured} saving={savingSettings} onSave={saveSettings} />;
  if (page === "support") content = <HelpCommunityPage />;

  return (
    <>
      <DashboardLayout page={page} onNavigate={(nextPage: DashboardPageId) => { setPage(nextPage); setNotice(""); }} query={query} onQueryChange={setQuery} user={user} onLogout={logout}>
        <div className="dashboard-content" ref={pageRef}>
          {notice && <div className={`notice ${noticeError ? "notice-error" : ""}`} role={noticeError ? "alert" : "status"}><span>{notice.startsWith("https://") ? <><span>Lien prêt : </span><a className="payment-link" href={notice} target="_blank" rel="noreferrer">Ouvrir le lien de paiement</a><small className="payment-link-url">{notice}</small></> : notice}</span><button onClick={() => setNotice("")} aria-label="Fermer le message"><span aria-hidden="true">×</span></button></div>}
          {content}
        </div>
      </DashboardLayout>
      {showPayment && <PaymentModal busy={busy} onClose={() => setShowPayment(false)} onSubmit={createLink} />}
    </>
  );
}
