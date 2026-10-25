import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../common/Icon";
import {
  DEFAULT_DOWNLOAD_LINKS,
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

interface DownloadsGuidePageProps {
  search?: string;
  onNotice?: (message: string, isError?: boolean) => void;
}

export default function DownloadsGuidePage({ search = "", onNotice }: DownloadsGuidePageProps) {
  const [links, setLinks] = useState<DownloadLinks>(DEFAULT_DOWNLOAD_LINKS);
  const [category, setCategory] = useState<PlatformCategory>("all");
  const [selectedId, setSelectedId] = useState<string>("linux-appimage");
  const [copiedKey, setCopiedKey] = useState<string>("");
  const tutorialDetailRef = useRef<HTMLDivElement | null>(null);

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
    const normalizedQuery = search.trim().toLowerCase();
    return PACKAGE_TUTORIALS.filter((pkg) => {
      if (category !== "all" && pkg.category !== category) return false;
      if (!normalizedQuery) return true;
      const haystack = `${pkg.extension} ${pkg.name} ${pkg.systems} ${pkg.summary} ${pkg.envVarName}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [category, search]);

  const selectedTutorial: PackageTutorial = useMemo(() => {
    const inFiltered = filteredPackages.find((item) => item.id === selectedId);
    if (inFiltered) return inFiltered;
    if (filteredPackages.length > 0) return filteredPackages[0];
    return PACKAGE_TUTORIALS.find((item) => item.id === selectedId) || PACKAGE_TUTORIALS[0];
  }, [filteredPackages, selectedId]);

  function selectAndScrollToTutorial(id: string): void {
    setSelectedId(id);
    requestAnimationFrame(() => {
      tutorialDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function copyCommand(command: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedKey(key);
      onNotice?.("Commande copiée dans le presse-papiers.");
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 2200);
    } catch {
      onNotice?.("La copie automatique a échoué. Sélectionnez la commande manuellement.", true);
    }
  }

  const selectedDownload = resolvePackageDownload(selectedTutorial, links);

  return (
    <section className="panel full-panel feature-page downloads-guide-page">
      <div className="feature-heading">
        <div>
          <div className="eyebrow">APPLICATIONS BUREAU & MOBILE</div>
          <h1>Téléchargements & tutoriels d’installation</h1>
          <p>
            Téléchargez PayFlow pour Windows, Linux, FreeBSD, Android ou iOS et suivez le guide complet adapté à chaque extension de fichier.
          </p>
        </div>
        <div className="downloads-header-links">
          <a className="button button-secondary" href={links.releasesUrl || REPOSITORY_RELEASES_URL} target="_blank" rel="noreferrer">
            <Icon name="download" size={15} />
            <span>GitHub Releases</span>
            <Icon name="external" size={14} />
          </a>
          <a className="button button-secondary" href={REPOSITORY_ACTIONS_URL} target="_blank" rel="noreferrer">
            <span>Builds GitHub Actions</span>
            <Icon name="external" size={14} />
          </a>
        </div>
      </div>

      <div className="downloads-filter-bar" role="tablist" aria-label="Filtrer par système d’exploitation">
        {PLATFORM_CATEGORIES.map((tab) => {
          const isActive = category === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`downloads-filter-tab ${isActive ? "is-active" : ""}`}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {filteredPackages.length === 0 ? (
        <div className="table-empty">
          <strong>Aucun format ne correspond à votre recherche</strong>
          <span>Effacez le filtre de recherche en haut de page ou choisissez « Tous les formats ».</span>
        </div>
      ) : (
        <div className="downloads-catalog-grid">
          {filteredPackages.map((pkg) => {
            const download = resolvePackageDownload(pkg, links);
            const isSelected = selectedTutorial.id === pkg.id;
            return (
              <article
                key={pkg.id}
                className={`download-format-item ${isSelected ? "is-selected" : ""}`}
              >
                <div className="download-format-meta">
                  <strong>{pkg.extension}</strong>
                  <span aria-hidden="true">·</span>
                  <span>{pkg.systems}</span>
                </div>
                <h2>{pkg.name}</h2>
                <p>{pkg.summary}</p>
                <div className="download-format-actions">
                  <a
                    className={`button ${download.isDirect ? "button-primary" : "button-secondary"}`}
                    href={download.url}
                    target="_blank"
                    rel="noreferrer"
                    download={download.isDirect || undefined}
                  >
                    <Icon name={download.isDirect ? "download" : "external"} size={14} />
                    <span>{download.label}</span>
                  </a>
                  <button
                    type="button"
                    className={`button ${isSelected ? "button-primary" : "button-secondary"}`}
                    onClick={() => selectAndScrollToTutorial(pkg.id)}
                  >
                    <span>{isSelected ? "Tutoriel affiché ↓" : "Tutoriel d’installation"}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="tutorial-viewer" id="tutoriel-detail" ref={tutorialDetailRef}>
        <div className="tutorial-viewer-header">
          <div>
            <div className="download-format-meta">
              <strong>GUIDE D’INSTALLATION COMPLET</strong>
              <span aria-hidden="true">·</span>
              <span>{selectedTutorial.extension}</span>
              <span aria-hidden="true">·</span>
              <span>{selectedTutorial.systems}</span>
            </div>
            <h2>Comment installer {selectedTutorial.name}</h2>
            <p>{selectedTutorial.summary}</p>
          </div>
          <div className="downloads-header-links">
            <a
              className="button button-primary"
              href={selectedDownload.url}
              target="_blank"
              rel="noreferrer"
              download={selectedDownload.isDirect || undefined}
            >
              <Icon name={selectedDownload.isDirect ? "download" : "external"} size={15} />
              <span>{selectedDownload.label}</span>
            </a>
          </div>
        </div>

        <div className="tutorial-quick-selector" aria-label="Choisir un format de fichier">
          {PACKAGE_TUTORIALS.map((pkg) => (
            <button
              key={pkg.id}
              type="button"
              className={`tutorial-selector-btn ${selectedTutorial.id === pkg.id ? "is-active" : ""}`}
              onClick={() => setSelectedId(pkg.id)}
            >
              {pkg.extension}
            </button>
          ))}
        </div>

        <div className="tutorial-prereq-row">
          <strong>Prérequis avant de commencer :</strong> <span>{selectedTutorial.prerequisites}</span>
        </div>

        <ol className="tutorial-steps-list">
          {selectedTutorial.steps.map((step, index) => {
            const copyId = `${selectedTutorial.id}-step-${index}`;
            const stepNumber = String(index + 1).padStart(2, "0");
            return (
              <li key={step.title} className="tutorial-step-row">
                <span className="tutorial-step-index">{stepNumber}</span>
                <div className="tutorial-step-body">
                  <h3>{step.title}</h3>
                  <p>{step.detail}</p>
                  {step.command && (
                    <div className="tutorial-command-box">
                      <div className="tutorial-command-top">
                        <span>{step.commandLabel || "Terminal"}</span>
                        <button
                          type="button"
                          onClick={() => copyCommand(step.command!, copyId)}
                        >
                          <Icon name={copiedKey === copyId ? "check" : "copy"} size={13} />
                          <span>{copiedKey === copyId ? "Copié" : "Copier la commande"}</span>
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

        <div className="tutorial-reference-rows">
          <div className="tutorial-ref-row">
            <strong>Emplacement local des données & sauvegardes</strong>
            <code>{selectedTutorial.storagePath}</code>
          </div>
          <div className="tutorial-ref-row">
            <strong>Dépannage fréquent</strong>
            <span>{selectedTutorial.troubleshooting}</span>
          </div>
          <div className="tutorial-ref-row">
            <strong>Mise à jour & désinstallation</strong>
            <span>{selectedTutorial.uninstallNote}</span>
          </div>
          <div className="tutorial-ref-row">
            <strong>Lien direct personnalisé (.env serveur)</strong>
            <span>
              Pour activer un bouton de téléchargement direct sur ce format, renseignez <code>{selectedTutorial.envVarName}=https://…</code> dans votre fichier <code>.env</code> (ou sur Render).
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
