import React from "react";

export function HeroSection() {
  return (
    <section className="landing-hero" id="accueil">
      <div className="landing-container landing-hero-grid">
        <div className="landing-hero-copy">
          <span className="landing-pill"><i /> OPEN SOURCE · LOCAL-FIRST</span>
          <h1>Encaissez en ligne.<br /><span>Gardez le contrôle.</span></h1>
          <p>PayFlow est un outil gratuit pour créer et partager des liens de paiement PayGateGlobal. Vos clés et vos données restent sur votre appareil.</p>
          <div className="landing-actions"><a className="landing-button" href="/dashboard.html">Créer mon espace <span>→</span></a><a className="landing-button landing-button-outline" href="#comment-ca-marche">Découvrir le fonctionnement</a></div>
          <div className="landing-trust"><span>✓ Pas d’abonnement PayFlow</span><span>✓ SQLite local</span><span>✓ Votre clé API</span></div>
        </div>
        <div className="landing-product-card" aria-label="Aperçu du tableau de bord PayFlow">
          <div className="mockup-top"><span className="mockup-dots">● ● ●</span><span>payflow.local / dashboard</span><span className="mockup-status">● Local</span></div>
          <div className="mockup-content"><div className="mockup-greeting"><small>VOTRE ESPACE MARCHAND</small><h2>Bonjour 👋</h2><p>Voici l’activité de votre compte.</p></div>
            <div className="mockup-cards"><div><small>REVENUS CONFIRMÉS</small><strong>248 500 <i>FCFA</i></strong><span>Mis à jour depuis votre base locale</span></div><div><small>LIENS CRÉÉS</small><strong>18</strong><span>3 cette semaine</span></div></div>
            <div className="mockup-graph"><div className="mockup-graph-label"><strong>Activité récente</strong><span>7 jours⌄</span></div><svg viewBox="0 0 430 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 95 C45 78 52 90 95 62 S145 86 185 54 S235 74 280 38 S340 67 385 25 S410 32 430 10 V120 H0Z" fill="url(#mockFill)" /><path d="M0 95 C45 78 52 90 95 62 S145 86 185 54 S235 74 280 38 S340 67 385 25 S410 32 430 10" fill="none" stroke="#10a783" strokeWidth="3" /><defs><linearGradient id="mockFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#10a783" stopOpacity=".2" /><stop offset="1" stopColor="#10a783" stopOpacity="0" /></linearGradient></defs></svg></div>
            <div className="mockup-link"><span className="mockup-link-icon">↗</span><span><strong>Lien de paiement</strong><small>Commande #1042 · 25 000 FCFA</small></span><b>Copier</b></div>
          </div><div className="mockup-glow" />
        </div>
      </div>
    </section>
  );
}

export function TrustSection() {
  return <section className="landing-trust-strip"><div className="landing-container"><span>FAIT POUR VOS ENCAISSEMENTS</span><strong>T-Money</strong><strong>Flooz</strong><strong>PayGateGlobal</strong><strong>SQLite</strong><strong>Open source</strong></div></section>;
}

export function StatsSection() {
  return <section className="landing-container landing-stats"><article><strong>0<span> FCFA</span></strong><small>d’abonnement PayFlow</small></article><article><strong>100<span>%</span></strong><small>des données conservées localement</small></article><article><strong>1<span> clé</span></strong><small>votre compte PayGateGlobal</small></article><article><strong>∞</strong><small>liens à créer selon votre usage</small></article></section>;
}

export function ProblemSection() {
  return <section className="landing-section landing-problem"><div className="landing-container landing-split"><div><span className="landing-kicker">PLUS SIMPLE, PLUS DIRECT</span><h2>La création d’un lien ne devrait pas être compliquée.</h2><p>PayFlow rassemble les outils essentiels dans un espace local, sans compte tiers ni frais de plateforme.</p></div><div className="problem-list"><div><span>01</span><p>Configurez votre propre clé API PayGateGlobal.</p></div><div><span>02</span><p>Renseignez le montant, la devise et le réseau de paiement.</p></div><div><span>03</span><p>Copiez le lien généré et envoyez-le à votre client.</p></div></div></div></section>;
}

export function FeaturesSection() {
  const features = [
    ["✦", "Liens à la demande", "Créez un lien par vente avec une référence et une description."],
    ["⌂", "Données chez vous", "Comptes, liens et paramètres enregistrés dans une base SQLite locale."],
    ["↗", "Partage facile", "Copiez l’URL ou ouvrez la page de paiement en un clic."],
    ["◎", "Multi-comptes locaux", "Chaque compte garde ses propres clients, liens et clé API."],
    ["▤", "Rapports lisibles", "Suivez les liens, les clients et les événements de paiement reçus."],
    ["⌘", "Gratuit et ouvert", "Le code est libre, sans abonnement PayFlow ni verrouillage propriétaire."],
  ];
  return <section className="landing-section" id="fonctionnalites"><div className="landing-container"><div className="landing-section-heading"><span className="landing-kicker">VOTRE OUTIL, VOS RÈGLES</span><h2>Tout ce qu’il faut pour commencer à encaisser.</h2><p>Une interface conçue pour les indépendants, boutiques et petites équipes.</p></div><div className="landing-feature-grid">{features.map(([icon, title, text]) => <article className="landing-feature" key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}
