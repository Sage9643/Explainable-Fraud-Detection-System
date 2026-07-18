import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Activity } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-xs shadow-card dark:border-ink-700 dark:bg-surface-dark-subtle">
      <p className="text-ink-900 dark:text-ink-50">FPR: {point.fpr.toFixed(4)}</p>
      <p className="text-ink-900 dark:text-ink-50">TPR: {point.tpr.toFixed(4)}</p>
      {point.threshold !== null && point.threshold !== undefined && (
        <p className="text-ink-500 dark:text-ink-400">Threshold: {point.threshold.toFixed(6)}</p>
      )}
    </div>
  );
}

export default function ROCCurveChart({ data, auc }) {
  const { theme } = useTheme();
  const gridColor = theme === "dark" ? "#22262f" : "#eceef1";
  const axisColor = theme === "dark" ? "#8891a1" : "#646d7d";

  if (!data || data.length === 0) {
    return (
      <div className="h-72 w-full">
        <EmptyState
          icon={Activity}
          title="ROC curve not available"
          description="Regenerate metadata.json with curve data to enable this chart."
          compact
        />
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
            label={{ value: "False Positive Rate", position: "insideBottom", offset: -4, fontSize: 11, fill: axisColor }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: axisColor }}
            axisLine={false}
            tickLine={false}
            label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fontSize: 11, fill: axisColor }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="line"
            formatter={(value) => <span className="text-xs text-ink-600 dark:text-ink-300">{value}</span>}
          />
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke={axisColor}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
            label={{ value: "Random guess", position: "insideTopLeft", fontSize: 10, fill: axisColor }}
          />
          <Line
            type="monotone"
            dataKey="tpr"
            name={auc ? `ROC Curve (AUC = ${auc.toFixed(4)})` : "ROC Curve"}
            stroke="#3568d4"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}