import React, { useState } from "react";
import type { ReactNode } from "react";
import Icon from "../common/Icon";
import { DONATION_URL } from "../../constants/externalLinks";
import type { DashboardPageId, User } from "../../types";

interface NavItem {
  id: Exclude<DashboardPageId, "support">;
  label: string;
  icon: string;
}

interface DashboardLayoutProps {
  page: DashboardPageId;
  onNavigate: (page: DashboardPageId) => void;
  query: string;
  onQueryChange: (query: string) => void;
  user: User;
  onLogout: () => void;
  onCreateBackup: () => void;
  creatingBackup?: boolean;
  children: ReactNode;
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "grid" },
  { id: "manualPayments", label: "Encaissements", icon: "receipt" },
  { id: "links", label: "Liens de paiement", icon: "link" },
  { id: "customers", label: "Clients", icon: "users" },
  { id: "catalog", label: "Catalogue", icon: "box" },
  { id: "qrCodes", label: "QR codes", icon: "qr" },
  { id: "exports", label: "Exports", icon: "file" },
  { id: "backups", label: "Sauvegardes", icon: "database" },
  { id: "downloads", label: "Téléchargements", icon: "download" },
  { id: "analytics", label: "Analytique", icon: "chart" },
  { id: "reminders", label: "Relances", icon: "bell" },
  { id: "transactions", label: "Historique", icon: "arrows" },
];

const mobileNavItems: Array<{ id: DashboardPageId; label: string }> = [
  ...navItems.map(({ id, label }) => ({ id, label })),
  { id: "settings", label: "Paramètres" },
  { id: "support", label: "Aide & communauté" },
];

export default function DashboardLayout({ page, onNavigate, query, onQueryChange, user, onLogout, onCreateBackup, creatingBackup = false, children }: DashboardLayoutProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const currentLabel = page === "support" ? "Aide & communauté" : navItems.find((item) => item.id === page)?.label || "Paramètres";

  return (
    <div className="app-shell">
      <a className="skip-link" href="#dashboard-main">Aller au contenu</a>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="PayFlow, accueil">
          <img className="brand-symbol" src="/payflow-icon.svg" alt="" />
          <span className="brand-name">payflow<span>.</span><small>MERCHANT</small></span>
        </a>
        <div className="workspace-label">ESPACE MARCHAND</div>
        <div className="workspace-card">
          <div className="workspace-avatar">P</div>
          <div><strong>Mon espace marchand</strong><small>Stockage local</small></div>
          <span className="workspace-chevron"><Icon name="chevron" size={15} /></span>
        </div>
        <nav className="side-nav" aria-label="Navigation principale">
          <span className="nav-section-label">GESTION</span>
          {navItems.map(({ id, label, icon }) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => onNavigate(id)} aria-current={page === id ? "page" : undefined} title={label}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
          <span className="nav-section-label nav-section-bottom">PRÉFÉRENCES</span>
          <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")} aria-current={page === "settings" ? "page" : undefined}><Icon name="settings" /><span>Paramètres</span></button>
          <button className={`nav-item nav-support ${page === "support" ? "active" : ""}`} onClick={() => onNavigate("support")} aria-current={page === "support" ? "page" : undefined}><Icon name="help" /><span>Aide & communauté</span></button>
          <button className="nav-item nav-logout" onClick={onLogout} aria-label="Déconnexion du compte"><Icon name="logout" /><span>Déconnexion</span></button>
        </nav>
        <div className="sidebar-bottom">
          <button className={`support-card ${page === "support" ? "active" : ""}`} onClick={() => onNavigate("support")} aria-current={page === "support" ? "page" : undefined}>
            <span className="support-icon"><Icon name="help" size={16} /></span>
            <span><strong>Aide & communauté</strong><small>Documentation et projet</small></span>
            <Icon name="chevron" size={15} />
          </button>
          <div className="profile-row"><div className="profile-avatar">{user.email.slice(0, 2).toUpperCase()}</div><div className="profile-identity"><strong>{user.email}</strong><small>Compte local isolé</small></div><button className="logout-button" onClick={onLogout} aria-label="Déconnexion du compte">Déconnexion</button></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">PayFlow <span>/</span> <strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <label className={`search-box ${mobileSearchOpen ? "mobile-search-open" : ""}`}><Icon name="search" size={17} /><input autoFocus={mobileSearchOpen} value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher..." aria-label="Rechercher dans la page" /></label>
            <button className="mobile-search-toggle" onClick={() => setMobileSearchOpen((value) => !value)} aria-label={mobileSearchOpen ? "Fermer la recherche" : "Ouvrir la recherche"} aria-expanded={mobileSearchOpen}><Icon name={mobileSearchOpen ? "close" : "search"} size={18} /></button>
            <button type="button" className="button button-primary topbar-backup" onClick={onCreateBackup} disabled={creatingBackup} aria-label="Créer une sauvegarde">
              {creatingBackup ? <span className="spinner" /> : <Icon name="download" size={16} />}
              <span>{creatingBackup ? "Sauvegarde…" : "Créer une sauvegarde"}</span>
            </button>
            <a className="topbar-donate" href={DONATION_URL} target="_blank" rel="noreferrer" aria-label="Soutenir PayFlow avec un don">
              <Icon name="heart" size={16} /><span>Faire un don</span>
            </a>
            <div className="topbar-divider" />
            <div className="topbar-date"><span className="live-dot" /> Données locales</div>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Navigation du dashboard mobile">
          <label><span>Aller à</span><select value={page} onChange={(event) => onNavigate(event.target.value as DashboardPageId)}>{mobileNavItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <button type="button" onClick={onCreateBackup} disabled={creatingBackup} aria-label="Créer une sauvegarde"><Icon name="download" size={16} /><span>{creatingBackup ? "Copie…" : "Créer une sauvegarde"}</span></button>
          <button onClick={onLogout} aria-label="Déconnexion"><Icon name="logout" size={17} /><span>Quitter</span></button>
        </nav>
        <div className="page-content" id="dashboard-main">{children}</div>
      </main>
    </div>
  );
}
