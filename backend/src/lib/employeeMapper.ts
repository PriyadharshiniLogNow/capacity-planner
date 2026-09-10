import type { EmployeeStatus } from "@prisma/client";
import { formatDateOnly } from "../utils/date";

export type EmployeeSupervisorSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

export type EmployeeForResponse = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  supervisorId: string | null;
  supervisor?: EmployeeSupervisorSummary | null;
  weeklyHours: number;
  workingDays: number[];
  startDate: Date;
  endDate: Date | null;
  status: EmployeeStatus;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  password?: unknown;
  passwordHash?: unknown;
  user?: unknown;
};

export function toEmployeeResponse(employee: EmployeeForResponse) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    role: employee.role,
    department: employee.department,
    supervisorId: employee.supervisorId,
    supervisor: employee.supervisor
      ? {
          id: employee.supervisor.id,
          employeeCode: employee.supervisor.employeeCode,
          firstName: employee.supervisor.firstName,
          lastName: employee.supervisor.lastName,
        }
      : null,
    weeklyHours: employee.weeklyHours,
    workingDays: employee.workingDays,
    startDate: formatDateOnly(employee.startDate),
    endDate: employee.endDate ? formatDateOnly(employee.endDate) : null,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    createdBy: employee.createdBy,
    updatedAt: employee.updatedAt.toISOString(),
    updatedBy: employee.updatedBy,
  };
}

export function employeeResponseContainsSecrets(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  if (Array.isArray(payload)) {
    return payload.some(employeeResponseContainsSecrets);
  }

  return Object.entries(payload as Record<string, unknown>).some(([key, value]) => {
    const lower = key.toLowerCase();
    if (lower === "password" || lower === "passwordhash") {
      return true;
    }
    return employeeResponseContainsSecrets(value);
  });
}
