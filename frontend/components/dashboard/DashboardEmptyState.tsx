export function DashboardEmptyState() {
  return (
    <section className="rounded-lg border border-border bg-surface p-8 text-center shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <h2 className="text-lg font-semibold text-foreground">No capacity data found</h2>
      <p className="mt-2 text-sm text-muted">
        No capacity data found for the selected filters.
      </p>
    </section>
  );
}
