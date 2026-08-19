import type { VarianceRow } from "@/hooks/useDashboard";
import { formatHours } from "@/lib/utilization";

type PlanActualVarianceProps = {
  rows: VarianceRow[];
};

export function PlanActualVariance({ rows }: PlanActualVarianceProps) {
  return (
    <section className="rounded-lg border border-border bg-surface p-4 shadow-[0_1px_2px_rgba(11,49,88,0.05)]">
      <h2 className="text-[15px] font-bold text-foreground">Plan vs actual variance</h2>
      <p className="mb-4 text-sm text-muted">Actual productive hours minus planned productive hours</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">No plan or actual hours for the selected filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Planned</th>
                <th className="pb-2 font-medium">Actual</th>
                <th className="pb-2 font-medium">Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.employeeId} className="border-t border-border">
                  <td className="py-2.5 text-foreground">{row.name}</td>
                  <td className="py-2.5">{formatHours(row.plannedHours)}</td>
                  <td className="py-2.5">{formatHours(row.actualHours)}</td>
                  <td
                    className={[
                      "py-2.5 font-medium",
                      row.variance < 0
                        ? "text-utilization-warning"
                        : row.variance > 0
                          ? "text-utilization-well"
                          : "text-foreground",
                    ].join(" ")}
                  >
                    {row.variance > 0 ? "+" : ""}
                    {formatHours(row.variance)}
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
