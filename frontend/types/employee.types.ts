export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type EmployeeSupervisorSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

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

export type EmployeeWritePayload = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  supervisorId: string | null;
  weeklyHours: number;
  workingDays: number[];
  startDate: string;
  endDate: string | null;
  status: EmployeeStatus;
};

export type CreateEmployeePayload = EmployeeWritePayload;

export type EmployeeListQuery = {
  status?: EmployeeStatus;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
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
