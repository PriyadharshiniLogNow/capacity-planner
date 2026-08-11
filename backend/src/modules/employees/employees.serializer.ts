import type { Employee } from "@prisma/client";
import { formatDateOnly } from "../../utils/date";

export function serializeEmployee(employee: Employee) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role,
    department: employee.department,
    managerId: employee.managerId,
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
