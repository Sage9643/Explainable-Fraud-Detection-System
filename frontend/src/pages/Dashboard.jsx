import { Activity, ShieldAlert, TrendingUp, Gauge, AlertOctagon, CalendarClock, Inbox } from "lucide-react";
import StatCard from "../components/cards/StatCard.jsx";
import LoadingState from "../components/feedback/LoadingState.jsx";
import ErrorState from "../components/feedback/ErrorState.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";
import RiskDistributionChart from "../charts/RiskDistributionChart.jsx";
import PredictionsOverTimeChart from "../charts/PredictionsOverTimeChart.jsx";
import { useDashboardStats } from "../hooks/useDashboardStats.js";
import { formatNumber, formatPercent } from "../utils/formatters.js";

export default function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) return <LoadingState label="Loading dashboard…" />;
  if (error) return <ErrorState message={error} />;
  if (!stats) return null;

  const { totals, today, risk_distribution, predictions_over_time } = stats;
  const hasPredictions = totals.total_predictions > 0;

  if (!hasPredictions) {
    return (
      <div className="card">
        <EmptyState
          icon={Inbox}
          title="No predictions yet."
          description="Run a transaction prediction to populate the dashboard."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Activity}
          label="Total Predictions"
          value={formatNumber(totals.total_predictions)}
          sublabel="All-time"
          accent="brand"
        />
        <StatCard
          icon={ShieldAlert}
          label="Fraud Count"
          value={formatNumber(totals.fraud_count)}
          sublabel="All-time flagged"
          accent="critical"
        />
        <StatCard
          icon={TrendingUp}
          label="Fraud Rate"
          value={formatPercent(totals.fraud_rate)}
          sublabel="Of all predictions"
          accent="high"
        />
        <StatCard
          icon={Gauge}
          label="Avg. Confidence"
          value={formatPercent(totals.avg_confidence)}
          sublabel="Model prediction confidence"
          accent="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={CalendarClock}
          label="Predictions Today"
          value={formatNumber(today.predictions_today)}
          accent="brand"
        />
        <StatCard
          icon={AlertOctagon}
          label="Fraud Today"
          value={formatNumber(today.fraud_today)}
          accent="critical"
        />
        <StatCard
          icon={ShieldAlert}
          label="High/Critical Alerts Today"
          value={formatNumber(today.high_risk_alerts_today)}
          accent="high"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Risk Distribution</h3>
          <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">Predictions by risk band</p>
          <RiskDistributionChart data={risk_distribution} />
        </div>

        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Predictions Over Time</h3>
          <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">Last 7 days</p>
          <PredictionsOverTimeChart data={predictions_over_time} />
        </div>
      </div>
    </div>
  );
}