import type { AbsenceType } from "@prisma/client";
import type { z } from "zod";
import type {
  absenceIdParamSchema,
  createAbsenceSchema,
  listAbsencesQuerySchema,
  updateAbsenceSchema,
} from "../schemas/absence.schema";

export type CreateAbsenceInput = z.infer<typeof createAbsenceSchema>;
export type UpdateAbsenceInput = z.infer<typeof updateAbsenceSchema>;
export type ListAbsencesQuery = z.infer<typeof listAbsencesQuerySchema>;
export type AbsenceIdParam = z.infer<typeof absenceIdParamSchema>;

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
