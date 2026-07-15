import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 py-4 last:border-b-0 dark:border-ink-700">
      <div>
        <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{label}</p>
        {description && <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <h2 className="mb-1 text-sm font-semibold text-ink-900 dark:text-ink-50">Appearance</h2>
        <p className="mb-2 text-xs text-ink-500 dark:text-ink-400">
          Preferences are stored locally in this browser.
        </p>

        <SettingRow label="Theme" description="Choose how FraudLens AI looks on this device.">
          <div className="flex rounded-md border border-ink-200 p-0.5 dark:border-ink-700">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === "light"
                  ? "bg-brand-500 text-white"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
              }`}
            >
              <Sun size={14} /> Light
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                theme === "dark"
                  ? "bg-brand-500 text-white"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
              }`}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </SettingRow>
      </div>
    </div>
  );
}
