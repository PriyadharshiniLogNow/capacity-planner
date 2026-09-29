import type { FreeResourceRow } from "@/hooks/useDashboard";
import { formatIsoWeekLabel, formatShortDate } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type FreeResourcesListProps = {
  rows: FreeResourceRow[];
};

export function FreeResourcesList({ rows }: FreeResourcesListProps) {
  return (
    <section className="flex h-full max-h-[22rem] flex-col overflow-hidden rounded-md border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(0,26,51,0.04)]">
      <h2 className="shrink-0 text-[15px] font-semibold text-foreground">Free Resources</h2>
      <p className="mb-3 shrink-0 text-[12px] text-muted">
        Available capacity remaining after planned hours
      </p>
      {rows.length === 0 ? (
        <p className="text-[13px] text-muted">No free capacity in the selected period.</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="min-w-full text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#e8eef5] text-left text-foreground">
                <th className="rounded-tl px-3 py-2 font-semibold">Employee</th>
                <th className="px-3 py-2 font-semibold">Week</th>
                <th className="rounded-tr px-3 py-2 font-semibold">Free Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.employeeId}-${row.weekStart}`} className="border-t border-border">
                  <td className="px-3 py-2 font-medium text-foreground">{row.name}</td>
                  <td className="px-3 py-2 text-muted">
                    {formatIsoWeekLabel(row.weekStart)} · {formatShortDate(row.weekStart)}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-full border border-[#fdba74] bg-[#fff7ed] px-2 py-0.5 text-[11px] font-semibold text-[#c2410c]">
                      {formatHours(row.freeHours)}
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
