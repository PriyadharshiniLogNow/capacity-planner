import { employeeDisplayName } from "@/lib/utilization";
import type { EmployeeResponse } from "@/types/employee.types";

type EmployeeSelectorProps = {
  employees: EmployeeResponse[];
  employeeId: string;
  onChange: (employeeId: string) => void;
  locked: boolean;
};

export function EmployeeSelector({
  employees,
  employeeId,
  onChange,
  locked,
}: EmployeeSelectorProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 text-[13px]">
      <span className="shrink-0 font-medium text-foreground">Employee:</span>
      <select
        className="h-8 min-w-[10rem] flex-1 rounded border border-border bg-surface px-2 text-[13px] text-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
        value={employeeId}
        disabled={locked || employees.length === 0}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Select employee"
      >
        {employees.length === 0 ? (
          <option value="">No employees available</option>
        ) : null}
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employeeDisplayName(employee)}
            {employee.status === "INACTIVE" ? " (Inactive)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
