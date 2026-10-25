import React from "react";
import type { ReactNode } from "react";

interface DashboardPageBoundaryProps {
  pageLabel: string;
  onReturnToOverview: () => void;
  children: ReactNode;
}

interface DashboardPageBoundaryState {
  errorMessage: string;
}

export default class DashboardPageBoundary extends React.Component<DashboardPageBoundaryProps, DashboardPageBoundaryState> {
  state: DashboardPageBoundaryState = { errorMessage: "" };

  static getDerivedStateFromError(error: Error): DashboardPageBoundaryState {
    return { errorMessage: error.message || "Erreur de rendu inconnue." };
  }

  render() {
    if (this.state.errorMessage) {
      return (
        <section className="panel page-error" role="alert">
          <div className="eyebrow">AFFICHAGE INTERROMPU</div>
          <h1>La page « {this.props.pageLabel} » n’a pas pu s’afficher.</h1>
          <p>Vous pouvez revenir à la vue d’ensemble sans recharger l’application.</p>
          <details><summary>Détail technique</summary><code>{this.state.errorMessage}</code></details>
          <div className="feature-actions">
            <button className="button button-primary" onClick={() => this.setState({ errorMessage: "" })}>Réessayer d’afficher la page</button>
            <button className="button button-secondary" onClick={this.props.onReturnToOverview}>Retour à la vue d’ensemble</button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
