import type { EmployeeCapacitySummary } from "@/types/capacitySummary.types";
import type { EmployeeProjectRow } from "@/hooks/useDashboard";
import { formatShortDate, isCurrentOrPastWeek } from "@/lib/date/weeks";
import { formatHours } from "@/lib/utilization";

type EmployeeWeeklyTablesProps = {
  weeks: EmployeeCapacitySummary[];
  projects: EmployeeProjectRow[];
};

export function EmployeeWeeklyTables({ weeks, projects }: EmployeeWeeklyTablesProps) {
  const missingHours = weeks
    .filter((week) => isCurrentOrPastWeek(week.weekStart))
    .map((week) => ({
      weekStart: week.weekStart,
      missingHours: Math.max(0, week.plannedHours - week.actualHours),
    }))
    .filter((row) => row.missingHours > 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
        <h2 className="text-base font-semibold text-foreground">My weekly capacity</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="pb-2 font-medium">Week</th>
                <th className="pb-2 font-medium">Available</th>
                <th className="pb-2 font-medium">Planned</th>
                <th className="pb-2 font-medium">Actual</th>
                <th className="pb-2 font-medium">Free</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart} className="border-t border-border">
                  <td className="py-2.5">{formatShortDate(week.weekStart)}</td>
                  <td className="py-2.5">{formatHours(week.availableCapacity)}</td>
                  <td className="py-2.5">{formatHours(week.plannedHours)}</td>
                  <td className="py-2.5">
                    {isCurrentOrPastWeek(week.weekStart)
                      ? formatHours(week.actualHours)
                      : "—"}
                  </td>
                  <td className="py-2.5 font-medium">
                    {formatHours(Math.max(0, week.remainingCapacity))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
        <h2 className="text-base font-semibold text-foreground">My missing hours</h2>
        <p className="mb-4 text-sm text-muted">
          Planned productive hours not yet matched by actual time
        </p>
        {missingHours.length === 0 ? (
          <p className="text-sm text-muted">No missing hours in completed weeks.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-medium">Week</th>
                  <th className="pb-2 font-medium">Missing Hours</th>
                </tr>
              </thead>
              <tbody>
                {missingHours.map((row) => (
                  <tr key={row.weekStart} className="border-t border-border">
                    <td className="py-2.5">{formatShortDate(row.weekStart)}</td>
                    <td className="py-2.5 font-medium">{formatHours(row.missingHours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
        <h2 className="text-base font-semibold text-foreground">My projects</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No planned or actual hours on projects.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">Planned</th>
                  <th className="pb-2 font-medium">Actual</th>
                  <th className="pb-2 font-medium">Variance</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.projectId} className="border-t border-border">
                    <td className="py-2.5">
                      {project.projectCode} · {project.name}
                    </td>
                    <td className="py-2.5">{formatHours(project.plannedHours)}</td>
                    <td className="py-2.5">{formatHours(project.actualHours)}</td>
                    <td className="py-2.5 font-medium">
                      {project.variance > 0 ? "+" : ""}
                      {formatHours(project.variance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
