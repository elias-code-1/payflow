import React, { useState } from "react";
import { api } from "../../services/api";
import type { FormEvent } from "react";
import type { User } from "../../types";

type AuthMode = "login" | "register";

interface AuthPageProps {
  hasAccounts: boolean;
  onAuthenticated: (user: User) => void | Promise<void>;
}

export default function AuthPage({ hasAccounts, onAuthenticated }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(hasAccounts ? "login" : "register");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    try {
      const action = mode === "register" ? api.register : api.login;
      const result = await action({
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      });
      await onAuthenticated(result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur est survenue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="auth-brand" href="/"><span className="brand-symbol">p</span><span>payflow<span>.</span></span></a>
        <div className="eyebrow">TABLEAU DE BORD LOCAL</div>
        <h1>{mode === "register" ? "Créer votre espace" : "Ravi de vous revoir"}</h1>
        <p>Chaque compte conserve sa propre clé API et ses propres données dans SQLite.</p>
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required maxLength="254" /></label>
          <label>Mot de passe<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} required minLength={mode === "register" ? 10 : 1} maxLength="200" /></label>
          {mode === "register" && <small className="auth-help">10 caractères minimum. Il n’existe pas de réinitialisation en ligne : gardez-le en lieu sûr.</small>}
          <button className="button button-primary" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "register" ? "Créer mon compte" : "Se connecter"}</button>
        </form>
        {hasAccounts && <button className="auth-mode-switch" onClick={() => { setError(""); setMode(mode === "register" ? "login" : "register"); }}>{mode === "register" ? "J’ai déjà un compte" : "Créer un nouveau compte"}</button>}
        <div className="auth-local-note"><span className="security-shield">✓</span> Comptes et données hébergés localement sur cet appareil.</div>
      </section>
    </main>
  );
}
