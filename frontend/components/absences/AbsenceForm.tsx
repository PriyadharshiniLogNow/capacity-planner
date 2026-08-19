import { absenceTypeLabel } from "@/components/absences/AbsenceTypeBadge";
import { employeeDisplayName } from "@/lib/utilization";
import type { AbsenceType } from "@/types/absence.types";
import type { EmployeeResponse } from "@/types/employee.types";
import { useState } from "react";

export type AbsenceFormValues = {
  employeeId: string;
  absenceType: AbsenceType;
  startDate: string;
  endDate: string;
  note: string;
};

type AbsenceFormProps = {
  mode: "create" | "edit";
  initialValues: AbsenceFormValues;
  employees: EmployeeResponse[];
  employeeLocked: boolean;
  employeeLabel?: string;
  hoursDisplay?: number | null;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (values: AbsenceFormValues) => void;
};

const fieldClassName =
  "w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:bg-background disabled:text-muted";

const ABSENCE_TYPES: AbsenceType[] = [
  "VACATION",
  "SICKNESS",
  "PUBLIC_HOLIDAY",
  "OTHER",
];

function validate(values: AbsenceFormValues, employeeLocked: boolean): string | null {
  if (!employeeLocked && !values.employeeId.trim()) {
    return "Select an employee.";
  }
  if (!values.startDate) {
    return "Start date is required.";
  }
  if (!values.endDate) {
    return "End date is required.";
  }
  if (values.endDate < values.startDate) {
    return "End date cannot be before start date.";
  }
  return null;
}

export function AbsenceForm({
  mode,
  initialValues,
  employees,
  employeeLocked,
  employeeLabel,
  hoursDisplay,
  busy,
  error,
  onCancel,
  onSubmit,
}: AbsenceFormProps) {
  const [values, setValues] = useState<AbsenceFormValues>(initialValues);
  const [localError, setLocalError] = useState<string | null>(null);

  const matchedEmployee = employees.find(
    (employee) => employee.id === values.employeeId,
  );
  const lockedEmployeeName =
    employeeLabel ||
    (matchedEmployee
      ? employeeDisplayName(matchedEmployee)
      : "Your employee profile");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const message = validate(values, employeeLocked);
        if (message) {
          setLocalError(message);
          return;
        }
        setLocalError(null);
        onSubmit(values);
      }}
    >
      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-foreground">Employee</span>
        {employeeLocked ? (
          <input
            type="text"
            disabled
            value={lockedEmployeeName}
            className={fieldClassName}
          />
        ) : (
          <select
            required
            disabled={mode === "edit" || busy}
            value={values.employeeId}
            onChange={(event) => {
              setLocalError(null);
              setValues((current) => ({
                ...current,
                employeeId: event.target.value,
              }));
            }}
            className={fieldClassName}
          >
            <option value="">Select an employee</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employeeDisplayName(employee)}
              </option>
            ))}
          </select>
        )}
        {mode === "edit" && !employeeLocked ? (
          <span className="mt-1 block text-xs text-muted">
            Employee cannot be changed after creation.
          </span>
        ) : null}
      </label>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-foreground">
          Absence Type
        </span>
        <select
          required
          disabled={busy}
          value={values.absenceType}
          onChange={(event) => {
            setLocalError(null);
            setValues((current) => ({
              ...current,
              absenceType: event.target.value as AbsenceType,
            }));
          }}
          className={fieldClassName}
        >
          {ABSENCE_TYPES.map((type) => (
            <option key={type} value={type}>
              {absenceTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Start Date
          </span>
          <input
            type="date"
            required
            disabled={busy}
            value={values.startDate}
            onChange={(event) => {
              setLocalError(null);
              setValues((current) => ({
                ...current,
                startDate: event.target.value,
              }));
            }}
            className={fieldClassName}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">End Date</span>
          <input
            type="date"
            required
            disabled={busy}
            value={values.endDate}
            min={values.startDate || undefined}
            onChange={(event) => {
              setLocalError(null);
              setValues((current) => ({
                ...current,
                endDate: event.target.value,
              }));
            }}
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">
        <p className="text-muted">Hours</p>
        <p className="font-medium text-foreground">
          {typeof hoursDisplay === "number"
            ? `${Math.round(hoursDisplay * 10) / 10}h (calculated from working days)`
            : "Calculated automatically from the employee's working days"}
        </p>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-foreground">
          Note <span className="font-normal text-muted">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={1000}
          disabled={busy}
          value={values.note}
          onChange={(event) => {
            setLocalError(null);
            setValues((current) => ({
              ...current,
              note: event.target.value,
            }));
          }}
          className={fieldClassName}
          placeholder="Optional note"
        />
      </label>

      {localError || error ? (
        <p className="text-sm text-utilization-critical" role="alert">
          {localError || error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          {busy
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create Absence"
              : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
