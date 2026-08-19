import type {
  AbsenceFilterState,
  AbsenceStatus,
  AbsenceType,
} from "@/types/absence.types";
import type { EmployeeResponse } from "@/types/employee.types";
import { employeeDisplayName } from "@/lib/utilization";

type AbsenceFiltersProps = {
  filters: AbsenceFilterState;
  onChange: (patch: Partial<AbsenceFilterState>) => void;
  employees: EmployeeResponse[];
  showEmployeeFilter: boolean;
};

const selectClassName =
  "h-8 min-w-[7.5rem] max-w-[14rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

const dateClassName =
  "h-8 min-w-[9.5rem] rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent";

export function AbsenceFilters({
  filters,
  onChange,
  employees,
  showEmployeeFilter,
}: AbsenceFiltersProps) {
  return (
    <section className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {showEmployeeFilter ? (
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
                  {employeeDisplayName(employee)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="shrink-0 font-medium text-foreground">Type:</span>
          <select
            className={selectClassName}
            value={filters.absenceType}
            onChange={(event) =>
              onChange({
                absenceType: event.target.value as AbsenceType | "",
              })
            }
          >
            <option value="">All</option>
            <option value="VACATION">Vacation</option>
            <option value="SICKNESS">Sickness</option>
            <option value="PUBLIC_HOLIDAY">Public Holiday</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        <label className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="shrink-0 font-medium text-foreground">Status:</span>
          <select
            className={selectClassName}
            value={filters.status}
            onChange={(event) =>
              onChange({
                status: event.target.value as AbsenceStatus | "",
              })
            }
          >
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>

        <label className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="shrink-0 font-medium text-foreground">From:</span>
          <input
            type="date"
            className={dateClassName}
            value={filters.from}
            onChange={(event) => onChange({ from: event.target.value })}
          />
        </label>

        <label className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="shrink-0 font-medium text-foreground">To:</span>
          <input
            type="date"
            className={dateClassName}
            value={filters.to}
            min={filters.from || undefined}
            onChange={(event) => onChange({ to: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}
