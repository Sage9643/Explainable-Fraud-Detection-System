import { useState } from "react";
import { Search, History as HistoryIcon, ChevronLeft, ChevronRight } from "lucide-react";
import DataTable from "../components/tables/DataTable.jsx";
import RiskBadge from "../components/tables/RiskBadge.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";
import { SkeletonTable } from "../components/feedback/Skeleton.jsx";
import { useHistory } from "../hooks/useHistory.js";
import { formatDateTime, formatPercent } from "../utils/formatters.js";

const RISK_BAND_OPTIONS = ["All", "Low", "Medium", "High", "Critical"];

const COLUMNS = [
  { key: "timestamp", header: "Timestamp", render: (row) => formatDateTime(row.timestamp) },
  { key: "prediction", header: "Prediction" },
  {
    key: "fraud_probability",
    header: "Fraud Probability",
    render: (row) => formatPercent(row.fraud_probability, 4),
  },
  { key: "risk_band", header: "Risk Band", render: (row) => <RiskBadge riskBand={row.risk_band} /> },
  { key: "confidence", header: "Confidence", render: (row) => formatPercent(row.confidence) },
];

export default function PredictionHistory() {
  const [searchInput, setSearchInput] = useState("");
  const [riskBandFilter, setRiskBandFilter] = useState("All");

  const search = searchInput.trim() || null;
  const riskBand = riskBandFilter === "All" ? null : riskBandFilter;

  const { data, loading, error, page, setPage, totalPages, refetch } = useHistory({ riskBand, search });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            aria-hidden="true"
          />
          <label htmlFor="history-search" className="sr-only">
            Search by prediction
          </label>
          <input
            id="history-search"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by prediction…"
            className="w-full rounded-md border border-ink-200 bg-surface-light py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 dark:border-ink-700 dark:bg-surface-dark-subtle dark:text-ink-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="history-risk-filter" className="text-xs text-ink-500 dark:text-ink-400">
            Risk band
          </label>
          <select
            id="history-risk-filter"
            value={riskBandFilter}
            onChange={(e) => setRiskBandFilter(e.target.value)}
            className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-sm text-ink-800 focus:border-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 dark:border-ink-700 dark:bg-surface-dark-subtle dark:text-ink-100"
          >
            {RISK_BAND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div role="status" aria-label="Loading prediction history">
          <span className="sr-only">Loading prediction history…</span>
          <SkeletonTable rows={8} />
        </div>
      )}

      {!loading && error && (
        <div className="card">
          <ErrorState message={error} onRetry={refetch} />
        </div>
      )}

      {!loading && !error && data && data.items.length === 0 && (
        <div className="card">
          <EmptyState
            icon={HistoryIcon}
            title="No predictions yet."
            description="Run a transaction prediction to populate the history log."
          />
        </div>
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <div className="card">
          <DataTable columns={COLUMNS} rows={data.items} />

          <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 dark:border-ink-700">
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Page {page} of {totalPages} · {data.total} total predictions
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 text-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 disabled:opacity-40 dark:border-ink-700 dark:text-ink-400"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-ink-200 text-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 disabled:opacity-40 dark:border-ink-700 dark:text-ink-400"
                aria-label="Next page"
              >
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}