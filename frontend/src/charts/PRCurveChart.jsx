import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-xs shadow-card dark:border-ink-700 dark:bg-surface-dark-subtle">
      <p className="text-ink-900 dark:text-ink-50">Precision: {point.precision.toFixed(4)}</p>
      <p className="text-ink-900 dark:text-ink-50">Recall: {point.recall.toFixed(4)}</p>
      {point.threshold !== null && point.threshold !== undefined && (
        <p className="text-ink-500 dark:text-ink-400">Threshold: {point.threshold.toFixed(6)}</p>
      )}
    </div>
  );
}

export default function PRCurveChart({ data, averagePrecision }) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#22262f" : "#eceef1";
  const axisColor = theme === "dark" ? "#8891a1" : "#646d7d";

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full">
        <EmptyState
          icon={TrendingDown}
          title="Precision-Recall curve not available"
          description="Regenerate metadata.json with curve data to enable this chart."
          compact
        />
      </div>
    );
  }

  // precision_recall_curve is naturally ordered by descending threshold;
  // sort by recall ascending so the line renders as a proper left-to-right
  // curve instead of crossing back over itself.
  const sortedData = [...data].sort((a, b) => a.recall - b.recall);

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={sortedData} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="recall"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            label={{ value: "Recall", position: "insideBottom", offset: -4, fontSize: 11, fill: axisColor }}
          />
          <YAxis
            dataKey="precision"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Precision", angle: -90, position: "insideLeft", fontSize: 11, fill: axisColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="line"
            formatter={(value) => <span className="text-xs text-ink-600 dark:text-ink-300">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="precision"
            name={averagePrecision ? `PR Curve (AP = ${averagePrecision.toFixed(4)})` : "PR Curve"}
            stroke="#059669"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}