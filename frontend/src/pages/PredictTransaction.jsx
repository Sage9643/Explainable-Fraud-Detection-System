import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScanSearch, Lightbulb, RotateCcw } from "lucide-react";
import TransactionForm from "../components/forms/TransactionForm.jsx";
import RiskBadge from "../components/tables/RiskBadge.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import { usePredict } from "../hooks/usePredict.js";
import { formatPercent } from "../utils/formatters.js";

export default function PredictTransaction() {
  const navigate = useNavigate();
  const { result, loading, error, predict, reset } = usePredict();
  const [lastTransaction, setLastTransaction] = useState(null);

  function handleExplain() {
    if (!lastTransaction) return;
    navigate("/explainability", { state: { transaction: lastTransaction } });
  }

  async function handleSubmit(transaction) {
    setLastTransaction(transaction);
    await predict(transaction);
  }

  function handleReset() {
    reset();
    setLastTransaction(null);
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400">
            <ScanSearch size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Transaction Details</h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Enter V1–V28 and Amount to score a single transaction
            </p>
          </div>
        </div>

        <TransactionForm onSubmit={handleSubmit} submitLabel="Predict" loading={loading} />
      </div>

      {error && <ErrorState message={error} />}

      {result && (
        <div className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Prediction Result</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExplain}
                className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
              >
                <Lightbulb size={13} /> Explain this Prediction
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <RotateCcw size={13} /> Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Prediction</p>
              <p className="text-lg font-semibold text-ink-900 dark:text-ink-50">{result.prediction}</p>
            </div>
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
            <div>
              <p className="text-xs text-ink-500 dark:text-ink-400">Recommended Action</p>
              <p className="text-lg font-semibold text-ink-900 dark:text-ink-50">{result.recommended_action}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}