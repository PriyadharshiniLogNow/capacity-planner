"use client";

import { SpinnerIcon } from "@/components/auth/icons";
import { FormInput, FormSelect } from "@/components/master-data/FormControls";
import { SearchableSelect } from "@/components/master-data/SearchableSelect";
import { Notice } from "@/components/master-data/Notice";
import { ApiError } from "@/lib/api/client";
import { createEmployee, updateEmployee } from "@/lib/api/employees.api";
import {
  EMPLOYEE_DEPARTMENTS,
  EMPLOYEE_ROLES,
  WORKING_DAYS_PRESETS,
  findWorkingDaysPreset,
  withCurrentOption,
} from "@/lib/masterData/constants";
import {
  emptyEmployeeForm,
  validateEmployeeForm,
  workingDaysFromPreset,
  type EmployeeFieldErrors,
  type EmployeeFormValues,
} from "@/lib/masterData/employeeValidation";
import type { EmployeeResponse } from "@/types/employee.types";
import { useId, useMemo, useState, type FormEvent } from "react";

type EmployeeFormMode = "create" | "edit" | "view";

type EmployeeFormProps = {
  mode: EmployeeFormMode;
  employee?: EmployeeResponse | null;
  supervisors: EmployeeResponse[];
  onCancel: () => void;
  onSaved: (employee: EmployeeResponse, message: string) => void;
};

function valuesFromEmployee(employee: EmployeeResponse): EmployeeFormValues {
  const preset = findWorkingDaysPreset(employee.workingDays);
  return {
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email ?? "",
    role: employee.role,
    department: employee.department,
    supervisorId: employee.supervisorId ?? "",
    weeklyHours: String(employee.weeklyHours),
    workingDaysPreset: preset?.id ?? "custom",
    startDate: employee.startDate,
    endDate: employee.endDate ?? "",
    status: employee.status,
  };
}

function mapApiFieldErrors(
  fieldErrors: Record<string, string[] | undefined> | undefined,
): EmployeeFieldErrors {
  if (!fieldErrors) {
    return {};
  }
  const next: EmployeeFieldErrors = {};
  const keys: (keyof EmployeeFormValues)[] = [
    "employeeCode",
    "firstName",
    "lastName",
    "email",
    "role",
    "department",
    "supervisorId",
    "weeklyHours",
    "workingDaysPreset",
    "startDate",
    "endDate",
    "status",
  ];
  for (const key of keys) {
    const message = fieldErrors[key]?.[0];
    if (message) {
      next[key] = message;
    }
  }
  if (fieldErrors.workingDays?.[0]) {
    next.workingDaysPreset = fieldErrors.workingDays[0];
  }
  return next;
}

