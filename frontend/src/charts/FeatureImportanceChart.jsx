import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { BarChart3 } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";
import EmptyState from "../components/feedback/EmptyState.jsx";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-xs shadow-card dark:border-ink-700 dark:bg-surface-dark-subtle">
      <p className="font-medium text-ink-900 dark:text-ink-50">{point.feature}</p>
      <p className="text-ink-500 dark:text-ink-400">Importance: {point.importance.toFixed(4)}</p>
    </div>
  );
}

export default function FeatureImportanceChart({ data }) {
  const { theme } = useTheme();
  const [mode, setMode] = useState("gain");

  const gridColor = theme === "dark" ? "#22262f" : "#eceef1";
  const axisColor = theme === "dark" ? "#8891a1" : "#646d7d";

  const hasGain = data?.gain && data.gain.length > 0;
  const hasShap = data?.shap && data.shap.length > 0;

  if (!data || (!hasGain && !hasShap)) {
    return (
      <div className="h-80 w-full">
        <EmptyState
          icon={BarChart3}
          title="Feature importance not available"
          description="Regenerate metadata.json with feature importance data to enable this chart."
          compact
        />
      </div>
    );
  }

  const activeMode = mode === "shap" && hasShap ? "shap" : "gain";
  const chartData = [...(data[activeMode] ?? [])].reverse(); // largest bar at top

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <div className="flex rounded-md border border-ink-200 p-0.5 dark:border-ink-700">
          <button
            type="button"
            onClick={() => setMode("gain")}
            disabled={!hasGain}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
              activeMode === "gain"
                ? "bg-brand-500 text-white"
                : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            Gain
          </button>
          <button
            type="button"
            onClick={() => setMode("shap")}
            disabled={!hasShap}
            className={`rounded px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
              activeMode === "shap"
                ? "bg-brand-500 text-white"
                : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
            }`}
          >
            SHAP
          </button>
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} axisLine={{ stroke: gridColor }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="feature"
              width={90}
              tick={{ fontSize: 11, fill: axisColor }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: theme === "dark" ? "#22262f" : "#f6f7f9" }} />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {chartData.map((entry) => (
                <Cell key={entry.feature} fill="#5b8def" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}