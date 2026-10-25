import React from "react";
import type { ReactNode } from "react";
import Icon from "../common/Icon";
import { formatDate, formatMoney } from "../../utils/formatters";
import type { Customer, PaymentLink, TransactionRow } from "../../types";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  delta?: ReactNode;
  icon: string;
  tone: string;
}

export function MetricCard({ label, value, delta, icon, tone }: MetricCardProps) {
  return (
    <article className="metric-tile">
      <div className={`metric-icon ${tone}`}><Icon name={icon} size={18} /></div>
      <span className="metric-title">{label}</span>
      <strong className="metric-number">{value}</strong>
      <small className="metric-subtitle">{delta || "Données issues de votre base locale"}</small>
    </article>
  );
}

export function TransactionTable({ rows }: { rows: TransactionRow[] }) {
  if (!rows.length) return <div className="table-empty"><div className="empty-icon"><Icon name="arrows" /></div><strong>Aucune transaction enregistrée</strong><span>Les liens créés sont consultables dans Liens de paiement.</span></div>;

  return (
    <div className="table-scroll">
      <table><thead><tr><th>RÉFÉRENCE</th><th>CLIENT</th><th>DATE</th><th>MÉTHODE</th><th>MONTANT</th><th>STATUT</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td><strong className="reference">{row.tx_reference || row.identifier || "—"}</strong><small className="sub-reference">{row.identifier}</small></td>
          <td><div className="customer-cell"><span className="customer-avatar">{String(row.phone_number || "?").slice(-2)}</span><span>{row.phone_number || "—"}</span></div></td>
          <td>{formatDate(row.created_at)}</td>
          <td><span className={`method-badge ${(row.payment_method || "").toLowerCase()}`}>{row.payment_method || "—"}</span></td>
          <td><strong>{formatMoney(row.amount)}</strong></td>
          <td><PaymentStatus status={row.status} source={row.source} /></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export function PaymentStatus({ status, source }: { status: number | string; source?: string }) {
  const numericStatus = Number(status);
  const label = source === "manual_link" ? "Payé · manuel" : numericStatus === 1 ? "Réussi" : numericStatus === 0 ? "En attente" : "Échec";
  const tone = numericStatus === 1 ? "success" : numericStatus === 0 ? "pending" : "failed";
  return <span className={`status-badge ${tone}`}><i />{label}</span>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const value = String(status || "pending").toLowerCase();
  const map = {
    pending: { label: "En attente", tone: "pending" },
    paid: { label: "Payé", tone: "success" },
    cancelled: { label: "Annulé", tone: "failed" },
  };
  const current = map[value] || map.pending;
  return <span className={`status-badge ${current.tone}`}><i />{current.label}</span>;
}

interface PaymentLinksTableProps {
  rows: PaymentLink[];
  onCopy: (value: string) => void;
  onStatusChange: (id: number, status: PaymentLink["status"]) => void;
}

export function PaymentLinksTable({ rows, onCopy, onStatusChange }: PaymentLinksTableProps) {
  if (!rows.length) return <div className="table-empty"><div className="empty-icon"><Icon name="link" /></div><strong>Aucun lien créé</strong><span>Créez un lien et partagez-le avec votre client.</span></div>;
  return (
    <div className="table-scroll">
      <table><thead><tr><th>DESCRIPTION</th><th>RÉFÉRENCE</th><th>DATE</th><th>CLIENT</th><th>MONTANT</th><th>STATUT</th><th>ACTIONS</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>
          <td><strong className="reference">{row.description}</strong></td>
          <td><small className="sub-reference">{row.identifier}</small></td>
          <td>{formatDate(row.created_at)}</td>
          <td>{row.phone_number || "—"}</td>
          <td><strong>{formatMoney(row.display_amount ?? row.amount, row.currency)}</strong></td>
          <td>
            <div className="status-control">
              <PaymentStatusBadge status={row.status} />
              <select value={String(row.status || "pending").toLowerCase()} onChange={(event) => onStatusChange?.(row.id, event.target.value)} aria-label={`Changer le statut pour ${row.identifier}`}>
                <option value="pending">En attente</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </td>
          <td><div className="table-actions"><button className="table-icon-button" onClick={() => onCopy(row.payment_url)} aria-label="Copier le lien"><Icon name="copy" size={15} /></button><a className="table-icon-button" href={row.payment_url} target="_blank" rel="noreferrer" aria-label="Ouvrir le lien"><Icon name="external" size={15} /></a></div></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}

export function CustomerTable({ rows }: { rows: Customer[] }) {
  if (!rows.length) return <div className="table-empty"><div className="empty-icon"><Icon name="users" /></div><strong>Aucun client enregistré</strong><span>Ajoutez un numéro client à un lien de paiement pour le retrouver ici.</span></div>;
  return (
    <div className="table-scroll">
      <table><thead><tr><th>TÉLÉPHONE</th><th>DERNIÈRE ACTIVITÉ</th><th>LIENS / PAIEMENTS</th></tr></thead>
        <tbody>{rows.map((customer) => <tr key={customer.phone_number}>
          <td><div className="customer-cell"><span className="customer-avatar">{String(customer.phone_number).slice(-2)}</span><strong>{customer.phone_number}</strong></div></td>
          <td>{formatDate(customer.last_seen)}</td>
          <td>{customer.payment_count}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
