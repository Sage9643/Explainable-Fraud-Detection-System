import { BarChart3 } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function ModelAnalytics() {
  return (
    <ComingSoon
      icon={BarChart3}
      title="Model Analytics"
      description="ROC/PR curves, confusion matrix, and risk-band fraud rates from the frozen model's metadata.json will render here."
      sprint="Sprint 8"
    />
  );
}
