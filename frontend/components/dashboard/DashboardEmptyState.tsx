export function DashboardEmptyState() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">No capacity data found</h2>
      <p className="mt-2 text-sm text-muted">
        No capacity data found for the selected filters.
      </p>
    </section>
  );
}
