import type { FreeResourceRow } from "@/hooks/useDashboard";
import { formatShortDate } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type FreeResourcesListProps = {
  rows: FreeResourceRow[];
};

export function FreeResourcesList({ rows }: FreeResourcesListProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
      <h2 className="text-base font-semibold text-foreground">Free resources</h2>
      <p className="mb-4 text-sm text-muted">Available capacity remaining after planned hours</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No free capacity in the selected period.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Week</th>
                <th className="pb-2 font-medium">Free Hours</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.employeeId}-${row.weekStart}`} className="border-t border-border">
                  <td className="py-2.5 text-foreground">{row.name}</td>
                  <td className="py-2.5 text-muted">{formatShortDate(row.weekStart)}</td>
                  <td className="py-2.5 font-medium text-foreground">
                    {formatHours(row.freeHours)}
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
