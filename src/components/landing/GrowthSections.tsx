import React, { useState } from "react";

export function PricingSection() {
  return <section className="landing-section landing-section-tinted" id="tarifs"><div className="landing-container landing-pricing"><div><span className="landing-kicker">TARIFICATION</span><h2>PayFlow est gratuit.</h2><p>Le logiciel ne facture aucun abonnement. Les frais et conditions de paiement de PayGateGlobal continuent de s’appliquer selon votre contrat.</p></div><div className="pricing-card"><span>PAYFLOW OPEN SOURCE</span><strong>0 <i>FCFA</i></strong><ul><li>✓ Dashboard local</li><li>✓ SQLite sur votre appareil</li><li>✓ Clé API personnelle</li><li>✓ Liens de paiement</li></ul><a className="landing-button" href="/dashboard.html">Créer mon compte</a></div></div></section>;
}

export function TestimonialSection() {
  return <section className="landing-section"><div className="landing-container landing-quote"><span className="landing-kicker">UNE APPROCHE SIMPLE</span><blockquote>« Un outil d’encaissement doit vous aider à garder la main sur vos clients et vos données. »</blockquote><p>La promesse de PayFlow : un logiciel libre, local et sans abonnement.</p></div></section>;
}

const faqItems = [
  ["PayFlow est-il vraiment gratuit ?", "Oui. Le logiciel est open source et ne facture pas d’abonnement. Les frais éventuels du prestataire de paiement restent indépendants de PayFlow."],
  ["Où sont stockées mes données ?", "Dans une base SQLite locale à l’installation. Il est important de sauvegarder le fichier de base de données."],
  ["Est-ce que PayFlow débite directement mon client ?", "Non. PayFlow génère un lien hébergé par PayGateGlobal. Le client ouvre le lien et finalise lui-même le paiement."],
  ["Comment les paiements confirmés alimentent-ils les graphiques ?", "PayFlow ne reçoit aucune notification de paiement. Les graphiques évoluent lorsque vous marquez manuellement un lien comme payé dans votre dashboard."],
  ["Puis-je utiliser plusieurs comptes ?", "Oui. Chaque compte local a ses propres liens, clients et clé API, séparés dans SQLite."],
  ["La landing page est-elle incluse dans l’APK/EXE ?", "Non. Seul le dashboard est destiné aux applications desktop et Android. La landing page reste le site web public."],
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  return <section className="landing-section landing-section-tinted" id="faq"><div className="landing-container landing-faq-layout"><div><span className="landing-kicker">FAQ</span><h2>Les réponses aux questions fréquentes.</h2><p>Vous pouvez aussi parcourir le code source et contribuer au projet.</p></div><div className="landing-faq">{faqItems.map(([question, answer], index) => <article key={question}><button aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>{question}<span>{open === index ? "−" : "+"}</span></button>{open === index && <p>{answer}</p>}</article>)}</div></div></section>;
}

export function DownloadsSection() {
  return <section className="landing-section" id="telechargements"><div className="landing-container landing-downloads"><div><span className="landing-kicker">APPLICATIONS</span><h2>Construisez le dashboard pour votre appareil.</h2><p>Les paquets ne sont pas encore publiés. Les scripts de build se lancent depuis le dépôt source. Android exige Android Studio/JDK/SDK ; le .exe Windows se construit sous Windows ou avec Wine.</p></div><div className="download-cards"><article><span>⊞</span><div><strong>Windows · .exe</strong><small>Dashboard uniquement</small></div><a href="#build-instructions">Voir la commande</a></article><article><span>▣</span><div><strong>Android · .apk</strong><small>Dashboard uniquement</small></div><a href="#build-instructions">Voir la commande</a></article></div></div></section>;
}

export function BuildInstructionsSection() {
  return <section className="landing-build" id="build-instructions"><div className="landing-container"><span className="landing-kicker">BUILD DEPUIS LES SOURCES</span><div className="landing-build-grid"><div><h2>Compiler les applications natives.</h2><p>Windows : lancez le script sur Windows. Android : ouvrez android/ dans Android Studio ou utilisez Gradle après avoir installé le SDK.</p></div><pre><code>{`npm install\nnpm run build\nnpm run package:win\nnpm run cap:sync\ncd android && ./gradlew assembleDebug`}</code></pre></div><small>La compilation Android ne peut pas être exécutée sur cette machine tant que JDK, Android SDK et Gradle ne sont pas installés.</small></div></section>;
}

export function DonateSection() {
  return <section className="landing-section landing-donate"><div className="landing-container landing-donate-card"><div><span className="landing-kicker">SOUTENIR LE PROJET</span><h2>PayFlow est gratuit. Votre soutien aide à le faire grandir.</h2><p>Vous pouvez contribuer au projet libre avec un don volontaire.</p></div><a className="landing-button landing-button-light" href="https://by-josue.mychariow.com/prd_fmngq8xp/checkout" target="_blank" rel="noreferrer">Faire un don <span>↗</span></a></div></section>;
}

export function FinalCtaSection() {
  return <section className="landing-final-cta"><div className="landing-container"><h2>Prêt à créer votre premier lien ?</h2><p>Commencez par ouvrir le dashboard et créer votre espace marchand local.</p><a className="landing-button landing-button-light" href="/dashboard.html">Ouvrir PayFlow <span>→</span></a></div></section>;
}

export function LandingFooter() {
  return <footer className="landing-footer"><div className="landing-container"><a className="landing-brand" href="#accueil"><img className="landing-brand-mark" src="/payflow-icon.svg" alt="" /><span>PayFlow<span className="brand-dot">.</span></span></a><div><a href="#fonctionnalites">Fonctionnalités</a><a href="#faq">FAQ</a><a href="/dashboard.html">Dashboard</a><a href="#telechargements">Téléchargements</a><a href="https://by-josue.mychariow.com/prd_fmngq8xp/checkout" target="_blank" rel="noreferrer">Faire un don</a></div><small>Open source · Local-first · Les frais du prestataire s’appliquent.</small></div></footer>;
}
