import { Lightbulb } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function Explainability() {
  return (
    <ComingSoon
      icon={Lightbulb}
      title="Explainability"
      description="SHAP feature contributions and plain-language reasoning for a given transaction will render here."
      sprint="Sprint 6"
    />
  );
}
