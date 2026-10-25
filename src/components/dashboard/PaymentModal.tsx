import React, { useEffect, useRef } from "react";
import type { FormEvent, MouseEvent } from "react";
import { gsap } from "gsap";
import Icon from "../common/Icon";

interface PaymentModalProps {
  busy: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function PaymentModal({ busy, onClose, onSubmit }: PaymentModalProps) {
  const modalRef = useRef<HTMLSectionElement | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current, { y: 18, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
    }
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="payment-modal" ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="payment-title">
        <div className="modal-heading"><div><div className="eyebrow">NOUVEL ENCAISSEMENT</div><h2 id="payment-title">Créer un lien</h2><p>Le client finalise lui-même le paiement via PayGateGlobal.</p></div><button className="icon-button" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button></div>
        <form onSubmit={onSubmit}>
          <label>Description<input name="description" placeholder="Ex. Commande #1042" required maxLength="120" /></label>
          <label>Téléphone du client (facultatif)<input name="phone" type="tel" placeholder="+228 90 00 00 00" /></label>
          <div className="form-two">
            <label>Montant<input name="amount" type="number" min="0.01" step="0.01" placeholder="0,00" required /></label>
            <label>Devise<select name="currency"><option value="XOF">FCFA · XOF</option><option value="EUR">Euro · EUR</option><option value="USD">Dollar · USD</option></select></label>
          </div>
          <label>Réseau de paiement<select name="network"><option value="TMONEY">T-Money</option><option value="FLOOZ">Flooz</option></select></label>
          <div className="modal-footnote"><span className="security-shield">✓</span> Aucun paiement n’est envoyé avant que le client ouvre le lien.</div>
          <button className="button button-primary modal-submit" disabled={busy}>{busy ? <span className="spinner" /> : <Icon name="link" size={17} />}{busy ? "Génération en cours…" : "Générer le lien"}</button>
        </form>
      </section>
    </div>
  );
}
