import type { TimeCategory } from "@prisma/client";
import type { z } from "zod";
import type {
  createTimeEntrySchema,
  listTimeEntriesQuerySchema,
  timeEntryIdParamSchema,
  updateTimeEntrySchema,
} from "../schemas/timeEntry.schema";

export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput = z.infer<typeof updateTimeEntrySchema>;
export type ListTimeEntriesQuery = z.infer<typeof listTimeEntriesQuerySchema>;
export type TimeEntryIdParam = z.infer<typeof timeEntryIdParamSchema>;

export type TimeEntryEmployeeSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
};

export type TimeEntryProjectSummary = {
  id: string;
  projectCode: string;
  name: string;
  status: string;
};

export type TimeEntryResponse = {
  id: string;
  employeeId: string;
  projectId: string;
  entryDate: string;
  actualHours: number;
  timeCategory: TimeCategory;
  comment: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  employee?: TimeEntryEmployeeSummary;
  project?: TimeEntryProjectSummary;
};

export type TimeEntryListResponse = {
  data: TimeEntryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type TimeEntryDeleteResponse = {
  message: string;
  timeEntry: TimeEntryResponse;
};
