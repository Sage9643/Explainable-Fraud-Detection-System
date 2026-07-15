import { ShieldCheck, ShieldAlert, ShieldQuestion, ShieldX } from "lucide-react";

/**
 * The only place risk-band -> color/icon/label mapping is defined.
 * Charts, badges, and tables all import from here so the visual language
 * for risk never drifts between components.
 */
export const RISK_BANDS = {
  Low: {
    label: "Low",
    color: "#0f9d58",
    bg: "bg-risk-low/10",
    text: "text-risk-low",
    border: "border-risk-low/30",
    icon: ShieldCheck,
  },
  Medium: {
    label: "Medium",
    color: "#d9a404",
    bg: "bg-risk-medium/10",
    text: "text-risk-medium",
    border: "border-risk-medium/30",
    icon: ShieldQuestion,
  },
  High: {
    label: "High",
    color: "#e8720c",
    bg: "bg-risk-high/10",
    text: "text-risk-high",
    border: "border-risk-high/30",
    icon: ShieldAlert,
  },
  Critical: {
    label: "Critical",
    color: "#d93025",
    bg: "bg-risk-critical/10",
    text: "text-risk-critical",
    border: "border-risk-critical/30",
    icon: ShieldX,
  },
};

export function getRiskConfig(band) {
  return RISK_BANDS[band] ?? RISK_BANDS.Low;
}
