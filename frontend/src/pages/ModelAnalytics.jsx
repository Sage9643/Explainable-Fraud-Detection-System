import { Target, CheckCircle2, Crosshair, Gauge, Database, Info } from "lucide-react";
import StatCard from "../components/cards/StatCard.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import RiskBadge from "../components/tables/RiskBadge.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import ROCCurveChart from "../charts/ROCCurveChart.jsx";
import PRCurveChart from "../charts/PRCurveChart.jsx";
import ConfusionMatrixChart from "../charts/ConfusionMatrixChart.jsx";
import FeatureImportanceChart from "../charts/FeatureImportanceChart.jsx";
import { useAnalytics } from "../hooks/useAnalytics.js";
import { formatDateTime, formatNumber, formatPercent } from "../utils/formatters.js";

const RISK_BAND_FRAUD_RATE_COLUMNS = [
  { key: "risk_band", header: "Risk Band", render: (row) => <RiskBadge riskBand={row.risk_band} /> },
  { key: "fraud_rate", header: "Fraud Rate", render: (row) => formatPercent(row.fraud_rate, 4) },
];

export default function ModelAnalytics() {
  const { data, loading, error } = useAnalytics();

  if (loading) return <LoadingState label="Loading model analytics…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  const { model_info, evaluation_metrics, risk_band_fraud_rates, confusion_matrix, roc_curve, pr_curve, feature_importance, dataset_info } = data;

  return (
    <div className="space-y-6">
      {/* Model identity card */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400">
            <Info size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {model_info.model_name} <span className="text-ink-400">v{model_info.model_version}</span>
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400">
              {model_info.algorithm} · Trained {formatDateTime(model_info.training_date)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-500 dark:text-ink-400">Optimization Objective</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{model_info.optimization_objective}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 dark:text-ink-400">Imbalance Strategy</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{model_info.imbalance_strategy}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 dark:text-ink-400">Decision Threshold</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{model_info.decision_threshold.toFixed(6)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-500 dark:text-ink-400">Random Seed</dt>
            <dd className="font-medium text-ink-900 dark:text-ink-50">{model_info.random_seed}</dd>
          </div>
        </div>

        <div className="mt-4 border-t border-ink-100 pt-3 dark:border-ink-700">
          <p className="mb-2 text-xs font-medium text-ink-500 dark:text-ink-400">Hyperparameters</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(model_info.hyperparameters).map(([key, value]) => (
              <span
                key={key}
                className="rounded-full border border-ink-200 px-2.5 py-1 text-xs text-ink-600 dark:border-ink-700 dark:text-ink-300"
              >
                {key}: <span className="font-medium text-ink-900 dark:text-ink-50">{String(value)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluation metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="AUC"
          value={evaluation_metrics.test_auc.toFixed(4)}
          sublabel="Area under ROC curve"
          accent="brand"
        />
        <StatCard
          icon={Crosshair}
          label="Precision"
          value={formatPercent(evaluation_metrics.test_precision)}
          sublabel="Of flagged fraud, % correct"
          accent="high"
        />
        <StatCard
          icon={CheckCircle2}
          label="Recall"
          value={formatPercent(evaluation_metrics.test_recall)}
          sublabel="Of actual fraud, % caught"
          accent="low"
        />
        <StatCard
          icon={Gauge}
          label="F1 Score"
          value={evaluation_metrics.test_f1.toFixed(4)}
          sublabel={`F2: ${evaluation_metrics.test_f2.toFixed(4)}`}
          accent="brand"
        />
      </div>

      {/* ROC + PR curves */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">ROC Curve</h3>
          <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">True positive rate vs. false positive rate</p>
          <ROCCurveChart data={roc_curve} auc={evaluation_metrics.test_auc} />
        </div>

        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Precision-Recall Curve</h3>
          <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">Precision vs. recall across thresholds</p>
          <PRCurveChart data={pr_curve} averagePrecision={evaluation_metrics.test_avg_precision} />
        </div>
      </div>

      {/* Confusion matrix + feature importance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Confusion Matrix</h3>
          <p className="mb-3 text-xs text-ink-500 dark:text-ink-400">Test-set prediction outcomes at the decision threshold</p>
          <ConfusionMatrixChart data={confusion_matrix} />
        </div>

        <div className="card p-5">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Feature Importance</h3>
          <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">Top contributing features, by gain or mean |SHAP value|</p>
          <FeatureImportanceChart data={feature_importance} />
        </div>
      </div>

      {/* Risk band fraud rates + dataset info */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="p-5 pb-0">
            <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Risk Band Fraud Rates</h3>
            <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">
              Actual fraud rate observed within each risk band on the test set
            </p>
          </div>
          <DataTable columns={RISK_BAND_FRAUD_RATE_COLUMNS} rows={risk_band_fraud_rates} keyField="risk_band" />
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database size={16} className="text-ink-400" />
            <h3 className="text-sm font-semibold text-ink-900 dark:text-ink-50">Dataset</h3>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Total Rows</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{formatNumber(dataset_info.total_rows)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Fraud Rate</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{dataset_info.fraud_rate_pct.toFixed(4)}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Train Rows</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{formatNumber(dataset_info.train_rows)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500 dark:text-ink-400">Test Rows</dt>
              <dd className="font-medium text-ink-900 dark:text-ink-50">{formatNumber(dataset_info.test_rows)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}