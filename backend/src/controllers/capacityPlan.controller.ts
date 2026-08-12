import {
  Prisma,
  type CapacityPlan,
  type Employee,
  type Project,
  type Role,
} from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  capacityPlanIdParamSchema,
  copyWeekSchema,
  createCapacityPlanSchema,
  listCapacityPlansQuerySchema,
  updateCapacityPlanSchema,
} from "../schemas/capacityPlan.schema";
import type {
  CapacityPlanResponse,
  WeekCapacitySummary,
} from "../types/capacityPlan.types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

type PlanWithRelations = CapacityPlan & {
  employee?: Pick<
    Employee,
    | "id"
    | "employeeCode"
    | "firstName"
    | "lastName"
    | "department"
    | "weeklyHours"
    | "workingDays"
  >;
  project?: Pick<Project, "id" | "projectCode" | "name" | "status">;
};

const employeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  department: true,
  weeklyHours: true,
  workingDays: true,
} as const;

const projectSelect = {
  id: true,
  projectCode: true,
  name: true,
  status: true,
} as const;

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

/** ISO weekday 1=Mon .. 7=Sun from a UTC date-only Date. */
function isoWeekday(date: Date): number {
  const jsDay = date.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function weekEndFromStart(weekStart: Date): Date {
  return addUtcDays(weekStart, 6);
}

export function assertMonday(weekStart: Date, res: Response): boolean {
  if (isoWeekday(weekStart) !== 1) {
    res.status(422).json({
      error: {
        code: "INVALID_WEEK",
        message: "weekStart must be a Monday (YYYY-MM-DD)",
      },
    });
    return false;
  }
  return true;
}

function dailyHoursForEmployee(employee: {
  weeklyHours: number;
  workingDays: number[];
}): number {
  if (employee.workingDays.length === 0) {
    return 0;
  }
  return employee.weeklyHours / employee.workingDays.length;
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

function toCapacityPlanResponse(
  plan: PlanWithRelations,
  capacity?: WeekCapacitySummary,
): CapacityPlanResponse {
  const response: CapacityPlanResponse = {
    id: plan.id,
    employeeId: plan.employeeId,
    projectId: plan.projectId,
    weekStart: formatDateOnly(plan.planDate),
    plannedHours: plan.plannedHours,
    createdAt: plan.createdAt.toISOString(),
    createdBy: plan.createdBy,
    updatedAt: plan.updatedAt.toISOString(),
    updatedBy: plan.updatedBy,
  };

  if (plan.employee) {
    response.employee = {
      id: plan.employee.id,
      employeeCode: plan.employee.employeeCode,
      firstName: plan.employee.firstName,
      lastName: plan.employee.lastName,
      department: plan.employee.department,
      weeklyHours: plan.employee.weeklyHours,
      workingDays: plan.employee.workingDays,
    };
  }

  if (plan.project) {
    response.project = {
      id: plan.project.id,
      projectCode: plan.project.projectCode,
      name: plan.project.name,
      status: plan.project.status,
    };
  }

  if (capacity) {
    response.capacity = capacity;
  }

  return response;
}

function dateInRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() <= bEnd.getTime() && bStart.getTime() <= aEnd.getTime();
}

/**
 * Weekly contract capacity for the planning week (working days only,
 * clipped to employment period). Non-working days contribute 0.
 */
function computeWeeklyCapacity(
  employee: {
    weeklyHours: number;
    workingDays: number[];
    startDate: Date;
    endDate: Date | null;
  },
  weekStart: Date,
): number {
  const daily = dailyHoursForEmployee(employee);
  if (daily <= 0) {
    return 0;
  }

  const working = new Set(employee.workingDays);
  const weekEnd = weekEndFromStart(weekStart);
  let hours = 0;

  for (
    let cursor = weekStart;
    cursor.getTime() <= weekEnd.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    if (!working.has(isoWeekday(cursor))) {
      continue;
    }
    if (cursor.getTime() < employee.startDate.getTime()) {
      continue;
    }
    if (employee.endDate && cursor.getTime() > employee.endDate.getTime()) {
      continue;
    }
    hours += daily;
  }

  return hours;
}

/**
 * Absence hours for working days in the week only.
 * Full-day absence on a working day deducts one daily capacity unit.
 */
function computeAbsenceHoursForWeek(
  employee: { weeklyHours: number; workingDays: number[] },
  weekStart: Date,
  absences: Array<{ startDate: Date; endDate: Date }>,
): number {
  const daily = dailyHoursForEmployee(employee);
  if (daily <= 0 || absences.length === 0) {
    return 0;
  }

  const working = new Set(employee.workingDays);
  const weekEnd = weekEndFromStart(weekStart);
  let hours = 0;

  for (
    let cursor = weekStart;
    cursor.getTime() <= weekEnd.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    if (!working.has(isoWeekday(cursor))) {
      continue;
    }
    const absent = absences.some((a) =>
      dateInRange(cursor, a.startDate, a.endDate),
    );
    if (absent) {
      hours += daily;
    }
  }

  return hours;
}

export async function buildWeekCapacitySummary(params: {
  employee: {
    id: string;
    weeklyHours: number;
    workingDays: number[];
    startDate: Date;
    endDate: Date | null;
  };
  weekStart: Date;
  excludePlanId?: string;
  extraPlannedHours?: number;
}): Promise<WeekCapacitySummary> {
  const { employee, weekStart, excludePlanId, extraPlannedHours } = params;
  const weekEnd = weekEndFromStart(weekStart);

  const [absences, plannedAgg, actualAgg] = await Promise.all([
    prisma.absence.findMany({
      where: {
        employeeId: employee.id,
        startDate: { lte: weekEnd },
        endDate: { gte: weekStart },
      },
      select: { startDate: true, endDate: true },
    }),
    prisma.capacityPlan.aggregate({
      where: {
        employeeId: employee.id,
        planDate: weekStart,
        ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
      },
      _sum: { plannedHours: true },
    }),
    prisma.timeEntry.aggregate({
      where: {
        employeeId: employee.id,
        entryDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      _sum: { actualHours: true },
    }),
  ]);

  const weeklyCapacity = computeWeeklyCapacity(employee, weekStart);
  const absenceHours = computeAbsenceHoursForWeek(
    employee,
    weekStart,
    absences,
  );
  const availableCapacity = Math.max(0, weeklyCapacity - absenceHours);
  const plannedHours =
    (plannedAgg._sum.plannedHours ?? 0) + (extraPlannedHours ?? 0);
  const actualHours = actualAgg._sum.actualHours ?? 0;
  const remainingCapacity = availableCapacity - plannedHours;
  const overallocationHours = Math.max(0, -remainingCapacity);

  return {
    employeeId: employee.id,
    weekStart: formatDateOnly(weekStart),
    weekEnd: formatDateOnly(weekEnd),
    weeklyCapacity,
    absenceHours,
    availableCapacity,
    plannedHours,
    actualHours,
    remainingCapacity,
    overallocationHours,
  };
}

type ValidationOk = { ok: true; employee: Employee; project: Project };
type ValidationFail = { ok: false };

async function validateCapacityPlanRules(params: {
  employeeId: string;
  projectId: string;
  weekStart: Date;
  plannedHours: number;
  excludePlanId?: string;
  res: Response;
  /** When true, reject if this plan would over-allocate the week. */
  rejectOverallocation?: boolean;
}): Promise<ValidationOk | ValidationFail> {
  const {
    employeeId,
    projectId,
    weekStart,
    plannedHours,
    excludePlanId,
    res,
    rejectOverallocation = true,
  } = params;

  if (!assertMonday(weekStart, res)) {
    return { ok: false };
  }

  const weekEnd = weekEndFromStart(weekStart);

  const [employee, project] = await Promise.all([
    prisma.employee.findUnique({ where: { id: employeeId } }),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);

  if (!employee) {
    res.status(404).json({
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      },
    });
    return { ok: false };
  }

  if (!project) {
    res.status(404).json({
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found",
      },
    });
    return { ok: false };
  }

  if (employee.status !== "ACTIVE") {
    res.status(422).json({
      error: {
        code: "EMPLOYEE_OUTSIDE_PLANNING_PERIOD",
        message: "Employee must be ACTIVE for capacity planning",
      },
    });
    return { ok: false };
  }

  if (employee.workingDays.length === 0 || employee.weeklyHours <= 0) {
    res.status(422).json({
      error: {
        code: "INVALID_PLANNED_HOURS",
        message: "Employee has no weekly working capacity configured",
      },
    });
    return { ok: false };
  }

  const employmentEnd = employee.endDate ?? weekEnd;
  if (
    !rangesOverlap(
      weekStart,
      weekEnd,
      employee.startDate,
      employmentEnd,
    )
  ) {
    res.status(422).json({
      error: {
        code: "EMPLOYEE_OUTSIDE_PLANNING_PERIOD",
        message: "Planning week is outside the employee's employment period",
      },
    });
    return { ok: false };
  }

  if (project.status !== "OPEN") {
    res.status(422).json({
      error: {
        code: "PROJECT_OUTSIDE_PLANNING_PERIOD",
        message: "Capacity plans can only be created for OPEN projects",
      },
    });
    return { ok: false };
  }

  if (
    !rangesOverlap(weekStart, weekEnd, project.startDate, project.endDate)
  ) {
    res.status(422).json({
      error: {
        code: "PROJECT_OUTSIDE_PLANNING_PERIOD",
        message: "Planning week is outside the project date range",
      },
    });
    return { ok: false };
  }

  if (plannedHours < 0) {
    res.status(422).json({
      error: {
        code: "INVALID_PLANNED_HOURS",
        message: "plannedHours must be greater than or equal to 0",
      },
    });
    return { ok: false };
  }

  const capacity = await buildWeekCapacitySummary({
    employee,
    weekStart,
    excludePlanId,
    extraPlannedHours: plannedHours,
  });

  if (rejectOverallocation && capacity.overallocationHours > 0) {
    res.status(409).json({
      error: {
        code: "OVER_CAPACITY",
        message: `Planned hours exceed available capacity by ${capacity.overallocationHours}`,
      },
      capacity,
    });
    return { ok: false };
  }

  return { ok: true, employee, project };
}

export const createCapacityPlan = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createCapacityPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;

  if (actorRole(req) === "EMPLOYEE") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const weekStart = parseDateOnly(data.weekStart);

  const validation = await validateCapacityPlanRules({
    employeeId: data.employeeId,
    projectId: data.projectId,
    weekStart,
    plannedHours: data.plannedHours,
    res,
  });
  if (!validation.ok) {
    return;
  }

  try {
    const plan = await prisma.capacityPlan.create({
      data: {
        employeeId: data.employeeId,
        projectId: data.projectId,
        planDate: weekStart,
        plannedHours: data.plannedHours,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      include: {
        employee: { select: employeeSelect },
        project: { select: projectSelect },
      },
    });

    const capacity = await buildWeekCapacitySummary({
      employee: validation.employee,
      weekStart,
    });

    return res.status(201).json({
      message: "Capacity plan created successfully",
      data: toCapacityPlanResponse(plan, capacity),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: {
          code: "CAPACITY_PLAN_ALREADY_EXISTS",
          message:
            "A capacity plan already exists for this employee, project, and week",
        },
      });
    }
    throw error;
  }
};

