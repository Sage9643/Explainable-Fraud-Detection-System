import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Lightbulb, ArrowUp, ArrowDown } from "lucide-react";
import TransactionForm from "../components/forms/TransactionForm.jsx";
import RiskBadge from "../components/tables/RiskBadge.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import { useExplain } from "../hooks/useExplain.js";
import { formatPercent } from "../utils/formatters.js";

function ContributionRow({ contribution }) {
  const increasesRisk = contribution.direction === "increases_risk";
  return (
    <div className="flex items-center justify-between border-b border-ink-50 py-2.5 last:border-b-0 dark:border-ink-800">
      <div className="flex items-center gap-2">
        {increasesRisk ? (
          <ArrowUp size={14} className="text-risk-critical" />
        ) : (
          <ArrowDown size={14} className="text-risk-low" />
        )}
        <span className="text-sm font-medium text-ink-800 dark:text-ink-100">{contribution.feature}</span>
        <span className="text-xs text-ink-400">value = {contribution.feature_value}</span>
      </div>
      <span className={`text-sm font-medium ${increasesRisk ? "text-risk-critical" : "text-risk-low"}`}>
        {contribution.shap_value > 0 ? "+" : ""}
        {contribution.shap_value}
      </span>
    </div>
  );
}

export default function Explainability() {
  const location = useLocation();
  const incomingTransaction = location.state?.transaction ?? null;
  const { result, loading, error, explain } = useExplain();
  const autoSubmitted = useRef(false);

  useEffect(() => {
    if (incomingTransaction && !autoSubmitted.current) {
      autoSubmitted.current = true;
      explain(incomingTransaction);
    }
    // Only auto-submit once, on arrival with a transaction handed off from
    // the Predict Transaction page - not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingTransaction]);

  function handleSubmit(transaction) {
    explain(transaction);
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400">
            <Lightbulb size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Explain a Transaction</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {incomingTransaction
                ? "Pre-filled from your last prediction — submit to see why the model decided what it did."
                : "Enter V1–V28 and Amount to see the SHAP-based reasoning behind a prediction"}
            </p>
          </div>
        </div>

        <TransactionForm
          onSubmit={handleSubmit}
          submitLabel="Explain"
          loading={loading}
          initialValues={incomingTransaction}
        />
      </div>

      {loading && <LoadingState label="Computing SHAP explanation…" />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && result && (
        <div className="card p-6">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Fraud Probability</p>
              <p className="text-lg font-semibold text-ink-900 dark:text-ink-50">
                {formatPercent(result.fraud_probability, 4)}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Risk Band</p>
              <div className="mt-1">
                <RiskBadge riskBand={result.risk_band} />
              </div>
            </div>
          </div>

          <p className="mb-4 rounded-md border border-ink-100 bg-ink-50/60 px-4 py-3 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-800/40 dark:text-ink-200">
            {result.summary}
          </p>

          <h3 className="mb-2 text-sm font-semibold text-ink-900 dark:text-ink-50">Top Contributing Features</h3>
          <div>
            {result.top_contributing_features.map((contribution) => (
              <ContributionRow key={contribution.feature} contribution={contribution} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}