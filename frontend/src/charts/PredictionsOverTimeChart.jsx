import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-xs shadow-card dark:border-ink-700 dark:bg-surface-dark-subtle">
      <p className="mb-1 font-medium text-ink-900 dark:text-ink-50">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function PredictionsOverTimeChart({ data }) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#22262f" : "#eceef1";
  const axisColor = theme === "dark" ? "#8891a1" : "#646d7d";

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full">
        <EmptyState
          icon={LineChartIcon}
          title="No prediction activity yet"
          description="Run a transaction prediction to start populating this chart."
          compact
        />
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-ink-600 dark:text-ink-300">{value}</span>}
          />
          <Line type="monotone" dataKey="predictions" name="Predictions" stroke="#3568d4" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="fraud" name="Fraud Detected" stroke="#d93025" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}