import { LayoutDashboard } from "lucide-react";
import ComingSoon from "../components/feedback/ComingSoon.jsx";

export default function Dashboard() {
  return (
    <ComingSoon
      icon={LayoutDashboard}
      title="Fraud Intelligence Dashboard"
      description="Total predictions, fraud rate, and risk alerts will appear here once connected to the analytics API."
      sprint="Sprint 5"
    />
  );
}
