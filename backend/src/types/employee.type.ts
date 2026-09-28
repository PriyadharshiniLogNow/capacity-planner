import type { EmployeeStatus } from "@prisma/client";
import type { z } from "zod";
import type {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import type { EmployeeSupervisorSummary } from "../lib/employeeMapper";

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeBody = UpdateEmployeeInput;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export type EmployeeResponse = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  supervisorId: string | null;
  supervisor: EmployeeSupervisorSummary | null;
  weeklyHours: number;
  workingDays: number[];
  startDate: string;
  endDate: string | null;
  status: EmployeeStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type EmployeeCreateResponse = {
  message: string;
  data: {
    employee: EmployeeResponse;
  };
};

export type EmployeeListResponse = {
  data: EmployeeResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type EmployeeDeactivateResponse = {
  message: string;
  employee: EmployeeResponse;
};
