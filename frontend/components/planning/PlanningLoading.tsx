export function PlanningLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading capacity plan</p>
      <div className="mb-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[62px] animate-pulse rounded-md border border-border bg-surface"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-md border border-border bg-surface" />
    </div>
  );
}
