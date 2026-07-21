import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-ink-500 dark:text-ink-400"
    >
      <Loader2 size={20} className="animate-spin" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}