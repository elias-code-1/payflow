import React, { useEffect, useRef } from "react";
import type { FormEvent, MouseEvent } from "react";
import { gsap } from "gsap";
import Icon from "../common/Icon";
import type { CatalogItem, CurrencyCode, CustomerProfile } from "../../types";

interface PaymentModalProps {
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  customers: CustomerProfile[];
  catalogItems: CatalogItem[];
  initialValues?: {
    description?: string;
    phone?: string;
    amount?: number;
    currency?: CurrencyCode;
    customerId?: number;
    catalogItemId?: number;
  };
}

export default function PaymentModal({ busy, onClose, onSubmit, customers, catalogItems, initialValues }: PaymentModalProps) {
  const modalRef = useRef<HTMLSectionElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { y: 18, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
    }
  }, []);

  function selectCatalogItem(itemId: string) {
    const item = catalogItems.find((entry) => String(entry.id) === itemId);
    if (!item || !formRef.current) return;
    const form = formRef.current;
    (form.elements.namedItem("description") as HTMLInputElement).value = item.name;
    (form.elements.namedItem("amount") as HTMLInputElement).value = String(item.amount);
    (form.elements.namedItem("currency") as HTMLSelectElement).value = item.currency;
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find((entry) => String(entry.id) === customerId);
    if (!formRef.current) return;
    (formRef.current.elements.namedItem("phone") as HTMLInputElement).value = customer?.phone_number || "";
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="payment-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <div className="modal-heading"><div><div className="eyebrow">NOUVEL ENCAISSEMENT</div><h2 id="payment-title">Créer un lien</h2><p>Le client finalise lui-même le paiement via PayGateGlobal.</p></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button></div>
        <form ref={formRef} onSubmit={onSubmit}>
          <label>Article du catalogue, facultatif<select name="catalogItemId" defaultValue={initialValues?.catalogItemId || ""} onChange={(event) => selectCatalogItem(event.target.value)}><option value="">Lien libre</option>{catalogItems.filter((item) => !item.archived_at).map((item) => <option key={item.id} value={item.id}>{item.name} · {item.amount} {item.currency}</option>)}</select></label>
          <label>Description<input name="description" placeholder="Ex. Commande #1042" required maxLength="120" defaultValue={initialValues?.description} /></label>
          <label>Fiche client, facultative<select name="customerId" defaultValue={initialValues?.customerId || ""} onChange={(event) => selectCustomer(event.target.value)}><option value="">Sans fiche client</option>{customers.filter((customer) => !customer.archived_at).map((customer) => <option key={customer.id} value={customer.id}>{customer.full_name || customer.phone_number || customer.email}</option>)}</select></label>
          <label>Téléphone du client (facultatif)<input name="phone" type="tel" placeholder="+228 90 00 00 00" defaultValue={initialValues?.phone} /></label>
          <div className="form-two">
            <label>Montant<input name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required defaultValue={initialValues?.amount} /></label>
            <label>Devise<select name="currency" defaultValue={initialValues?.currency || "XOF"}><option value="XOF">FCFA · XOF</option><option value="EUR">Euro · EUR</option><option value="USD">Dollar · USD</option></select></label>
          </div>
          <p className="modal-footnote">Conversion fixe intégrée vers XOF : 1 EUR = 655,957 XOF; 1 USD = 600 XOF. Ces taux ne sont pas actualisés en temps réel et leur date de révision n’est pas renseignée.</p>
          <label>Réseau de paiement<select name="network"><option value="TMONEY">T-Money</option><option value="FLOOZ">Flooz</option></select></label>
          <label>Expiration locale facultative<input name="expiresAt" type="datetime-local" /><small>PayFlow masquera le lien après cette date; le fournisseur peut toujours l’accepter.</small></label>
          <div className="modal-footnote"><span className="security-shield">✓</span> Aucun paiement n’est envoyé avant que le client ouvre le lien.</div>
          <button className="button button-primary modal-submit" disabled={busy}>{busy ? <span className="spinner" /> : <Icon name="link" size={17} />}{busy ? "Génération en cours…" : "Générer le lien"}</button>
        </form>
      </section>
    </div>
  );
}
