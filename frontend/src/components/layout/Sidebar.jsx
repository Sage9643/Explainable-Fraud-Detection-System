import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanSearch,
  UploadCloud,
  Lightbulb,
  BarChart3,
  History,
  Settings,
  Info,
  ShieldHalf,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/predict", label: "Predict Transaction", icon: ScanSearch },
  { to: "/batch", label: "Batch Prediction", icon: UploadCloud },
  { to: "/explainability", label: "Explainability", icon: Lightbulb },
  { to: "/analytics", label: "Model Analytics", icon: BarChart3 },
  { to: "/history", label: "Prediction History", icon: History },
];

const SECONDARY_ITEMS = [
  { to: "/about-model", label: "About Model", icon: Info },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-400"
            : "text-ink-600 hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50",
        ].join(" ")
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-100 bg-surface-light dark:border-ink-700 dark:bg-surface-dark-subtle">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white">
          <ShieldHalf size={18} strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-ink-900 dark:text-ink-50">FraudLens AI</p>
          <p className="text-xs leading-tight text-ink-400">Fraud Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="space-y-1 border-t border-ink-100 px-3 py-3 dark:border-ink-700">
        {SECONDARY_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
