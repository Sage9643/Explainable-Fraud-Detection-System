import { useEffect, useRef } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Focus is moved to this region whenever the error message changes, so
 * keyboard and screen-reader users land directly on the failure instead of
 * having to hunt for it - particularly important after a failed form
 * submission where focus would otherwise stay on the (now potentially
 * removed) submit button.
 */
export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  const containerRef = useRef(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, [message]);

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-card border border-risk-critical/30 bg-risk-critical/5 px-6 text-center outline-none"
    >
      <AlertTriangle size={20} className="text-risk-critical" aria-hidden="true" />
      <p className="text-sm text-risk-critical">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry loading data"
          className="flex items-center gap-1.5 rounded-md border border-risk-critical/30 px-3 py-1.5 text-xs font-medium text-risk-critical transition-colors hover:bg-risk-critical/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-risk-critical"
        >
          <RotateCcw size={13} aria-hidden="true" /> Try Again
        </button>
      )}
    </div>
  );
}