export type AbsenceType = "VACATION" | "SICKNESS" | "PUBLIC_HOLIDAY" | "OTHER";

export type AbsenceStatus = "PENDING" | "APPROVED" | "REJECTED";

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
  status: AbsenceStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  employee?: AbsenceEmployeeSummary;
};

export type CreateAbsenceRequest = {
  employeeId: string;
  startDate: string;
  endDate: string;
  absenceType: AbsenceType;
  note?: string | null;
};

export type UpdateAbsenceRequest = {
  startDate?: string;
  endDate?: string;
  absenceType?: AbsenceType;
  note?: string | null;
};

export type RejectAbsenceRequest = {
  rejectionReason: string;
};

export type AbsenceListQuery = {
  employeeId?: string;
  from?: string;
  to?: string;
  status?: AbsenceStatus;
  page?: number;
  limit?: number;
};

export type AbsenceFilterState = {
  employeeId: string;
  absenceType: AbsenceType | "";
  status: AbsenceStatus | "";
  from: string;
  to: string;
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

export type AbsenceDeleteResponse = {
  message: string;
  absence: AbsenceResponse;
};

export type AbsenceActionResponse = {
  message: string;
  data: AbsenceResponse;
};
