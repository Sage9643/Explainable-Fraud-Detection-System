import { useState } from "react";
import { UploadCloud, Rows3, ShieldAlert, TrendingUp, Timer, Download, RotateCcw } from "lucide-react";
import CSVUploader from "../components/forms/CSVUploader.jsx";
import StatCard from "../components/cards/StatCard.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import RiskBadge from "../components/tables/RiskBadge.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import { SkeletonStatGrid, SkeletonChart } from "../components/feedback/Skeleton.jsx";
import RiskDistributionChart from "../charts/RiskDistributionChart.jsx";
import { useBatchPredict } from "../hooks/useBatchPredict.js";
import { downloadBatchResults } from "../services/batchService.js";
import { useToast } from "../context/ToastContext.jsx";
import { formatNumber, formatPercent } from "../utils/formatters.js";

const RISK_DISTRIBUTION_COLUMNS = [
  { key: "risk_band", header: "Risk Band", render: (row) => <RiskBadge riskBand={row.risk_band} /> },
  { key: "count", header: "Transactions", render: (row) => formatNumber(row.count) },
];

export default function BatchPrediction() {
  const { status, result, error, upload, reset } = useBatchPredict();
  const { showToast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const isUploading = status === "uploading";

  async function handleUpload(file) {
    await upload(file);
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      await downloadBatchResults(result.batch_id);
      showToast("Batch results exported successfully", "success");
    } catch (err) {
      showToast(`Export failed: ${err.message}`, "error");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {status !== "success" && (
        <div className="card p-6">
          <CSVUploader onFileSelected={handleUpload} disabled={isUploading} />
          <p className="mt-3 text-center text-xs text-ink-500 dark:text-ink-400">
            CSV must contain columns V1 through V28 and Amount.
          </p>
        </div>
      )}

      {isUploading && (
        <div role="status" aria-label="Scoring transactions" className="space-y-4">
          <span className="sr-only">Scoring transactions…</span>
          <SkeletonStatGrid count={4} />
          <SkeletonChart />
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <ErrorState message={error} />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
            >
              <RotateCcw size={13} aria-hidden="true" /> Try Again
            </button>
          </div>
        </div>
      )}

      {status === "success" && result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Batch <span className="font-mono text-ink-700 dark:text-ink-200">{result.batch_id}</span> scored
              successfully.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1.5 rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
              >
                <UploadCloud size={13} aria-hidden="true" /> Upload Another
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                aria-label="Download scored results as CSV"
                className="flex items-center gap-1.5 rounded-md bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50"
              >
                <Download size={13} aria-hidden="true" /> {downloading ? "Preparing…" : "Download Results"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Rows3}
              label="Rows Scored"
              value={formatNumber(result.rows_scored)}
              accent="brand"
            />
            <StatCard
              icon={ShieldAlert}
              label="Fraud Count"
              value={formatNumber(result.fraud_count)}
              accent="critical"
            />
            <StatCard
              icon={TrendingUp}
              label="Fraud Rate"
              value={formatPercent(result.fraud_rate)}
              accent="high"
            />
            <StatCard
              icon={Timer}
              label="Processing Time"
              value={`${formatNumber(result.processing_time_ms)} ms`}
              accent="brand"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-1">
              <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Risk Distribution</h3>
              <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">Scored transactions by risk band</p>
              <RiskDistributionChart data={result.risk_distribution} />
            </div>

            <div className="card lg:col-span-2">
              <div className="p-5 pb-0">
                <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Risk Band Summary</h3>
                <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">
                  Row-level results are available in the downloaded CSV
                </p>
              </div>
              <DataTable columns={RISK_DISTRIBUTION_COLUMNS} rows={result.risk_distribution} keyField="risk_band" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}