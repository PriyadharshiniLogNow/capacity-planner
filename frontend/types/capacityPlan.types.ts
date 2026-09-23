export type CapacityPlanDailyHours = {
  "1"?: number;
  "2"?: number;
  "3"?: number;
  "4"?: number;
  "5"?: number;
  "6"?: number;
  "7"?: number;
};

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
  dailyHours?: CapacityPlanDailyHours | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  employee?: CapacityPlanEmployeeSummary;
  project?: CapacityPlanProjectSummary;
  capacity?: WeekCapacitySummary;
};

export type CapacityPlanListQuery = {
  employeeId?: string;
  projectId?: string;
  weekStart?: string;
  page?: number;
  limit?: number;
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

export type CreateCapacityPlanInput = {
  employeeId: string;
  projectId: string;
  weekStart: string;
  plannedHours: number;
  dailyHours?: CapacityPlanDailyHours;
};

export type UpdateCapacityPlanInput = {
  projectId?: string;
  weekStart?: string;
  plannedHours?: number;
  dailyHours?: CapacityPlanDailyHours;
};

export type CopyWeekInput = {
  sourceWeekStart: string;
  targetWeekStart: string;
  employeeId?: string;
};

export type CopyWeekResponse = {
  message: string;
  sourceWeekStart: string;
  targetWeekStart: string;
  copied: number;
  skipped: number;
  data: CapacityPlanResponse[];
};

export type PlanningView = "hours" | "utilization" | "capacity";
