import { History } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function PredictionHistory() {
  return (
    <ComingSoon
      icon={History}
      title="Prediction History"
      description="A searchable, filterable audit trail of every prediction made through the platform."
      sprint="Sprint 9"
    />
  );
}
