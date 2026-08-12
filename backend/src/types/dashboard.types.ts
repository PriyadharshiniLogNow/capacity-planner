import type { z } from "zod";
import type { dashboardQuerySchema } from "../schemas/dashboard.schema";

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export type DashboardEmployeeStats = {
  total: number;
  active: number;
  inactive: number;
};

export type DashboardProjectStats = {
  total: number;
  open: number;
  closed: number;
  withPlannedCapacity: number;
  withActualHours: number;
};

export type DashboardAbsenceStats = {
  employeeCount: number;
  hours: number;
};

export type DashboardCapacityStats = {
  weeklyCapacity: number;
  availableCapacity: number;
  plannedHours: number;
  actualHours: number;
  remainingCapacity: number;
  utilizationPercentage: number;
};

export type DashboardOverallocationStats = {
  employeeCount: number;
  hours: number;
};

export type DashboardResponse = {
  weekStart: string;
  weekEnd: string;
  employees: DashboardEmployeeStats;
  projects: DashboardProjectStats;
  absences: DashboardAbsenceStats;
  capacity: DashboardCapacityStats;
  overallocation: DashboardOverallocationStats;
};
