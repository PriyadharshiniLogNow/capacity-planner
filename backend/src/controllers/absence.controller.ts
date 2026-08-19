import {
  Prisma,
  type Absence,
  type Employee,
  type Role,
} from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  absenceIdParamSchema,
  createAbsenceSchema,
  listAbsencesQuerySchema,
  rejectAbsenceSchema,
  updateAbsenceSchema,
} from "../schemas/absence.schema";
import type { AbsenceResponse } from "../types/absence.types";
import { formatDateOnly, parseDateOnly } from "../utils/date";

type AbsenceWithEmployee = Absence & {
  employee?: Pick<
    Employee,
    "id" | "employeeCode" | "firstName" | "lastName" | "department"
  >;
};

const employeeSelect = {
  id: true,
  employeeCode: true,
  firstName: true,
  lastName: true,
  department: true,
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

function toAbsenceResponse(absence: AbsenceWithEmployee): AbsenceResponse {
  const response: AbsenceResponse = {
    id: absence.id,
    employeeId: absence.employeeId,
    startDate: formatDateOnly(absence.startDate),
    endDate: formatDateOnly(absence.endDate),
    absenceType: absence.absenceType,
    hours: absence.hours,
    note: absence.note,
    status: absence.status,
    approvedBy: absence.approvedBy,
    approvedAt: absence.approvedAt ? absence.approvedAt.toISOString() : null,
    rejectionReason: absence.rejectionReason,
    createdAt: absence.createdAt.toISOString(),
    createdBy: absence.createdBy,
    updatedAt: absence.updatedAt.toISOString(),
    updatedBy: absence.updatedBy,
  };

  if (absence.employee) {
    response.employee = {
      id: absence.employee.id,
      employeeCode: absence.employee.employeeCode,
      firstName: absence.employee.firstName,
      lastName: absence.employee.lastName,
      department: absence.employee.department,
    };
  }

  return response;
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

function countWorkingDaysInRange(
  startDate: Date,
  endDate: Date,
  workingDays: number[],
): number {
  const working = new Set(workingDays);
  let count = 0;
  for (
    let cursor = startDate;
    cursor.getTime() <= endDate.getTime();
    cursor = addUtcDays(cursor, 1)
  ) {
    if (working.has(isoWeekday(cursor))) {
      count += 1;
    }
  }
  return count;
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

function computeAbsenceHours(
  employee: { weeklyHours: number; workingDays: number[] },
  startDate: Date,
  endDate: Date,
): number {
  const workingDayCount = countWorkingDaysInRange(
    startDate,
    endDate,
    employee.workingDays,
  );
  return dailyHoursForEmployee(employee) * workingDayCount;
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
  if (!ownEmployeeId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }

  if (ownEmployeeId !== targetEmployeeId) {
    res.status(403).json({ message: "Forbidden" });
    return false;
  }

  return true;
}

async function findOverlappingAbsence(params: {
  employeeId: string;
  startDate: Date;
  endDate: Date;
  excludeId?: string;
}): Promise<Absence | null> {
  const { employeeId, startDate, endDate, excludeId } = params;

  return prisma.absence.findFirst({
    where: {
      employeeId,
      status: { in: ["PENDING", "APPROVED"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  });
}

function isWithinEmploymentPeriod(
  employee: { startDate: Date; endDate: Date | null },
  startDate: Date,
  endDate: Date,
): boolean {
  if (startDate.getTime() < employee.startDate.getTime()) {
    return false;
  }
  if (
    employee.endDate &&
    endDate.getTime() > employee.endDate.getTime()
  ) {
    return false;
  }
  return true;
}

export const createAbsence = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createAbsenceSchema.safeParse(req.body);
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

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  if (employee.status !== "ACTIVE") {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        employeeId: ["Employee must be ACTIVE to record absences"],
      },
    });
  }

  const startDate = parseDateOnly(data.startDate);
  const endDate = parseDateOnly(data.endDate);

  if (!isWithinEmploymentPeriod(employee, startDate, endDate)) {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        startDate: [
          "Absence dates must fall within the employee's employment period",
        ],
      },
    });
  }

  const overlap = await findOverlappingAbsence({
    employeeId,
    startDate,
    endDate,
  });

  if (overlap) {
    return res.status(409).json({
      error: {
        code: "OVERLAPPING_ABSENCE",
        message: "Absence overlaps an existing absence for this employee",
      },
    });
  }

  const hours = computeAbsenceHours(employee, startDate, endDate);

  const absence = await prisma.absence.create({
    data: {
      employeeId,
      absenceType: data.absenceType,
      startDate,
      endDate,
      hours,
      note: data.note ?? null,
      status: "PENDING",
      createdBy: req.user.id,
      updatedBy: req.user.id,
    },
    include: { employee: { select: employeeSelect } },
  });

  return res.status(201).json({
    message: "Absence created successfully",
    data: toAbsenceResponse(absence),
  });
};

