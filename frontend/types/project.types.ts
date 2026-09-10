export type ProjectType = "CUSTOMER" | "INTERNAL";
export type ProjectStatus = "OPEN" | "CLOSED";

export type ProjectManagerSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

export type ProjectResponse = {
  id: string;
  projectCode: string;
  name: string;
  type: ProjectType;
  customerName: string | null;
  projectManagerId: string | null;
  projectManager: ProjectManagerSummary | null;
  startDate: string;
  endDate: string;
  billable: boolean;
  status: ProjectStatus;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
};

export type ProjectWritePayload = {
  projectCode: string;
  name: string;
  type: ProjectType;
  customerName: string;
  projectManagerId: string;
  startDate: string;
  endDate: string;
  billable: boolean;
  status: ProjectStatus;
};

export type ProjectListQuery = {
  status?: ProjectStatus;
  type?: ProjectType;
  billable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
};

export type ProjectListResponse = {
  data: ProjectResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
