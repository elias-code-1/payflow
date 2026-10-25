import React from "react";
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
  children: ReactNode;
}

export const navItems: NavItem[] = [
  { id: "overview", label: "Vue d’ensemble", icon: "grid" },
  { id: "transactions", label: "Transactions", icon: "arrows" },
  { id: "links", label: "Liens de paiement", icon: "link" },
  { id: "customers", label: "Clients", icon: "users" },
  { id: "analytics", label: "Analytique", icon: "chart" },
];

export default function DashboardLayout({ page, onNavigate, query, onQueryChange, user, onLogout, children }: DashboardLayoutProps) {
  const currentLabel = page === "support" ? "Aide & communauté" : navItems.find((item) => item.id === page)?.label || "Paramètres";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="PayFlow, accueil">
          <span className="brand-symbol">p</span>
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
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => onNavigate(id)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
          <span className="nav-section-label nav-section-bottom">PRÉFÉRENCES</span>
          <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}><Icon name="settings" /><span>Paramètres</span></button>
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
            <label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher..." /></label>
            <a className="topbar-donate" href={DONATION_URL} target="_blank" rel="noreferrer" aria-label="Soutenir PayFlow avec un don">
              <Icon name="heart" size={16} /><span>Faire un don</span>
            </a>
            <div className="topbar-divider" />
            <div className="topbar-date"><span className="live-dot" /> Données locales</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
