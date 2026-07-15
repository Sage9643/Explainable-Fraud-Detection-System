import { useEffect, useState } from "react";
import { Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "../services/api.js";
import { formatDateTime } from "../utils/formatters.js";

function StatusPill({ ok, label }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? "bg-risk-low/10 text-risk-low"
          : "bg-risk-critical/10 text-risk-critical"
      }`}
    >
      {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {label}
    </span>
  );
}

export default function AboutModel() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/health")
      .then((res) => {
        if (!cancelled) setHealth(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400">
            <Info size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Model Identity</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">Live from GET /api/health</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-8 text-sm text-ink-500 dark:text-ink-400">
            <Loader2 size={16} className="animate-spin" /> Connecting to backend…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-md border border-risk-critical/30 bg-risk-critical/5 px-4 py-3 text-sm text-risk-critical">
            Could not reach the backend: {error}. Confirm the API is running and VITE_API_URL is set correctly.
          </div>
        )}

        {!loading && health && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Model Name</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{health.model_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Model Version</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{health.model_version ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Trained</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">
                {formatDateTime(health.training_date)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-500 dark:text-ink-400">Backend Uptime</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{health.uptime ?? "—"}</dd>
            </div>
            <div className="col-span-2 flex gap-2 pt-2">
              <StatusPill ok={health.model_loaded} label="Model Loaded" />
              <StatusPill ok={health.shap_loaded} label="SHAP Loaded" />
              <StatusPill ok={health.database_connected} label="Database Connected" />
            </div>
          </dl>
        )}
      </div>

      <p className="px-1 text-xs text-ink-400">
        Full model card (hyperparameters, evaluation metrics, risk-band definitions) will render here once the
        Model Analytics API is wired up in Sprint 8.
      </p>
    </div>
  );
}
