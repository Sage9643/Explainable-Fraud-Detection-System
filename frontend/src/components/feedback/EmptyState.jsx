import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title, description, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center ${
        compact ? "min-h-[180px]" : "min-h-[320px]"
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-50 text-ink-400 dark:bg-ink-800 dark:text-ink-500">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink-700 dark:text-ink-200">{title}</p>
      {description && <p className="max-w-xs text-xs text-ink-500 dark:text-ink-400">{description}</p>}
    </div>
  );
}