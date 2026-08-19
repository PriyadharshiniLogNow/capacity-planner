import {
  Prisma,
  type Employee,
  type Project,
  type Role,
  type TimeEntry,
} from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  createTimeEntrySchema,
  listTimeEntriesQuerySchema,
  timeEntryIdParamSchema,
  updateTimeEntrySchema,
} from "../schemas/timeEntry.schema";
import type { TimeEntryResponse } from "../types/timeEntry.types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

type TimeEntryWithRelations = TimeEntry & {
  employee?: Pick<
    Employee,
    "id" | "employeeCode" | "firstName" | "lastName" | "department"
  >;
  project?: Pick<Project, "id" | "projectCode" | "name" | "status">;
};

const employeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  department: true,
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

function toTimeEntryResponse(entry: TimeEntryWithRelations): TimeEntryResponse {
  const response: TimeEntryResponse = {
    id: entry.id,
    employeeId: entry.employeeId,
    projectId: entry.projectId,
    entryDate: formatDateOnly(entry.entryDate),
    actualHours: entry.actualHours,
    timeCategory: entry.timeCategory,
    comment: entry.comment,
    createdAt: entry.createdAt.toISOString(),
    createdBy: entry.createdBy,
    updatedAt: entry.updatedAt.toISOString(),
    updatedBy: entry.updatedBy,
  };

  if (entry.employee) {
    response.employee = {
      id: entry.employee.id,
      employeeCode: entry.employee.employeeCode,
      firstName: entry.employee.firstName,
      lastName: entry.employee.lastName,
      department: entry.employee.department,
    };
  }

  if (entry.project) {
    response.project = {
      id: entry.project.id,
      projectCode: entry.project.projectCode,
      name: entry.project.name,
      status: entry.project.status,
    };
  }

  return response;
}

/** ISO weekday 1=Mon .. 7=Sun from a UTC date-only Date. */
function isoWeekday(date: Date): number {
  const jsDay = date.getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
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

function isWithinEmploymentPeriod(
  employee: { startDate: Date; endDate: Date | null },
  entryDate: Date,
): boolean {
  if (entryDate.getTime() < employee.startDate.getTime()) {
    return false;
  }
  if (employee.endDate && entryDate.getTime() > employee.endDate.getTime()) {
    return false;
  }
  return true;
}

function isWithinProjectPeriod(
  project: { startDate: Date; endDate: Date },
  entryDate: Date,
): boolean {
  return (
    entryDate.getTime() >= project.startDate.getTime() &&
    entryDate.getTime() <= project.endDate.getTime()
  );
}

async function findCoveringAbsence(
  employeeId: string,
  entryDate: Date,
): Promise<{ id: string; hours: number } | null> {
  return prisma.absence.findFirst({
    where: {
      employeeId,
      status: "APPROVED",
      startDate: { lte: entryDate },
      endDate: { gte: entryDate },
    },
    select: { id: true, hours: true },
  });
}

async function sumActualHoursForDay(params: {
  employeeId: string;
  entryDate: Date;
  excludeId?: string;
}): Promise<number> {
  const { employeeId, entryDate, excludeId } = params;
  const aggregate = await prisma.timeEntry.aggregate({
    where: {
      employeeId,
      entryDate,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    _sum: { actualHours: true },
  });
  return aggregate._sum.actualHours ?? 0;
}

type ValidationOk = { ok: true };
type ValidationFail = { ok: false };

async function validateTimeEntryRules(params: {
  employeeId: string;
  projectId: string;
  entryDate: Date;
  actualHours: number;
  excludeId?: string;
  res: Response;
}): Promise<ValidationOk | ValidationFail> {
  const { employeeId, projectId, entryDate, actualHours, excludeId, res } =
    params;

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
        code: "INVALID_TIME_ENTRY_DATE",
        message: "Employee must be ACTIVE to log time",
      },
    });
    return { ok: false };
  }

  if (!isWithinEmploymentPeriod(employee, entryDate)) {
    res.status(422).json({
      error: {
        code: "INVALID_TIME_ENTRY_DATE",
        message:
          "Time entry date must fall within the employee's employment period",
      },
    });
    return { ok: false };
  }

  if (project.status !== "OPEN") {
    res.status(422).json({
      error: {
        code: "INVALID_TIME_ENTRY_DATE",
        message: "Time entries can only be logged against OPEN projects",
      },
    });
    return { ok: false };
  }

  if (!isWithinProjectPeriod(project, entryDate)) {
    res.status(422).json({
      error: {
        code: "INVALID_TIME_ENTRY_DATE",
        message: "Time entry date must fall within the project date range",
      },
    });
    return { ok: false };
  }

  if (!employee.workingDays.includes(isoWeekday(entryDate))) {
    res.status(422).json({
      error: {
        code: "NON_WORKING_DAY",
        message: "Time entries are not allowed on non-working days",
      },
    });
    return { ok: false };
  }

  const absence = await findCoveringAbsence(employeeId, entryDate);
  if (absence) {
    res.status(409).json({
      error: {
        code: "EMPLOYEE_ABSENT",
        message: "Employee is absent on this date; time entry is not allowed",
      },
    });
    return { ok: false };
  }

  const dailyCapacity = dailyHoursForEmployee(employee);
  if (dailyCapacity <= 0) {
    res.status(422).json({
      error: {
        code: "INVALID_HOURS",
        message: "Employee has no daily working capacity configured",
      },
    });
    return { ok: false };
  }

  if (actualHours > dailyCapacity) {
    res.status(422).json({
      error: {
        code: "INVALID_HOURS",
        message: `actualHours must not exceed daily capacity of ${dailyCapacity}`,
      },
    });
    return { ok: false };
  }

  const existingHours = await sumActualHoursForDay({
    employeeId,
    entryDate,
    excludeId,
  });
  const totalHours = existingHours + actualHours;

  if (totalHours > dailyCapacity) {
    res.status(422).json({
      error: {
        code: "INVALID_HOURS",
        message: `Total actual hours for the day (${totalHours}) would exceed daily capacity of ${dailyCapacity}`,
      },
    });
    return { ok: false };
  }

  return { ok: true };
}

