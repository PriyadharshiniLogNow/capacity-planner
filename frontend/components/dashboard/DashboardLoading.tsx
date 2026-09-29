export function DashboardLoading() {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dashboard data</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[62px] animate-pulse rounded-md border border-border bg-surface"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="h-72 animate-pulse rounded-md border border-border bg-surface" />
        <div className="h-72 animate-pulse rounded-md border border-border bg-surface" />
      </div>
      <div className="h-56 animate-pulse rounded-md border border-border bg-surface" />
    </div>
  );
}
