export function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-ink-100 dark:bg-ink-800 ${className}`} aria-hidden="true" />;
}

export function SkeletonStatCard() {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-8 w-8 rounded-md" />
      </div>
      <SkeletonBlock className="h-7 w-24" />
      <SkeletonBlock className="mt-2 h-3 w-16" />
    </div>
  );
}

/** A row of SkeletonStatCards - the shape most stat-card grids share. */
export function SkeletonStatGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonStatCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonChart({ heightClass = "h-64" }) {
  return (
    <div className="card p-5">
      <SkeletonBlock className="mb-2 h-4 w-32" />
      <SkeletonBlock className="mb-4 h-3 w-48" />
      <SkeletonBlock className={`w-full ${heightClass}`} />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="card p-5">
      <SkeletonBlock className="mb-4 h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <SkeletonBlock key={index} className="h-8 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Mimics the Predict Transaction / Explainability result panel shape while
 * an action-triggered request (not a page load) is in flight. */
export function SkeletonResultCard() {
  return (
    <div className="card p-6">
      <SkeletonBlock className="mb-4 h-4 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Model identity card shape used at the top of Model Analytics. */
export function SkeletonModelInfoCard() {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-3">
        <SkeletonBlock className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-48" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}