import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_DOWNLOAD_LINKS,
  DONATION_URL,
  fetchDownloadLinks,
  REPOSITORY_ACTIONS_URL,
  REPOSITORY_RELEASES_URL,
  type DownloadLinks,
} from "../../constants/externalLinks";
import {
  PACKAGE_TUTORIALS,
  PLATFORM_CATEGORIES,
  resolvePackageDownload,
  type PackageTutorial,
  type PlatformCategory,
} from "../../data/downloadTutorials";

export function PricingSection() {
  return <section className="landing-section landing-section-tinted" id="tarifs"><div className="landing-container landing-pricing"><div><span className="landing-kicker">TARIFICATION</span><h2>PayFlow est gratuit.</h2><p>Le logiciel ne facture aucun abonnement. Les frais et conditions de paiement de PayGateGlobal continuent de s’appliquer selon votre contrat.</p></div><div className="pricing-card"><span>PAYFLOW OPEN SOURCE</span><strong>0 <i>FCFA</i></strong><ul><li>✓ Dashboard local</li><li>✓ SQLite sur votre appareil</li><li>✓ Clé API personnelle</li><li>✓ Liens de paiement</li></ul><a className="landing-button" href="/dashboard.html">Créer mon compte</a></div></div></section>;
}

export function TestimonialSection() {
  return <section className="landing-section"><div className="landing-container landing-quote"><span className="landing-kicker">UNE APPROCHE SIMPLE</span><blockquote>« Un outil d’encaissement doit vous aider à garder la main sur vos clients et vos données. »</blockquote><p>La promesse de PayFlow : un logiciel libre, local et sans abonnement.</p></div></section>;
}

const faqItems = [
  ["PayFlow est-il vraiment gratuit ?", "Oui. Le logiciel est open source et ne facture pas d’abonnement. Les frais éventuels du prestataire de paiement restent indépendants de PayFlow."],
  ["Où sont stockées mes données ?", "Dans une base SQLite locale à l’installation (%APPDATA%\\PayFlow sur Windows, ~/.config/PayFlow sur Linux). Utilisez le bouton « Créer une sauvegarde » disponible en haut de chaque page pour exporter une copie JSON."],
  ["Est-ce que PayFlow débite directement mon client ?", "Non. PayFlow génère un lien hébergé par PayGateGlobal. Le client ouvre le lien et finalise lui-même le paiement."],
  ["Comment les paiements confirmés alimentent-ils les graphiques ?", "PayFlow ne reçoit aucune notification de paiement. Les graphiques évoluent lorsque vous marquez manuellement un lien comme payé dans votre dashboard."],
  ["Quel format choisir sur Linux ?", "Le format .AppImage fonctionne sur presque toutes les distributions sans installation root. Si vous êtes sur Ubuntu, Debian ou Mint, le paquet .deb ajoute automatiquement PayFlow à votre menu d’applications."],
  ["La landing page est-elle incluse dans l’APK/EXE ?", "Non. Seul le dashboard marchand (qui contient aussi l’onglet Téléchargements & tutoriels) est embarqué dans les applications bureau et mobiles."],
];

export function FaqSection() {
  const [open, setOpen] = useState(0);
  return <section className="landing-section landing-section-tinted" id="faq"><div className="landing-container landing-faq-layout"><div><span className="landing-kicker">FAQ</span><h2>Les réponses aux questions fréquentes.</h2><p>Vous pouvez aussi parcourir le code source et contribuer au projet.</p></div><div className="landing-faq">{faqItems.map(([question, answer], index) => <article key={question}><button aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>{question}<span>{open === index ? "−" : "+"}</span></button>{open === index && <p>{answer}</p>}</article>)}</div></div></section>;
}

