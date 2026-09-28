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
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25";

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
    <section className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-[0_8px_30px_rgba(88,70,180,0.06)] sm:p-5">
      <div
        className={[
          "grid grid-cols-1 gap-3",
          compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-3",
        ].join(" ")}
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">Period</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() =>
                onChange({ periodStart: addWeeks(filters.periodStart, -1) })
              }
              className="rounded-xl border border-border px-2.5 py-2 text-sm hover:bg-accent-soft"
            >
              ‹
            </button>
            <p className="min-w-0 flex-1 rounded-xl border border-border bg-accent-soft/50 px-3 py-2 text-center text-sm font-medium text-foreground">
              {formatPeriodRange(filters.periodStart)}
            </p>
            <button
              type="button"
              aria-label="Next week"
              onClick={() =>
                onChange({ periodStart: addWeeks(filters.periodStart, 1) })
              }
              className="rounded-xl border border-border px-2.5 py-2 text-sm hover:bg-accent-soft"
            >
              ›
            </button>
          </div>
        </label>

        {compact ? null : (
          <>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Department
              </span>
              <select
                className={selectClassName}
                value={filters.department}
                onChange={(event) => onChange({ department: event.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Supervisor</span>
              <select
                className={selectClassName}
                value={filters.supervisorId}
                onChange={(event) => onChange({ supervisorId: event.target.value })}
              >
                <option value="">All Supervisors</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Employee</span>
              <select
                className={selectClassName}
                value={filters.employeeId}
                onChange={(event) => onChange({ employeeId: event.target.value })}
              >
                <option value="">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">Project</span>
              <select
                className={selectClassName}
                value={filters.projectId}
                onChange={(event) => onChange({ projectId: event.target.value })}
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} · {project.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-foreground">
                Project Type
              </span>
              <select
                className={selectClassName}
                value={filters.projectType}
                onChange={(event) =>
                  onChange({
                    projectType: event.target.value as DashboardFilterState["projectType"],
                  })
                }
              >
                <option value="">All Types</option>
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
