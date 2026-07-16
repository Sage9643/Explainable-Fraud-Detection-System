import { getRiskConfig } from "../../utils/riskColors.js";

/**
 * Renders a risk band as a colored pill badge. Pulls all color/icon logic
 * from utils/riskColors.js so History, Batch Prediction, and Analytics
 * always render risk identically - no per-page color duplication.
 */
export default function RiskBadge({ riskBand, showIcon = true }) {
  const config = getRiskConfig(riskBand);
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      {showIcon && <Icon size={12} strokeWidth={2} />}
      {config.label}
    </span>
  );
}