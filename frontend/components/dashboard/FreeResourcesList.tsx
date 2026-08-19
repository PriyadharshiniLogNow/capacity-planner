import type { FreeResourceRow } from "@/hooks/useDashboard";
import { formatIsoWeekNumber } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type FreeResourcesListProps = {
  rows: FreeResourceRow[];
};

export function FreeResourcesList({ rows }: FreeResourcesListProps) {
  return (
    <section className="flex h-full flex-col rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <h2 className="text-[15px] font-bold text-foreground">Free Resources</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-[12px] text-muted">
          No free capacity in the selected period.
        </p>
      ) : (
        <div className="mt-3 max-h-[248px] min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] text-muted">
                <th className="pb-2 font-semibold">Employee</th>
                <th className="pb-2 font-semibold">Week</th>
                <th className="pb-2 font-semibold">Free</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.employeeId}-${row.weekStart}`}
                  className="border-t border-border"
                >
                  <td className="py-2 pr-3 whitespace-nowrap text-foreground">
                    {row.name}
                  </td>
                  <td className="py-2 pr-3 text-muted">
                    {formatIsoWeekNumber(row.weekStart)}
                  </td>
                  <td className="py-2">
                    <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {formatHours(row.freeHours).replace("h", " h")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
