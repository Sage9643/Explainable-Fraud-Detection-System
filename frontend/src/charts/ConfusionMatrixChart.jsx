import { Grid3x3 } from "lucide-react";
import EmptyState from "../components/feedback/EmptyState.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

function MatrixCell({ label, count, total, tone }) {
  const toneClasses = {
    correct: "bg-risk-low/10 border-risk-low/30 text-risk-low",
    incorrect: "bg-risk-critical/10 border-risk-critical/30 text-risk-critical",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-1 rounded-card border p-5 text-center ${toneClasses[tone]}`}>
      <span className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</span>
      <span className="text-2xl font-semibold">{formatNumber(count)}</span>
      <span className="text-xs opacity-70">{formatPercent(total > 0 ? count / total : 0)}</span>
    </div>
  );
}

export default function ConfusionMatrixChart({ data }) {
  if (!data) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <EmptyState
          icon={Grid3x3}
          title="Confusion matrix not available"
          description="Regenerate metadata.json with confusion matrix data to enable this view."
          compact
        />
      </div>
    );
  }

  const { true_negative, false_positive, false_negative, true_positive } = data;
  const total = true_negative + false_positive + false_negative + true_positive;

  return (
    <div>
      <div className="mb-3 grid grid-cols-[auto_1fr_1fr] items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
        <div />
        <div className="text-center font-medium">Predicted Legitimate</div>
        <div className="text-center font-medium">Predicted Fraudulent</div>
      </div>

      <div className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
        <div className="-rotate-90 whitespace-nowrap text-xs font-medium text-ink-500 dark:text-ink-400">
          Actual Legitimate
        </div>
        <MatrixCell label="True Negative" count={true_negative} total={total} tone="correct" />
        <MatrixCell label="False Positive" count={false_positive} total={total} tone="incorrect" />

        <div className="-rotate-90 whitespace-nowrap text-xs font-medium text-ink-500 dark:text-ink-400">
          Actual Fraudulent
        </div>
        <MatrixCell label="False Negative" count={false_negative} total={total} tone="incorrect" />
        <MatrixCell label="True Positive" count={true_positive} total={total} tone="correct" />
      </div>

      <p className="mt-3 text-center text-xs text-ink-500 dark:text-ink-400">
        Based on {formatNumber(total)} test-set transactions
      </p>
    </div>
  );
}