export type CapacitySummaryQuery = {
  weekStart: string;
  employeeId?: string;
  projectId?: string;
};

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

export type CapacitySummaryListEnvelope = {
  data: EmployeeCapacitySummary[];
};
