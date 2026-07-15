import { ScanSearch } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function PredictTransaction() {
  return (
    <ComingSoon
      icon={ScanSearch}
      title="Predict Transaction"
      description="A transaction form will call POST /api/predict and display fraud probability, risk band, and recommended action here."
      sprint="Sprint 6"
    />
  );
}
