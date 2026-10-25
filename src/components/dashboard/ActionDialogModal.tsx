import React, { useEffect, useId, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import Icon from "../common/Icon";

export interface ActionDialogInputConfig {
  label: string;
  type?: "text" | "datetime-local";
  placeholder?: string;
  required?: boolean;
  initialValue?: string;
  maxLength?: number;
  helperText?: string;
  clearLabel?: string;
}

export interface ActionDialogModalProps {
  eyebrow?: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  input?: ActionDialogInputConfig;
  onCancel: () => void;
  onConfirm: (value: string) => void | Promise<void>;
}

export default function ActionDialogModal({
  eyebrow = "CONFIRMATION",
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  busy = false,
  input,
  onCancel,
  onConfirm,
}: ActionDialogModalProps) {
  const titleId = useId();
  const [value, setValue] = useState(input?.initialValue ?? "");

  useEffect(() => {
    setValue(input?.initialValue ?? "");
  }, [input?.initialValue, title]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onCancel();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const trimmed = input?.type === "datetime-local" ? value.trim() : value.trim();
    if (input?.required && !trimmed) return;
    await onConfirm(trimmed);
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (!busy && event.target === event.currentTarget) onCancel();
      }}
    >
      <section className="payment-modal action-dialog-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal-heading">
          <div>
            <div className="eyebrow">{eyebrow}</div>
            <h2 id={titleId}>{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} disabled={busy} aria-label="Fermer">
            <Icon name="close" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {input && (
            <label>
              {input.label}
              <input
                autoFocus
                type={input.type || "text"}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={input.placeholder}
                required={input.required}
                maxLength={input.maxLength}
                disabled={busy}
              />
              {input.helperText && <small>{input.helperText}</small>}
            </label>
          )}
          <div className="action-dialog-buttons">
            <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>
              {cancelLabel}
            </button>
            {input?.clearLabel && (
              <button
                type="button"
                className="button button-secondary"
                disabled={busy}
                onClick={() => {
                  void onConfirm("");
                }}
              >
                {input.clearLabel}
              </button>
            )}
            <button
              type="submit"
              autoFocus={!input}
              className="button button-primary"
              disabled={busy || Boolean(input?.required && !value.trim())}
            >
              {busy ? <span className="spinner" /> : <Icon name="check" size={16} />}
              {busy ? "Traitement…" : confirmLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
