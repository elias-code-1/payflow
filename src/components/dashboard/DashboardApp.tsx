import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { gsap } from "gsap";
import { api } from "../../services/api";
import { createIdentifier, downloadBlob } from "../../utils/formatters";
import AuthPage from "../auth/AuthPage";
import DashboardLayout, { navItems } from "./DashboardLayout";
import DashboardPageBoundary from "./DashboardPageBoundary";
import PaymentModal from "./PaymentModal";
import HelpCommunityPage from "./HelpCommunityPage";
import DownloadsGuidePage from "./DownloadsGuidePage";
import { OverviewPage, TransactionsPage, SettingsPage } from "./DashboardPages";
import { AdvancedAnalyticsPage, BackupsPage, CatalogPage, CustomersPage, ExportsPage, LinkManagementPage, ManualPaymentsPage, QRCodesPage, RemindersPage } from "./FeaturePages";
import type { CatalogItem, CurrencyCode, Customer, CustomerProfile, DashboardPageId, DashboardStats, PaymentLink, PaymentLinkStatus, TransactionRow, User } from "../../types";

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
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerProfiles, setCustomerProfiles] = useState<CustomerProfile[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [configured, setConfigured] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentPrefill, setPaymentPrefill] = useState<{ description?: string; phone?: string; amount?: number; currency?: CurrencyCode; customerId?: number; catalogItemId?: number }>({});
  const [busy, setBusy] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupRevision, setBackupRevision] = useState(0);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(7);
  const pageRef = useRef<HTMLDivElement | null>(null);

  async function refreshData(): Promise<void> {
    const [nextStats, nextLinks, nextTransactions, nextCustomers, nextProfiles, nextCatalog, nextSettings] = await Promise.all([
      api.getStats(),
      api.getPaymentLinks(),
      api.getPayments(),
      api.getCustomers(),
      api.getCustomerProfiles(),
      api.getCatalogItems(),
      api.getPaymentSettings(),
    ]);
    setStats(nextStats);
    setLinks(nextLinks);
    setTransactions(nextTransactions);
    setCustomers(nextCustomers);
    setCustomerProfiles(nextProfiles);
    setCatalogItems(nextCatalog);
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
      gsap.killTweensOf(pageRef.current);
      gsap.fromTo(pageRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" });
    }
  }, [page]);

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return transactions;
    return transactions.filter((payment) => `${payment.identifier || ""} ${payment.tx_reference || ""} ${payment.phone_number || ""} ${payment.payment_method || ""}`.toLowerCase().includes(normalizedQuery));
  }, [transactions, query]);

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
        customer_id: formData.get("customerId") ? Number(formData.get("customerId")) : null,
        catalog_item_id: formData.get("catalogItemId") ? Number(formData.get("catalogItemId")) : null,
        expires_at: formData.get("expiresAt") ? new Date(String(formData.get("expiresAt"))).toISOString() : null,
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

  async function updateLinkStatus(id: number, status: PaymentLinkStatus, reason = ""): Promise<void> {
    try {
      const result = await api.updatePaymentLinkStatus(id, status, reason);
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
      setCustomerProfiles([]);
      setCatalogItems([]);
      setTransactions([]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La déconnexion a échoué.");
      setNoticeError(true);
    }
  }

  function openPayment(prefill: typeof paymentPrefill = {}): void {
    setPaymentPrefill(prefill);
    setShowPayment(true);
  }

  async function createQuickBackup(): Promise<void> {
    if (creatingBackup) return;
    setCreatingBackup(true);
    try {
      const result = await api.createBackup();
      downloadBlob(
        new Blob([JSON.stringify(result.document, null, 2)], { type: "application/json;charset=utf-8" }),
        `payflow-sauvegarde-${result.id}-${new Date().toISOString().slice(0, 10)}.json`,
      );
      setBackupRevision((value) => value + 1);
      const runningLocally = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      setNotice(
        result.fileName
          ? runningLocally
            ? "Sauvegarde créée et enregistrée dans Téléchargements ainsi que dans l’historique PayFlow."
            : "Sauvegarde créée dans PayFlow et téléchargement lancé."
          : "Sauvegarde téléchargée et conservée dans l’historique PayFlow.",
      );
      setNoticeError(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "La création de la sauvegarde a échoué.");
      setNoticeError(true);
    } finally {
      setCreatingBackup(false);
    }
  }

  if (!authReady) return <main className="auth-shell"><div className="auth-loading">Chargement de votre espace local…</div></main>;
  if (!user) return <AuthPage hasAccounts={hasAccounts} onAuthenticated={async (nextUser) => { setHasAccounts(true); setUser(nextUser); setNotice(""); await refreshData(); }} />;

  const reportNotice = (message: string, isError = false) => { setNotice(message); setNoticeError(isError); };
  const pageLabel = page === "settings" ? "Paramètres" : page === "support" ? "Aide & communauté" : navItems.find((item) => item.id === page)?.label || "Vue d’ensemble";
  let content: ReactNode;
  switch (page) {
    case "overview": content = <OverviewPage stats={stats} configured={configured} transactions={filteredTransactions} allTransactions={transactions} range={range} onRangeChange={setRange} onCreate={() => openPayment()} onNavigate={setPage} />; break;
    case "transactions": content = <TransactionsPage transactions={filteredTransactions} />; break;
    case "links": content = <LinkManagementPage links={filteredLinks} search={query} onCopy={copyLink} onStatusChange={updateLinkStatus} onRefresh={refreshData} onNotice={reportNotice} />; break;
    case "manualPayments": content = <ManualPaymentsPage search={query} onRefresh={refreshData} onNotice={reportNotice} />; break;
    case "customers": content = <CustomersPage search={query} onRefresh={refreshData} onNotice={reportNotice} onCreateLink={(customer) => openPayment({ description: customer.full_name || customer.company || "Commande client", phone: customer.phone_number, customerId: customer.id })} />; break;
    case "catalog": content = <CatalogPage search={query} onRefresh={refreshData} onNotice={reportNotice} onCreateLink={(item) => openPayment({ description: item.name, amount: item.amount, currency: item.currency, catalogItemId: item.id })} />; break;
    case "qrCodes": content = <QRCodesPage links={links} onNotice={reportNotice} />; break;
    case "exports": content = <ExportsPage onNotice={reportNotice} />; break;
    case "backups": content = <BackupsPage onRefresh={refreshData} onNotice={reportNotice} onRestoreComplete={() => setPage("overview")} backupRevision={backupRevision} />; break;
    case "downloads": content = <DownloadsGuidePage search={query} onNotice={reportNotice} />; break;
    case "analytics": content = <AdvancedAnalyticsPage onNotice={reportNotice} />; break;
    case "reminders": content = <RemindersPage search={query} onNotice={reportNotice} />; break;
    case "settings": content = <SettingsPage configured={configured} saving={savingSettings} onSave={saveSettings} />; break;
    case "support": content = <HelpCommunityPage onNavigate={setPage} />; break;
    default: content = <section className="panel page-error"><h1>Cette page n’existe pas.</h1><button className="button button-primary" onClick={() => setPage("overview")}>Retour à la vue d’ensemble</button></section>;
  }

  return (
    <>
      <DashboardLayout page={page} onNavigate={(nextPage: DashboardPageId) => { setPage(nextPage); setNotice(""); }} query={query} onQueryChange={setQuery} user={user} onLogout={logout} onCreateBackup={createQuickBackup} creatingBackup={creatingBackup}>
        <div className="dashboard-content" ref={pageRef}>
          {notice && <div className={`notice ${noticeError ? "notice-error" : ""}`} role={noticeError ? "alert" : "status"}><span>{notice.startsWith("https://") ? <><span>Lien prêt : </span><a className="payment-link" href={notice} target="_blank" rel="noreferrer">Ouvrir le lien de paiement</a><small className="payment-link-url">{notice}</small></> : notice}</span><button onClick={() => setNotice("")} aria-label="Fermer le message"><span aria-hidden="true">×</span></button></div>}
          <DashboardPageBoundary key={page} pageLabel={pageLabel} onReturnToOverview={() => setPage("overview")}>
            {content}
          </DashboardPageBoundary>
        </div>
      </DashboardLayout>
      {showPayment && <PaymentModal busy={busy} onClose={() => setShowPayment(false)} onSubmit={createLink} customers={customerProfiles} catalogItems={catalogItems} initialValues={paymentPrefill} />}
    </>
  );
}