export const createTimeEntry = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createTimeEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;
  let employeeId = data.employeeId;

  if (actorRole(req) === "EMPLOYEE") {
    const ownEmployeeId = actorEmployeeId(req);
    if (!ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (data.employeeId !== ownEmployeeId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    employeeId = ownEmployeeId;
  }

  const entryDate = parseDateOnly(data.entryDate);

  const validation = await validateTimeEntryRules({
    employeeId,
    projectId: data.projectId,
    entryDate,
    actualHours: data.actualHours,
    res,
  });
  if (!validation.ok) {
    return;
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      employeeId,
      projectId: data.projectId,
      entryDate,
      actualHours: data.actualHours,
      timeCategory: data.timeCategory,
      comment: data.comment ?? null,
      createdBy: req.user.id,
      updatedBy: req.user.id,
    },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  return res.status(201).json({
    message: "Time entry created successfully",
    data: toTimeEntryResponse(timeEntry),
  });
};

export const listTimeEntries = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listTimeEntriesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { employeeId, projectId, from, to, page, limit } = parsed.data;
  const where: Prisma.TimeEntryWhereInput = {};

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

  if (from || to) {
    where.entryDate = {
      ...(from ? { gte: parseDateOnly(from) } : {}),
      ...(to ? { lte: parseDateOnly(to) } : {}),
    };
  }

  const skip = (page - 1) * limit;

  const [total, entries] = await Promise.all([
    prisma.timeEntry.count({ where }),
    prisma.timeEntry.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
      include: {
        employee: { select: employeeSelect },
        project: { select: projectSelect },
      },
    }),
  ]);

  return res.status(200).json({
    data: entries.map(toTimeEntryResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
};

export const getTimeEntryById = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = timeEntryIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const timeEntry = await prisma.timeEntry.findUnique({
    where: { id: idParsed.data.id },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  if (!timeEntry) {
    return res.status(404).json({
      error: {
        code: "TIME_ENTRY_NOT_FOUND",
        message: "Time entry not found",
      },
    });
  }

  if (!assertEmployeeOwnership(req, timeEntry.employeeId, res)) {
    return;
  }

  return res.status(200).json(toTimeEntryResponse(timeEntry));
};

export const updateTimeEntry = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = timeEntryIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.timeEntry.findUnique({
    where: { id: idParsed.data.id },
  });

  if (!existing) {
    return res.status(404).json({
      error: {
        code: "TIME_ENTRY_NOT_FOUND",
        message: "Time entry not found",
      },
    });
  }

  if (!assertEmployeeOwnership(req, existing.employeeId, res)) {
    return;
  }

  const parsed = updateTimeEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;
  const projectId = data.projectId ?? existing.projectId;
  const entryDate = data.entryDate
    ? parseDateOnly(data.entryDate)
    : existing.entryDate;
  const actualHours = data.actualHours ?? existing.actualHours;

  const validation = await validateTimeEntryRules({
    employeeId: existing.employeeId,
    projectId,
    entryDate,
    actualHours,
    excludeId: existing.id,
    res,
  });
  if (!validation.ok) {
    return;
  }

  const timeEntry = await prisma.timeEntry.update({
    where: { id: existing.id },
    data: {
      projectId,
      entryDate,
      actualHours,
      timeCategory: data.timeCategory ?? existing.timeCategory,
      comment: data.comment !== undefined ? data.comment : existing.comment,
      updatedBy: req.user.id,
    },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  return res.status(200).json(toTimeEntryResponse(timeEntry));
};

export const deleteTimeEntry = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = timeEntryIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.timeEntry.findUnique({
    where: { id: idParsed.data.id },
    include: {
      employee: { select: employeeSelect },
      project: { select: projectSelect },
    },
  });

  if (!existing) {
    return res.status(404).json({
      error: {
        code: "TIME_ENTRY_NOT_FOUND",
        message: "Time entry not found",
      },
    });
  }

  if (!assertEmployeeOwnership(req, existing.employeeId, res)) {
    return;
  }

  await prisma.timeEntry.delete({
    where: { id: existing.id },
  });

  return res.status(200).json({
    message: "Time entry deleted successfully",
    timeEntry: toTimeEntryResponse(existing),
  });
};
