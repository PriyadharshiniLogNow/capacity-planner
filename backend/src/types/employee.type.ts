import type { EmployeeStatus } from "@prisma/client";
import type { z } from "zod";
import type {
  createEmployeeSchema,
  listEmployeesQuerySchema,
} from "../schemas/employee.schema";

export type EmployeeBody = z.infer<typeof createEmployeeSchema>;
export type CreateEmployeeInput = EmployeeBody;
export type UpdateEmployeeInput = EmployeeBody;
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export type EmployeeResponse = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  managerId: string | null;
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
