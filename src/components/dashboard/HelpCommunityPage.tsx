import React from "react";
import Icon from "../common/Icon";
import { DONATION_URL, REPOSITORY_URL } from "../../constants/externalLinks";
import type { DashboardPageId } from "../../types";

interface HelpCommunityPageProps {
  onNavigate?: (page: DashboardPageId) => void;
}

export default function HelpCommunityPage({ onNavigate }: HelpCommunityPageProps) {
  return (
    <section className="panel help-community-page">
      <div className="eyebrow">RESSOURCES PAYFLOW</div>
      <h1>Aide & communauté</h1>
      <p>PayFlow reste un outil local : les liens et paiements sont gérés dans votre compte, et chaque statut est confirmé manuellement.</p>

      <div className="help-community-grid">
        <article className="help-community-card">
          <div className="help-community-icon"><Icon name="download" size={21} /></div>
          <div className="eyebrow">APPLICATIONS & INSTALLATION</div>
          <h2>Téléchargements & tutoriels</h2>
          <p>Retrouvez tous les installateurs Windows (.exe), Linux (.AppImage, .deb, .rpm, .snap, .flatpak, .tar.*), Android (.apk) et iOS (.ipa) avec leur guide étape par étape.</p>
          {onNavigate ? (
            <button type="button" className="button button-primary" onClick={() => onNavigate("downloads")}>
              <Icon name="download" size={16} /> Ouvrir les téléchargements
            </button>
          ) : (
            <a className="button button-primary" href="/#telechargements">
              <Icon name="download" size={16} /> Voir les téléchargements
            </a>
          )}
        </article>

        <article className="help-community-card donation-card">
          <div className="help-community-icon"><Icon name="heart" size={21} /></div>
          <div className="eyebrow">SOUTENIR LE PROJET</div>
          <h2>Faire un don</h2>
          <p>Votre soutien aide à maintenir PayFlow gratuit et open source. Le paiement est traité sur la page de don externe.</p>
          <a className="button button-primary" href={DONATION_URL} target="_blank" rel="noreferrer">
            <Icon name="heart" size={16} /> Ouvrir la page de don <Icon name="external" size={15} />
          </a>
        </article>

        <article className="help-community-card">
          <div className="help-community-icon"><Icon name="help" size={21} /></div>
          <div className="eyebrow">AIDE ET CONTRIBUTIONS</div>
          <h2>Rejoindre la communauté</h2>
          <p>Consultez le code source, les consignes de contribution et la documentation du projet.</p>
          <a className="button button-secondary" href={REPOSITORY_URL} target="_blank" rel="noreferrer">
            <Icon name="external" size={15} /> Ouvrir PayFlow sur GitHub
          </a>
        </article>
      </div>

      <div className="help-community-note"><strong>À propos des paiements</strong><span>PayFlow ne reçoit aucune notification et n’utilise aucun webhook. Vous marquez chaque lien payé après votre propre vérification.</span></div>
    </section>
  );
}
