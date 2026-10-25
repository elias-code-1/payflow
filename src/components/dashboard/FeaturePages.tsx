import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import { formatDate, formatMoney } from "../../utils/formatters";
import { REMINDER_TEMPLATES, REMINDER_TEMPLATE_CATEGORIES, REMINDER_TEMPLATE_COUNT } from "../../data/reminderTemplates";
import pythonBackupSource from "../../../tools/backup_snapshot.py?raw";
import cBackupSource from "../../../tools/backup_verify.c?raw";
import type {
  AdvancedAnalytics,
  BackupDocument,
  BackupMetadata,
  CatalogItem,
  CurrencyCode,
  CustomerProfile,
  ManualPayment,
  ManualPaymentHistory,
  PaymentLink,
  PaymentLinkHistory,
  Reminder,
  ReminderLink,
} from "../../types";
import Icon from "../common/Icon";

function toLocalInput(value?: string | null): string {
  if (!value) return new Date().toISOString().slice(0, 16);
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function downloadBlob(blob: Blob, filename: string): void {
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

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture du fichier impossible."));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsText(file);
  });
}

const BACKUP_COUNT_LABELS: Record<string, string> = {
  customers: "Clients",
  catalogItems: "Articles",
  paymentLinks: "Liens",
  manualPayments: "Encaissements",
  paymentLinkHistory: "Historique des liens",
  manualPaymentHistory: "Historique des encaissements",
  paymentReminders: "Relances",
};

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="feature-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function EmptyRows({ title, description }: { title: string; description: string }) {
  return <div className="table-empty"><strong>{title}</strong><span>{description}</span></div>;
}

async function refreshDashboard(onRefresh: () => Promise<void>): Promise<boolean> {
  try { await onRefresh(); return true; }
  catch { return false; }
}

interface ManualPaymentsPageProps {
  search: string;
  onNotice: (message: string, isError?: boolean) => void;
  onRefresh: () => Promise<void>;
}