export const listCapacityPlans = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listCapacityPlansQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { employeeId, projectId, weekStart, page, limit } = parsed.data;
  const where: Prisma.CapacityPlanWhereInput = {};

  if (actorRole(req) === "EMPLOYEE") {
    const ownEmployeeId = actorEmployeeId(req);
    if (!ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (employeeId && employeeId !== ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    where.employeeId = ownEmployeeId;
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  let weekStartDate: Date | undefined;
  if (weekStart) {
    weekStartDate = parseDateOnly(weekStart);
    if (!assertMonday(weekStartDate, res)) {
      return;
    }
    where.planDate = weekStartDate;
  }

  const skip = (page - 1) * limit;

  const [total, plans] = await Promise.all([
    prisma.capacityPlan.count({ where }),
    prisma.capacityPlan.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ planDate: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { select: employeeSelect },
        project: { select: projectSelect },
      },
    }),
  ]);

  let capacity: WeekCapacitySummary | undefined;
  const summaryEmployeeId =
    actorRole(req) === "EMPLOYEE"
      ? actorEmployeeId(req)
      : employeeId;

  if (summaryEmployeeId && weekStartDate) {
    const employee = await prisma.employee.findUnique({
      where: { id: summaryEmployeeId },
    });
    if (employee) {
      capacity = await buildWeekCapacitySummary({
        employee,
        weekStart: weekStartDate,
      });
    }
  }

  return res.status(200).json({
    data: plans.map((plan) => toCapacityPlanResponse(plan)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
    ...(capacity ? { capacity } : {}),
  });
};

