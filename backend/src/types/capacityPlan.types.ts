import type { z } from "zod";
import type {
  capacityPlanIdParamSchema,
  copyWeekSchema,
  createCapacityPlanSchema,
  listCapacityPlansQuerySchema,
  updateCapacityPlanSchema,
} from "../schemas/capacityPlan.schema";

export type CreateCapacityPlanInput = z.infer<typeof createCapacityPlanSchema>;
export type UpdateCapacityPlanInput = z.infer<typeof updateCapacityPlanSchema>;
export type ListCapacityPlansQuery = z.infer<
  typeof listCapacityPlansQuerySchema
>;
export type CapacityPlanIdParam = z.infer<typeof capacityPlanIdParamSchema>;
export type CopyWeekInput = z.infer<typeof copyWeekSchema>;

export type CapacityPlanEmployeeSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  weeklyHours: number;
  workingDays: number[];
};

export type CapacityPlanProjectSummary = { 
  id: string;
  projectCode: string;
  name: string;
  status: string;
};

export type WeekCapacitySummary = {
  employeeId: string;
  weekStart: string;
  weekEnd: string;
  weeklyCapacity: number;
  absenceHours: number;
  availableCapacity: number;
  plannedHours: number;
  actualHours: number;
  remainingCapacity: number;
  overallocationHours: number;
};

export type CapacityPlanResponse = {
  id: string;
  employeeId: string;
  projectId: string;
  weekStart: string;
  plannedHours: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  employee?: CapacityPlanEmployeeSummary;
  project?: CapacityPlanProjectSummary;
  capacity?: WeekCapacitySummary;
};

export type CapacityPlanListResponse = {
  data: CapacityPlanResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  capacity?: WeekCapacitySummary;
};

export type CapacityPlanDeleteResponse = {
  message: string;
  capacityPlan: CapacityPlanResponse;
};

export type CopyWeekResponse = {
  message: string;
  sourceWeekStart: string;
  targetWeekStart: string;
  copied: number;
  skipped: number;
  data: CapacityPlanResponse[];
};
