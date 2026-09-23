import type { Role } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  assertMonday,
  buildWeekCapacitySummary,
  weekEndFromStart,
} from "./capacityPlan.controller";
import { employeeCountsTowardDefaultCapacityPool } from "../lib/capacityPolicy";
import { prisma } from "../lib/prisma";
import { dashboardQuerySchema } from "../schemas/dashboard.schema";
import type { DashboardResponse } from "../types/dashboard.types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function actorRole(req: Request): Role | undefined {
  return req.user?.role;
}

function actorEmployeeId(req: Request): string | null {
  return req.user?.employeeId ?? null;
}

/** Same planned-utilization formula as Capacity Summary. */
function calcUtilizationPercentage(
  plannedHours: number,
  availableCapacity: number,
): number {
  if (availableCapacity <= 0) {
    return 0;
  }
  return Math.round((plannedHours / availableCapacity) * 1000) / 10;
}

/** Monday of the current Asia/Kolkata calendar week. */
function currentWeekStartMonday(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);
  const today = parseDateOnly(
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  );

  const jsDay = today.getUTCDay();
  const iso = jsDay === 0 ? 7 : jsDay;
  const monday = new Date(today.getTime());
  monday.setUTCDate(monday.getUTCDate() + (1 - iso));
  return monday;
}

export const getDashboard = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = dashboardQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  let { employeeId, projectId } = parsed.data;
  const weekStart = parsed.data.weekStart
    ? parseDateOnly(parsed.data.weekStart)
    : currentWeekStartMonday();

  if (!assertMonday(weekStart, res)) {
    return;
  }

  const weekEnd = weekEndFromStart(weekStart);

  if (actorRole(req) === "EMPLOYEE") {
    const ownEmployeeId = actorEmployeeId(req);
    if (!ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (employeeId && employeeId !== ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    employeeId = ownEmployeeId;
  }

  if (employeeId) {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });
    if (!employee) {
      return res.status(404).json({
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found",
        },
      });
    }
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

  const [employeeTotal, employeeActive, employeeInactive, projectTotal, projectOpen, projectClosed] =
    await Promise.all([
      prisma.employee.count(
        employeeId ? { where: { id: employeeId } } : undefined,
      ),
      prisma.employee.count({
        where: {
          status: "ACTIVE",
          ...(employeeId ? { id: employeeId } : {}),
        },
      }),
      prisma.employee.count({
        where: {
          status: "INACTIVE",
          ...(employeeId ? { id: employeeId } : {}),
        },
      }),
      prisma.project.count(projectId ? { where: { id: projectId } } : undefined),
      prisma.project.count({
        where: {
          status: "OPEN",
          ...(projectId ? { id: projectId } : {}),
        },
      }),
      prisma.project.count({
        where: {
          status: "CLOSED",
          ...(projectId ? { id: projectId } : {}),
        },
      }),
    ]);

  const [projectsWithPlans, projectsWithActual] = await Promise.all([
    prisma.capacityPlan.findMany({
      where: {
        planDate: weekStart,
        ...(employeeId ? { employeeId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
    prisma.timeEntry.findMany({
      where: {
        entryDate: { gte: weekStart, lte: weekEnd },
        ...(employeeId ? { employeeId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      select: { projectId: true },
      distinct: ["projectId"],
    }),
  ]);

  // Resolve employees included in capacity aggregation (same rules as Capacity Summary).
  let capacityEmployeeIds: string[];

  if (employeeId) {
    capacityEmployeeIds = [employeeId];
  } else if (projectId) {
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
    capacityEmployeeIds = Array.from(
      new Set([
        ...planRows.map((r) => r.employeeId),
        ...entryRows.map((r) => r.employeeId),
      ]),
    );
  } else {
    const activeEmployees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, status: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
    capacityEmployeeIds = activeEmployees
      .filter((e) => employeeCountsTowardDefaultCapacityPool(e.status))
      .map((e) => e.id);
  }

  let weeklyCapacity = 0;
  let availableCapacity = 0;
  let plannedHours = 0;
  let actualHours = 0;
  let remainingCapacity = 0;
  let absenceHours = 0;
  let absenceEmployeeCount = 0;
  let overallocatedEmployeeCount = 0;
  let overallocationHours = 0;

  for (const id of capacityEmployeeIds) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      continue;
    }

    const capacity = await buildWeekCapacitySummary({
      employee,
      weekStart,
    });

    weeklyCapacity += capacity.weeklyCapacity;
    availableCapacity += capacity.availableCapacity;
    plannedHours += capacity.plannedHours;
    actualHours += capacity.actualHours;
    remainingCapacity += capacity.remainingCapacity;
    absenceHours += capacity.absenceHours;

    if (capacity.absenceHours > 0) {
      absenceEmployeeCount += 1;
    }
    if (capacity.overallocationHours > 0) {
      overallocatedEmployeeCount += 1;
      overallocationHours += capacity.overallocationHours;
    }
  }

  const data: DashboardResponse = {
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    employees: {
      total: employeeTotal,
      active: employeeActive,
      inactive: employeeInactive,
    },
    projects: {
      total: projectTotal,
      open: projectOpen,
      closed: projectClosed,
      withPlannedCapacity: projectsWithPlans.length,
      withActualHours: projectsWithActual.length,
    },
    absences: {
      employeeCount: absenceEmployeeCount,
      hours: absenceHours,
    },
    capacity: {
      weeklyCapacity,
      availableCapacity,
      plannedHours,
      actualHours,
      remainingCapacity,
      utilizationPercentage: calcUtilizationPercentage(
        plannedHours,
        availableCapacity,
      ),
    },
    overallocation: {
      employeeCount: overallocatedEmployeeCount,
      hours: overallocationHours,
    },
  };

  return res.status(200).json({ data });
};
