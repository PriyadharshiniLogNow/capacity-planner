import type { Employee, Role } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  assertMonday,
  buildWeekCapacitySummary,
  weekEndFromStart,
} from "./capacityPlan.controller";
import { prisma } from "../lib/prisma";
import {
  capacitySummaryQuerySchema,
  employeeCapacitySummaryQuerySchema,
  employeeIdParamSchema,
  employeeWeekParamsSchema,
  projectCapacitySummaryQuerySchema,
  projectIdParamSchema,
} from "../schemas/capacitySummary.schema";
import type {
  EmployeeCapacitySummary,
  ProjectAllocationBreakdown,
  ProjectCapacitySummary,
  ProjectEmployeeAllocation,
} from "../types/capacitySummary.types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function actorRole(req: Request): Role | undefined {
  return req.user?.role;
}

function actorEmployeeId(req: Request): string | null {
  return req.user?.employeeId ?? null;
}

function assertEmployeeOwnership(
  req: Request,
  targetEmployeeId: string,
  res: Response,
): boolean {
  if (actorRole(req) !== "EMPLOYEE") {
    return true;
  }

  const ownEmployeeId = actorEmployeeId(req);
  if (!ownEmployeeId || ownEmployeeId !== targetEmployeeId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }

  return true;
}

/** Planned utilization = plannedHours / availableCapacity × 100 (README). */
function calcUtilizationPercentage(
  plannedHours: number,
  availableCapacity: number,
): number {
  if (availableCapacity <= 0) {
    return 0;
  }
  return Math.round((plannedHours / availableCapacity) * 1000) / 10;
}

async function loadProjectBreakdown(
  employeeId: string,
  weekStart: Date,
): Promise<ProjectAllocationBreakdown[]> {
  const weekEnd = weekEndFromStart(weekStart);

  const [plans, entries] = await Promise.all([
    prisma.capacityPlan.findMany({
      where: {
        employeeId,
        planDate: weekStart,
      },
      include: {
        project: {
          select: { id: true, projectCode: true, name: true },
        },
      },
    }),
    prisma.timeEntry.groupBy({
      by: ["projectId"],
      where: {
        employeeId,
        entryDate: { gte: weekStart, lte: weekEnd },
      },
      _sum: { actualHours: true },
    }),
  ]);

  const actualByProject = new Map(
    entries.map((row) => [row.projectId, row._sum.actualHours ?? 0]),
  );

  const byProject = new Map<string, ProjectAllocationBreakdown>();

  for (const plan of plans) {
    byProject.set(plan.projectId, {
      projectId: plan.project.id,
      projectCode: plan.project.projectCode,
      name: plan.project.name,
      plannedHours: plan.plannedHours,
      actualHours: actualByProject.get(plan.projectId) ?? 0,
    });
  }

  // Include projects that have actual hours but no plan for the week.
  for (const [projectId, actualHours] of actualByProject) {
    if (byProject.has(projectId)) {
      continue;
    }
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectCode: true, name: true },
    });
    if (!project) {
      continue;
    }
    byProject.set(projectId, {
      projectId: project.id,
      projectCode: project.projectCode,
      name: project.name,
      plannedHours: 0,
      actualHours,
    });
  }

  return Array.from(byProject.values()).sort((a, b) =>
    a.projectCode.localeCompare(b.projectCode),
  );
}

async function buildEmployeeSummary(
  employee: Employee,
  weekStart: Date,
): Promise<EmployeeCapacitySummary> {
  const capacity = await buildWeekCapacitySummary({
    employee,
    weekStart,
  });
  const projects = await loadProjectBreakdown(employee.id, weekStart);

  return {
    employeeId: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    department: employee.department,
    weekStart: capacity.weekStart,
    weekEnd: capacity.weekEnd,
    weeklyCapacity: capacity.weeklyCapacity,
    absenceHours: capacity.absenceHours,
    availableCapacity: capacity.availableCapacity,
    plannedHours: capacity.plannedHours,
    actualHours: capacity.actualHours,
    remainingCapacity: capacity.remainingCapacity,
    utilizationPercentage: calcUtilizationPercentage(
      capacity.plannedHours,
      capacity.availableCapacity,
    ),
    overallocationHours: capacity.overallocationHours,
    isOverallocated: capacity.overallocationHours > 0,
    projects,
  };
}

export const listCapacitySummaries = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = capacitySummaryQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { weekStart: weekStartRaw, employeeId, projectId } = parsed.data;
  const weekStart = parseDateOnly(weekStartRaw);

  if (!assertMonday(weekStart, res)) {
    return;
  }

  let targetEmployeeId = employeeId;

  if (actorRole(req) === "EMPLOYEE") {
    const ownEmployeeId = actorEmployeeId(req);
    if (!ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (employeeId && employeeId !== ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    targetEmployeeId = ownEmployeeId;
  }

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      });
    }
  }

  let employeeIds: string[];

  if (targetEmployeeId) {
    employeeIds = [targetEmployeeId];
  } else if (projectId) {
    const weekEnd = weekEndFromStart(weekStart);
    const [planRows, entryRows] = await Promise.all([
      prisma.capacityPlan.findMany({
        where: { projectId, planDate: weekStart },
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
      prisma.timeEntry.findMany({
        where: {
          projectId,
          entryDate: { gte: weekStart, lte: weekEnd },
        },
        select: { employeeId: true },
        distinct: ["employeeId"],
      }),
    ]);
    employeeIds = Array.from(
      new Set([
        ...planRows.map((r) => r.employeeId),
        ...entryRows.map((r) => r.employeeId),
      ]),
    );
  } else {
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    employeeIds = employees.map((e) => e.id);
  }

  const summaries: EmployeeCapacitySummary[] = [];

  for (const id of employeeIds) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      if (targetEmployeeId) {
        return res.status(404).json({
          error: {
            code: "EMPLOYEE_NOT_FOUND",
            message: "Employee not found",
          },
        });
      }
      continue;
    }

    const summary = await buildEmployeeSummary(employee, weekStart);

    if (projectId) {
      summary.projects = summary.projects.filter(
        (p) => p.projectId === projectId,
      );
    }

    summaries.push(summary);
  }

  return res.status(200).json({ data: summaries });
};

