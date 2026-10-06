import type { HeatmapRow } from "@/hooks/useDashboard";
import { formatIsoWeekLabel, formatShortDate } from "@/lib/date/weeks";
import {
  formatPercent,
  getUtilizationStatus,
  type UtilizationLevel,
} from "@/lib/utilization";

type UtilizationHeatmapProps = {
  rows: HeatmapRow[];
  weekStarts: string[];
};

function heatmapCellClass(level: UtilizationLevel): string {
  switch (level) {
    case "under":
    case "partial":
      return "bg-[#fff7ed] text-[#c2410c] border border-[#fdba74]";
    case "well":
      return "bg-[#f0fdf4] text-[#15803d] border border-[#86efac]";
    case "warning":
    case "critical":
      return "bg-[#fef2f2] text-[#b91c1c] border border-[#fca5a5]";
  }
}

export function UtilizationHeatmap({ rows, weekStarts }: UtilizationHeatmapProps) {
  return (
    <section className="rounded-md border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,26,51,0.04)]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-foreground">
            Resource Utilization Heatmap
          </h2>
          <p className="text-[12px] text-muted">Employee × week planned utilization</p>
        </div>
        <ul className="flex flex-wrap gap-3 text-[11px] text-muted">
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#f59e0b]" />
            Low
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#22c55e]" />
            Good
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#ef4444]" />
            Overallocated
          </li>
        </ul>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[40rem] w-full border-separate border-spacing-1 text-[13px]">
          <thead>
            <tr>
              <th className="px-2 py-1.5 text-left font-semibold text-foreground">Employee</th>
              {weekStarts.map((weekStart) => (
                <th key={weekStart} className="px-2 py-1.5 text-center font-semibold text-foreground">
                  {formatIsoWeekLabel(weekStart)}
                  <span className="mt-0.5 block text-[11px] font-normal text-muted">
                    {formatShortDate(weekStart)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td className="whitespace-nowrap px-2 py-1 font-medium text-foreground">
                  {row.name}
                </td>
                {weekStarts.map((weekStart) => {
                  const cell = row.cells.find((item) => item.weekStart === weekStart);
                  if (!cell) {
                    return (
                      <td key={weekStart} className="px-1 py-1">
                        <div className="rounded border border-border bg-background px-2 py-2 text-center text-[11px] text-muted">
                          —
                        </div>
                      </td>
                    );
                  }
                  const status = getUtilizationStatus(cell.utilization);
                  return (
                    <td key={weekStart} className="px-1 py-1">
                      <div
                        className={`rounded px-2 py-2 text-center text-[11px] font-semibold ${heatmapCellClass(status.level)}`}
                      >
                        {formatPercent(cell.utilization)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