export function ManualPaymentsPage({ search, onNotice, onRefresh }: ManualPaymentsPageProps) {
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [editing, setEditing] = useState<ManualPayment | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<ManualPaymentHistory[]>([]);
  const [status, setStatus] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [method, setMethod] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    Promise.all([api.getManualPayments({ status: status === "all" ? undefined : status, currency: currency === "all" ? undefined : currency, method: method === "all" ? undefined : method, customerId: customerFilter === "all" ? undefined : customerFilter, from: from || undefined, to: to || undefined }), api.getPaymentLinks(), api.getCustomerProfiles()])
      .then(([nextPayments, nextLinks, nextCustomers]) => { setPayments(nextPayments); setLinks(nextLinks); setCustomers(nextCustomers); })
      .catch((error: unknown) => onNotice(error instanceof Error ? error.message : "Chargement des encaissements impossible.", true));
  }, [status, currency, method, customerFilter, from, to, refresh]);

  const rows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return payments.filter((row) => !normalized || `${row.reference} ${row.note} ${row.method} ${row.link_identifier} ${row.customer_name} ${row.customer_phone}`.toLowerCase().includes(normalized));
  }, [payments, search]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      amount: Number(String(data.get("amount")).replace(",", ".")),
      currency: String(data.get("currency")) as CurrencyCode,
      method: String(data.get("method") || ""),
      reference: String(data.get("reference") || ""),
      paidAt: new Date(String(data.get("paidAt"))).toISOString(),
      note: String(data.get("note") || ""),
      customerId: data.get("customerId") ? Number(data.get("customerId")) : null,
      paymentLinkId: data.get("paymentLinkId") ? Number(data.get("paymentLinkId")) : null,
    };
    try {
      const wasEditing = Boolean(editing);
      if (editing) {
        const reason = window.prompt("Motif de cette modification (obligatoire) :")?.trim();
        if (!reason) { setBusy(false); return; }
        await api.updateManualPayment(editing.id, { ...payload, reason });
      } else {
        await api.createManualPayment(payload);
      }
      setEditing(null);
      form.reset();
      setRefresh((value) => value + 1);
      if (!await refreshDashboard(onRefresh)) { onNotice("Encaissement enregistré, mais le dashboard n’a pas pu s’actualiser.", true); return; }
      onNotice(wasEditing ? "Encaissement modifié. La modification est conservée dans son historique." : "Encaissement saisi manuellement.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "Enregistrement impossible.", true); }
    finally { setBusy(false); }
  }

  async function toggleHistory(id: number) {
    if (historyId === id) { setHistoryId(null); return; }
    try { setHistory(await api.getManualPaymentHistory(id)); setHistoryId(id); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Historique indisponible.", true); }
  }

  async function changeStatus(payment: ManualPayment) {
    const next = payment.status === "confirmed" ? "void" : "confirmed";
    const reason = window.prompt(next === "void" ? "Motif de l’annulation (obligatoire) :" : "Motif de la réactivation (obligatoire) :")?.trim();
    if (!reason) return;
    try {
      await api.setManualPaymentStatus(payment.id, next, reason);
      if (!await refreshDashboard(onRefresh)) { setRefresh((value) => value + 1); onNotice("Statut enregistré, mais le dashboard n’a pas pu s’actualiser.", true); return; }
      onNotice(next === "void" ? "Saisie annulée; elle reste visible dans l’historique." : "Saisie réactivée.");
      setRefresh((value) => value + 1);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Statut non modifié.", true); }
  }

  return <section className="panel full-panel feature-page">
    <PageHeading eyebrow="SUIVI MANUEL" title="Encaissements" description="Saisissez les règlements observés. PayFlow ne vérifie pas leur statut auprès du fournisseur." />
    <details className="feature-form disclosure-form" open={!editing}>
      <summary>{editing ? `Modifier l’encaissement #${editing.id}` : "Ajouter un encaissement observé"}</summary>
      <form onSubmit={submit} key={editing?.id || "new-manual-payment"}>
        <label>Montant<input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} /></label>
        <label>Devise<select name="currency" defaultValue={editing?.currency || "XOF"}><option value="XOF">XOF · FCFA</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
        <label>Date et heure<input name="paidAt" type="datetime-local" required defaultValue={toLocalInput(editing?.paid_at)} /></label>
        <label>Méthode<input name="method" required maxLength={60} placeholder="Espèces, T-Money…" defaultValue={editing?.method} /></label>
        <label>Client (facultatif)<select name="customerId" defaultValue={editing?.customer_id || ""}><option value="">Aucun client</option>{customers.filter((customer) => !customer.archived_at).map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || customer.phone_number || customer.email}</option>)}</select></label>
        <label>Lien associé (facultatif)<select name="paymentLinkId" defaultValue={editing?.payment_link_id || ""}><option value="">Aucun lien</option>{links.map((link) => <option key={link.id} value={link.id}>{link.identifier} · {link.description}</option>)}</select></label>
        <label>Référence facultative<input name="reference" maxLength={180} defaultValue={editing?.reference} /></label>
        <label className="feature-span">Note privée<textarea name="note" maxLength={2000} defaultValue={editing?.note} /></label>
        {editing && <div className="feature-inline-note feature-span">La modification demande un motif et sera ajoutée à l’historique local.</div>}
        <div className="feature-form-actions feature-span"><button className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer la modification" : "Enregistrer l’encaissement"}</button>{editing && <button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Annuler</button>}</div>
      </form>
    </details>
    <div className="feature-filter-grid"><label>Statut<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option><option value="confirmed">Confirmés</option><option value="void">Annulés</option></select></label><label>Devise<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="all">Toutes</option><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label><label>Méthode<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="all">Toutes</option>{[...new Set(payments.map((payment) => payment.method))].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label>Client<select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)}><option value="all">Tous</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || customer.phone_number || customer.email}</option>)}</select></label><label>Du<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Au<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><span className="feature-filter-hint">{rows.length} saisie(s) · valeurs par devise</span></div>
    {!rows.length ? <EmptyRows title="Aucun encaissement correspondant" description="Ajoutez un règlement observé ou modifiez les filtres." /> : <div className="table-scroll"><table><thead><tr><th>DATE</th><th>CLIENT / LIEN</th><th>MÉTHODE</th><th>MONTANT</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{rows.map((payment) => <React.Fragment key={payment.id}><tr>
      <td>{formatDate(payment.paid_at, { dateStyle: "medium", timeStyle: "short" })}<small className="feature-muted">Saisi manuellement</small></td>
      <td><strong>{payment.customer_name || payment.customer_phone || payment.link_identifier || "Sans association"}</strong><small className="feature-muted">{payment.link_identifier || payment.reference || "—"}</small></td>
      <td>{payment.method}</td><td><strong>{formatMoney(payment.amount, payment.currency)}</strong></td>
      <td><span className={`feature-status ${payment.status}`}>{payment.status === "confirmed" ? "Confirmé · manuel" : "Annulé"}</span></td>
      <td><div className="feature-actions"><button onClick={() => { setEditing(payment); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Modifier</button><button onClick={() => changeStatus(payment)}>{payment.status === "confirmed" ? "Annuler" : "Réactiver"}</button><button onClick={() => toggleHistory(payment.id)}>{historyId === payment.id ? "Masquer l’historique" : "Historique"}</button></div></td>
    </tr>{historyId === payment.id && <tr><td colSpan={6}><div className="feature-history">{history.length ? history.map((item) => <article key={item.id}><strong>{formatDate(item.changed_at, { dateStyle: "medium", timeStyle: "short" })}</strong><span>{item.reason}</span><small>{JSON.stringify(item.old_values)} → {JSON.stringify(item.new_values)}</small></article>) : <span>Aucune modification enregistrée.</span>}</div></td></tr>}</React.Fragment>)}</tbody></table></div>}
  </section>;
}

interface CustomersPageProps {
  search: string;
  onNotice: (message: string, isError?: boolean) => void;
  onCreateLink: (customer: CustomerProfile) => void;
  onRefresh: () => Promise<void>;
}

export function CustomersPage({ search, onNotice, onCreateLink, onRefresh }: CustomersPageProps) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [selected, setSelected] = useState<CustomerProfile | null>(null);
  const [details, setDetails] = useState<Awaited<ReturnType<typeof api.getCustomerProfile>> | null>(null);
  const [editing, setEditing] = useState<CustomerProfile | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [mergeTarget, setMergeTarget] = useState("");
  const [mergePreview, setMergePreview] = useState<{ target: CustomerProfile; sources: CustomerProfile[]; links: number; receipts: number } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getCustomerProfiles({ q: search || undefined, archived: showArchived ? "true" : "false", from: activityFrom || undefined, to: activityTo || undefined })
      .then(setCustomers).catch((error: unknown) => onNotice(error instanceof Error ? error.message : "Chargement des clients impossible.", true));
  }, [search, showArchived, activityFrom, activityTo, refresh]);

  const activeSelected = selectedIds.filter((id) => customers.some((customer) => customer.id === id));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: Partial<CustomerProfile> = {
      full_name: String(data.get("full_name") || ""),
      phone_number: String(data.get("phone_number") || ""),
      email: String(data.get("email") || ""),
      company: String(data.get("company") || ""),
      address: String(data.get("address") || ""),
      tags: String(data.get("tags") || ""),
      notes: String(data.get("notes") || ""),
    };
    try {
      const result = editing ? await api.updateCustomerProfile(editing.id, input) : await api.createCustomerProfile(input);
      setEditing(null);
      setRefresh((value) => value + 1);
      form.reset();
      const updated = result.potentialDuplicates.length ? `Fiche enregistrée. Doublons potentiels à vérifier : ${result.potentialDuplicates.map((row) => row.full_name || row.email || row.phone_number).join(", ")}.` : "Fiche client enregistrée.";
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? updated : `${updated} Le dashboard n’a pas pu s’actualiser.`, !refreshed);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Enregistrement du client impossible.", true); }
    finally { setBusy(false); }
  }

  async function openDetails(customer: CustomerProfile) {
    setSelected(customer);
    setDetails(null);
    try { setDetails(await api.getCustomerProfile(customer.id)); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Fiche client indisponible.", true); }
  }

  async function archive(customer: CustomerProfile) {
    try {
      await api.setCustomerArchived(customer.id, !customer.archived_at);
      setRefresh((value) => value + 1);
      if (selected?.id === customer.id) setSelected(null);
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? (customer.archived_at ? "Fiche client restaurée." : "Fiche archivée; les liens et encaissements restent conservés.") : "Archivage enregistré, mais le dashboard n’a pas pu s’actualiser.", !refreshed);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Archivage impossible.", true); }
  }

  async function removeCustomer(customer: CustomerProfile, mode: "delete" | "anonymize") {
    const text = mode === "anonymize"
      ? "Anonymiser les coordonnées et notes de ce client? Les liens et encaissements garderont leur historique."
      : "Supprimer cette fiche sans historique associé? L’action est définitive.";
    if (!window.confirm(text)) return;
    try {
      await api.deleteCustomer(customer.id, mode);
      setRefresh((value) => value + 1);
      setSelected(null);
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? (mode === "anonymize" ? "Coordonnées du client anonymisées." : "Fiche client supprimée.") : "Modification enregistrée, mais le dashboard n’a pas pu s’actualiser.", !refreshed);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Suppression impossible.", true); }
  }

  async function previewMerge() {
    const targetId = Number(mergeTarget);
    const sourceIds = activeSelected.filter((id) => id !== targetId);
    if (!targetId || !sourceIds.length) { onNotice("Choisissez une fiche cible et au moins une fiche source.", true); return; }
    try { setMergePreview(await api.previewCustomerMerge(targetId, sourceIds)); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Prévisualisation impossible.", true); }
  }

  async function confirmMerge() {
    if (!mergePreview || !window.confirm(`Fusionner ${mergePreview.sources.length} fiche(s) dans ${mergePreview.target.full_name || mergePreview.target.email || mergePreview.target.phone_number}? ${mergePreview.links} lien(s) et ${mergePreview.receipts} encaissement(s) seront rattachés à la fiche cible.`)) return;
    try {
      await api.mergeCustomers(mergePreview.target.id, mergePreview.sources.map((row) => row.id));
      setMergePreview(null); setSelectedIds([]); setRefresh((value) => value + 1);
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? "Fusion terminée. L’historique des liens et encaissements est conservé." : "Fusion terminée, mais le dashboard n’a pas pu s’actualiser.", !refreshed);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Fusion impossible.", true); }
  }

  return <section className="panel full-panel feature-page">
    <PageHeading eyebrow="RELATION CLIENT" title="Clients" description="Coordonnées, historique local, tags et fiches archivées de ce compte." action={<button className="button button-secondary" onClick={() => setShowArchived((value) => !value)}>{showArchived ? "Voir les fiches actives" : "Voir les archives"}</button>} />
    <details className="feature-form disclosure-form" open={!editing}><summary>{editing ? `Modifier ${editing.full_name || editing.email || editing.phone_number}` : "Créer une fiche client"}</summary>
      <form onSubmit={submit} key={editing?.id || "new-customer-profile"}>
        <label>Nom<input name="full_name" maxLength={180} defaultValue={editing?.full_name} /></label><label>Téléphone<input name="phone_number" type="tel" maxLength={80} defaultValue={editing?.phone_number} /></label>
        <label>E-mail<input name="email" type="email" maxLength={254} defaultValue={editing?.email} /></label><label>Entreprise<input name="company" maxLength={180} defaultValue={editing?.company} /></label>
        <label>Adresse<input name="address" maxLength={400} defaultValue={editing?.address} /></label><label>Tags, séparés par des virgules<input name="tags" maxLength={500} defaultValue={editing?.tags} placeholder="VIP, boutique…" /></label>
        <label className="feature-span">Notes privées<textarea name="notes" maxLength={4000} defaultValue={editing?.notes} /></label>
        <div className="feature-form-actions feature-span"><button className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer les changements" : "Créer la fiche"}</button>{editing && <button type="button" className="button button-secondary" onClick={() => setEditing(null)}>Annuler</button>}</div>
      </form>
    </details>
    <div className="feature-filter-grid"><label>Activité à partir du<input type="date" value={activityFrom} onChange={(event) => setActivityFrom(event.target.value)} /></label><label>Activité jusqu’au<input type="date" value={activityTo} onChange={(event) => setActivityTo(event.target.value)} /></label><span className="feature-filter-hint">{customers.length} fiche(s) {showArchived ? "archivée(s)" : "active(s)"}. La recherche couvre nom, téléphone, e-mail, entreprise et tags.</span></div>
    {customers.length ? <div className="table-scroll"><table><thead><tr><th>FUSION</th><th>CLIENT</th><th>COORDONNÉES</th><th>ACTIVITÉ</th><th>ACTIONS</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id}>
      <td><input type="checkbox" aria-label={`Sélectionner ${customer.full_name || customer.email || customer.phone_number}`} checked={selectedIds.includes(customer.id)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, customer.id] : ids.filter((id) => id !== customer.id))} /></td>
      <td><button className="feature-link-button" onClick={() => openDetails(customer)}><strong>{customer.full_name || "Client sans nom"}</strong></button><small className="feature-muted">{customer.company || customer.tags || "—"}</small></td>
      <td>{customer.phone_number || "—"}<small className="feature-muted">{customer.email || ""}</small></td><td>{customer.link_count || 0} lien(s) · {customer.receipt_count || 0} encaissement(s)<small className="feature-muted">Dernière activité : {formatDate(customer.last_activity)}</small></td>
      <td><div className="feature-actions"><button onClick={() => { setEditing(customer); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Modifier</button><button onClick={() => archive(customer)}>{customer.archived_at ? "Restaurer" : "Archiver"}</button><button onClick={() => removeCustomer(customer, "anonymize")}>Anonymiser</button><button disabled={Boolean(customer.link_count || customer.receipt_count)} title={customer.link_count || customer.receipt_count ? "Un historique est associé; anonymisez la fiche pour le conserver." : "Supprimer définitivement cette fiche"} onClick={() => removeCustomer(customer, "delete")}>Supprimer</button></div></td>
    </tr>)}</tbody></table></div> : <EmptyRows title={showArchived ? "Aucune fiche archivée" : "Aucun client trouvé"} description="Créez une fiche ou modifiez votre recherche." />}
    {activeSelected.length > 1 && <div className="merge-panel"><strong>Fusion contrôlée de doublons</strong><div className="merge-controls"><label>Fiche à conserver<select value={mergeTarget} onChange={(event) => { setMergeTarget(event.target.value); setMergePreview(null); }}><option value="">Choisir la cible</option>{customers.filter((customer) => activeSelected.includes(customer.id)).map((customer) => <option value={customer.id} key={customer.id}>{customer.full_name || customer.email || customer.phone_number}</option>)}</select></label><button className="button button-secondary" onClick={previewMerge}>Prévisualiser</button></div>{mergePreview && <div className="merge-preview"><p>{mergePreview.sources.length} fiche(s) source, {mergePreview.links} lien(s) et {mergePreview.receipts} encaissement(s) à rattacher. Les coordonnées de la fiche cible seront conservées.</p><button className="button button-primary" onClick={confirmMerge}>Confirmer la fusion</button></div>}</div>}
    {selected && details && <div className="feature-detail"><div className="detail-heading"><div><div className="eyebrow">FICHE CLIENT</div><h2>{selected.full_name || selected.email || selected.phone_number}</h2></div><button className="button button-primary" disabled={Boolean(selected.archived_at)} title={selected.archived_at ? "Restaurez cette fiche avant de créer un lien." : undefined} onClick={() => onCreateLink(selected)}><Icon name="plus" size={16} /> Créer un lien</button></div>
      <p>{[selected.company, selected.phone_number, selected.email, selected.address].filter(Boolean).join(" · ") || "Aucune coordonnée enregistrée"}</p>
      {details.totals.map((total) => <span className="feature-total-chip" key={total.currency}>{formatMoney(total.amount, total.currency as CurrencyCode)} · {total.count} règlement(s) confirmé(s)</span>)}
      {selected.notes && <p className="feature-note">Note privée : {selected.notes}</p>}
      <h3>Liens créés</h3><div className="compact-records">{details.links.length ? details.links.map((link) => <article key={link.id}><strong>{link.description}</strong><span>{formatMoney(link.display_amount ?? link.amount, link.currency)} · {link.status}</span><small>{link.identifier} · {formatDate(link.created_at)}</small></article>) : <span>Aucun lien associé.</span>}</div>
      <h3>Encaissements associés</h3><div className="compact-records">{details.receipts.length ? details.receipts.map((receipt) => <article key={receipt.id}><strong>{formatMoney(receipt.amount, receipt.currency)} · {receipt.method}</strong><span>{receipt.status === "confirmed" ? "Confirmé · manuel" : "Annulé"}</span><small>{receipt.link_identifier || receipt.reference || "Sans lien"} · {formatDate(receipt.paid_at)}</small></article>) : <span>Aucun encaissement associé.</span>}</div>
      <button className="button button-secondary" onClick={() => { setSelected(null); setDetails(null); }}>Fermer la fiche</button>
    </div>}
  </section>;
}

