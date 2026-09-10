"use client";

import { listCapacitySummaries } from "@/lib/api/capacitySummary.api";
import { getDashboard } from "@/lib/api/dashboard.api";
import { getEmployeeById, listAllEmployees } from "@/lib/api/employees.api";
import { listAllProjects } from "@/lib/api/projects.api";
import { ApiError } from "@/lib/api/client";
import {
  getCurrentMonday,
  getSixWeekStarts,
} from "@/lib/date/weeks";
import { useAuth } from "@/hooks/useAuth";
import {
  calcUtilizationPercentage,
  employeeDisplayName,
} from "@/lib/utilization";
import type { EmployeeCapacitySummary } from "@/types/capacitySummary.types";
import type { DashboardFilterState, DashboardResponse } from "@/types/dashboard.types";
import type { EmployeeResponse } from "@/types/employee.types";
import type { ProjectResponse } from "@/types/project.types";
import { useCallback, useEffect, useMemo, useState } from "react";

export type DashboardKpis = {
  plannedUtilization: number;
  actualUtilization: number;
  plannedBillableUtilization: number;
  freeCapacity: number;
  overallocatedHours: number;
  availableCapacity: number;
  plannedHours: number;
  actualHours: number;
};

export type ChartWeek = {
  weekStart: string;
  weekEnd: string;
  customerHours: number;
  internalHours: number;
  freeHours: number;
  overallocatedHours: number;
};

export type HeatmapRow = {
  employeeId: string;
  name: string;
  cells: { weekStart: string; utilization: number }[];
};

export type FreeResourceRow = {
  employeeId: string;
  name: string;
  weekStart: string;
  freeHours: number;
};

export type OverallocationRow = {
  employeeId: string;
  name: string;
  weekStart: string;
  plannedHours: number;
  availableCapacity: number;
  overallocatedHours: number;
};

export type VarianceRow = {
  employeeId: string;
  name: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
};

export type EmployeeProjectRow = {
  projectId: string;
  projectCode: string;
  name: string;
  plannedHours: number;
  actualHours: number;
  variance: number;
};

type WeekBundle = {
  weekStart: string;
  dashboard: DashboardResponse;
  summaries: EmployeeCapacitySummary[];
};

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You do not have permission to view this dashboard.";
    }
    return error.message || "Unable to load dashboard data.";
  }
  return "Unable to load dashboard data.";
}

function applyFilters(
  summaries: EmployeeCapacitySummary[],
  filters: DashboardFilterState,
  employeesById: Map<string, EmployeeResponse>,
  projectsById: Map<string, ProjectResponse>,
): EmployeeCapacitySummary[] {
  return summaries
    .filter((summary) => {
      if (filters.department && summary.department !== filters.department) {
        return false;
      }
      if (filters.supervisorId) {
        const employee = employeesById.get(summary.employeeId);
        if (!employee || employee.supervisorId !== filters.supervisorId) {
          return false;
        }
      }
      return true;
    })
    .map((summary) => {
      if (!filters.projectType) {
        return summary;
      }

      const projects = summary.projects.filter((item) => {
        const project = projectsById.get(item.projectId);
        return project?.type === filters.projectType;
      });
      const plannedHours = projects.reduce((sum, item) => sum + item.plannedHours, 0);
      const actualHours = projects.reduce((sum, item) => sum + item.actualHours, 0);
      const remainingCapacity = summary.availableCapacity - plannedHours;
      const overallocationHours = Math.max(0, -remainingCapacity);

      return {
        ...summary,
        projects,
        plannedHours,
        actualHours,
        remainingCapacity,
        overallocationHours,
        isOverallocated: overallocationHours > 0,
        utilizationPercentage: calcUtilizationPercentage(
          plannedHours,
          summary.availableCapacity,
        ),
      };
    });
}

function sumKpisFromDashboard(weeks: DashboardResponse[]): Omit<
  DashboardKpis,
  "plannedUtilization" | "actualUtilization" | "plannedBillableUtilization"
> {
  return weeks.reduce(
    (totals, week) => ({
      availableCapacity: totals.availableCapacity + week.capacity.availableCapacity,
      plannedHours: totals.plannedHours + week.capacity.plannedHours,
      actualHours: totals.actualHours + week.capacity.actualHours,
      freeCapacity: totals.freeCapacity + Math.max(0, week.capacity.remainingCapacity),
      overallocatedHours: totals.overallocatedHours + week.overallocation.hours,
    }),
    {
      availableCapacity: 0,
      plannedHours: 0,
      actualHours: 0,
      freeCapacity: 0,
      overallocatedHours: 0,
    },
  );
}

function sumKpisFromSummaries(summaries: EmployeeCapacitySummary[]) {
  return summaries.reduce(
    (totals, summary) => ({
      availableCapacity: totals.availableCapacity + summary.availableCapacity,
      plannedHours: totals.plannedHours + summary.plannedHours,
      actualHours: totals.actualHours + summary.actualHours,
      freeCapacity: totals.freeCapacity + Math.max(0, summary.remainingCapacity),
      overallocatedHours: totals.overallocatedHours + summary.overallocationHours,
    }),
    {
      availableCapacity: 0,
      plannedHours: 0,
      actualHours: 0,
      freeCapacity: 0,
      overallocatedHours: 0,
    },
  );
}

