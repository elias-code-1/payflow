import React from "react";
import Icon from "../common/Icon";
import AmbientOrb from "./AmbientOrb";
import { MetricCard, TransactionTable, PaymentLinksTable, CustomerTable } from "./DashboardWidgets";
import { formatMoney, parseAppDate } from "../../utils/formatters";
import { getConfirmedPayments } from "../../utils/paymentAnalytics";
import type { Customer, DashboardPageId, DashboardStats, PaymentLink, PaymentLinkStatus, TransactionRow } from "../../types";

interface RevenueChartProps {
  transactions: TransactionRow[];
  days: number;
  onDaysChange: (days: number) => void;
}

function RevenueChart({ transactions, days, onDaysChange }: RevenueChartProps) {
  const currencies = [...new Set(transactions.filter((row) => row.status === "confirmed" || Number(row.status) === 1).map((row) => row.currency || "XOF"))];
  const currencyKey = currencies.join("|") || "XOF";
  const availableCurrencies = currencies.length ? currencies : ["XOF"];
  const [currency, setCurrency] = React.useState(availableCurrencies[0]);
  React.useEffect(() => {
    if (!availableCurrencies.includes(currency)) setCurrency(availableCurrencies[0]);
  }, [currencyKey, currency]);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);
    return { date, revenue: 0 };
  });
  for (const payment of transactions) {
    if ((payment.status !== "confirmed" && Number(payment.status) !== 1) || (payment.currency || "XOF") !== currency) continue;
    const date = parseAppDate(payment.created_at);
    if (!date || date.getTime() < cutoff) continue;
    date.setHours(0, 0, 0, 0);
    const day = daily.find((entry) => entry.date.toDateString() === date.toDateString());
    if (day) day.revenue += Number(payment.amount || 0);
  }
  const max = Math.max(...daily.map((entry) => entry.revenue), 1);
  const coords = daily.map((entry, index) => {
    const x = daily.length === 1 ? 260 : (index / (daily.length - 1)) * 520;
    const y = 125 - (entry.revenue / max) * 112;
    return [x, y];
  });
  const line = coords.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L520,136 L0,136 Z`;

  return (
    <div className="balance-chart-wrap">
      <div className="chart-topline"><span>Revenus confirmés par jour · {currency}</span><div><select value={currency} onChange={(event) => setCurrency(event.target.value)}>{availableCurrencies.map((value) => <option key={value} value={value}>{value}</option>)}</select><select value={days} onChange={(event) => onDaysChange(Number(event.target.value))}><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option></select></div></div>
      <div className="balance-chart">
        <div className="chart-y-labels"><span>{formatMoney(max, currency as "XOF" | "EUR" | "USD")}</span><span>{formatMoney(Math.round(max / 2), currency as "XOF" | "EUR" | "USD")}</span><span>0 {currency}</span></div>
        <svg viewBox="0 0 520 136" preserveAspectRatio="none" role="img" aria-label="Revenus journaliers issus des paiements confirmés">
          <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#b9e7d8" stopOpacity=".45" /><stop offset="100%" stopColor="#b9e7d8" stopOpacity="0" /></linearGradient></defs>
          <path className="chart-area" d={area} /><path className="chart-line" d={line} />
        </svg>
      </div>
      <div className="chart-x-labels"><span>{daily[0]?.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span><span>{daily[Math.floor(daily.length / 2)]?.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span><span>{daily.at(-1)?.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span></div>
    </div>
  );
}

interface OverviewPageProps {
  stats: DashboardStats;
  configured: boolean;
  transactions: TransactionRow[];
  allTransactions: TransactionRow[];
  range: number;
  onRangeChange: (days: number) => void;
  onCreate: () => void;
  onNavigate: (page: DashboardPageId) => void;
}

export function OverviewPage({ stats, configured, transactions, allTransactions, range, onRangeChange, onCreate, onNavigate }: OverviewPageProps) {
  const successful = Number(stats.completed || 0);
  const cutoff = Date.now() - range * 24 * 60 * 60 * 1000;
  const rangePayments = allTransactions.filter((payment) => {
    if (payment.status !== "confirmed" && Number(payment.status) !== 1) return false;
    const date = parseAppDate(payment.created_at);
    return Boolean(date && date.getTime() >= cutoff);
  });
  const revenueByCurrency = [...rangePayments.reduce((totals, payment) => {
    const currency = payment.currency || "XOF";
    totals.set(currency, (totals.get(currency) || 0) + Number(payment.amount || 0));
    return totals;
  }, new Map<string, number>())].map(([currency, amount]) => ({ currency, amount }));
  if (!revenueByCurrency.length) revenueByCurrency.push({ currency: "XOF", amount: 0 });
  return (
    <>
      <section className="welcome-row">
        <div><div className="eyebrow">VOTRE ACTIVITÉ LOCALE</div><h1>Votre activité, en un coup d’œil</h1><p>Liens et paiements stockés dans votre base SQLite locale.</p></div>
        <div className="welcome-actions"><button className="button button-primary" onClick={() => configured ? onCreate() : onNavigate("settings")}><Icon name={configured ? "plus" : "settings"} size={17} /> {configured ? "Créer un lien" : "Configurer les paiements"}</button></div>
      </section>
      {(!configured || Number(stats.links || 0) === 0) && <section className="quickstart-panel"><div className="quickstart-heading"><div><div className="eyebrow">DÉMARRAGE GUIDÉ</div><h2>Votre espace en trois étapes</h2><p>Suivez ces étapes pour préparer votre premier encaissement.</p></div></div><div className="quickstart-steps">
        <article className={configured ? "is-done" : "is-current"}><span className="quickstart-number">{configured ? <Icon name="check" size={15} /> : "1"}</span><div><strong>Configurer les paiements</strong><small>{configured ? "Votre clé est enregistrée sur cet appareil." : "Ajoutez la clé fournie par votre prestataire."}</small></div><button className="button button-secondary" onClick={() => onNavigate("settings")}>{configured ? "Voir" : "Configurer"}</button></article>
        <article className={Number(stats.links || 0) > 0 ? "is-done" : configured ? "is-current" : ""}><span className="quickstart-number">{Number(stats.links || 0) > 0 ? <Icon name="check" size={15} /> : "2"}</span><div><strong>Créer votre premier lien</strong><small>{Number(stats.links || 0) > 0 ? `${stats.links} lien(s) déjà créé(s).` : "Choisissez le montant puis copiez le lien client."}</small></div><button className="button button-secondary" disabled={!configured} onClick={onCreate}>{Number(stats.links || 0) > 0 ? "Créer un autre" : "Créer un lien"}</button></article>
        <article><span className="quickstart-number">3</span><div><strong>Garder une copie de sécurité</strong><small>Téléchargez vos données pour pouvoir les conserver.</small></div><button className="button button-secondary" onClick={() => onNavigate("backups")}>Faire une copie</button></article>
      </div></section>}
      <section className="balance-card">
        <div className="balance-copy"><span className="balance-label">REVENUS CONFIRMÉS · {range} JOURS</span><div className="balance-revenue-list">{revenueByCurrency.map((entry) => <div className="balance-revenue-item" key={entry.currency}><strong>{entry.amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}</strong><span>{entry.currency === "XOF" ? "FCFA · XOF" : entry.currency}</span></div>)}</div><div className="balance-meta"><span className="positive-pill"><Icon name="check" size={13} /> {rangePayments.length} paiement(s) confirmé(s)</span></div></div>
        <RevenueChart transactions={allTransactions} days={range} onDaysChange={onRangeChange} />
        <AmbientOrb />
      </section>
      <section className="metric-grid">
        <MetricCard label="Liens en attente" value={Number(stats.pending || 0).toLocaleString("fr-FR")} delta="À vérifier et mettre à jour manuellement" icon="arrows" tone="mint" />
        <MetricCard label="Paiements confirmés" value={successful.toLocaleString("fr-FR")} delta="Statut confirmé dans SQLite" icon="check" tone="lavender" />
        <MetricCard label="Liens créés" value={Number(stats.links || 0).toLocaleString("fr-FR")} delta="En attente du paiement client" icon="link" tone="peach" />
        <MetricCard label="Clients" value={Number(stats.customers || 0).toLocaleString("fr-FR")} delta="Numéros associés à un lien ou paiement" icon="users" tone="blue" />
      </section>
      <section className="content-grid">
        <div className="panel transactions-panel"><div className="panel-heading"><div><h2>Transactions récentes</h2><p>Encaissements saisis et liens marqués payés manuellement.</p></div><button className="text-button" onClick={() => onNavigate("transactions")}>Tout voir <Icon name="chevron" size={15} /></button></div><TransactionTable rows={transactions.slice(0, 5)} /></div>
        <div className="panel quick-panel"><div className="panel-heading"><div><h2>Raccourcis</h2><p>Accédez aux actions fréquentes.</p></div></div>
          <button className="quick-action" onClick={() => configured ? onCreate() : onNavigate("settings")}><span className="quick-icon mint"><Icon name={configured ? "plus" : "settings"} /></span><span><strong>{configured ? "Créer un lien" : "Configurer les paiements"}</strong><small>{configured ? "Préparer un encaissement" : "Ajoutez votre clé pour commencer"}</small></span><Icon name="chevron" size={16} /></button>
          <button className="quick-action" onClick={() => onNavigate("links")}><span className="quick-icon lavender"><Icon name="link" /></span><span><strong>Gérer les liens</strong><small>Copier ou ouvrir un lien client</small></span><Icon name="chevron" size={16} /></button>
          <button className="quick-action" onClick={() => onNavigate(configured ? "backups" : "settings")}><span className="quick-icon peach"><Icon name={configured ? "database" : "settings"} /></span><span><strong>{configured ? "Protéger mes données" : "Configurer les paiements"}</strong><small>{configured ? "Télécharger une copie de sécurité" : "Enregistrer votre clé"}</small></span><Icon name="chevron" size={16} /></button>
          <button className="quick-action" onClick={() => onNavigate("downloads")}><span className="quick-icon mint"><Icon name="download" /></span><span><strong>Téléchargements & tutoriels</strong><small>Installer sur Windows, Linux, Android ou iOS</small></span><Icon name="chevron" size={16} /></button>
          <div className="security-note"><span className="security-shield">✓</span><span><strong>Base SQLite locale</strong><small>Vos données restent sur cet appareil.</small></span></div>
        </div>
      </section>
    </>
  );
}

export function TransactionsPage({ transactions }: { transactions: TransactionRow[] }) {
  return <section className="panel full-panel"><div className="panel-heading"><div><div className="eyebrow">ACTIVITÉ DU COMPTE</div><h1>Transactions</h1><p>Cette liste réunit les encaissements saisis et les liens marqués payés manuellement; les doublons liés sont fusionnés.</p></div></div><TransactionTable rows={transactions} /></section>;
}

interface LinksPageProps {
  links: PaymentLink[];
  onCopy: (value: string) => void;
  onCreate: () => void;
  onStatusChange: (id: number, status: PaymentLinkStatus) => void;
}

export function LinksPage({ links, onCopy, onCreate, onStatusChange }: LinksPageProps) {
  return <section className="panel full-panel"><div className="panel-heading"><div><div className="eyebrow">ENCAISSEMENT</div><h1>Liens de paiement</h1><p>Les liens générés sont enregistrés sur cet appareil et peuvent être partagés à vos clients.</p></div><button className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} /> Créer un lien</button></div><PaymentLinksTable rows={links} onCopy={onCopy} onStatusChange={onStatusChange} /></section>;
}

export function CustomersPage({ customers }: { customers: Customer[] }) {
  return <section className="panel full-panel"><div className="panel-heading"><div><div className="eyebrow">RELATION CLIENT</div><h1>Clients</h1><p>Numéros associés aux liens que vous avez créés dans ce compte.</p></div></div><CustomerTable rows={customers} /></section>;
}

export function AnalyticsPage({ stats, links }: { stats: DashboardStats; links: PaymentLink[] }) {
  const successfulPayments = getConfirmedPayments(links);
  const totalConfirmed = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const average = successfulPayments.length ? totalConfirmed / successfulPayments.length : 0;
  const conversion = links.length ? Math.round((successfulPayments.length / links.length) * 100) : 0;
  return <section className="panel empty-state analytics-page"><div className="empty-icon"><Icon name="chart" size={25} /></div><div className="eyebrow">RAPPORTS LOCAUX</div><h1>Analytique</h1><p>Ces indicateurs sont calculés à partir des paiements confirmés enregistrés dans SQLite.</p><div className="analytics-summary"><MetricCard label="Revenus confirmés" value={formatMoney(totalConfirmed)} icon="chart" tone="mint" /><MetricCard label="Paiements" value={successfulPayments.length} icon="arrows" tone="lavender" /><MetricCard label="Panier moyen" value={formatMoney(average)} icon="check" tone="blue" /><MetricCard label="Liens créés" value={stats.links || 0} icon="link" tone="peach" /><MetricCard label="Taux indicatif" value={`${conversion}%`} delta="Paiements confirmés / liens créés" icon="chart" tone="mint" /></div></section>;
}

export function SettingsPage({ configured, saving, onSave }: { configured: boolean; saving: boolean; onSave: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <section className="panel settings-page"><div className="eyebrow">À FAIRE UNE FOIS</div><h1>Paramètres</h1><p>Connectez votre compte PayGateGlobal pour créer des liens de paiement.</p>
    <div className={`settings-key-state ${configured ? "is-configured" : ""}`}><span className="live-dot" />{configured ? "Votre clé est enregistrée sur cet appareil" : "Votre compte de paiement n’est pas encore connecté"}</div>
    <div className="settings-howto"><strong>Comment faire ?</strong><ol><li>Récupérez votre clé API dans votre espace PayGateGlobal.</li><li>Collez-la ci-dessous puis enregistrez.</li></ol></div>
    <form className="settings-form" onSubmit={onSave}>
      <label>Clé API personnelle<input name="apiToken" type="password" autoComplete="new-password" placeholder={configured ? "Clé enregistrée · saisissez une nouvelle clé pour la remplacer" : "Collez votre clé API ici"} minLength="8" maxLength="500" required /><small>La clé reste dans les réglages locaux de votre compte et n’est jamais réaffichée.</small></label>
      <button className="button button-primary" disabled={saving}>{saving ? "Enregistrement…" : configured ? "Remplacer la clé" : "Enregistrer et continuer"}</button>
    </form>
    <details className="settings-advanced"><summary>Informations sur cette installation</summary><div className="settings-row"><span>Stockage</span><strong>Sur cet appareil</strong></div><div className="settings-row"><span>Réseaux proposés</span><strong>T-Money · Flooz</strong></div><div className="settings-row"><span>Envoi des paiements</span><strong>Vous partagez le lien manuellement</strong></div></details>
  </section>;
}
