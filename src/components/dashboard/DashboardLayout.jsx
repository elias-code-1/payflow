import React from "react";
import Icon from "../common/Icon";

export const navItems = [
  ["overview", "Vue d’ensemble", "grid"],
  ["transactions", "Transactions", "arrows"],
  ["links", "Liens de paiement", "link"],
  ["customers", "Clients", "users"],
  ["analytics", "Analytique", "chart"],
];

export default function DashboardLayout({ page, onNavigate, query, onQueryChange, user, onLogout, children }) {
  const currentLabel = navItems.find(([id]) => id === page)?.[1] || "Paramètres";

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
          {navItems.map(([id, label, icon]) => (
            <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => onNavigate(id)}>
              <Icon name={icon} /><span>{label}</span>
            </button>
          ))}
          <span className="nav-section-label nav-section-bottom">PRÉFÉRENCES</span>
          <button className={`nav-item ${page === "settings" ? "active" : ""}`} onClick={() => onNavigate("settings")}><Icon name="settings" /><span>Paramètres</span></button>
        </nav>
        <div className="sidebar-bottom">
          <a className="support-card" href="https://github.com/" target="_blank" rel="noreferrer"><span className="support-icon">?</span><span><strong>Aide & communauté</strong><small>Projet open source</small></span><Icon name="chevron" size={15} /></a>
          <div className="profile-row"><div className="profile-avatar">{user.email.slice(0, 2).toUpperCase()}</div><div><strong>{user.email}</strong><small>Compte local isolé</small></div><button className="logout-button" onClick={onLogout}>Quitter</button></div>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">PayFlow <span>/</span> <strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <label className="search-box"><Icon name="search" size={17} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Rechercher..." /></label>
            <div className="topbar-divider" />
            <div className="topbar-date"><span className="live-dot" /> Données locales</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
