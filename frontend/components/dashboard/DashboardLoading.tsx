export function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dashboard data</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-surface"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="h-56 animate-pulse rounded-2xl border border-border bg-surface" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
        <div className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    </div>
  );
}