export const getCapacityPlanById = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = capacityPlanIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const plan = await prisma.capacityPlan.findUnique({
    where: { id: idParsed.data.id },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  if (!plan) {
    return res.status(404).json({
      error: {
        code: "CAPACITY_PLAN_NOT_FOUND",
        message: "Capacity plan not found",
      },
    });
  }

  if (!assertEmployeeOwnership(req, plan.employeeId, res)) {
    return;
  }

  const employee = await prisma.employee.findUnique({
    where: { id: plan.employeeId },
  });

  const capacity = employee
    ? await buildWeekCapacitySummary({
        employee,
        weekStart: plan.planDate,
      })
    : undefined;

  return res.status(200).json(toCapacityPlanResponse(plan, capacity));
};

export const updateCapacityPlan = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (actorRole(req) === "EMPLOYEE") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const idParsed = capacityPlanIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.capacityPlan.findUnique({
    where: { id: idParsed.data.id },
  });

  if (!existing) {
    return res.status(404).json({
      error: {
        code: "CAPACITY_PLAN_NOT_FOUND",
        message: "Capacity plan not found",
      },
    });
  }

  const parsed = updateCapacityPlanSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;
  const projectId = data.projectId ?? existing.projectId;
  const weekStart = data.weekStart
    ? parseDateOnly(data.weekStart)
    : existing.planDate;
  const plannedHours = data.plannedHours ?? existing.plannedHours;

  const validation = await validateCapacityPlanRules({
    employeeId: existing.employeeId,
    projectId,
    weekStart,
    plannedHours,
    excludePlanId: existing.id,
    res,
  });
  if (!validation.ok) {
    return;
  }

  try {
    const plan = await prisma.capacityPlan.update({
      where: { id: existing.id },
      data: {
        projectId,
        planDate: weekStart,
        plannedHours,
        updatedBy: req.user.id,
      },
      include: {
        employee: { select: employeeSelect },
        project: { select: projectSelect },
      },
    });

    const capacity = await buildWeekCapacitySummary({
      employee: validation.employee,
      weekStart,
    });

    return res.status(200).json(toCapacityPlanResponse(plan, capacity));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        error: {
          code: "CAPACITY_PLAN_ALREADY_EXISTS",
          message:
            "A capacity plan already exists for this employee, project, and week",
        },
      });
    }
    throw error;
  }
};

