import type { OverallocationRow } from "@/hooks/useDashboard";
import { formatShortDate } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type OverallocationCardProps = {
  rows: OverallocationRow[];
};

export function OverallocationCard({ rows }: OverallocationCardProps) {
  return (
    <section className="rounded-lg border border-utilization-critical/20 bg-surface p-4 shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <h2 className="text-[15px] font-bold text-foreground">Overallocation</h2>
      <p className="mb-4 text-sm text-muted">
        Planning above capacity is shown as a warning and is not silently accepted.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No overallocation in the selected period.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map((row) => (
            <article
              key={`${row.employeeId}-${row.weekStart}`}
              className="rounded-xl border border-utilization-critical/25 bg-utilization-critical/5 p-4"
            >
              <p className="font-semibold text-foreground">{row.name}</p>
              <p className="text-sm text-muted">Week of {formatShortDate(row.weekStart)}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted">Planned</dt>
                  <dd className="font-medium text-foreground">{formatHours(row.plannedHours)}</dd>
                </div>
                <div>
                  <dt className="text-muted">Available</dt>
                  <dd className="font-medium text-foreground">
                    {formatHours(row.availableCapacity)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Overallocated</dt>
                  <dd className="font-semibold text-utilization-critical">
                    {formatHours(row.overallocatedHours)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
