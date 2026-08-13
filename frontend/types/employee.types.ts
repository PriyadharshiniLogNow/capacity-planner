export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export type EmployeeResponse = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
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
