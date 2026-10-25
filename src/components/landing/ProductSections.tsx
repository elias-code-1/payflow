import React from "react";

export function HowItWorksSection() {
  const steps = [["01", "Créez votre espace", "Un compte local avec un mot de passe. Pas de création de compte PayFlow sur internet."], ["02", "Ajoutez votre clé API", "Chaque compte configure sa propre clé dans les paramètres du dashboard."], ["03", "Générez et partagez", "Préparez un montant et partagez le lien de paiement à votre client."]];
  return <section className="landing-section landing-section-tinted" id="comment-ca-marche"><div className="landing-container"><div className="landing-section-heading"><span className="landing-kicker">TROIS ÉTAPES</span><h2>Du compte au lien en quelques minutes.</h2></div><div className="landing-steps">{steps.map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

export function NetworksSection() {
  return <section className="landing-section"><div className="landing-container landing-split landing-network"><div><span className="landing-kicker">PAIEMENT MOBILE</span><h2>Les réseaux disponibles dans votre configuration PayGateGlobal.</h2><p>La disponibilité dépend de votre compte marchand, de votre pays et des options activées chez PayGateGlobal.</p></div><div className="network-grid"><div className="network-mark network-t">T<span>TMONEY</span></div><div className="network-mark network-f">F<span>FLOOZ</span></div><div className="network-note">Vérifiez toujours les réseaux activés dans votre compte PayGateGlobal.</div></div></div></section>;
}

export function CurrencySection() {
  return <section className="landing-section landing-section-dark"><div className="landing-container landing-split"><div><span className="landing-kicker">MONTANT TRANSPARENT</span><h2>Affichez votre prix. Encaissez en XOF.</h2><p>PayFlow conserve le montant et la devise affichés, puis convertit en XOF pour construire le lien : 1 EUR = 655,957 XOF et 1 USD = 600 XOF. Le taux USD est une estimation fixe, pas un taux de marché en temps réel.</p></div><div className="currency-card"><div><span>PRIX AFFICHÉ</span><strong>20,00 EUR</strong></div><span className="currency-arrow">↓</span><div><span>MONTANT ENVOYÉ À PAYGATEGLOBAL</span><strong>13 119 XOF</strong></div><small>Conversion indicative intégrée dans l’application.</small></div></div></section>;
}

export function CodeSection() {
  return <section className="landing-section" id="api"><div className="landing-container landing-split"><div><span className="landing-kicker">POUR LES DÉVELOPPEURS</span><h2>Une API locale, un format simple.</h2><p>Le dashboard utilise le backend Express local. Les endpoints de données sont protégés par votre session locale.</p><a className="landing-text-link" href="/dashboard.html">Explorer le dashboard →</a></div><pre className="landing-code"><code>{`POST /api/payment\nContent-Type: application/json\nCookie: payflow_session=…\n\n{\n  \"description\": \"Commande #1042\",\n  \"amount\": 25000,\n  \"currency\": \"XOF\",\n  \"network\": \"TMONEY\"\n}`}</code></pre></div></section>;
}

export function DashboardPreviewSection() {
  return <section className="landing-section landing-section-tinted"><div className="landing-container landing-split"><div className="preview-window"><div className="preview-sidebar"><b>p</b><i>▦</i><i>↔</i><i>↗</i><i>♙</i></div><div className="preview-main"><small>VUE D’ENSEMBLE</small><h3>Votre espace marchand</h3><div className="preview-metrics"><span>REVENUS CONFIRMÉS<b>248 500 FCFA</b></span><span>LIENS CRÉÉS<b>18 liens</b></span><span>CLIENTS<b>12 numéros</b></span></div><div className="preview-bars"><i /><i /><i /><i /><i /><i /><i /><i /></div></div></div><div><span className="landing-kicker">UN DASHBOARD CLAIR</span><h2>Vos liens et vos indicateurs réunis.</h2><p>Retrouvez les liens créés, les clients renseignés et les événements de paiement enregistrés dans votre SQLite.</p></div></div></section>;
}

export function UseCasesSection() {
  const useCases = [["Freelances", "Envoyez un lien avec la facture d’une mission."], ["Boutiques", "Créez un lien pour une commande ou un acompte."], ["Associations", "Partagez facilement un lien de collecte."], ["Créateurs", "Encaissez une prestation ou un produit numérique."]];
  return <section className="landing-section" id="usages"><div className="landing-container"><div className="landing-section-heading"><span className="landing-kicker">POUR QUI ?</span><h2>Un outil léger pour les activités qui encaissent.</h2></div><div className="landing-use-grid">{useCases.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>;
}

export function PrivacySection() {
  return <section className="landing-section landing-section-green" id="securite"><div className="landing-container landing-split"><div><span className="landing-kicker">LOCAL-FIRST</span><h2>Les données de chaque compte restent séparées.</h2><p>Les comptes, clés API, liens et données clients sont stockés dans la base SQLite de l’installation. Les sessions sont signées et utilisent un cookie HttpOnly.</p></div><div className="privacy-points"><p><b>✓</b> Clé API par compte</p><p><b>✓</b> Données filtrées par identifiant de compte</p><p><b>✓</b> Mot de passe stocké sous forme de dérivé cryptographique</p><p><b>✓</b> Serveur limité à l’interface locale par défaut</p><small>Pour une installation multi-utilisateur accessible depuis Internet, configurez HTTPS, sauvegardes et durcissement serveur.</small></div></div></section>;
}

export function PlatformsSection() {
  return (
    <section className="landing-section">
      <div className="landing-container">
        <div className="landing-section-heading">
          <span className="landing-kicker">WEB · WINDOWS · LINUX · ANDROID · IOS</span>
          <h2>Utilisez PayFlow sur votre environnement.</h2>
          <p>Choisissez la version adaptée à votre poste ou votre téléphone et suivez le tutoriel correspondant.</p>
        </div>
        <div className="landing-platform-grid landing-platform-grid-four">
          <article>
            <span>WEB</span>
            <h3>Application web</h3>
            <p>Le backend Express et SQLite s’exécutent localement ou sur votre propre serveur HTTPS.</p>
            <a className="landing-text-link" href="/dashboard.html">Ouvrir dans le navigateur →</a>
          </article>
          <article>
            <span>WINDOWS</span>
            <h3>Bureau Windows (.exe)</h3>
            <p>Installateur NSIS ou version portable autonome avec serveur et base SQLite embarqués.</p>
            <a className="landing-text-link" href="#telechargements">Voir les formats .exe ↓</a>
          </article>
          <article>
            <span>LINUX & BSD</span>
            <h3>Bureau Linux (10 formats)</h3>
            <p>AppImage, .deb, .rpm, .snap, .flatpak, .pacman, Alpine .apk, FreeBSD, .tar.* et .zip/.7z.</p>
            <a className="landing-text-link" href="#tutoriels-installation">Lire les tutoriels Linux ↓</a>
          </article>
          <article>
            <span>MOBILE</span>
            <h3>Android (.apk) & iOS (.ipa)</h3>
            <p>Applications mobiles Capacitor connectées à votre instance PayFlow sécurisée.</p>
            <a className="landing-text-link" href="#telechargements">Télécharger sur mobile ↓</a>
          </article>
        </div>
      </div>
    </section>
  );
}
