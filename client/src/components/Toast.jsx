// src/components/Toast.jsx
// Reusable toast notification component + useToast hook.
//
// Usage:
//   const { toast, showToast } = useToast();
//   ...
//   showToast("Message here", "success"); // or "error" | "info"
//   ...
//   <Toast toast={toast} />

import { useState, useCallback } from "react";
import "./Toast.css";

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useToast(duration = 2800) {
  const [toast, setToast] = useState({ message: "", type: "success", visible: false });

  const showToast = useCallback(
    (message, type = "success") => {
      setToast({ message, type, visible: true });
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
    },
    [duration]
  );

  return { toast, showToast };
}

// ── Component ─────────────────────────────────────────────────────────────────

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({ toast }) {
  if (!toast?.visible) return null;

  return (
    <div className={`zapgo-toast zapgo-toast--${toast.type}`} role="alert" aria-live="polite">
      <span className="zapgo-toast__icon">{ICONS[toast.type] ?? ICONS.info}</span>
      <span className="zapgo-toast__message">{toast.message}</span>
    </div>
  );
}