export const getEmployeeCapacitySummary = async (
  req: Request,
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = employeeIdParamSchema.safeParse({
    employeeId: paramId(req.params.employeeId),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const queryParsed = employeeCapacitySummaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return validationError(res, queryParsed.error);
  }

  if (!queryParsed.data.weekStart) {
    return res.status(422).json({
      error: {
        code: "INVALID_WEEK",
        message: "weekStart query parameter is required (Monday YYYY-MM-DD)",
      },
    });
  }

  const employeeId = idParsed.data.employeeId;
  if (!assertEmployeeOwnership(req, employeeId, res)) {
    return;
  }

  const weekStart = parseDateOnly(queryParsed.data.weekStart);
  if (!assertMonday(weekStart, res)) {
    return;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    return res.status(404).json({
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      },
    });
  }

  const summary = await buildEmployeeSummary(employee, weekStart);
  return res.status(200).json({ data: summary });
};

export const getEmployeeWeekCapacitySummary = async (
  req: Request,
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = employeeWeekParamsSchema.safeParse({
    employeeId: paramId(req.params.employeeId),
    weekStart: paramId(req.params.weekStart),
  });
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { employeeId, weekStart: weekStartRaw } = parsed.data;
  if (!assertEmployeeOwnership(req, employeeId, res)) {
    return;
  }

  const weekStart = parseDateOnly(weekStartRaw);
  if (!assertMonday(weekStart, res)) {
    return;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });
  if (!employee) {
    return res.status(404).json({
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      },
    });
  }

  const summary = await buildEmployeeSummary(employee, weekStart);
  return res.status(200).json({ data: summary });
};

export const getProjectCapacitySummary = async (
  req: Request,
  res: Response,
) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = projectIdParamSchema.safeParse({
    projectId: paramId(req.params.projectId),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const queryParsed = projectCapacitySummaryQuerySchema.safeParse(req.query);
  if (!queryParsed.success) {
    return validationError(res, queryParsed.error);
  }

  const projectId = idParsed.data.projectId;
  let filterEmployeeId = queryParsed.data.employeeId;

  if (actorRole(req) === "EMPLOYEE") {
    const ownEmployeeId = actorEmployeeId(req);
    if (!ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (filterEmployeeId && filterEmployeeId !== ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    filterEmployeeId = ownEmployeeId;
  }

  const weekStart = parseDateOnly(queryParsed.data.weekStart);
  if (!assertMonday(weekStart, res)) {
    return;
  }
  const weekEnd = weekEndFromStart(weekStart);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectCode: true, name: true },
  });
  if (!project) {
    return res.status(404).json({
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      },
    });
  }

  const employeeFilter = filterEmployeeId
    ? { employeeId: filterEmployeeId }
    : {};

  const [plans, entryGroups] = await Promise.all([
    prisma.capacityPlan.findMany({
      where: {
        projectId,
        planDate: weekStart,
        ...employeeFilter,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.timeEntry.groupBy({
      by: ["employeeId"],
      where: {
        projectId,
        entryDate: { gte: weekStart, lte: weekEnd },
        ...employeeFilter,
      },
      _sum: { actualHours: true },
    }),
  ]);

  const actualByEmployee = new Map(
    entryGroups.map((row) => [row.employeeId, row._sum.actualHours ?? 0]),
  );

  const byEmployee = new Map<string, ProjectEmployeeAllocation>();

  for (const plan of plans) {
    byEmployee.set(plan.employeeId, {
      employeeId: plan.employee.id,
      employeeCode: plan.employee.employeeCode,
      firstName: plan.employee.firstName,
      lastName: plan.employee.lastName,
      plannedHours: plan.plannedHours,
      actualHours: actualByEmployee.get(plan.employeeId) ?? 0,
    });
  }

  for (const [employeeId, actualHours] of actualByEmployee) {
    if (byEmployee.has(employeeId)) {
      continue;
    }
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!employee) {
      continue;
    }
    byEmployee.set(employeeId, {
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      plannedHours: 0,
      actualHours,
    });
  }

  const employees = Array.from(byEmployee.values()).sort((a, b) =>
    a.employeeCode.localeCompare(b.employeeCode),
  );

  const summary: ProjectCapacitySummary = {
    projectId: project.id,
    projectCode: project.projectCode,
    name: project.name,
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    totalPlannedHours: employees.reduce((sum, e) => sum + e.plannedHours, 0),
    totalActualHours: employees.reduce((sum, e) => sum + e.actualHours, 0),
    employeeCount: employees.length,
    employees,
  };

  return res.status(200).json({ data: summary });
};
