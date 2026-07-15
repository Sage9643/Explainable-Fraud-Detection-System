export default function ComingSoon({ icon: Icon, title, description, sprint }) {
  return (
    <div className="card flex min-h-[420px] flex-col items-center justify-center gap-3 px-6 text-center">
      {Icon && (
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-700/20 dark:text-brand-400">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">{title}</h2>
      <p className="max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
      {sprint && (
        <span className="mt-2 rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-500 dark:border-ink-700 dark:text-ink-400">
          Wired up in {sprint}
        </span>
      )}
    </div>
  );
}
