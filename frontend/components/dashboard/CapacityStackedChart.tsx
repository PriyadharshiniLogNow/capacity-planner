import type { ChartWeek } from "@/hooks/useDashboard";
import { formatShortDate } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type CapacityStackedChartProps = {
  weeks: ChartWeek[];
};

const SERIES = [
  { key: "customerHours", label: "Customer", className: "bg-accent" },
  { key: "internalHours", label: "Internal", className: "bg-[#7c9cff]" },
  { key: "freeHours", label: "Free", className: "bg-utilization-well" },
  {
    key: "overallocatedHours",
    label: "Overallocated",
    className: "bg-utilization-critical",
  },
] as const;

export function CapacityStackedChart({ weeks }: CapacityStackedChartProps) {
  const maxTotal = Math.max(
    1,
    ...weeks.map(
      (week) =>
        week.customerHours +
        week.internalHours +
        week.freeHours +
        week.overallocatedHours,
    ),
  );

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Six-week capacity
          </h2>
          <p className="text-sm text-muted">Hours by week · Customer, Internal, Free, Overallocated</p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs text-muted">
          {SERIES.map((series) => (
            <li key={series.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${series.className}`} />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-[36rem] items-end gap-3 sm:gap-4">
          {weeks.map((week, index) => {
            const total =
              week.customerHours +
              week.internalHours +
              week.freeHours +
              week.overallocatedHours;
            const columnHeight = `${Math.max(8, (total / maxTotal) * 100)}%`;

            return (
              <div key={week.weekStart} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex h-56 w-full items-end">
                  {total === 0 ? (
                    <div className="h-2 w-full rounded-xl bg-border" />
                  ) : (
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded-xl"
                      style={{ height: columnHeight }}
                      title={`Customer ${formatHours(week.customerHours)} · Internal ${formatHours(week.internalHours)} · Free ${formatHours(week.freeHours)} · Over ${formatHours(week.overallocatedHours)}`}
                    >
                      {week.overallocatedHours > 0 ? (
                        <div
                          className="bg-utilization-critical"
                          style={{ height: `${(week.overallocatedHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.freeHours > 0 ? (
                        <div
                          className="bg-utilization-well"
                          style={{ height: `${(week.freeHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.internalHours > 0 ? (
                        <div
                          className="bg-[#7c9cff]"
                          style={{ height: `${(week.internalHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.customerHours > 0 ? (
                        <div
                          className="bg-accent"
                          style={{ height: `${(week.customerHours / total) * 100}%` }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">W{index + 1}</p>
                <p className="text-[11px] text-muted">{formatShortDate(week.weekStart)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