interface CatalogPageProps {
  search: string;
  onNotice: (message: string, isError?: boolean) => void;
  onCreateLink: (item: CatalogItem) => void;
  onRefresh: () => Promise<void>;
}

export function CatalogPage({ search, onNotice, onCreateLink, onRefresh }: CatalogPageProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [category, setCategory] = useState("all");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState<Awaited<ReturnType<typeof api.getCatalogItem>> | null>(null);

  useEffect(() => {
    api.getCatalogItems({ q: search || undefined, archived: showArchived ? "true" : "false" })
      .then(setItems).catch((error: unknown) => onNotice(error instanceof Error ? error.message : "Chargement du catalogue impossible.", true));
  }, [search, showArchived, refresh]);

  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
  const visibleItems = category === "all" ? items : items.filter((item) => item.category === category);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = { name: String(data.get("name") || ""), description: String(data.get("description") || ""), sku: String(data.get("sku") || ""), amount: Number(data.get("amount")), currency: String(data.get("currency")) as CurrencyCode, category: String(data.get("category") || "") };
    try {
      if (editing) await api.updateCatalogItem(editing.id, input); else await api.createCatalogItem(input);
      setEditing(null); setRefresh((value) => value + 1); form.reset();
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? "Article de catalogue enregistré. Les liens existants gardent leur instantané." : "Article enregistré, mais le dashboard n’a pas pu s’actualiser.", !refreshed);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Enregistrement impossible.", true); }
    finally { setBusy(false); }
  }

  async function archive(item: CatalogItem) {
    try { await api.setCatalogArchived(item.id, !item.archived_at); setRefresh((value) => value + 1); const refreshed = await refreshDashboard(onRefresh); onNotice(refreshed ? (item.archived_at ? "Article restauré." : "Article archivé; ses anciens liens restent consultables.") : "Modification enregistrée, mais le dashboard n’a pas pu s’actualiser.", !refreshed); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Archivage impossible.", true); }
  }

  async function duplicate(item: CatalogItem) {
    try { await api.duplicateCatalogItem(item.id); setRefresh((value) => value + 1); const refreshed = await refreshDashboard(onRefresh); onNotice(refreshed ? "Article dupliqué." : "Article dupliqué, mais le dashboard n’a pas pu s’actualiser.", !refreshed); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Duplication impossible.", true); }
  }

  return <section className="panel full-panel feature-page">
    <PageHeading eyebrow="OFFRE COMMERCIALE" title="Catalogue" description="Articles réutilisables pour préparer des liens cohérents. Le lien conserve le prix utilisé lors de sa création." action={<button className="button button-secondary" onClick={() => setShowArchived((value) => !value)}>{showArchived ? "Voir les articles actifs" : "Voir les archives"}</button>} />
    <details className="feature-form disclosure-form" open={!editing}><summary>{editing ? `Modifier ${editing.name}` : "Ajouter un article"}</summary><form onSubmit={submit} key={editing?.id || "new-catalog-item"}>
      <label>Nom<input name="name" required maxLength={180} defaultValue={editing?.name} /></label><label>Référence SKU<input name="sku" maxLength={80} defaultValue={editing?.sku} /></label>
      <label>Prix<input name="amount" type="number" min="0.01" step="0.01" required defaultValue={editing?.amount} /></label><label>Devise<select name="currency" defaultValue={editing?.currency || "XOF"}><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
      <label>Catégorie<input name="category" maxLength={100} defaultValue={editing?.category} /></label><label>Description<input name="description" maxLength={1000} defaultValue={editing?.description} /></label>
      <div className="feature-form-actions feature-span"><button className="button button-primary" disabled={busy}>{busy ? "Enregistrement…" : editing ? "Enregistrer" : "Créer l’article"}</button>{editing && <button className="button button-secondary" type="button" onClick={() => setEditing(null)}>Annuler</button>}</div>
    </form></details>
    <div className="feature-filter-grid"><label>Catégorie<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Toutes les catégories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><span className="feature-filter-hint">{visibleItems.length} article(s) affiché(s)</span></div>
    {visibleItems.length ? <div className="table-scroll"><table><thead><tr><th>ARTICLE</th><th>RÉFÉRENCE / CATÉGORIE</th><th>PRIX</th><th>LIENS / VENTES MANUELLES</th><th>ACTIONS</th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}>
      <td><strong>{item.name}</strong><small className="feature-muted">{item.description}</small></td><td>{item.sku || "—"}<small className="feature-muted">{item.category || "Sans catégorie"}</small></td><td><strong>{formatMoney(item.amount, item.currency)}</strong></td>
      <td>{item.link_count || 0} lien(s) · {item.paid_link_count || 0} marqué(s) payé(s)<button className="feature-link-button" onClick={async () => { setDetails(null); try { setDetails(await api.getCatalogItem(item.id)); } catch (error) { onNotice(error instanceof Error ? error.message : "Historique indisponible.", true); } }}>Voir les ventes</button></td>
      <td><div className="feature-actions"><button disabled={Boolean(item.archived_at)} onClick={() => onCreateLink(item)}>Créer un lien</button><button onClick={() => { setEditing(item); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Modifier</button><button disabled={Boolean(item.archived_at)} onClick={() => duplicate(item)}>Dupliquer</button><button onClick={() => archive(item)}>{item.archived_at ? "Restaurer" : "Archiver"}</button></div></td>
    </tr>)}</tbody></table></div> : <EmptyRows title={showArchived ? "Aucun article archivé" : "Catalogue vide"} description="Ajoutez un produit ou un service fréquemment vendu." />}
    {details && <div className="feature-detail"><div className="detail-heading"><h2>Liens de {details.item.name}</h2><button className="button button-secondary" onClick={() => setDetails(null)}>Fermer</button></div><div className="feature-filters">{details.sales.length ? details.sales.map((sale) => <span key={sale.currency}>{formatMoney(sale.amount, sale.currency as CurrencyCode)} · {sale.count} lien(s) marqué(s) payé(s)</span>) : <span>Aucune vente manuellement confirmée.</span>}</div><div className="compact-records">{details.links.map((link) => <article key={link.id}><strong>{link.description}</strong><span>{formatMoney(link.display_amount ?? link.amount, link.currency)} · {link.status}</span><small>{link.identifier} · {formatDate(link.created_at)}</small></article>)}</div></div>}
  </section>;
}

interface LinkManagementPageProps {
  links: PaymentLink[];
  search: string;
  onNotice: (message: string, isError?: boolean) => void;
  onCopy: (value: string) => void;
  onStatusChange: (id: number, status: PaymentLink["status"], reason?: string) => void;
  onRefresh: () => void;
}

