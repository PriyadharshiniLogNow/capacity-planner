import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { toEmployeeResponse } from "../lib/employeeMapper";
import {
  isDirectCircularSupervision,
  isInactiveSupervisorSelection,
  isSelfSupervision,
  isSupervisorRequired,
  SUPERVISOR_MESSAGES,
} from "../lib/supervisorPolicy";
import {
  employeeEmailConflictBody,
  employeeIdConflictBody,
  isPrismaUniqueConstraintError,
  uniqueConstraintIncludes,
} from "../lib/uniqueConstraint";
import { prisma } from "../lib/prisma";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import { parseDateOnly } from "../utils/date";

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function fieldError(res: Response, field: string, message: string) {
  return res.status(422).json({
    message: "Validation failed",
    errors: {
      formErrors: [] as string[],
      fieldErrors: { [field]: [message] },
    },
  });
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

const employeeListInclude = {
  supervisor: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

async function assertValidSupervisor(
  params: {
    employeeId?: string;
    supervisorId: string | null;
    currentSupervisorId?: string | null;
  },
  res: Response,
): Promise<boolean> {
  const { employeeId, supervisorId, currentSupervisorId } = params;

  const eligibleCount = await prisma.employee.count({
    where: {
      status: "ACTIVE",
      ...(employeeId ? { id: { not: employeeId } } : {}),
    },
  });

  if (!supervisorId) {
    if (isSupervisorRequired(eligibleCount)) {
      fieldError(res, "supervisorId", SUPERVISOR_MESSAGES.required);
      return false;
    }
    return true;
  }

  if (isSelfSupervision(employeeId, supervisorId)) {
    fieldError(res, "supervisorId", SUPERVISOR_MESSAGES.self);
    return false;
  }

  const supervisor = await prisma.employee.findUnique({
    where: { id: supervisorId },
    select: { id: true, status: true, supervisorId: true },
  });

  if (!supervisor) {
    res.status(404).json({ message: SUPERVISOR_MESSAGES.notFound });
    return false;
  }

  if (isDirectCircularSupervision(employeeId, supervisor.supervisorId)) {
    fieldError(res, "supervisorId", SUPERVISOR_MESSAGES.circular);
    return false;
  }

  if (
    isInactiveSupervisorSelection({
      supervisorStatus: supervisor.status,
      selectedSupervisorId: supervisorId,
      currentSupervisorId,
    })
  ) {
    fieldError(res, "supervisorId", SUPERVISOR_MESSAGES.inactive);
    return false;
  }

  return true;
}

function duplicateEmployeeId(res: Response) {
  return res.status(409).json(employeeIdConflictBody());
}

function duplicateEmail(res: Response) {
  return res.status(409).json(employeeEmailConflictBody());
}

export const createEmployee = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;
  const actorId = req.user.id;

  if (
    !(await assertValidSupervisor(
      { supervisorId: data.supervisorId },
      res,
    ))
  ) {
    return;
  }

  const existingEmail = await prisma.employee.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existingEmail) {
    return duplicateEmail(res);
  }

  try {
    const created = await prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        department: data.department,
        weeklyHours: data.weeklyHours,
        workingDays: data.workingDays,
        startDate: parseDateOnly(data.startDate),
        endDate: data.endDate ? parseDateOnly(data.endDate) : null,
        status: data.status,
        createdBy: actorId,
        updatedBy: actorId,
        supervisorId: data.supervisorId,
      },
      include: employeeListInclude,
    });

    return res.status(201).json({
      message: "Employee created successfully",
      data: {
        employee: toEmployeeResponse(created),
      },
    });
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      if (uniqueConstraintIncludes(error, "email")) {
        return duplicateEmail(res);
      }
      return duplicateEmployeeId(res);
    }
    throw error;
  }
};

export const listEmployees = async (req: Request, res: Response) => {
  const parsed = listEmployeesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { status, department, search, page, limit } = parsed.data;
  const where: Prisma.EmployeeWhereInput = {};

  if (status) {
    where.status = status;
  }
  if (department) {
    where.department = department;
  }
  if (search) {
    where.OR = [
      { employeeCode: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, employees] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      include: employeeListInclude,
    }),
  ]);

  return res.status(200).json({
    data: employees.map((employee) => toEmployeeResponse(employee)),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
};

export const getEmployeeById = async (req: Request, res: Response) => {
  const id = paramId(req.params.id);

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: employeeListInclude,
  });

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  return res.status(200).json(toEmployeeResponse(employee));
};

export const updateEmployee = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const parsed = updateEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;

  if (
    !(await assertValidSupervisor(
      {
        employeeId: id,
        supervisorId: data.supervisorId,
        currentSupervisorId: existing.supervisorId,
      },
      res,
    ))
  ) {
    return;
  }

  if (data.employeeCode !== existing.employeeCode) {
    const conflict = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode },
      select: { id: true },
    });
    if (conflict) {
      return duplicateEmployeeId(res);
    }
  }

  if (data.email !== existing.email) {
    const conflict = await prisma.employee.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (conflict) {
      return duplicateEmail(res);
    }
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        department: data.department,
        weeklyHours: data.weeklyHours,
        workingDays: data.workingDays,
        startDate: parseDateOnly(data.startDate),
        endDate: data.endDate ? parseDateOnly(data.endDate) : null,
        status: data.status,
        updatedBy: req.user.id,
        supervisorId: data.supervisorId,
      },
      include: employeeListInclude,
    });

    return res.status(200).json(toEmployeeResponse(employee));
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      if (uniqueConstraintIncludes(error, "email")) {
        return duplicateEmail(res);
      }
      return duplicateEmployeeId(res);
    }
    throw error;
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.employee.findUnique({
    where: { id },
    include: employeeListInclude,
  });

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  // Soft-delete only. Historical assignments and time entries are kept.
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      status: "INACTIVE",
      updatedBy: req.user.id,
    },
    include: employeeListInclude,
  });

  return res.status(200).json({
    message: "Employee deactivated successfully",
    employee: toEmployeeResponse(employee),
  });
};