export const listAbsences = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = listAbsencesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { employeeId, from, to, status, page, limit } = parsed.data;
  const where: Prisma.AbsenceWhereInput = {};

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

  if (status) {
    where.status = status;
  }

  if (from || to) {
    const rangeStart = from ? parseDateOnly(from) : undefined;
    const rangeEnd = to ? parseDateOnly(to) : undefined;
    where.AND = [
      ...(rangeEnd ? [{ startDate: { lte: rangeEnd } }] : []),
      ...(rangeStart ? [{ endDate: { gte: rangeStart } }] : []),
    ];
  }

  const skip = (page - 1) * limit;

  const [total, absences] = await Promise.all([
    prisma.absence.count({ where }),
    prisma.absence.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      include: { employee: { select: employeeSelect } },
    }),
  ]);

  return res.status(200).json({
    data: absences.map(toAbsenceResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
};

export const getAbsenceById = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = absenceIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const absence = await prisma.absence.findUnique({
    where: { id: idParsed.data.id },
    include: { employee: { select: employeeSelect } },
  });

  if (!absence) {
    return res.status(404).json({ message: "Absence not found" });
  }

  if (!assertEmployeeOwnership(req, absence.employeeId, res)) {
    return;
  }

  return res.status(200).json(toAbsenceResponse(absence));
};

export const updateAbsence = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = absenceIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.absence.findUnique({
    where: { id: idParsed.data.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Absence not found" });
  }

  if (!assertEmployeeOwnership(req, existing.employeeId, res)) {
    return;
  }

  if (existing.status === "APPROVED") {
    return res.status(422).json({
      message: "Approved leave requests cannot be edited.",
    });
  }

  const parsed = updateAbsenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;
  const startDate = data.startDate
    ? parseDateOnly(data.startDate)
    : existing.startDate;
  const endDate = data.endDate
    ? parseDateOnly(data.endDate)
    : existing.endDate;

  if (endDate.getTime() < startDate.getTime()) {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        endDate: ["endDate must be greater than or equal to startDate"],
      },
    });
  }

  const employee = await prisma.employee.findUnique({
    where: { id: existing.employeeId },
  });

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  if (employee.status !== "ACTIVE") {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        employeeId: ["Employee must be ACTIVE to update absences"],
      },
    });
  }

  if (!isWithinEmploymentPeriod(employee, startDate, endDate)) {
    return res.status(422).json({
      message: "Validation failed",
      errors: {
        startDate: [
          "Absence dates must fall within the employee's employment period",
        ],
      },
    });
  }

  const overlap = await findOverlappingAbsence({
    employeeId: existing.employeeId,
    startDate,
    endDate,
    excludeId: existing.id,
  });

  if (overlap) {
    return res.status(409).json({
      error: {
        code: "OVERLAPPING_ABSENCE",
        message: "Absence overlaps an existing absence for this employee",
      },
    });
  }

  const hours = computeAbsenceHours(employee, startDate, endDate);
  const resetRejected = existing.status === "REJECTED";

  const absence = await prisma.absence.update({
    where: { id: existing.id },
    data: {
      startDate,
      endDate,
      absenceType: data.absenceType ?? existing.absenceType,
      note: data.note !== undefined ? data.note : existing.note,
      hours,
      ...(resetRejected
        ? {
            status: "PENDING" as const,
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
          }
        : {}),
      updatedBy: req.user.id,
    },
    include: { employee: { select: employeeSelect } },
  });

  return res.status(200).json(toAbsenceResponse(absence));
};

export const approveAbsence = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = absenceIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.absence.findUnique({
    where: { id: idParsed.data.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Leave request not found." });
  }

  if (existing.status === "APPROVED") {
    return res.status(422).json({
      message: "Leave request has already been approved.",
    });
  }

  if (existing.status !== "PENDING") {
    return res.status(422).json({
      message:
        existing.status === "REJECTED"
          ? "Leave request has already been rejected."
          : "Only pending leave requests can be approved.",
    });
  }

  const absence = await prisma.absence.update({
    where: { id: existing.id },
    data: {
      status: "APPROVED",
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: null,
      updatedBy: req.user.id,
    },
    include: { employee: { select: employeeSelect } },
  });

  return res.status(200).json({
    message: "Leave request approved successfully.",
    data: toAbsenceResponse(absence),
  });
};

export const rejectAbsence = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = absenceIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const parsed = rejectAbsenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const existing = await prisma.absence.findUnique({
    where: { id: idParsed.data.id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Leave request not found." });
  }

  if (existing.status === "REJECTED") {
    return res.status(422).json({
      message: "Leave request has already been rejected.",
    });
  }

  if (existing.status === "APPROVED") {
    return res.status(422).json({
      message: "Leave request has already been approved.",
    });
  }

  if (existing.status !== "PENDING") {
    return res.status(422).json({
      message: "Only pending leave requests can be rejected.",
    });
  }

  const absence = await prisma.absence.update({
    where: { id: existing.id },
    data: {
      status: "REJECTED",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: parsed.data.rejectionReason,
      updatedBy: req.user.id,
    },
    include: { employee: { select: employeeSelect } },
  });

  return res.status(200).json({
    message: "Leave request rejected successfully.",
    data: toAbsenceResponse(absence),
  });
};

export const deleteAbsence = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idParsed = absenceIdParamSchema.safeParse({
    id: paramId(req.params.id),
  });
  if (!idParsed.success) {
    return validationError(res, idParsed.error);
  }

  const existing = await prisma.absence.findUnique({
    where: { id: idParsed.data.id },
    include: { employee: { select: employeeSelect } },
  });

  if (!existing) {
    return res.status(404).json({ message: "Absence not found" });
  }

  if (!assertEmployeeOwnership(req, existing.employeeId, res)) {
    return;
  }

  await prisma.absence.delete({
    where: { id: existing.id },
  });

  return res.status(200).json({
    message: "Absence deleted successfully",
    absence: toAbsenceResponse(existing),
  });
};