export function EmployeeForm({
  mode,
  employee,
  supervisors,
  onCancel,
  onSaved,
}: EmployeeFormProps) {
  const id = useId();
  const readOnly = mode === "view";
  const isCreate = mode === "create";
  const [values, setValues] = useState<EmployeeFormValues>(
    employee ? valuesFromEmployee(employee) : emptyEmployeeForm(),
  );
  const [fieldErrors, setFieldErrors] = useState<EmployeeFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = withCurrentOption([...EMPLOYEE_ROLES], values.role);
  const departmentOptions = withCurrentOption(
    [...EMPLOYEE_DEPARTMENTS],
    values.department,
  );

  const supervisorOptions = useMemo(() => {
    const options = supervisors
      .filter((item) => {
        if (item.id === employee?.id) {
          return false;
        }
        if (item.status === "ACTIVE") {
          return true;
        }
        return item.id === values.supervisorId;
      })
      .map((item) => ({
        value: item.id,
        label: `${item.firstName} ${item.lastName}`,
        hint: item.employeeCode,
      }));

    if (
      employee?.supervisor &&
      employee.supervisor.id !== employee.id &&
      !options.some((option) => option.value === employee.supervisor?.id)
    ) {
      options.unshift({
        value: employee.supervisor.id,
        label: `${employee.supervisor.firstName} ${employee.supervisor.lastName}`,
        hint: employee.supervisor.employeeCode,
      });
    }

    return options;
  }, [employee, supervisors, values.supervisorId]);

  const requireSupervisor = supervisors.some(
    (item) => item.status === "ACTIVE" && item.id !== employee?.id,
  );

  function patch<K extends keyof EmployeeFormValues>(
    key: K,
    value: EmployeeFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (readOnly || isSubmitting) {
      return;
    }

    const errors = validateEmployeeForm(values, {
      requireSupervisor,
      employeeId: employee?.id,
      currentSupervisorId: employee?.supervisorId,
      supervisors,
    });
    setFieldErrors(errors);
    setFormError(null);
    if (Object.values(errors).some(Boolean)) {
      return;
    }

    const workingDays =
      values.workingDaysPreset === "custom" && employee
        ? employee.workingDays
        : workingDaysFromPreset(values.workingDaysPreset, employee?.workingDays ?? []);

    const payload = {
      employeeCode: values.employeeCode.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
      department: values.department,
      supervisorId: values.supervisorId || null,
      weeklyHours: Number(values.weeklyHours),
      workingDays,
      startDate: values.startDate,
      endDate: values.endDate ? values.endDate : null,
      status: values.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    } as const;

    setIsSubmitting(true);
    try {
      if (isCreate) {
        const created = await createEmployee(payload);
        onSaved(created, "Employee saved successfully.");
      } else if (employee) {
        const updated = await updateEmployee(employee.id, payload);
        onSaved(updated, "Employee saved successfully.");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const mapped = mapApiFieldErrors(error.fieldErrors);
        if (Object.keys(mapped).length > 0) {
          setFieldErrors(mapped);
        }
        setFormError(error.message);
      } else {
        setFormError("Unable to save employee. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const title =
    mode === "create" ? "New employee" : mode === "edit" ? "Edit employee" : "Employee details";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-accent">MASTER DATA</p>
        <h2 id="employee-form-title" className="mt-1 text-xl font-semibold text-foreground">{title}</h2>
      </div>

      {formError ? <Notice tone="error">{formError}</Notice> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormInput
          id={`${id}-code`}
          label="Employee ID"
          required
          value={values.employeeCode}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.employeeCode}
          onChange={(event) => patch("employeeCode", event.target.value)}
        />
        <FormSelect
          id={`${id}-status`}
          label="Status"
          required
          value={values.status}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.status}
          onChange={(event) =>
            patch("status", event.target.value as EmployeeFormValues["status"])
          }
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </FormSelect>
        <FormInput
          id={`${id}-first`}
          label="First name"
          required
          value={values.firstName}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.firstName}
          onChange={(event) => patch("firstName", event.target.value)}
        />
        <FormInput
          id={`${id}-last`}
          label="Last name"
          required
          value={values.lastName}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.lastName}
          onChange={(event) => patch("lastName", event.target.value)}
        />
        <FormInput
          id={`${id}-email`}
          label="Email"
          type="email"
          required
          value={values.email}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.email}
          onChange={(event) => patch("email", event.target.value)}
        />
        <FormSelect
          id={`${id}-role`}
          label="Role"
          required
          value={values.role}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.role}
          onChange={(event) => patch("role", event.target.value)}
        >
          <option value="">Select role</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </FormSelect>
        <FormSelect
          id={`${id}-department`}
          label="Department"
          required
          value={values.department}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.department}
          onChange={(event) => patch("department", event.target.value)}
        >
          <option value="">Select department</option>
          {departmentOptions.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </FormSelect>
        <SearchableSelect
          id={`${id}-supervisor`}
          label="Supervisor"
          required={requireSupervisor}
          disabled={readOnly || isSubmitting}
          value={values.supervisorId}
          error={fieldErrors.supervisorId}
          options={supervisorOptions}
          placeholder="Search supervisors"
          onChange={(value) => patch("supervisorId", value)}
        />
        <FormInput
          id={`${id}-hours`}
          label="Weekly contract hours"
          type="number"
          inputMode="decimal"
          min={0.5}
          step="0.5"
          required
          value={values.weeklyHours}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.weeklyHours}
          onChange={(event) => patch("weeklyHours", event.target.value)}
        />
        <FormSelect
          id={`${id}-days`}
          label="Working days"
          required
          value={values.workingDaysPreset}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.workingDaysPreset}
          onChange={(event) => patch("workingDaysPreset", event.target.value)}
        >
          {WORKING_DAYS_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
          {values.workingDaysPreset === "custom" ? (
            <option value="custom">Custom schedule</option>
          ) : null}
        </FormSelect>
        <FormInput
          id={`${id}-start`}
          label="Start date"
          type="date"
          required
          value={values.startDate}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.startDate}
          onChange={(event) => patch("startDate", event.target.value)}
        />
        <FormInput
          id={`${id}-end`}
          label="End date"
          type="date"
          value={values.endDate}
          disabled={readOnly || isSubmitting}
          error={fieldErrors.endDate}
          hint="Optional"
          onChange={(event) => patch("endDate", event.target.value)}
        />
      </div>

      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {readOnly ? "Close" : "Cancel"}
        </button>
        {readOnly ? null : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-[0_10px_24px_rgba(108,76,232,0.28)] transition hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
