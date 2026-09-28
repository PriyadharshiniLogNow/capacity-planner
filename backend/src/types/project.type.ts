import type { ProjectStatus, ProjectType } from "@prisma/client";
import type { z } from "zod";
import type {
  listProjectsQuerySchema,
  projectBodySchema,
} from "../schemas/project.schema";

export type ProjectBody = z.infer<typeof projectBodySchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

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
  customerName: string;
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

export type ProjectListResponse = {
  data: ProjectResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ProjectCloseResponse = {
  message: string;
  project: ProjectResponse;
};
