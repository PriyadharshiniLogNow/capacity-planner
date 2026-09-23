export type AbsenceType = "VACATION" | "SICKNESS" | "PUBLIC_HOLIDAY" | "OTHER";

export type AbsenceEmployeeSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
};

export type AbsenceResponse = {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  absenceType: AbsenceType;
  hours: number;
  note: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  employee?: AbsenceEmployeeSummary;
};

export type AbsenceListQuery = {
  employeeId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

export type AbsenceListResponse = {
  data: AbsenceResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