export function DownloadsSection() {
  const [links, setLinks] = useState<DownloadLinks>(DEFAULT_DOWNLOAD_LINKS);
  const [category, setCategory] = useState<PlatformCategory>("all");
  const [selectedId, setSelectedId] = useState<string>("windows-nsis");
  const [copiedKey, setCopiedKey] = useState<string>("");
  const tutorialRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    fetchDownloadLinks().then((nextLinks) => {
      if (active) setLinks(nextLinks);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredPackages = useMemo(() => {
    if (category === "all") return PACKAGE_TUTORIALS;
    return PACKAGE_TUTORIALS.filter((pkg) => pkg.category === category);
  }, [category]);

  const selectedTutorial: PackageTutorial = useMemo(() => {
    const matchInFilter = filteredPackages.find((pkg) => pkg.id === selectedId);
    if (matchInFilter) return matchInFilter;
    return filteredPackages[0] || PACKAGE_TUTORIALS[0];
  }, [filteredPackages, selectedId]);

  function openTutorial(id: string): void {
    setSelectedId(id);
    requestAnimationFrame(() => {
      tutorialRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function copyCommand(command: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 2200);
    } catch {
      /* Presse-papiers indisponible : l’utilisateur peut sélectionner le bloc manuellement */
    }
  }

  const selectedDownload = resolvePackageDownload(selectedTutorial, links);

  return (
    <section className="landing-section landing-section-tinted landing-downloads-hub" id="telechargements">
      <div className="landing-container">
        <div className="landing-downloads-header">
          <div>
            <span className="landing-kicker">CENTRE DE TÉLÉCHARGEMENT & TUTORIELS</span>
            <h2>Téléchargez PayFlow et installez-le pas à pas.</h2>
            <p>
              Sélectionnez votre système ci-dessous pour télécharger le paquet correspondant ou afficher le tutoriel complet d’installation pour chaque type de fichier (Windows, Linux, FreeBSD, Android et iOS).
            </p>
          </div>
          <div className="landing-downloads-header-actions">
            <a className="landing-button landing-button-small" href={links.releasesUrl || REPOSITORY_RELEASES_URL} target="_blank" rel="noreferrer">
              GitHub Releases <span>↗</span>
            </a>
            <a className="landing-button landing-button-small landing-button-outline" href={REPOSITORY_ACTIONS_URL} target="_blank" rel="noreferrer">
              Artefacts GitHub Actions <span>↗</span>
            </a>
          </div>
        </div>

        <div className="landing-os-tabs" role="tablist" aria-label="Filtrer les téléchargements par plateforme">
          {PLATFORM_CATEGORIES.map((tab) => {
            const isActive = category === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={isActive ? "is-active" : ""}
                onClick={() => setCategory(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="landing-package-grid">
          {filteredPackages.map((pkg) => {
            const download = resolvePackageDownload(pkg, links);
            const isSelected = selectedTutorial.id === pkg.id;
            return (
              <article key={pkg.id} className={`landing-package-card ${isSelected ? "is-selected" : ""}`}>
                <div className="landing-package-meta">
                  <strong>{pkg.extension}</strong>
                  <span aria-hidden="true">·</span>
                  <span>{pkg.systems}</span>
                </div>
                <h3>{pkg.name}</h3>
                <p>{pkg.summary}</p>
                <div className="landing-package-actions">
                  <a
                    className={`landing-pkg-btn ${download.isDirect ? "is-primary" : ""}`}
                    href={download.url}
                    target="_blank"
                    rel="noreferrer"
                    download={download.isDirect || undefined}
                  >
                    {download.label} {download.isDirect ? "↓" : "↗"}
                  </a>
                  <button
                    type="button"
                    className={`landing-pkg-btn ${isSelected ? "is-active-guide" : ""}`}
                    onClick={() => openTutorial(pkg.id)}
                  >
                    {isSelected ? "Tutoriel ouvert ↓" : "Tutoriel complet ↓"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="landing-tutorial-panel" id="tutoriels-installation" ref={tutorialRef}>
          <div className="landing-tutorial-top">
            <div>
              <div className="landing-package-meta">
                <strong>TUTORIEL D’INSTALLATION DÉTAILLÉ</strong>
                <span aria-hidden="true">·</span>
                <span>{selectedTutorial.extension}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedTutorial.systems}</span>
              </div>
              <h3>Installer {selectedTutorial.name}</h3>
              <p>{selectedTutorial.summary}</p>
            </div>
            <a
              className="landing-button landing-button-small"
              href={selectedDownload.url}
              target="_blank"
              rel="noreferrer"
              download={selectedDownload.isDirect || undefined}
            >
              {selectedDownload.label} <span>{selectedDownload.isDirect ? "↓" : "↗"}</span>
            </a>
          </div>

          <div className="landing-tutorial-switcher" aria-label="Accès rapide par extension de fichier">
            {PACKAGE_TUTORIALS.map((pkg) => (
              <button
                key={pkg.id}
                type="button"
                className={selectedTutorial.id === pkg.id ? "is-active" : ""}
                onClick={() => setSelectedId(pkg.id)}
              >
                {pkg.extension}
              </button>
            ))}
          </div>

          <div className="landing-tutorial-prereq">
            <strong>Prérequis :</strong> <span>{selectedTutorial.prerequisites}</span>
          </div>

          <ol className="landing-tutorial-steps">
            {selectedTutorial.steps.map((step, index) => {
              const copyKey = `land-${selectedTutorial.id}-${index}`;
              const stepNum = String(index + 1).padStart(2, "0");
              return (
                <li key={step.title}>
                  <span className="landing-step-num">{stepNum}</span>
                  <div className="landing-step-content">
                    <h4>{step.title}</h4>
                    <p>{step.detail}</p>
                    {step.command && (
                      <div className="landing-cmd-block">
                        <div className="landing-cmd-bar">
                          <span>{step.commandLabel || "Terminal"}</span>
                          <button type="button" onClick={() => copyCommand(step.command!, copyKey)}>
                            {copiedKey === copyKey ? "Copié ✓" : "Copier la commande"}
                          </button>
                        </div>
                        <pre><code>{step.command}</code></pre>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="landing-tutorial-notes">
            <div>
              <strong>Dossier local des données & sauvegardes</strong>
              <code>{selectedTutorial.storagePath}</code>
            </div>
            <div>
              <strong>Dépannage & erreurs courantes</strong>
              <span>{selectedTutorial.troubleshooting}</span>
            </div>
            <div>
              <strong>Mise à jour & désinstallation</strong>
              <span>{selectedTutorial.uninstallNote}</span>
            </div>
            <div>
              <strong>Configurer un lien direct (.env)</strong>
              <span>
                Définissez <code>{selectedTutorial.envVarName}=https://…</code> sur le serveur pour pointer ce bouton directement vers votre binaire hébergé.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BuildInstructionsSection() {
  return (
    <section className="landing-build" id="build-instructions">
      <div className="landing-container">
        <span className="landing-kicker">BUILD DEPUIS LES SOURCES</span>
        <div className="landing-build-grid">
          <div>
            <h2>Compiler vous-même les applications natives.</h2>
            <p>
              Vous pouvez également générer tous les paquets bureau (Linux et Windows) ainsi que le projet mobile Capacitor directement depuis le dépôt GitHub ou via les workflows GitHub Actions.
            </p>
          </div>
          <pre><code>{`npm install && npm run build\nnpm run package:linux   # AppImage, .deb, .rpm, .snap, .flatpak, .tar.*\nnpm run package:win     # .exe NSIS & Portable\nnpm run cap:sync        # Synchroniser Android / iOS\ncd android && ./gradlew assembleDebug`}</code></pre>
        </div>
        <small>Les workflows automatisés (.github/workflows/build-desktop.yml et build-mobile.yml) compilent l’ensemble des formats à chaque mise à jour.</small>
      </div>
    </section>
  );
}

export function DonateSection() {
  return <section className="landing-section landing-donate"><div className="landing-container landing-donate-card"><div><span className="landing-kicker">SOUTENIR LE PROJET</span><h2>PayFlow est gratuit. Votre soutien aide à le faire grandir.</h2><p>Vous pouvez contribuer au projet libre avec un don volontaire.</p></div><a className="landing-button landing-button-light" href={DONATION_URL} target="_blank" rel="noreferrer">Faire un don <span>↗</span></a></div></section>;
}

export function FinalCtaSection() {
  return <section className="landing-final-cta"><div className="landing-container"><h2>Prêt à créer votre premier lien ?</h2><p>Commencez par ouvrir le dashboard et créer votre espace marchand local.</p><a className="landing-button landing-button-light" href="/dashboard.html">Ouvrir PayFlow <span>→</span></a></div></section>;
}

export function LandingFooter() {
  return <footer className="landing-footer"><div className="landing-container"><a className="landing-brand" href="#accueil"><img className="landing-brand-mark" src="/payflow-icon.svg" alt="" /><span>PayFlow<span className="brand-dot">.</span></span></a><div><a href="#fonctionnalites">Fonctionnalités</a><a href="#telechargements">Téléchargements</a><a href="#tutoriels-installation">Tutoriels</a><a href="#faq">FAQ</a><a href="/dashboard.html">Dashboard</a><a href={DONATION_URL} target="_blank" rel="noreferrer">Faire un don</a></div><small>Open source · Local-first · Les frais du prestataire s’appliquent.</small></div></footer>;
}
