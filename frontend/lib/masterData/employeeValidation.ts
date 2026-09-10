import type { EmployeeStatus } from "@/types/employee.types";
import { WORKING_DAYS_PRESETS } from "./constants";

export type EmployeeFormValues = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  supervisorId: string;
  weeklyHours: string;
  workingDaysPreset: string;
  startDate: string;
  endDate: string;
  status: EmployeeStatus | "";
};

export type EmployeeFieldErrors = Partial<Record<keyof EmployeeFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyEmployeeForm(): EmployeeFormValues {
  return {
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "",
    department: "",
    supervisorId: "",
    weeklyHours: "40",
    workingDaysPreset: "mon-fri",
    startDate: "",
    endDate: "",
    status: "ACTIVE",
  };
}

export function workingDaysFromPreset(presetId: string, fallback: number[]): number[] {
  const preset = WORKING_DAYS_PRESETS.find((item) => item.id === presetId);
  return preset?.days ?? (fallback.length > 0 ? fallback : [1, 2, 3, 4, 5]);
}

export function validateEmployeeForm(
  values: EmployeeFormValues,
  options: {
    requireSupervisor: boolean;
    employeeId?: string;
    currentSupervisorId?: string | null;
    supervisors?: Array<{
      id: string;
      supervisorId: string | null;
      status: EmployeeStatus;
    }>;
  },
): EmployeeFieldErrors {
  const errors: EmployeeFieldErrors = {};

  if (!values.employeeCode.trim()) {
    errors.employeeCode = "Employee ID is required.";
  }
  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!values.role) {
    errors.role = "Role is required.";
  }
  if (!values.department) {
    errors.department = "Department is required.";
  }
  if (options.requireSupervisor && !values.supervisorId) {
    errors.supervisorId = "Supervisor is required.";
  }
  if (!values.workingDaysPreset) {
    errors.workingDaysPreset = "Working days is required.";
  }
  if (!values.startDate) {
    errors.startDate = "Start date is required.";
  }
  if (!values.status) {
    errors.status = "Status is required.";
  }

  const weeklyHours = Number(values.weeklyHours);
  if (values.weeklyHours.trim() === "" || Number.isNaN(weeklyHours)) {
    errors.weeklyHours = "Weekly contract hours is required.";
  } else if (weeklyHours <= 0) {
    errors.weeklyHours = "Weekly contract hours must be greater than zero.";
  }

  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "End date cannot be earlier than the start date.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (values.supervisorId && options.employeeId && values.supervisorId === options.employeeId) {
    errors.supervisorId = "Employees cannot supervise themselves.";
  }

  const selected = options.supervisors?.find((item) => item.id === values.supervisorId);
  if (
    selected &&
    options.employeeId &&
    selected.supervisorId === options.employeeId
  ) {
    errors.supervisorId = "This would create a circular supervisor relationship.";
  }
  if (
    selected &&
    selected.status === "INACTIVE" &&
    selected.id !== options.currentSupervisorId
  ) {
    errors.supervisorId = "Inactive employees cannot be selected as supervisor.";
  }

  return errors;
}
