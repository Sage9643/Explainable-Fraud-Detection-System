function TrendPill({ direction, label }) {
  if (!direction) return null;
  const isUp = direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
        isUp ? "bg-risk-critical/10 text-risk-critical" : "bg-risk-low/10 text-risk-low"
      }`}
    >
      {isUp ? "▲" : "▼"} {label}
    </span>
  );
}

export default function StatCard({ icon: Icon, label, value, sublabel, trend, accent = "brand" }) {
  const accentClasses = {
    brand: "bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400",
    critical: "bg-risk-critical/10 text-risk-critical",
    low: "bg-risk-low/10 text-risk-low",
    high: "bg-risk-high/10 text-risk-high",
  };

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500 dark:text-ink-400">{label}</span>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-md ${accentClasses[accent]}`}>
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-ink-900 dark:text-ink-50">{value}</span>
        {trend && <TrendPill {...trend} />}
      </div>
      {sublabel && <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sublabel}</p>}
    </div>
  );
}