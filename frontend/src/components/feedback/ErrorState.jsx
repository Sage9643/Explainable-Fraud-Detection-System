import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Something went wrong." }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-card border border-risk-critical/30 bg-risk-critical/5 px-6 text-center">
      <AlertTriangle size={20} className="text-risk-critical" />
      <p className="text-sm text-risk-critical">{message}</p>
    </div>
  );
}