export const deleteCapacityPlan = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (actorRole(req) === "EMPLOYEE") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const idParsed = capacityPlanIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.capacityPlan.findUnique({
    where: { id: idParsed.data.id },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: {
        code: "CAPACITY_PLAN_NOT_FOUND",
        message: "Capacity plan not found",
      },
    });
  }

  await prisma.capacityPlan.delete({
    where: { id: existing.id },
  });

  return res.status(200).json({
    message: "Capacity plan deleted successfully",
    capacityPlan: toCapacityPlanResponse(existing),
  });
};

export const copyWeek = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (actorRole(req) !== "ADMIN") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const parsed = copyWeekSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const sourceWeekStart = parseDateOnly(parsed.data.sourceWeekStart);
  const targetWeekStart = parseDateOnly(parsed.data.targetWeekStart);

  if (!assertMonday(sourceWeekStart, res)) {
    return;
  }
  if (!assertMonday(targetWeekStart, res)) {
    return;
  }

  const sourcePlans = await prisma.capacityPlan.findMany({
    where: {
      planDate: sourceWeekStart,
      ...(parsed.data.employeeId
        ? { employeeId: parsed.data.employeeId }
        : {}),
    },
    orderBy: [{ employeeId: "asc" }, { projectId: "asc" }],
  });

  const copied: CapacityPlanResponse[] = [];
  let skipped = 0;

  for (const source of sourcePlans) {
    const existingTarget = await prisma.capacityPlan.findUnique({
      where: {
        employeeId_projectId_planDate: {
          employeeId: source.employeeId,
          projectId: source.projectId,
          planDate: targetWeekStart,
        },
      },
      select: { id: true },
    });

    if (existingTarget) {
      skipped += 1;
      continue;
    }

    // Soft-validate without writing an HTTP error for each skip path.
    const employee = await prisma.employee.findUnique({
      where: { id: source.employeeId },
    });
    const project = await prisma.project.findUnique({
      where: { id: source.projectId },
    });

    if (!employee || !project || employee.status !== "ACTIVE") {
      skipped += 1;
      continue;
    }

    const weekEnd = weekEndFromStart(targetWeekStart);
    const employmentEnd = employee.endDate ?? weekEnd;
    if (
      !rangesOverlap(
        targetWeekStart,
        weekEnd,
        employee.startDate,
        employmentEnd,
      ) ||
      !rangesOverlap(
        targetWeekStart,
        weekEnd,
        project.startDate,
        project.endDate,
      ) ||
      project.status !== "OPEN"
    ) {
      skipped += 1;
      continue;
    }

    const capacityPreview = await buildWeekCapacitySummary({
      employee,
      weekStart: targetWeekStart,
      extraPlannedHours: source.plannedHours,
    });

    if (capacityPreview.overallocationHours > 0) {
      skipped += 1;
      continue;
    }

    const plan = await prisma.capacityPlan.create({
      data: {
        employeeId: source.employeeId,
        projectId: source.projectId,
        planDate: targetWeekStart,
        plannedHours: source.plannedHours,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      include: {
        employee: { select: employeeSelect },
        project: { select: projectSelect },
      },
    });

    const capacity = await buildWeekCapacitySummary({
      employee,
      weekStart: targetWeekStart,
    });

    copied.push(toCapacityPlanResponse(plan, capacity));
  }

  return res.status(201).json({
    message: "Capacity plans copied successfully",
    sourceWeekStart: formatDateOnly(sourceWeekStart),
    targetWeekStart: formatDateOnly(targetWeekStart),
    copied: copied.length,
    skipped,
    data: copied,
  });
};
