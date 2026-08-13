import type { HeatmapRow } from "@/hooks/useDashboard";
import { formatShortDate } from "@/lib/date/weeks";
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
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Utilization heatmap</h2>
      <p className="mb-4 text-sm text-muted">Employee × week planned utilization</p>
      <div className="overflow-x-auto">
        <table className="min-w-[40rem] w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-muted">Employee</th>
              {weekStarts.map((weekStart, index) => (
                <th key={weekStart} className="px-2 py-1 text-center font-medium text-muted">
                  W{index + 1}
                  <span className="mt-0.5 block text-[11px] font-normal">
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
                        <div className="rounded-lg bg-border/40 px-2 py-2 text-center text-xs text-muted">
                          —
                        </div>
                      </td>
                    );
                  }
                  const status = getUtilizationStatus(cell.utilization);
                  return (
                    <td key={weekStart} className="px-1 py-1">
                      <div
                        className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${utilizationHeatmapClass(status.level)}`}
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
