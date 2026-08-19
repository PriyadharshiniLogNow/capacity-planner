import type { HeatmapRow } from "@/hooks/useDashboard";
import { formatIsoWeekNumber } from "@/lib/date/weeks";
import {
  formatPercent,
  getUtilizationStatus,
  utilizationHeatmapClass,
} from "@/lib/utilization";

type UtilizationHeatmapProps = {
  rows: HeatmapRow[];
  weekStarts: string[];
};

export function UtilizationHeatmap({ rows, weekStarts }: UtilizationHeatmapProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <h2 className="text-[15px] font-bold text-foreground">
        Resource Utilization Heatmap
      </h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[36rem] w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5 text-[12px]">
          <thead>
            <tr>
              <th className="px-1 py-1 text-left text-[11px] font-semibold text-muted">
                Employee
              </th>
              {weekStarts.map((weekStart) => (
                <th
                  key={weekStart}
                  className="px-1 py-1 text-center text-[11px] font-semibold text-muted"
                >
                  {formatIsoWeekNumber(weekStart)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employeeId}>
                <td className="whitespace-nowrap px-1 py-0.5 font-medium text-foreground">
                  {row.name}
                </td>
                {weekStarts.map((weekStart) => {
                  const cell = row.cells.find((item) => item.weekStart === weekStart);
                  if (!cell) {
                    return (
                      <td key={weekStart} className="px-0 py-0">
                        <div className="min-w-[3.25rem] rounded-md bg-border/40 px-2 py-1.5 text-center text-[11px] text-muted">
                          —
                        </div>
                      </td>
                    );
                  }
                  const status = getUtilizationStatus(cell.utilization);
                  return (
                    <td key={weekStart} className="px-0 py-0">
                      <div
                        className={`min-w-[3.25rem] rounded-md px-2 py-1.5 text-center text-[11px] font-semibold ${utilizationHeatmapClass(status.level)}`}
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
