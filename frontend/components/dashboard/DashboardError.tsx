type DashboardErrorProps = {
  message?: string;
  onRetry: () => void;
};

export function DashboardError({
  message = "Unable to load dashboard data.",
  onRetry,
}: DashboardErrorProps) {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-utilization-critical/20 bg-surface p-6 text-center"
    >
      <h2 className="text-lg font-semibold text-foreground">Unable to load dashboard data.</h2>
      <p className="mt-2 text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Retry
      </button>
    </section>
  );
}
