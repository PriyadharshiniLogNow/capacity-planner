import type { z } from "zod";
import type {
  capacitySummaryQuerySchema,
  employeeCapacitySummaryQuerySchema,
  employeeIdParamSchema,
  employeeWeekParamsSchema,
  projectCapacitySummaryQuerySchema,
  projectIdParamSchema,
} from "../schemas/capacitySummary.schema";

export type CapacitySummaryQuery = z.infer<typeof capacitySummaryQuerySchema>;
export type EmployeeCapacitySummaryQuery = z.infer<
  typeof employeeCapacitySummaryQuerySchema
>;
export type EmployeeIdParam = z.infer<typeof employeeIdParamSchema>;
export type EmployeeWeekParams = z.infer<typeof employeeWeekParamsSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type ProjectCapacitySummaryQuery = z.infer<
  typeof projectCapacitySummaryQuerySchema
>;

export type ProjectAllocationBreakdown = {
  projectId: string;
  projectCode: string;
  name: string;
  plannedHours: number;
  actualHours: number;
};

export type EmployeeCapacitySummary = {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  department: string;
  weekStart: string;
  weekEnd: string;
  weeklyCapacity: number;
  absenceHours: number;
  availableCapacity: number;
  plannedHours: number;
  actualHours: number;
  remainingCapacity: number;
  utilizationPercentage: number;
  overallocationHours: number;
  isOverallocated: boolean;
  projects: ProjectAllocationBreakdown[];
};

export type ProjectEmployeeAllocation = {
  employeeId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  plannedHours: number;
  actualHours: number;
};

export type ProjectCapacitySummary = {
  projectId: string;
  projectCode: string;
  name: string;
  weekStart: string;
  weekEnd: string;
  totalPlannedHours: number;
  totalActualHours: number;
  employeeCount: number;
  employees: ProjectEmployeeAllocation[];
};
