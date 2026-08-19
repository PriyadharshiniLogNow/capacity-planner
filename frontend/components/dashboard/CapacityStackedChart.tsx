import type { ChartWeek } from "@/hooks/useDashboard";
import { formatIsoWeekNumber } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type CapacityStackedChartProps = {
  weeks: ChartWeek[];
};

const SERIES = [
  { key: "customerHours", label: "Customer", className: "bg-emerald-500" },
  { key: "internalHours", label: "Internal", className: "bg-blue-500" },
  { key: "freeHours", label: "Free", className: "bg-amber-400" },
  { key: "overallocatedHours", label: "Over", className: "bg-rose-500" },
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
    <section className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[15px] font-bold text-foreground">
          6-Week Capacity Overview
        </h2>
        <ul className="flex flex-wrap gap-3 text-[11px] text-muted">
          {SERIES.map((series) => (
            <li key={series.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-[2px] ${series.className}`} />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div
          className="flex h-[220px] min-w-[28rem] items-end justify-around gap-3 px-1 pb-1"
          style={{
            backgroundImage:
              "linear-gradient(to top, var(--border) 1px, transparent 1px)",
            backgroundSize: "100% 25%",
            backgroundPosition: "bottom",
          }}
        >
          {weeks.map((week) => {
            const total =
              week.customerHours +
              week.internalHours +
              week.freeHours +
              week.overallocatedHours;
            const columnHeight = `${Math.max(8, (total / maxTotal) * 100)}%`;

            return (
              <div
                key={week.weekStart}
                className="flex h-full min-w-0 flex-1 flex-col items-center"
              >
                <div className="flex w-full flex-1 items-end justify-center">
                  {total === 0 ? (
                    <div className="h-1.5 w-8 rounded-sm bg-border" />
                  ) : (
                    <div
                      className="flex w-9 flex-col justify-end overflow-hidden rounded-t-md sm:w-11"
                      style={{ height: columnHeight }}
                      title={`Customer ${formatHours(week.customerHours)} · Internal ${formatHours(week.internalHours)} · Free ${formatHours(week.freeHours)} · Over ${formatHours(week.overallocatedHours)}`}
                    >
                      {week.overallocatedHours > 0 ? (
                        <div
                          className="bg-rose-500"
                          style={{
                            height: `${(week.overallocatedHours / total) * 100}%`,
                          }}
                        />
                      ) : null}
                      {week.freeHours > 0 ? (
                        <div
                          className="bg-amber-400"
                          style={{ height: `${(week.freeHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.internalHours > 0 ? (
                        <div
                          className="bg-blue-500"
                          style={{
                            height: `${(week.internalHours / total) * 100}%`,
                          }}
                        />
                      ) : null}
                      {week.customerHours > 0 ? (
                        <div
                          className="bg-emerald-500"
                          style={{
                            height: `${(week.customerHours / total) * 100}%`,
                          }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-medium text-muted">
                  {formatIsoWeekNumber(week.weekStart)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
