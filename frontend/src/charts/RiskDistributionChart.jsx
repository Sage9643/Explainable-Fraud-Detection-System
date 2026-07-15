import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { getRiskConfig } from "../utils/riskColors.js";
import { formatNumber } from "../utils/formatters.js";
import EmptyState from "../components/feedback/EmptyState.jsx";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border border-ink-200 bg-surface-light px-3 py-2 text-xs shadow-card dark:border-ink-700 dark:bg-surface-dark-subtle">
      <p className="font-medium text-ink-900 dark:text-ink-50">{entry.name}</p>
      <p className="text-ink-500 dark:text-ink-400">{formatNumber(entry.value)} predictions</p>
    </div>
  );
}

export default function RiskDistributionChart({ data }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-64 w-full">
        <EmptyState
          icon={PieChartIcon}
          title="No risk data yet"
          description="This chart populates once predictions have been made."
          compact
        />
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.risk_band,
    value: d.count,
    color: getRiskConfig(d.risk_band).color,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={32}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-ink-600 dark:text-ink-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}