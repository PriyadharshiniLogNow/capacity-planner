import { addWeeks, formatPeriodRange } from "@/lib/date/weeks";
import type { DashboardFilterState } from "@/types/dashboard.types";
import type { EmployeeResponse } from "@/types/employee.types";
import type { ProjectResponse } from "@/types/project.types";

type DashboardFiltersProps = {
  filters: DashboardFilterState;
  onChange: (patch: Partial<DashboardFilterState>) => void;
  employees: EmployeeResponse[];
  projects: ProjectResponse[];
  departments: string[];
  managers: { id: string; name: string }[];
  compact?: boolean;
};

const selectClassName =
  "h-8 min-w-[7.5rem] max-w-[14rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

const controlClassName =
  "h-8 rounded border border-border bg-surface px-2 text-sm text-foreground hover:bg-background";

export function DashboardFilters({
  filters,
  onChange,
  employees,
  projects,
  departments,
  managers,
  compact = false,
}: DashboardFiltersProps) {
  return (
    <section className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[13px] font-medium text-foreground">
            Period:
          </span>
          <button
            type="button"
            aria-label="Previous week"
            onClick={() =>
              onChange({ periodStart: addWeeks(filters.periodStart, -1) })
            }
            className={controlClassName}
          >
            ‹
          </button>
          <span className="inline-flex h-8 min-w-[11.5rem] items-center rounded border border-border bg-surface px-2 text-[13px] text-foreground">
            {formatPeriodRange(filters.periodStart)}
          </span>
          <button
            type="button"
            aria-label="Next week"
            onClick={() =>
              onChange({ periodStart: addWeeks(filters.periodStart, 1) })
            }
            className={controlClassName}
          >
            ›
          </button>
        </div>

        {compact ? null : (
          <>
            <label className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="shrink-0 font-medium text-foreground">
                Department:
              </span>
              <select
                className={selectClassName}
                value={filters.department}
                onChange={(event) => onChange({ department: event.target.value })}
              >
                <option value="">All</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="shrink-0 font-medium text-foreground">Manager:</span>
              <select
                className={selectClassName}
                value={filters.managerId}
                onChange={(event) => onChange({ managerId: event.target.value })}
              >
                <option value="">All</option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="shrink-0 font-medium text-foreground">Project:</span>
              <select
                className={selectClassName}
                value={filters.projectId}
                onChange={(event) => onChange({ projectId: event.target.value })}
              >
                <option value="">All</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} · {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 items-center gap-2 text-[13px]">
              <span className="shrink-0 font-medium text-foreground">Employee:</span>
              <select
                className={selectClassName}
                value={filters.employeeId}
                onChange={(event) => onChange({ employeeId: event.target.value })}
              >
                <option value="">All</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
    </section>
  );
}