function billablePlannedHours(
  summaries: EmployeeCapacitySummary[],
  projectsById: Map<string, ProjectResponse>,
) {
  return summaries.reduce((total, summary) => {
    const hours = summary.projects.reduce((sum, item) => {
      const project = projectsById.get(item.projectId);
      if (project?.billable && project.type === "CUSTOMER") {
        return sum + item.plannedHours;
      }
      return sum;
    }, 0);
    return total + hours;
  }, 0);
}

export function useDashboard() {
  const { user, token } = useAuth();
  const [filters, setFilters] = useState<DashboardFilterState>({
    periodStart: getCurrentMonday(),
    department: "",
    supervisorId: "",
    employeeId: "",
    projectId: "",
    projectType: "",
  });
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [weeks, setWeeks] = useState<WeekBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const weekStarts = useMemo(
    () => getSixWeekStarts(filters.periodStart),
    [filters.periodStart],
  );

  const missingEmployeeLink = user?.role === "EMPLOYEE" && !user.employeeId;

  const retry = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const updateFilters = useCallback(
    (patch: Partial<DashboardFilterState>) => {
      setFilters((current) => ({ ...current, ...patch }));
    },
    [],
  );

  useEffect(() => {
    if (!token || !user || missingEmployeeLink) {
      return;
    }

    const currentUser = user;
    const isEmployee = currentUser.role === "EMPLOYEE";

    const scopedEmployeeId = isEmployee
      ? currentUser.employeeId ?? undefined
      : filters.employeeId || undefined;
    const scopedProjectId = isEmployee ? undefined : filters.projectId || undefined;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [employeeList, projectList, profile] = await Promise.all([
          isEmployee ? Promise.resolve([] as EmployeeResponse[]) : listAllEmployees({ status: "ACTIVE" }),
          listAllProjects(),
          currentUser.employeeId
            ? getEmployeeById(currentUser.employeeId).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelled) {
          return;
        }

        setEmployees(employeeList);
        setProjects(projectList);
        setDisplayName(
          profile ? employeeDisplayName(profile) : currentUser.email,
        );

        const bundles = await Promise.all(
          weekStarts.map(async (weekStart) => {
            const query = {
              weekStart,
              employeeId: scopedEmployeeId,
              projectId: scopedProjectId,
            };
            const [dashboard, summaries] = await Promise.all([
              getDashboard(query),
              listCapacitySummaries(query),
            ]);
            return { weekStart, dashboard, summaries };
          }),
        );

        if (cancelled) {
          return;
        }

        setWeeks(bundles);
      } catch (loadError) {
        if (!cancelled) {
          setError(errorMessage(loadError));
          setWeeks([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    token,
    user,
    missingEmployeeLink,
    filters.periodStart,
    filters.employeeId,
    filters.projectId,
    weekStarts,
    reloadKey,
  ]);

  const employeesById = useMemo(
    () => new Map(employees.map((employee) => [employee.id, employee])),
    [employees],
  );
  const projectsById = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );

  const filteredWeeks = useMemo(
    () =>
      weeks.map((week) => ({
        ...week,
        summaries: applyFilters(week.summaries, filters, employeesById, projectsById),
      })),
    [weeks, filters, employeesById, projectsById],
  );

  const allSummaries = useMemo(
    () => filteredWeeks.flatMap((week) => week.summaries),
    [filteredWeeks],
  );

  const usesClientOnlyFilters = Boolean(
    filters.department || filters.supervisorId || filters.projectType,
  );

  const kpis = useMemo<DashboardKpis>(() => {
    const hourTotals = usesClientOnlyFilters
      ? sumKpisFromSummaries(allSummaries)
      : sumKpisFromDashboard(filteredWeeks.map((week) => week.dashboard));

    return {
      ...hourTotals,
      plannedUtilization: calcUtilizationPercentage(
        hourTotals.plannedHours,
        hourTotals.availableCapacity,
      ),
      actualUtilization: calcUtilizationPercentage(
        hourTotals.actualHours,
        hourTotals.availableCapacity,
      ),
      plannedBillableUtilization: calcUtilizationPercentage(
        billablePlannedHours(allSummaries, projectsById),
        hourTotals.availableCapacity,
      ),
    };
  }, [allSummaries, filteredWeeks, projectsById, usesClientOnlyFilters]);

  const chart = useMemo<ChartWeek[]>(
    () =>
      filteredWeeks.map((week) => {
        let customerHours = 0;
        let internalHours = 0;

        for (const summary of week.summaries) {
          for (const item of summary.projects) {
            const project = projectsById.get(item.projectId);
            if (project?.type === "CUSTOMER") {
              customerHours += item.plannedHours;
            } else if (project?.type === "INTERNAL") {
              internalHours += item.plannedHours;
            }
          }
        }

        const freeHours = week.summaries.reduce(
          (sum, summary) => sum + Math.max(0, summary.remainingCapacity),
          0,
        );
        const overallocatedHours = week.summaries.reduce(
          (sum, summary) => sum + summary.overallocationHours,
          0,
        );

        return {
          weekStart: week.weekStart,
          weekEnd: week.dashboard.weekEnd,
          customerHours,
          internalHours,
          freeHours,
          overallocatedHours,
        };
      }),
    [filteredWeeks, projectsById],
  );

  const heatmap = useMemo<HeatmapRow[]>(() => {
    const byEmployee = new Map<string, HeatmapRow>();

    for (const week of filteredWeeks) {
      for (const summary of week.summaries) {
        const existing = byEmployee.get(summary.employeeId);
        const cell = {
          weekStart: summary.weekStart,
          utilization: summary.utilizationPercentage,
        };
        if (existing) {
          existing.cells.push(cell);
        } else {
          byEmployee.set(summary.employeeId, {
            employeeId: summary.employeeId,
            name: employeeDisplayName(summary),
            cells: [cell],
          });
        }
      }
    }

    return Array.from(byEmployee.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [filteredWeeks]);

  const freeResources = useMemo<FreeResourceRow[]>(
    () =>
      allSummaries
        .filter((summary) => summary.remainingCapacity > 0)
        .map((summary) => ({
          employeeId: summary.employeeId,
          name: employeeDisplayName(summary),
          weekStart: summary.weekStart,
          freeHours: summary.remainingCapacity,
        }))
        .sort((a, b) => b.freeHours - a.freeHours),
    [allSummaries],
  );

  const overallocation = useMemo<OverallocationRow[]>(
    () =>
      allSummaries
        .filter((summary) => summary.isOverallocated)
        .map((summary) => ({
          employeeId: summary.employeeId,
          name: employeeDisplayName(summary),
          weekStart: summary.weekStart,
          plannedHours: summary.plannedHours,
          availableCapacity: summary.availableCapacity,
          overallocatedHours: summary.overallocationHours,
        }))
        .sort((a, b) => b.overallocatedHours - a.overallocatedHours),
    [allSummaries],
  );

  const variance = useMemo<VarianceRow[]>(() => {
    const byEmployee = new Map<string, VarianceRow>();

    for (const summary of allSummaries) {
      const existing = byEmployee.get(summary.employeeId);
      if (existing) {
        existing.plannedHours += summary.plannedHours;
        existing.actualHours += summary.actualHours;
        existing.variance = existing.actualHours - existing.plannedHours;
      } else {
        byEmployee.set(summary.employeeId, {
          employeeId: summary.employeeId,
          name: employeeDisplayName(summary),
          plannedHours: summary.plannedHours,
          actualHours: summary.actualHours,
          variance: summary.actualHours - summary.plannedHours,
        });
      }
    }

    return Array.from(byEmployee.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSummaries]);

  const employeeWeeks = useMemo(
    () =>
      allSummaries
        .slice()
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    [allSummaries],
  );

  const employeeProjects = useMemo<EmployeeProjectRow[]>(() => {
    const byProject = new Map<string, EmployeeProjectRow>();

    for (const summary of allSummaries) {
      for (const item of summary.projects) {
        const existing = byProject.get(item.projectId);
        if (existing) {
          existing.plannedHours += item.plannedHours;
          existing.actualHours += item.actualHours;
          existing.variance = existing.actualHours - existing.plannedHours;
        } else {
          byProject.set(item.projectId, {
            projectId: item.projectId,
            projectCode: item.projectCode,
            name: item.name,
            plannedHours: item.plannedHours,
            actualHours: item.actualHours,
            variance: item.actualHours - item.plannedHours,
          });
        }
      }
    }

    return Array.from(byProject.values()).sort((a, b) =>
      a.projectCode.localeCompare(b.projectCode),
    );
  }, [allSummaries]);

  const departments = useMemo(
    () =>
      Array.from(new Set(employees.map((employee) => employee.department))).sort(),
    [employees],
  );

  const supervisors = useMemo(() => {
    const supervisorIds = new Set(
      employees
        .map((employee) => employee.supervisorId)
        .filter((id): id is string => Boolean(id)),
    );

    return employees
      .filter((employee) => supervisorIds.has(employee.id))
      .map((employee) => ({
        id: employee.id,
        name: employeeDisplayName(employee),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);

  const empty = !loading && !error && allSummaries.length === 0;

  return {
    user,
    displayName,
    filters,
    updateFilters,
    weekStarts,
    kpis,
    chart,
    heatmap,
    freeResources,
    overallocation,
    variance,
    employeeWeeks,
    employeeProjects,
    employees,
    projects,
    departments,
    supervisors,
    loading: missingEmployeeLink ? false : loading,
    error: missingEmployeeLink
      ? "Your account is not linked to an employee profile."
      : error,
    empty,
    retry,
  };
}
