import { useLocation } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/predict": "Predict Transaction",
  "/batch": "Batch Prediction",
  "/explainability": "Explainability",
  "/analytics": "Model Analytics",
  "/history": "Prediction History",
  "/settings": "Settings",
  "/about-model": "About Model",
};

export default function Topbar() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? "FraudLens AI";

  return (
    <header className="flex h-16 items-center justify-between border-b border-ink-100 bg-surface-light px-6 dark:border-ink-700 dark:bg-surface-dark-subtle">
      <div>
        <p className="text-xs text-ink-400">FraudLens AI</p>
        <h1 className="text-lg font-semibold text-ink-900 dark:text-ink-50">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
