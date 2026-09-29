import type { ChartWeek } from "@/hooks/useDashboard";
import { formatIsoWeekLabel, formatShortDate } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type CapacityStackedChartProps = {
  weeks: ChartWeek[];
};

const SERIES = [
  { key: "customerHours", label: "Customer", className: "bg-[#3b82f6]" },
  { key: "internalHours", label: "Internal", className: "bg-[#94a3b8]" },
  { key: "freeHours", label: "Free", className: "bg-[#f59e0b]" },
  {
    key: "overallocatedHours",
    label: "Overallocated",
    className: "bg-[#ef4444]",
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
    <section className="h-full rounded-md border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,26,51,0.04)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">
            6-Week Capacity Overview
          </h2>
          <p className="text-[12px] text-muted">
            Customer, Internal, Free, and Overallocated hours by week
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-[11px] text-muted">
          {SERIES.map((series) => (
            <li key={series.key} className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${series.className}`} />
              {series.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-[28rem] items-end gap-3 sm:gap-4">
          {weeks.map((week) => {
            const total =
              week.customerHours +
              week.internalHours +
              week.freeHours +
              week.overallocatedHours;
            const columnHeight = `${Math.max(8, (total / maxTotal) * 100)}%`;

            return (
              <div key={week.weekStart} className="flex min-w-0 flex-1 flex-col items-center">
                <div className="flex h-52 w-full items-end">
                  {total === 0 ? (
                    <div className="h-2 w-full rounded bg-border" />
                  ) : (
                    <div
                      className="flex w-full flex-col justify-end overflow-hidden rounded"
                      style={{ height: columnHeight }}
                      title={`Customer ${formatHours(week.customerHours)} · Internal ${formatHours(week.internalHours)} · Free ${formatHours(week.freeHours)} · Over ${formatHours(week.overallocatedHours)}`}
                    >
                      {week.overallocatedHours > 0 ? (
                        <div
                          className="bg-[#ef4444]"
                          style={{ height: `${(week.overallocatedHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.freeHours > 0 ? (
                        <div
                          className="bg-[#f59e0b]"
                          style={{ height: `${(week.freeHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.internalHours > 0 ? (
                        <div
                          className="bg-[#94a3b8]"
                          style={{ height: `${(week.internalHours / total) * 100}%` }}
                        />
                      ) : null}
                      {week.customerHours > 0 ? (
                        <div
                          className="bg-[#3b82f6]"
                          style={{ height: `${(week.customerHours / total) * 100}%` }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[12px] font-semibold text-foreground">
                  {formatIsoWeekLabel(week.weekStart)}
                </p>
                <p className="text-[11px] text-muted">{formatShortDate(week.weekStart)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
