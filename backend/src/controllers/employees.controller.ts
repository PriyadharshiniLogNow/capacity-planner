import { Prisma, type Employee } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import type { EmployeeBody } from "../types/employee.type";
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

function toEmployeeResponse(employee: Employee) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    role: employee.role,
    department: employee.department,
    managerId: employee.managerId,
    weeklyHours: employee.weeklyHours,
    workingDays: employee.workingDays,
    startDate: formatDateOnly(employee.startDate),
    endDate: employee.endDate ? formatDateOnly(employee.endDate) : null,
    status: employee.status,
    createdAt: employee.createdAt.toISOString(),
    createdBy: employee.createdBy,
    updatedAt: employee.updatedAt.toISOString(),
    updatedBy: employee.updatedBy,
  };
}

async function assertManagerExists(
  managerId: string | null | undefined,
  res: Response,
): Promise<boolean> {
  if (!managerId) {
    return true;
  }

  const manager = await prisma.employee.findUnique({
    where: { id: managerId },
    select: { id: true },
  });

  if (!manager) {
    res.status(404).json({ message: "Manager not found" });
    return false;
  }

  return true;
}

function toCreateData(data: EmployeeBody, actorId: string) {
  return {
    employeeCode: data.employeeCode,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    department: data.department,
    weeklyHours: data.weeklyHours,
    workingDays: data.workingDays,
    startDate: parseDateOnly(data.startDate),
    endDate: data.endDate ? parseDateOnly(data.endDate) : null,
    status: data.status,
    createdBy: actorId,
    updatedBy: actorId,
    managerId: data.managerId ?? null,
  };
}

export const createEmployee = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = createEmployeeSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;

  if (!(await assertManagerExists(data.managerId, res))) {
    return;
  }

  try {
    const employee = await prisma.employee.create({
      data: toCreateData(data, req.user.id),
    });

    return res.status(201).json(toEmployeeResponse(employee));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "employeeCode already exists" });
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
    }),
  ]);

  return res.status(200).json({
    data: employees.map(toEmployeeResponse),
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
  });

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  return res.status(200).json(toEmployeeResponse(employee));
};

export const updateEmployee = async (req: Request, res: Response) => {
  if (!req.user) {
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

  if (data.managerId && data.managerId === id) {
    return res.status(422).json({
      message: "Validation failed",
      errors: { managerId: ["managerId cannot equal the employee id"] },
    });
  }

  if (!(await assertManagerExists(data.managerId, res))) {
    return;
  }

  if (data.employeeCode !== existing.employeeCode) {
    const conflict = await prisma.employee.findUnique({
      where: { employeeCode: data.employeeCode },
      select: { id: true },
    });
    if (conflict) {
      return res.status(409).json({ message: "employeeCode already exists" });
    }
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        department: data.department,
        weeklyHours: data.weeklyHours,
        workingDays: data.workingDays,
        startDate: parseDateOnly(data.startDate),
        endDate: data.endDate ? parseDateOnly(data.endDate) : null,
        status: data.status,
        updatedBy: req.user.id,
        managerId: data.managerId ?? null,
      },
    });

    return res.status(200).json(toEmployeeResponse(employee));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "employeeCode already exists" });
    }
    throw error;
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      status: "INACTIVE",
      updatedBy: req.user.id,
    },
  });

  return res.status(200).json({
    message: "Employee deactivated successfully",
    employee: toEmployeeResponse(employee),
  });
};
