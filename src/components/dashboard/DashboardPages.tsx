import React from "react";
import Icon from "../common/Icon";
import AmbientOrb from "./AmbientOrb";
import { MetricCard, TransactionTable, PaymentLinksTable, CustomerTable } from "./DashboardWidgets";
import { formatMoney } from "../../utils/formatters";
import { getConfirmedPayments, getDailyRevenue, getPaymentsForRange } from "../../utils/paymentAnalytics";
import type { Customer, DashboardStats, PaymentLink, PaymentLinkStatus, TransactionRow } from "../../types";

interface RevenueChartProps {
  links: PaymentLink[];
  days: number;
  onDaysChange: (days: number) => void;
}

function RevenueChart({ links, days, onDaysChange }: RevenueChartProps) {
  const daily = getDailyRevenue(links, days);
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
      <div className="chart-topline"><span>Revenus confirmés par jour</span><select value={days} onChange={(event) => onDaysChange(Number(event.target.value))}><option value="7">7 derniers jours</option><option value="30">30 derniers jours</option></select></div>
      <div className="balance-chart">
        <div className="chart-y-labels"><span>{formatMoney(max)}</span><span>{formatMoney(Math.round(max / 2))}</span><span>0 FCFA</span></div>
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
  transactions: TransactionRow[];
  links: PaymentLink[];
  range: number;
  onRangeChange: (days: number) => void;
  onCreate: () => void;
  onNavigate: (page: "transactions" | "links" | "settings") => void;
}

export function OverviewPage({ stats, transactions, links, range, onRangeChange, onCreate, onNavigate }: OverviewPageProps) {
  const successful = Number(stats.completed || 0);
  const rangePayments = getPaymentsForRange(links, range);
  const rangeRevenue = rangePayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  return (
    <>
      <section className="welcome-row">
        <div><div className="eyebrow">VOTRE ACTIVITÉ LOCALE</div><h1>Votre activité, en un coup d’œil</h1><p>Liens et paiements stockés dans votre base SQLite locale.</p></div>
        <div className="welcome-actions"><button className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} /> Créer un lien</button></div>
      </section>
      <section className="balance-card">
        <div className="balance-copy"><span className="balance-label">REVENUS CONFIRMÉS · {range} JOURS</span><h2>{formatMoney(rangeRevenue)}</h2><div className="balance-meta"><span className="positive-pill"><Icon name="check" size={13} /> {rangePayments.length} paiements confirmés</span></div></div>
        <RevenueChart links={links} days={range} onDaysChange={onRangeChange} />
        <AmbientOrb />
      </section>
      <section className="metric-grid">
        <MetricCard label="Liens en attente" value={Number(stats.pending || 0).toLocaleString("fr-FR")} delta="À vérifier et mettre à jour manuellement" icon="arrows" tone="mint" />
        <MetricCard label="Paiements confirmés" value={successful.toLocaleString("fr-FR")} delta="Statut confirmé dans SQLite" icon="check" tone="lavender" />
        <MetricCard label="Liens créés" value={Number(stats.links || 0).toLocaleString("fr-FR")} delta="En attente du paiement client" icon="link" tone="peach" />
        <MetricCard label="Clients" value={Number(stats.customers || 0).toLocaleString("fr-FR")} delta="Numéros associés à un lien ou paiement" icon="users" tone="blue" />
      </section>
      <section className="content-grid">
        <div className="panel transactions-panel"><div className="panel-heading"><div><h2>Encaissements récents</h2><p>Liens que vous avez marqués payés dans votre compte.</p></div><button className="text-button" onClick={() => onNavigate("transactions")}>Tout voir <Icon name="chevron" size={15} /></button></div><TransactionTable rows={transactions.slice(0, 5)} /></div>
        <div className="panel quick-panel"><div className="panel-heading"><div><h2>Raccourcis</h2><p>Accédez aux actions fréquentes.</p></div></div>
          <button className="quick-action" onClick={onCreate}><span className="quick-icon mint"><Icon name="plus" /></span><span><strong>Créer un lien</strong><small>Préparer un encaissement</small></span><Icon name="chevron" size={16} /></button>
          <button className="quick-action" onClick={() => onNavigate("links")}><span className="quick-icon lavender"><Icon name="link" /></span><span><strong>Gérer les liens</strong><small>Copier ou ouvrir un lien client</small></span><Icon name="chevron" size={16} /></button>
          <button className="quick-action" onClick={() => onNavigate("settings")}><span className="quick-icon peach"><Icon name="settings" /></span><span><strong>Configurer l’API</strong><small>Enregistrer votre propre clé</small></span><Icon name="chevron" size={16} /></button>
          <div className="security-note"><span className="security-shield">✓</span><span><strong>Base SQLite locale</strong><small>Vos données restent sur cet appareil.</small></span></div>
        </div>
      </section>
    </>
  );
}

export function TransactionsPage({ transactions }: { transactions: TransactionRow[] }) {
  return <section className="panel full-panel"><div className="panel-heading"><div><div className="eyebrow">ACTIVITÉ DU COMPTE</div><h1>Encaissements</h1><p>Cette liste reprend les liens que vous avez marqués payés manuellement. PayFlow ne reçoit pas de notifications de paiement.</p></div></div><TransactionTable rows={transactions} /></section>;
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
  return <section className="panel settings-page"><div className="eyebrow">INTÉGRATION</div><h1>Paramètres</h1><p>Votre clé API reste dans le stockage local de cette installation. Elle n’est jamais affichée après enregistrement.</p>
    <form className="settings-form" onSubmit={onSave}>
      <label>Clé API PayGateGlobal<input name="apiToken" type="password" autoComplete="new-password" placeholder={configured ? "Clé enregistrée — saisissez-en une nouvelle pour la remplacer" : "Collez votre clé API"} minLength="8" maxLength="500" required /></label>
      <button className="button button-primary" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer la clé API"}</button>
    </form>
    <div className={`settings-key-state ${configured ? "is-configured" : ""}`}><span className="live-dot" />{configured ? "Clé configurée localement" : "Aucune clé configurée"}</div>
    <div className="settings-row"><span>Base de données</span><strong>SQLite · locale</strong></div>
    <div className="settings-row"><span>Réseaux pris en charge par cette interface</span><strong>TMONEY · FLOOZ</strong></div>
    <div className="settings-row"><span>Mode</span><strong>Génération de lien uniquement</strong></div>
  </section>;
}
