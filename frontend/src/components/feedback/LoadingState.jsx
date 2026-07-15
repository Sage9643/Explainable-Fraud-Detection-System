import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-2 text-ink-500 dark:text-ink-400">
      <Loader2 size={20} className="animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}