export function LinkManagementPage({ links, search, onNotice, onCopy, onStatusChange, onRefresh }: LinkManagementPageProps) {
  const [status, setStatus] = useState("all");
  const [currency, setCurrency] = useState("all");
  const [method, setMethod] = useState("all");
  const [customerId, setCustomerId] = useState("all");
  const [catalogItemId, setCatalogItemId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [history, setHistory] = useState<PaymentLinkHistory[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<PaymentLink | null>(null);

  const customers = useMemo(() => [...new Map(links.filter((link) => link.customer_id).map((link) => [link.customer_id, { id: Number(link.customer_id), name: link.customer_name || link.phone_number || `Client #${link.customer_id}` }])).values()], [links]);
  const methods = useMemo(() => [...new Set(links.map((link) => link.payment_method).filter(Boolean))], [links]);
  const items = useMemo(() => [...new Map(links.filter((link) => link.catalog_item_id).map((link) => [link.catalog_item_id, { id: Number(link.catalog_item_id), name: link.catalog_item_name || `Article #${link.catalog_item_id}` }])).values()], [links]);
  const visible = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const lowerBound = minimum ? Number(minimum) : null;
    const upperBound = maximum ? Number(maximum) : null;
    return links.filter((link) => {
      const expired = Boolean(link.status === "pending" && link.expires_at && new Date(String(link.expires_at).replace(" ", "T") + "Z").getTime() <= Date.now());
      const displayStatus = link.archived_at ? "archived" : expired ? "expired" : link.status;
      const date = String(link.created_at).slice(0, 10);
      const amount = Number(link.display_amount ?? link.amount);
      const queryMatches = !normalized || `${link.identifier} ${link.description} ${link.phone_number} ${link.payment_method} ${link.customer_name} ${link.catalog_item_name}`.toLowerCase().includes(normalized);
      return (includeArchived || status === "archived" || !link.archived_at)
        && (status === "all" || displayStatus === status)
        && (currency === "all" || link.currency === currency)
        && (method === "all" || link.payment_method === method)
        && (customerId === "all" || String(link.customer_id || "") === customerId)
        && (catalogItemId === "all" || String(link.catalog_item_id || "") === catalogItemId)
        && (!from || date >= from) && (!to || date <= to)
        && (lowerBound === null || amount >= lowerBound) && (upperBound === null || amount <= upperBound)
        && queryMatches;
    });
  }, [links, search, status, currency, method, customerId, catalogItemId, from, to, minimum, maximum, includeArchived]);
  const selectedVisibleIds = visible.filter((link) => selectedIds.includes(link.id)).map((link) => link.id);

  async function updateLifecycle(link: PaymentLink, patch: { archived?: boolean; expiresAt?: string | null; reason?: string }) {
    try { await api.changePaymentLinkLifecycle(link.id, patch); onRefresh(); onNotice("Cycle de vie du lien mis à jour. L’URL chez le fournisseur n’est pas désactivée par PayFlow."); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Modification du lien impossible.", true); }
  }

  async function duplicate(link: PaymentLink) {
    try { const result = await api.duplicatePaymentLink(link.id); onRefresh(); onNotice(`Nouveau lien créé : ${result.identifier}`); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Duplication impossible.", true); }
  }

  async function openHistory(id: number) {
    if (historyId === id) { setHistoryId(null); return; }
    try { setHistory(await api.getPaymentLinkHistory(id)); setHistoryId(id); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Historique indisponible.", true); }
  }

  async function bulkArchive() {
    if (!selectedVisibleIds.length || !window.confirm(`Archiver ${selectedVisibleIds.length} lien(s) dans PayFlow? Les URL externes peuvent encore fonctionner.`)) return;
    try {
      const result = await api.bulkArchivePaymentLinks(selectedVisibleIds);
      setSelectedIds((ids) => ids.filter((id) => !selectedVisibleIds.includes(id)));
      const refreshed = await refreshDashboard(onRefresh);
      onNotice(refreshed ? `${result.archived} lien(s) archivé(s) localement.` : `${result.archived} lien(s) archivé(s), mais le dashboard n’a pas pu s’actualiser.`, !refreshed);
    }
    catch (error) { onNotice(error instanceof Error ? error.message : "Archivage groupé impossible.", true); }
  }

  async function exportSelected() {
    if (!selectedVisibleIds.length || !window.confirm(`Exporter ${selectedVisibleIds.length} lien(s) sélectionné(s) en CSV? Le token des URL sera masqué.`)) return;
    try {
      const blob = await api.downloadExport("links", "csv", { ids: selectedVisibleIds.join(",") });
      downloadBlob(blob, `payflow-liens-selection-${new Date().toISOString().slice(0, 10)}.csv`);
      onNotice(`${selectedVisibleIds.length} lien(s) exporté(s) en CSV.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Export de la sélection impossible.", true); }
  }

  return <section className="panel full-panel feature-page">
    <PageHeading eyebrow="CYCLE DE VIE" title="Liens de paiement" description="Recherchez, filtrez, dupliquez et archivez vos liens. Les confirmations de paiement restent des saisies manuelles." />
    <div className="feature-filter-grid">
      <label>État<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option><option value="pending">En attente</option><option value="paid">Payé manuellement</option><option value="cancelled">Annulé</option><option value="expired">Expiré localement</option><option value="archived">Archivé</option></select></label>
      <label>Client<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="all">Tous</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
      <label>Produit / service<select value={catalogItemId} onChange={(event) => setCatalogItemId(event.target.value)}><option value="all">Tous</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>Devise<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="all">Toutes</option><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
      <label>Méthode<select value={method} onChange={(event) => setMethod(event.target.value)}><option value="all">Toutes</option>{methods.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Du<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Au<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label>Montant min.<input type="number" min="0" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></label><label>Montant max.<input type="number" min="0" value={maximum} onChange={(event) => setMaximum(event.target.value)} /></label>
      <label className="feature-check"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} /> Inclure les archives</label>
    </div>
    <div className="feature-filters"><span>{visible.length} lien(s) correspondant aux filtres.</span>{selectedVisibleIds.length > 0 && <div className="feature-actions"><button className="button button-secondary" onClick={exportSelected}>Exporter la sélection ({selectedVisibleIds.length})</button><button className="button button-secondary" onClick={bulkArchive}>Archiver la sélection ({selectedVisibleIds.length})</button></div>}</div>
    {!visible.length ? <EmptyRows title="Aucun lien correspondant" description="Modifiez les filtres ou créez un nouveau lien." /> : <div className="table-scroll"><table><thead><tr><th></th><th>DESCRIPTION / CLIENT</th><th>RÉFÉRENCE</th><th>DATE / EXPIRATION LOCALE</th><th>MONTANT</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>{visible.map((link) => {
      const expired = Boolean(link.status === "pending" && link.expires_at && new Date(String(link.expires_at).replace(" ", "T") + "Z").getTime() <= Date.now());
      const displayStatus = link.archived_at ? "archived" : expired ? "expired" : link.status;
      return <React.Fragment key={link.id}><tr>
        <td><input type="checkbox" aria-label={`Sélectionner ${link.identifier}`} checked={selectedIds.includes(link.id)} onChange={(event) => setSelectedIds((ids) => event.target.checked ? [...ids, link.id] : ids.filter((id) => id !== link.id))} /></td>
        <td><strong>{link.description}</strong><small className="feature-muted">{link.customer_name || link.phone_number || "Sans client"}{link.catalog_item_name ? ` · ${link.catalog_item_name}` : ""}</small></td>
        <td><span className="reference">{link.identifier}</span></td><td>{formatDate(link.created_at)}<small className={expired ? "feature-expired" : "feature-muted"}>{link.expires_at ? `Expire localement : ${formatDate(link.expires_at)}` : "Sans expiration locale"}</small></td>
        <td><strong>{formatMoney(link.display_amount ?? link.amount, link.currency)}</strong><small className="feature-muted">Envoyé : {formatMoney(link.amount, "XOF")}</small></td>
        <td><span className={`feature-status ${displayStatus}`}>{displayStatus === "archived" ? "Archivé" : displayStatus === "expired" ? "Expiré localement" : displayStatus === "paid" ? "Payé · manuel" : displayStatus === "cancelled" ? "Annulé" : "En attente"}</span>
          {!link.archived_at && <select value={link.status} aria-label={`Changer manuellement le statut de ${link.identifier}`} onChange={(event) => {
            const next = event.target.value as PaymentLink["status"];
            if (next === link.status) return;
            if (!window.confirm(`Confirmez-vous la saisie manuelle « ${next} » pour ${link.identifier}? PayFlow ne vérifie pas le paiement.`)) return;
            const reason = window.prompt("Motif facultatif :") || "";
            onStatusChange(link.id, next, reason);
          }}><option value="pending">En attente</option><option value="paid">Payé manuellement</option><option value="cancelled">Annulé</option></select>}
        </td>
        <td><div className="feature-actions"><button onClick={() => setSelectedDetail(link)}>Détails</button><button onClick={() => onCopy(link.payment_url)}>Copier URL</button><a href={link.payment_url} target="_blank" rel="noreferrer">Ouvrir</a><button disabled={Boolean(link.archived_at)} onClick={() => duplicate(link)}>Dupliquer</button><button onClick={() => { const value = window.prompt("Nouvelle expiration locale (AAAA-MM-JJTHH:mm). Laisser vide pour effacer :", link.expires_at ? toLocalInput(link.expires_at) : ""); if (value === null) return; const date = value ? new Date(value) : null; if (date && Number.isNaN(date.getTime())) { onNotice("Date d’expiration invalide.", true); return; } updateLifecycle(link, { expiresAt: date ? date.toISOString() : null }); }}>Expiration</button><button onClick={() => { if (!link.archived_at && !window.confirm("Archiver ce lien dans PayFlow? L’URL externe peut rester active.")) return; updateLifecycle(link, { archived: !link.archived_at, reason: link.archived_at ? "Restauration manuelle" : "Archivage manuel" }); }}>{link.archived_at ? "Restaurer" : "Archiver"}</button><button onClick={() => openHistory(link.id)}>{historyId === link.id ? "Masquer" : "Historique"}</button></div></td>
      </tr>{historyId === link.id && <tr><td colSpan={7}><div className="feature-history">{history.length ? history.map((item) => <article key={item.id}><strong>{item.action} · {formatDate(item.created_at, { dateStyle: "medium", timeStyle: "short" })}</strong><span>{item.reason || "Sans motif"}</span><small>{JSON.stringify(item.old_value)} → {JSON.stringify(item.new_value)}</small></article>) : <span>Aucun changement enregistré.</span>}</div></td></tr>}</React.Fragment>;
    })}</tbody></table></div>}
    {selectedDetail && <div className="feature-detail"><div className="detail-heading"><div><div className="eyebrow">FICHE LIEN · {selectedDetail.identifier}</div><h2>{selectedDetail.description}</h2></div><button className="button button-secondary" onClick={() => setSelectedDetail(null)}>Fermer</button></div><p>Montant affiché : {formatMoney(selectedDetail.display_amount ?? selectedDetail.amount, selectedDetail.currency)} · Montant transmis : {formatMoney(selectedDetail.amount, "XOF")}</p><p>Client : {selectedDetail.customer_name || selectedDetail.phone_number || "Aucun"} · Article : {selectedDetail.catalog_item_name || "Lien libre"}</p><p>Créé le {formatDate(selectedDetail.created_at, { dateStyle: "long", timeStyle: "short" })} · Statut mis à jour le {formatDate(selectedDetail.status_updated_at, { dateStyle: "long", timeStyle: "short" })} · Expiration locale : {formatDate(selectedDetail.expires_at, { dateStyle: "long", timeStyle: "short" })}</p><code className="feature-url">{selectedDetail.payment_url}</code><div className="feature-actions"><button onClick={() => onCopy(selectedDetail.payment_url)}>Copier l’URL</button><a href={selectedDetail.payment_url} target="_blank" rel="noreferrer">Ouvrir l’URL</a><button onClick={() => openHistory(selectedDetail.id)}>Afficher l’historique</button></div></div>}
    <p className="feature-warning">« Expiré » et « archivé » ne désactivent pas le lien chez PayGateGlobal. Vérifiez directement le fournisseur si son état externe est important.</p>
  </section>;
}

interface QRCodesPageProps { links: PaymentLink[]; onNotice: (message: string, isError?: boolean) => void; }

export function QRCodesPage({ links, onNotice }: QRCodesPageProps) {
  const [linkId, setLinkId] = useState("");
  const [label, setLabel] = useState("");
  const [size, setSize] = useState(512);
  const [png, setPng] = useState("");
  const [svg, setSvg] = useState("");
  const link = links.find((row) => String(row.id) === linkId) || null;

  useEffect(() => {
    let cancelled = false;
    setPng(""); setSvg("");
    if (!link) return () => { cancelled = true; };
    import("qrcode").then(async (module) => {
      const qr = module.default;
      const [pngData, svgData] = await Promise.all([
        qr.toDataURL(link.payment_url, { width: size, margin: 2, errorCorrectionLevel: "M" }),
        qr.toString(link.payment_url, { type: "svg", width: size, margin: 2, errorCorrectionLevel: "M" }),
      ]);
      if (!cancelled) { setPng(pngData); setSvg(svgData); }
    }).catch((error: unknown) => onNotice(error instanceof Error ? error.message : "Génération du QR code impossible.", true));
    return () => { cancelled = true; };
  }, [linkId, size, links]);

  return <section className="panel full-panel feature-page"><PageHeading eyebrow="PARTAGE PHYSIQUE" title="QR codes" description="Le QR encode uniquement l’URL déjà enregistrée. Sa création et son téléchargement ne créent aucun paiement." />
    <div className="qr-controls"><label>Lien<select value={linkId} onChange={(event) => setLinkId(event.target.value)}><option value="">Sélectionner un lien</option>{links.map((row) => <option key={row.id} value={row.id}>{row.description} · {row.identifier}</option>)}</select></label><label>Libellé imprimé, facultatif<input value={label} maxLength={120} onChange={(event) => setLabel(event.target.value)} placeholder="Ce texte reste hors du QR" /></label><label>Taille<select value={size} onChange={(event) => setSize(Number(event.target.value))}><option value={256}>256 px</option><option value={512}>512 px</option><option value={1024}>1024 px · impression</option></select></label></div>
    {!link ? <EmptyRows title="Choisissez un lien" description="Le QR code sera généré localement à partir de son URL enregistrée." /> : <div className="qr-preview-layout"><div className="qr-preview-card">{png ? <img className="qr-image" src={png} alt={`QR code vers le lien ${link.identifier}`} /> : <div className="qr-loading">Génération du QR code…</div>}{label && <strong className="qr-label">{label}</strong>}<div className="qr-link-caption">{link.description}<small>{link.identifier}</small></div></div><div className="qr-details"><h2>{link.description}</h2><p>{formatMoney(link.display_amount ?? link.amount, link.currency)} · {link.status === "paid" ? "Payé manuellement" : link.status === "cancelled" ? "Annulé" : "En attente"}</p><p className="feature-url">{link.payment_url}</p><div className="feature-actions"><button className="button button-primary" disabled={!png} onClick={() => { const anchor = document.createElement("a"); anchor.href = png; anchor.download = `payflow-${link.identifier}.png`; anchor.click(); }}>Télécharger PNG</button><button className="button button-secondary" disabled={!svg} onClick={() => downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `payflow-${link.identifier}.svg`)}>Télécharger SVG</button><a className="button button-secondary" href={link.payment_url} target="_blank" rel="noreferrer">Tester l’URL</a></div>{(link.archived_at || (link.expires_at && new Date(String(link.expires_at).replace(" ", "T") + "Z").getTime() <= Date.now())) && <p className="feature-warning">Ce lien est archivé ou expiré localement. Le QR ouvre toujours l’URL externe et ne la désactive pas.</p>}</div></div>}
  </section>;
}

const EXPORT_TYPES = [
  { value: "links", label: "Liens de paiement" },
  { value: "receipts", label: "Encaissements manuels" },
  { value: "customers", label: "Clients" },
  { value: "catalog", label: "Catalogue" },
  { value: "transactions", label: "Transactions sans double comptage" },
];

export function ExportsPage({ onNotice }: { onNotice: (message: string, isError?: boolean) => void }) {
  const [type, setType] = useState("links");
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [currency, setCurrency] = useState("all");
  const [status, setStatus] = useState("all");
  const [customerId, setCustomerId] = useState("all");
  const [includeSensitive, setIncludeSensitive] = useState(false);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [preview, setPreview] = useState<{ type: string; count: number; generatedAt: string; filters: Record<string, unknown> } | null>(null);
  const [previewKey, setPreviewKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.getCustomerProfiles({ archived: "all" }).then(setCustomers).catch(() => setCustomers([])); }, []);
  const supportsStatus = ["links", "receipts", "transactions"].includes(type);
  const supportsCurrency = type !== "customers";
  const supportsCustomer = ["links", "receipts", "transactions"].includes(type);
  const filters = {
    from,
    to,
    currency: supportsCurrency && currency !== "all" ? currency : undefined,
    status: supportsStatus && status !== "all" ? status : undefined,
    customerId: supportsCustomer && customerId !== "all" ? customerId : undefined,
    includeSensitive: includeSensitive ? "true" : "false",
  };
  const statusOptions = type === "links"
    ? [["pending", "En attente"], ["paid", "Payé"], ["cancelled", "Annulé"]]
    : [["confirmed", "Confirmé"], ["void", "Annulé · saisie"]];
  const currentPreviewKey = JSON.stringify({ type, filters });

  async function previewExport() {
    setBusy(true);
    try { setPreview(await api.previewExport(type, filters)); setPreviewKey(currentPreviewKey); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Prévisualisation impossible.", true); }
    finally { setBusy(false); }
  }

  async function downloadExport() {
    setBusy(true);
    try {
      const blob = await api.downloadExport(type, format, filters);
      downloadBlob(blob, `payflow-${type}-${new Date().toISOString().slice(0, 10)}.${format}`);
      onNotice(`${type.toUpperCase()} téléchargé en ${format.toUpperCase()}.`);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Export impossible.", true); }
    finally { setBusy(false); }
  }

  return <section className="panel full-panel feature-page"><PageHeading eyebrow="DONNÉES DU COMPTE" title="Exports" description="Prévisualisez le volume, choisissez les filtres et exportez les données de ce compte uniquement." />
    <div className="feature-form"><div className="feature-form-grid">
      <label>Catégorie<select value={type} onChange={(event) => { setType(event.target.value); setStatus("all"); setPreview(null); }}>{EXPORT_TYPES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select></label>
      <label>Format<select value={format} onChange={(event) => setFormat(event.target.value as "csv" | "json")}><option value="csv">CSV · tableur</option><option value="json">JSON</option></select></label>
      <label>Date de début<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Date de fin<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
      <label>Devise<select disabled={!supportsCurrency} value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="all">Toutes</option><option value="XOF">XOF</option><option value="EUR">EUR</option><option value="USD">USD</option></select></label>
      <label>Statut<select disabled={!supportsStatus} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous</option>{statusOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label>Client<select disabled={!supportsCustomer} value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="all">Tous les clients</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || customer.email || customer.phone_number}</option>)}</select></label>
      <label className="feature-check"><input type="checkbox" checked={includeSensitive} onChange={(event) => setIncludeSensitive(event.target.checked)} /> Inclure notes et coordonnées privées</label>
    </div>
      <p className="feature-warning">Les clés API et mots de passe ne sont jamais exportés. Le token est toujours masqué dans les URL et le téléphone l’est par défaut; les URL exportées ne sont donc pas directement utilisables. L’inclusion des notes et coordonnées est facultative.</p>
      <div className="feature-form-actions"><button className="button button-secondary" disabled={busy} onClick={previewExport}>{busy ? "Préparation…" : "Prévisualiser le nombre"}</button><button className="button button-primary" disabled={busy || !preview || previewKey !== currentPreviewKey} onClick={downloadExport}>{busy ? "Préparation…" : `Télécharger ${format.toUpperCase()}`}</button></div>
    </div>
    {preview && previewKey === currentPreviewKey && <div className="feature-detail"><h2>Prévisualisation</h2><p><strong>{preview.count}</strong> enregistrement(s) · {EXPORT_TYPES.find((entry) => entry.value === preview.type)?.label}</p><small>Généré le {formatDate(preview.generatedAt, { dateStyle: "long", timeStyle: "short" })}. Filtres appliqués : {JSON.stringify(preview.filters)}</small></div>}
  </section>;
}

export function BackupsPage({ onNotice, onRefresh, onRestoreComplete }: { onNotice: (message: string, isError?: boolean) => void; onRefresh: () => Promise<void>; onRestoreComplete?: () => void }) {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [verified, setVerified] = useState<BackupDocument | null>(null);
  const [verification, setVerification] = useState<{ valid: boolean; checksum: string; schemaVersion: number; generatedAt: string; counts: Record<string, number> } | null>(null);
  const [verifiedFileName, setVerifiedFileName] = useState("");
  const [fileFeedback, setFileFeedback] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [databasePath, setDatabasePath] = useState("./database.sqlite");
  const pythonCommand = `python3 backup_snapshot.py --db ${shellQuote(databasePath)} --output-dir ./backups --retain 7`;
  const cCommand = `cc -O2 -Wall -Wextra -o backup_verify backup_verify.c -lsqlite3 && ./backup_verify ${shellQuote(databasePath)}`;
  const latestAutomatic = backups.find((backup) => backup.source === "automatic-daily") || null;

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    api.getBackups().then((result) => { if (!cancelled) setBackups(result); })
      .catch((error: unknown) => { if (!cancelled) onNotice(error instanceof Error ? error.message : "Impossible de charger les copies enregistrées.", true); })
      .finally(() => { if (!cancelled) setLoadingHistory(false); });
    return () => { cancelled = true; };
  }, [refresh]);

  async function createBackup() {
    setBusy(true);
    try {
      const result = await api.createBackup();
      downloadBlob(new Blob([JSON.stringify(result.document, null, 2)], { type: "application/json;charset=utf-8" }), `payflow-sauvegarde-${result.id}-${new Date().toISOString().slice(0, 10)}.json`);
      setRefresh((value) => value + 1);
      const runningLocally = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      onNotice(result.fileName
        ? runningLocally
          ? "Copie enregistrée sur cet ordinateur et dans Téléchargements. Vous pourrez aussi la restaurer depuis PayFlow."
          : "Copie enregistrée dans PayFlow et téléchargement lancé. Vous pourrez aussi la restaurer depuis l’historique."
        : "Copie conservée dans l’historique PayFlow et téléchargement lancé, mais l’enregistrement côté application a échoué.", !result.fileName);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Création de sauvegarde impossible.", true); }
    finally { setBusy(false); }
  }

  async function verifyDocument(document: BackupDocument, fileName = "Fichier sélectionné") {
    setBusy(true);
    setFileFeedback("Vérification de la sauvegarde…");
    try {
      const result = await api.verifyBackup(document);
      setVerified(document); setVerification(result); setVerifiedFileName(fileName);
      setFileFeedback("Fichier reconnu. Vos données ne changeront qu’après avoir cliqué sur « Importer et restaurer ».");
      onNotice("Sauvegarde reconnue. Vérifiez son contenu puis cliquez sur « Importer et restaurer ».");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ce fichier ne ressemble pas à une sauvegarde PayFlow valide.";
      setVerified(null); setVerification(null); setVerifiedFileName(""); setFileFeedback(`Import impossible : ${message}`); onNotice(`Import impossible : ${message}`, true);
    }
    finally { setBusy(false); }
  }

  async function readFile(file?: File) {
    if (!file) return;
    setVerified(null); setVerification(null); setVerifiedFileName("");
    if (file.size > 20 * 1024 * 1024) { const message = "Ce fichier est trop volumineux (maximum 20 Mo)."; setFileFeedback(message); onNotice(message, true); return; }
    setFileFeedback(`Lecture de « ${file.name} »…`);
    try {
      const parsed: unknown = JSON.parse(await readFileText(file));
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Le fichier JSON ne contient pas de sauvegarde PayFlow.");
      await verifyDocument(parsed as BackupDocument, file.name);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Choisissez une sauvegarde PayFlow au format JSON.";
      setVerified(null); setVerification(null); setVerifiedFileName(""); setFileFeedback(`Import impossible : ${message}`); onNotice(`Import impossible : ${message}`, true);
    }
  }

  async function verifyStored(id: number) {
    setBusy(true);
    try { const document = await api.getBackup(id); await verifyDocument(document, `Copie du ${formatDate(document.generatedAt)}`); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Lecture de la sauvegarde impossible.", true); }
    finally { setBusy(false); }
  }

  async function downloadStored(id: number) {
    setBusy(true);
    try {
      const document = await api.getBackup(id);
      downloadBlob(new Blob([JSON.stringify(document, null, 2)], { type: "application/json;charset=utf-8" }), `payflow-sauvegarde-${id}.json`);
    } catch (error) { onNotice(error instanceof Error ? error.message : "Téléchargement impossible.", true); }
    finally { setBusy(false); }
  }

  async function copyCommand(command: string) {
    try { await navigator.clipboard.writeText(command); onNotice("Commande copiée."); }
    catch { onNotice("Copie impossible. Sélectionnez la commande affichée pour la copier.", true); }
  }

  async function restore() {
    if (!verified || !verification?.valid) return;
    if (!window.confirm(`Importer la copie du ${formatDate(verification.generatedAt)} et remplacer les données actuelles de ce compte ? PayFlow créera une copie de sécurité avant.`)) return;
    setBusy(true);
    try {
      const result = await api.restoreBackup(verified);
      setVerified(null); setVerification(null); setVerifiedFileName(""); setRefresh((value) => value + 1);
      try { await onRefresh(); }
      catch {
        setFileFeedback("Import terminé. Rechargez la page pour afficher les données restaurées.");
        onNotice("Import terminé, mais l’actualisation a échoué. Rechargez la page pour afficher les données.", true);
        return;
      }
      const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
      setFileFeedback(`Import terminé : ${total} élément(s) restauré(s).`);
      onNotice(`Import terminé. ${total} élément(s) restauré(s).`);
      onRestoreComplete?.();
    } catch (error) { onNotice(error instanceof Error ? error.message : "Restauration refusée; les données courantes sont conservées.", true); }
    finally { setBusy(false); }
  }

  async function restoreLatestAutomatic() {
    if (!latestAutomatic) return;
    if (!window.confirm(`Restaurer la sauvegarde automatique du ${formatDate(latestAutomatic.created_at)} ? Les données actuelles seront remplacées après création d’une copie de sécurité.`)) return;
    setBusy(true);
    try {
      const result = await api.restoreLatestAutomaticBackup();
      setRefresh((value) => value + 1);
      const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
      try {
        await onRefresh();
        onNotice(`Sauvegarde automatique restaurée. ${total} élément(s) récupéré(s).`);
      } catch {
        onNotice("Sauvegarde automatique restaurée. Rechargez la page pour afficher les données.", true);
      }
      onRestoreComplete?.();
    } catch (error) { onNotice(error instanceof Error ? error.message : "Restauration automatique impossible.", true); }
    finally { setBusy(false); }
  }

  return <section className="panel full-panel feature-page backup-page"><PageHeading eyebrow="VOS DONNÉES" title="Sauvegardes" description="Téléchargez une copie pour garder vos données en sécurité, ou restaurez une copie précédente." />
    <section className="backup-hero">
      <div className="backup-hero-icon"><Icon name="database" size={24} /></div>
      <div className="backup-hero-copy"><h2>Garder une copie de vos données</h2><p>Vos changements restent enregistrés dans PayFlow. Téléchargez aussi un fichier pour pouvoir récupérer vos données si vous changez d’appareil.</p></div>
      <button className="button button-primary" onClick={createBackup} disabled={busy}><Icon name="download" size={17} />{busy ? "Préparation de la copie…" : "Télécharger une sauvegarde"}</button>
    </section>
    <section className="backup-howto" aria-label="Comment sauvegarder et restaurer">
      <article><span>1</span><div><strong>Créer une copie</strong><small>Cliquez sur « Télécharger une sauvegarde ». PayFlow vérifie les données et prépare un fichier JSON.</small></div></article>
      <article><span>2</span><div><strong>Garder le fichier à part</strong><small>Enregistrez-le dans un endroit sûr, idéalement aussi sur un autre appareil ou une clé USB.</small></div></article>
      <article><span>3</span><div><strong>Récupérer vos données</strong><small>Choisissez le fichier ci-dessous, vérifiez le résumé, puis cliquez sur « Importer et restaurer maintenant ».</small></div></article>
    </section>
    <section className="backup-auto-restore">
      <div className="backup-option-icon"><Icon name="database" size={18} /></div>
      <div><h2>Sauvegarde automatique quotidienne</h2><p>PayFlow crée une copie au démarrage puis chaque jour pendant que l’application fonctionne. Si elle était fermée, la copie est créée au prochain démarrage. Les 30 dernières sont gardées.</p><small>{latestAutomatic ? `Dernière copie : ${formatDate(latestAutomatic.created_at, { dateStyle: "long", timeStyle: "short" })}` : loadingHistory ? "Recherche de la dernière copie…" : "La première copie sera créée au démarrage du serveur."}</small></div>
      <button className="button button-secondary" disabled={busy || !latestAutomatic} onClick={restoreLatestAutomatic}>{latestAutomatic ? "Restaurer la dernière copie" : "Aucune copie disponible"}</button>
    </section>
    <div className="backup-main-grid">
      <section className="backup-option"><div className="backup-option-icon"><Icon name="upload" size={18} /></div><div><h2>Importer une sauvegarde</h2><p>Choisissez un fichier PayFlow JSON (20 Mo maximum). Après vérification, cliquez sur « Importer et restaurer ».</p></div><label className="button button-secondary backup-file-button"><Icon name="upload" size={16} />Choisir mon fichier<input type="file" accept="application/json,.json" disabled={busy} onChange={(event) => { const input = event.currentTarget; const file = input.files?.[0]; input.value = ""; void readFile(file); }} /></label></section>
      <section className="backup-option backup-privacy"><div className="backup-option-icon"><Icon name="shield" size={18} /></div><div><h2>Votre fichier reste privé</h2><p>Il peut contenir des coordonnées et des liens de paiement. Gardez-le dans un endroit sûr et évitez de le partager.</p></div></section>
    </div>
    {fileFeedback && <div className={`backup-file-feedback ${fileFeedback.startsWith("Import impossible") ? "is-error" : ""}`} role={fileFeedback.startsWith("Import impossible") ? "alert" : "status"}>{fileFeedback}</div>}
    {verification && verified && <section className="backup-restore-ready"><div className="backup-ready-title"><span className="backup-ready-check"><Icon name="check" size={17} /></span><div><h2>Fichier vérifié · prêt à importer</h2><p>{verifiedFileName} · créé le {formatDate(verification.generatedAt, { dateStyle: "long", timeStyle: "short" })}</p></div></div><div className="backup-counts">{Object.entries(verification.counts).map(([key, count]) => <span key={key}>{BACKUP_COUNT_LABELS[key] || key} <strong>{count}</strong></span>)}</div><div className="feature-form-actions"><button className="button button-primary" disabled={busy} onClick={restore}>{busy ? "Importation en cours…" : "Importer et restaurer maintenant"}</button><button className="button button-secondary" disabled={busy} onClick={() => { setVerified(null); setVerification(null); setVerifiedFileName(""); setFileFeedback(""); }}>Annuler</button></div><small>Vos données actuelles seront remplacées. PayFlow crée une copie de sécurité avant l’import.</small></section>}
    <section className="backup-history"><div className="backup-history-heading"><div><h2>Copies enregistrées dans PayFlow</h2><p>Elles restent sur l’ordinateur ou le serveur qui héberge PayFlow. Téléchargez-en une pour la conserver ailleurs.</p></div><span className="feature-status">{backups.length} copie(s)</span></div>
      {loadingHistory ? <div className="backup-loading"><span className="spinner" /> Chargement des copies…</div> : backups.length ? <div className="backup-history-list">{backups.map((backup) => <article key={backup.id}><div><strong>{formatDate(backup.created_at, { dateStyle: "long", timeStyle: "short" })}</strong><small>{backup.source === "before-restore" ? "Copie automatique avant restauration" : backup.source === "automatic-daily" ? "Sauvegarde automatique quotidienne" : "Copie créée depuis PayFlow"}</small></div><div className="feature-actions"><button disabled={busy} onClick={() => verifyStored(backup.id)}>Restaurer</button><button disabled={busy} onClick={() => downloadStored(backup.id)}>Télécharger</button></div></article>)}</div> : <EmptyRows title="Aucune copie enregistrée" description="Votre première copie apparaîtra ici après le téléchargement." />}
    </section>
    <p className="backup-privacy-note">Les fichiers ne sont pas chiffrés. Ils contiennent des coordonnées et peuvent inclure un token dans certaines URL de paiement. Conservez-les dans un endroit personnel et sûr.</p>
    <details className="backup-advanced"><summary>Options avancées · outils Python et C</summary>
      <section className="backup-tools" aria-labelledby="backup-tools-title">
        <div className="detail-heading"><div><div className="eyebrow">POUR LES UTILISATEURS AVANCÉS</div><h2 id="backup-tools-title">Outils locaux de sauvegarde SQLite</h2></div></div>
        <p>Les scripts sont facultatifs et ne peuvent agir que sur un fichier SQLite accessible sur l’appareil qui les exécute. Depuis Render, utilisez les copies automatiques et le bouton de restauration ci-dessus : le navigateur ne peut pas ouvrir le disque du serveur.</p>
        <label className="backup-database-path">Emplacement du fichier SQLite<input value={databasePath} onChange={(event) => setDatabasePath(event.target.value)} spellCheck={false} /></label>
        <div className="backup-tool-grid">
          <article className="backup-tool-card"><h3>Créer une copie avec Python</h3><p>Copie cohérente, contrôle de l’intégrité et conservation des sept dernières copies valides.</p><pre><code>{pythonCommand}</code></pre><div className="feature-actions"><button onClick={() => copyCommand(pythonCommand)}>Copier la commande</button><button onClick={() => downloadBlob(new Blob([pythonBackupSource], { type: "text/x-python;charset=utf-8" }), "backup_snapshot.py")}>Télécharger le fichier Python</button></div><details className="backup-source-code"><summary>Afficher le code</summary><pre><code>{pythonBackupSource}</code></pre></details></article>
          <article className="backup-tool-card"><h3>Vérifier une copie avec C</h3><p>Contrôle le fichier en lecture seule. Un compilateur C et SQLite sont nécessaires.</p><pre><code>{cCommand}</code></pre><div className="feature-actions"><button onClick={() => copyCommand(cCommand)}>Copier la commande</button><button onClick={() => downloadBlob(new Blob([cBackupSource], { type: "text/x-c;charset=utf-8" }), "backup_verify.c")}>Télécharger le fichier C</button></div><details className="backup-source-code"><summary>Afficher le code</summary><pre><code>{cBackupSource}</code></pre></details></article>
        </div>
        <small className="feature-muted">Téléchargez le script avant d’utiliser sa commande. Les copies Python et les sauvegardes PayFlow ne sont pas chiffrées.</small>
      </section>
    </details>
  </section>;
}

export function AdvancedAnalyticsPage({ onNotice }: { onNotice: (message: string, isError?: boolean) => void }) {
  const initialTo = new Date().toISOString().slice(0, 10);
  const initialFrom = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [data, setData] = useState<AdvancedAnalytics | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    try { setData(await api.getAnalytics(from, to)); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Calcul des analyses impossible.", true); }
    finally { setBusy(false); }
  }

  useEffect(() => { void load(); }, []);

  function choosePeriod(days: number) {
    const end = new Date(`${to}T00:00:00Z`);
    if (Number.isNaN(end.getTime())) return;
    setFrom(new Date(end.getTime() - (days - 1) * 86400000).toISOString().slice(0, 10));
  }

  function exportGraph() {
    if (!data) return;
    const blob = new Blob([JSON.stringify({ period: { from: data.from, to: data.to }, daily: data.daily, monthly: data.monthly, currencies: data.currencies }, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `payflow-analytique-${data.from}-${data.to}.json`);
  }

  return <section className="panel full-panel feature-page"><PageHeading eyebrow="RAPPORTS LOCAUX" title="Analytique" description="Chaque revenu et taux est calculé à partir des saisies manuelles et présenté séparément par devise." />
    <div className="analytics-filter"><div className="analytics-presets" aria-label="Périodes prédéfinies"><button type="button" onClick={() => choosePeriod(7)}>7 jours</button><button type="button" onClick={() => choosePeriod(30)}>30 jours</button><button type="button" onClick={() => choosePeriod(90)}>90 jours</button></div><label>Du<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>Au<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label><button className="button button-primary" disabled={busy} onClick={load}>{busy ? "Calcul…" : "Appliquer la période"}</button><button className="button button-secondary" disabled={!data} onClick={exportGraph}>Exporter les données du graphique</button></div>
    {data && <><div className="feature-inline-note">Période {data.from} → {data.to} · comparaison {data.previousFrom} → {data.previousTo}. « Payé » signifie marqué manuellement dans PayFlow.</div>
      {!data.currencies.length ? <EmptyRows title="Aucune activité sur cette période" description="Les indicateurs apparaîtront après la création de liens ou la saisie d’encaissements." /> : data.currencies.map((summary) => <section className="analytics-currency" key={summary.currency}>
        <div className="analytics-currency-heading"><div><div className="eyebrow">DEVISE SÉPARÉE</div><h2>{summary.currency}</h2></div><span className="feature-status confirmed">Données saisies manuellement</span></div>
        <div className="analytics-metrics"><article><small>Revenus confirmés sans doublon</small><strong>{formatMoney(summary.revenue, summary.currency)}</strong><span>{summary.revenueChange === null ? "Pas de base de comparaison" : `${summary.revenueChange > 0 ? "+" : ""}${summary.revenueChange}% vs période précédente`}</span></article><article><small>Liens marqués payés</small><strong>{summary.paidLinks}</strong><span>sur {summary.eligibleLinks} liens éligibles</span></article><article><small>Taux opérationnel</small><strong>{summary.conversionRate}%</strong><span>{summary.paidLinks} / {summary.eligibleLinks} lien(s)</span></article><article><small>Encaissements saisis</small><strong>{summary.receiptCount}</strong><span>{formatMoney(summary.pendingAmount, summary.currency)} en attente · {formatMoney(summary.cancelledAmount, summary.currency)} annulés</span></article></div>
        <div className="analytics-split"><div><h3>Tendance journalière</h3>{(() => { const daily = data.daily.filter((row) => row.currency === summary.currency); const max = Math.max(...daily.map((row) => row.amount), 1); return daily.length ? <div className="analytics-bars" role="img" aria-label={`Revenus journaliers en ${summary.currency}`}>{daily.map((row) => <div key={row.date} title={`${row.date} · ${formatMoney(row.amount, summary.currency)}`}><i style={{ height: `${Math.max(4, (row.amount / max) * 100)}%` }} /><small>{row.date.slice(8)}</small></div>)}</div> : <div className="table-empty">Aucun revenu confirmé dans cette devise.</div>; })()}</div><div><h3>Par méthode</h3><div className="compact-records">{data.methods.filter((row) => row.currency === summary.currency).map((row) => <article key={row.method}><strong>{row.method}</strong><span>{formatMoney(row.amount, summary.currency)}</span></article>)}</div></div></div>
        <div className="analytics-split"><div><h3>Par article</h3><div className="compact-records">{data.products.filter((row) => row.currency === summary.currency).map((row) => <article key={row.itemId}><strong>{row.name}</strong><span>{formatMoney(row.amount, summary.currency)}</span></article>)}</div></div><div><h3>Par client</h3><div className="compact-records">{data.customers.filter((row) => row.currency === summary.currency).map((row) => <article key={row.customerId}><strong>{row.name}</strong><span>{formatMoney(row.amount, summary.currency)}</span></article>)}</div></div></div>
        <div><h3>Par mois</h3><div className="compact-records">{data.monthly.filter((row) => row.currency === summary.currency).length ? data.monthly.filter((row) => row.currency === summary.currency).map((row) => <article key={row.month}><strong>{row.month}</strong><span>{formatMoney(row.amount, summary.currency)}</span></article>) : <span>Aucun revenu confirmé dans cette devise.</span>}</div></div>
      </section>)}
      <details className="analytics-definitions"><summary>Définition des indicateurs</summary><ul><li>Un revenu correspond à un encaissement manuel confirmé ou à un lien marqué payé sans encaissement associé confirmé.</li><li>Un encaissement confirmé lié à un lien payé remplace ce lien dans le revenu agrégé pour éviter un double comptage.</li><li>Le taux opérationnel est le nombre de liens marqués payés divisé par les liens créés non annulés et non expirés avant la fin de la période.</li><li>Un lien ouvert n’est jamais considéré comme un paiement. Aucune donnée n’est reçue automatiquement du fournisseur.</li></ul></details>
    </>}
  </section>;
}

function reminderText(template: string, link: ReminderLink): string {
  const name = (link.customer_name || link.customer_email || "").trim().split(/\s+/)[0] || "";
  const amount = Number(link.display_amount ?? link.amount).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const currency = link.currency === "XOF" ? "FCFA" : link.currency;
  return template.replace(/\{\{(name|amount|currency|description|url)\}\}/g, (_match, key: string) => ({
    name, amount, currency, description: link.description, url: link.payment_url,
  }[key] || "")).replace(/Bonjour\s+,/g, "Bonjour,");
}

export function RemindersPage({ search, onNotice }: { search: string; onNotice: (message: string, isError?: boolean) => void }) {
  const [eligible, setEligible] = useState<ReminderLink[]>([]);
  const [history, setHistory] = useState<Reminder[]>([]);
  const [linkId, setLinkId] = useState("");
  const [templateId, setTemplateId] = useState(REMINDER_TEMPLATES[0]?.id || "");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [templateSearch, setTemplateSearch] = useState("");
  const [channel, setChannel] = useState("WhatsApp");
  const [message, setMessage] = useState("");
  const [ageDays, setAgeDays] = useState("all");
  const [customerId, setCustomerId] = useState("all");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [expiration, setExpiration] = useState("all");
  const [expirationFrom, setExpirationFrom] = useState("");
  const [expirationTo, setExpirationTo] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const visibleLinks = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    const min = minimumAmount ? Number(minimumAmount) : null;
    const max = maximumAmount ? Number(maximumAmount) : null;
    return eligible.filter((link) => {
      const amount = Number(link.display_amount ?? link.amount);
      const date = String(link.created_at).includes("T") ? new Date(link.created_at) : new Date(`${String(link.created_at).replace(" ", "T")}Z`);
      const age = Math.floor((Date.now() - date.getTime()) / 86400000);
      const expiryDate = link.expires_at ? String(link.expires_at).slice(0, 10) : "";
      const matchesSearch = !normalized || `${link.identifier} ${link.description} ${link.customer_name} ${link.customer_email} ${link.phone_number}`.toLowerCase().includes(normalized);
      return matchesSearch
        && (ageDays === "all" || age >= Number(ageDays))
        && (customerId === "all" || String(link.customer_id || "") === customerId)
        && (min === null || amount >= min) && (max === null || amount <= max)
        && (expiration === "all" || (expiration === "has" ? Boolean(expiryDate) : !expiryDate))
        && (!expirationFrom || (expiryDate && expiryDate >= expirationFrom))
        && (!expirationTo || (expiryDate && expiryDate <= expirationTo));
    });
  }, [eligible, search, ageDays, customerId, minimumAmount, maximumAmount, expiration, expirationFrom, expirationTo]);
  const selected = visibleLinks.find((link) => String(link.id) === linkId) || null;
  const templateQuery = templateSearch.trim().toLocaleLowerCase("fr");
  const matchingTemplates = useMemo(() => REMINDER_TEMPLATES.filter((item) =>
    (templateCategory === "all" || item.categoryId === templateCategory)
      && (!templateQuery || `${item.title} ${item.category} ${item.text}`.toLocaleLowerCase("fr").includes(templateQuery)),
  ), [templateCategory, templateQuery]);
  const selectedTemplate = REMINDER_TEMPLATES.find((item) => item.id === templateId) || REMINDER_TEMPLATES[0];

  useEffect(() => {
    api.getReminders().then((result) => { setEligible(result.eligible); setHistory(result.history); })
      .catch((error: unknown) => onNotice(error instanceof Error ? error.message : "Chargement des relances impossible.", true));
  }, [refresh]);

  useEffect(() => {
    if (selected && selectedTemplate) setMessage(reminderText(selectedTemplate.text, selected));
  }, [linkId, templateId, eligible]);

  async function save(status: "prepared" | "sent") {
    if (!selected || !message.trim()) { onNotice("Choisissez un lien et rédigez un message.", true); return; }
    if (status === "sent" && !window.confirm("Confirmez-vous avoir envoyé ce message vous-même? PayFlow ne transmet aucun message.")) return;
    setBusy(true);
    try {
      await api.createReminder({ paymentLinkId: selected.id, message: message.trim(), channel, status });
      setRefresh((value) => value + 1); onNotice(status === "sent" ? "Relance marquée comme envoyée manuellement." : "Texte préparé et enregistré. Aucun message n’a été envoyé.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "Enregistrement de la relance impossible.", true); }
    finally { setBusy(false); }
  }

  async function markSent(item: Reminder) {
    if (!window.confirm("Confirmez-vous avoir envoyé ce rappel vous-même?")) return;
    try { await api.updateReminder(item.id, { status: "sent" }); setRefresh((value) => value + 1); onNotice("Relance marquée comme envoyée manuellement."); }
    catch (error) { onNotice(error instanceof Error ? error.message : "Mise à jour impossible.", true); }
  }

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); onNotice(`${label} copié.`); }
    catch { onNotice(`Copie impossible. Sélectionnez le ${label.toLowerCase()} manuellement.`, true); }
  }

  return <section className="panel full-panel feature-page reminders-page"><PageHeading eyebrow="SUIVI CLIENT" title="Relances" description={`${REMINDER_TEMPLATE_COUNT} messages prêts à personnaliser. Choisissez un lien, adaptez le texte, puis copiez-le ou ouvrez WhatsApp.`} />
    <div className="reminder-simple-note"><Icon name="check" size={16} /><span>Rien ne part automatiquement. Vous vérifiez et envoyez chaque message vous-même.</span></div>
    {eligible.length ? <>
      <div className="reminder-workflow">
        <section className="reminder-step"><div className="reminder-step-heading"><span>1</span><div><h2>Choisir le lien</h2><p>{visibleLinks.length} lien(s) disponible(s) pour un rappel.</p></div></div>
          {visibleLinks.length ? <label className="reminder-control">Lien de paiement<select value={linkId} onChange={(event) => setLinkId(event.target.value)}><option value="">Choisir un lien</option>{visibleLinks.map((link) => <option key={link.id} value={link.id}>{link.customer_name || link.customer_email || link.phone_number || "Client sans nom"} · {link.description} · {formatMoney(link.display_amount ?? link.amount, link.currency)}</option>)}</select></label> : <EmptyRows title="Aucun lien correspondant" description="Changez la recherche ou les filtres pour afficher d’autres liens." />}
          <details className="reminder-advanced-filters"><summary>Filtres avancés</summary><div className="feature-filter-grid"><label>Ancienneté<select value={ageDays} onChange={(event) => setAgeDays(event.target.value)}><option value="all">Toutes</option><option value="3">Au moins 3 jours</option><option value="7">Au moins 7 jours</option><option value="30">Au moins 30 jours</option></select></label><label>Client<select value={customerId} onChange={(event) => setCustomerId(event.target.value)}><option value="all">Tous</option>{[...new Map(eligible.filter((link) => link.customer_id).map((link) => [link.customer_id, { id: Number(link.customer_id), name: link.customer_name || link.customer_email || link.phone_number }])).values()].map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Montant minimum<input type="number" min="0" value={minimumAmount} onChange={(event) => setMinimumAmount(event.target.value)} /></label><label>Montant maximum<input type="number" min="0" value={maximumAmount} onChange={(event) => setMaximumAmount(event.target.value)} /></label><label>Expiration<select value={expiration} onChange={(event) => setExpiration(event.target.value)}><option value="all">Toutes</option><option value="has">Avec expiration</option><option value="none">Sans expiration</option></select></label><label>Expire à partir du<input type="date" value={expirationFrom} onChange={(event) => setExpirationFrom(event.target.value)} /></label><label>Expire jusqu’au<input type="date" value={expirationTo} onChange={(event) => setExpirationTo(event.target.value)} /></label></div></details>
        </section>
        <section className="reminder-step"><div className="reminder-step-heading"><span>2</span><div><h2>Choisir un message</h2><p>{REMINDER_TEMPLATE_COUNT} modèles · modifiables avant envoi.</p></div></div>
          <div className="reminder-template-filters"><label>Style<select value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}><option value="all">Tous les styles</option>{REMINDER_TEMPLATE_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label><label>Rechercher un message<input type="search" value={templateSearch} onChange={(event) => setTemplateSearch(event.target.value)} placeholder="Ex. commande, merci, paiement…" /></label></div>
          <label className="reminder-control">Modèles trouvés ({matchingTemplates.length})<select className="reminder-template-list" size={6} value={matchingTemplates.some((item) => item.id === templateId) ? templateId : ""} onChange={(event) => setTemplateId(event.target.value)} aria-label="Choisir un modèle de message">{matchingTemplates.length ? matchingTemplates.map((item) => <option key={item.id} value={item.id}>{item.category} · {item.title}</option>) : <option value="">Aucun modèle trouvé</option>}</select></label>
          {selectedTemplate && <div className="selected-template-note">Modèle choisi : <strong>{selectedTemplate.category}</strong> · {selectedTemplate.title}</div>}
        </section>
      </div>
      <section className="reminder-editor"><div className="reminder-step-heading"><span>3</span><div><h2>Relire et envoyer</h2><p>Modifiez le texte comme vous le souhaitez.</p></div></div>
        <label className="reminder-control">Canal<select value={channel} onChange={(event) => setChannel(event.target.value)}><option>WhatsApp</option><option>SMS</option><option>E-mail</option><option>Autre</option></select></label>
        <label className="reminder-control">Message<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} rows={7} disabled={!selected} placeholder="Choisissez un lien pour préparer un message personnalisé." /></label>
        <div className="reminder-editor-footer"><small>{message.length}/4 000 caractères · les champs entre accolades sont déjà remplacés par les informations du lien.</small><div className="feature-reminder-actions">{selected && <><button className="button button-primary" disabled={busy || !message.trim()} onClick={() => copy(message, "Message")}>Copier le message</button>{channel === "WhatsApp" && <a className="button button-secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Ouvrir WhatsApp</a>}<button className="button button-secondary" onClick={() => copy(selected.payment_url, "Lien")}>Copier le lien seul</button><button className="button button-secondary" disabled={busy || !message.trim()} onClick={() => save("prepared")}>Enregistrer pour plus tard</button><button className="button button-secondary" disabled={busy || !message.trim()} onClick={() => save("sent")}>J’ai envoyé ce message</button></>}</div></div>
        {selected?.expires_at && new Date(String(selected.expires_at).replace(" ", "T") + "Z").getTime() <= Date.now() && <p className="feature-warning">Ce lien a dépassé sa date dans PayFlow. Vérifiez qu’il fonctionne encore avant de le partager.</p>}
      </section>
    </> : <EmptyRows title="Aucun lien à relancer" description="Les liens encore en attente apparaîtront ici. Les liens payés, annulés ou archivés ne sont pas proposés." />}
    <details className="reminder-history"><summary>Historique des messages · {history.length}</summary>
      {history.length ? <div className="table-scroll"><table><thead><tr><th>DATE</th><th>RÉFÉRENCE</th><th>CANAL</th><th>STATUT</th><th>MESSAGE</th><th>ACTION</th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>{formatDate(item.sent_at || item.created_at, { dateStyle: "medium", timeStyle: "short" })}</td><td>{item.identifier || `Lien #${item.payment_link_id}`}</td><td>{item.channel || "—"}</td><td><span className={`feature-status ${item.status === "sent" ? "confirmed" : "pending"}`}>{item.status === "sent" ? "Envoyée" : "Préparée"}</span></td><td><details><summary>Voir le texte</summary><pre className="reminder-message">{item.message}</pre></details></td><td>{item.status === "prepared" && <button onClick={() => markSent(item)}>J’ai envoyé ce message</button>}</td></tr>)}</tbody></table></div> : <p className="feature-muted">Les messages enregistrés apparaîtront ici.</p>}
    </details>
  </section>;
}
