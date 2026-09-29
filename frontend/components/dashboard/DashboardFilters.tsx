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
  supervisors: { id: string; name: string }[];
  compact?: boolean;
};

const selectClassName =
  "h-8 w-full min-w-[7.5rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

const navButtonClassName =
  "h-8 rounded border border-border bg-surface px-2 text-sm text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40";

export function DashboardFilters({
  filters,
  onChange,
  employees,
  projects,
  departments,
  supervisors,
  compact = false,
}: DashboardFiltersProps) {
  return (
    <section className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <label className="block min-w-[14rem] flex-1 text-[13px]">
          <span className="mb-1 block font-medium text-foreground">Period</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() =>
                onChange({ periodStart: addWeeks(filters.periodStart, -1) })
              }
              className={navButtonClassName}
            >
              ‹
            </button>
            <p
              className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1.5 text-center text-[13px] font-medium text-foreground"
              title={formatPeriodRange(filters.periodStart)}
            >
              Next 6 Weeks
            </p>
            <button
              type="button"
              aria-label="Next week"
              onClick={() =>
                onChange({ periodStart: addWeeks(filters.periodStart, 1) })
              }
              className={navButtonClassName}
            >
              ›
            </button>
          </div>
          <span className="mt-1 block text-[11px] text-muted">
            {formatPeriodRange(filters.periodStart)}
          </span>
        </label>

        {compact ? null : (
          <>
            <label className="block min-w-[8rem] flex-1 text-[13px]">
              <span className="mb-1 block font-medium text-foreground">Department</span>
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

            <label className="block min-w-[8rem] flex-1 text-[13px]">
              <span className="mb-1 block font-medium text-foreground">Manager</span>
              <select
                className={selectClassName}
                value={filters.supervisorId}
                onChange={(event) => onChange({ supervisorId: event.target.value })}
              >
                <option value="">All</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-[8rem] flex-1 text-[13px]">
              <span className="mb-1 block font-medium text-foreground">Employee</span>
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

            <label className="block min-w-[9rem] flex-1 text-[13px]">
              <span className="mb-1 block font-medium text-foreground">Project</span>
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

            <label className="block min-w-[8rem] flex-1 text-[13px]">
              <span className="mb-1 block font-medium text-foreground">Project Type</span>
              <select
                className={selectClassName}
                value={filters.projectType}
                onChange={(event) =>
                  onChange({
                    projectType: event.target.value as DashboardFilterState["projectType"],
                  })
                }
              >
                <option value="">All</option>
                <option value="CUSTOMER">Customer</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </label>
          </>
        )}
      </div>
    </section>
  );
}
