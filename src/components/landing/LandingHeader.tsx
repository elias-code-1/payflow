import React, { useState } from "react";

export default function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="landing-header">
      <div className="landing-container landing-nav">
        <a className="landing-brand" href="#accueil"><img className="landing-brand-mark" src="/payflow-icon.svg" alt="" /><span>PayFlow<span className="brand-dot">.</span></span></a>
        <button className="landing-menu-button" aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "×" : "☰"}</button>
        <nav className={menuOpen ? "is-open" : ""} aria-label="Navigation du site">
          <a href="#fonctionnalites" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
          <a href="#telechargements" onClick={() => setMenuOpen(false)}>Téléchargements</a>
          <a href="#tutoriels-installation" onClick={() => setMenuOpen(false)}>Tutoriels</a>
          <a href="#securite" onClick={() => setMenuOpen(false)}>Confidentialité</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <div className="landing-nav-actions"><a className="landing-login" href="/dashboard.html">Connexion</a><a className="landing-button landing-button-small" href="/dashboard.html">Ouvrir le dashboard <span>↗</span></a></div>
      </div>
    </header>
  );
}
