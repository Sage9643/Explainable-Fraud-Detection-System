import { CheckCircle2, XCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", onDismiss }) {
  const isSuccess = type === "success";

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-center gap-2 rounded-md border bg-surface-light px-4 py-3 text-sm shadow-card dark:bg-surface-dark-subtle ${
        isSuccess ? "border-risk-low/30" : "border-risk-critical/30"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={16} className="shrink-0 text-risk-low" aria-hidden="true" />
      ) : (
        <XCircle size={16} className="shrink-0 text-risk-critical" aria-hidden="true" />
      )}
      <span className="text-ink-800 dark:text-ink-100">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="ml-2 shrink-0 text-ink-400 transition-colors hover:text-ink-700 dark:hover:text-ink-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}