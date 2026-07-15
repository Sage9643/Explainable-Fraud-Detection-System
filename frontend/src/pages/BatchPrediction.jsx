import { UploadCloud } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function BatchPrediction() {
  return (
    <ComingSoon
      icon={UploadCloud}
      title="Batch Prediction"
      description="Upload a CSV of transactions, score them all, and download the results with a risk-band summary."
      sprint="Sprint 7"
    />
  );
}
