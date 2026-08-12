import { Prisma, type Employee } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  createEmployeeSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../schemas/employee.schema";
import { formatDateOnly, parseDateOnly } from "../utils/date";
import { hashPassword } from "../utils/password";

type EmployeeWithUserEmail = Employee & {
  user?: { email: string } | null;
};

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function toEmployeeResponse(employee: EmployeeWithUserEmail) {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.user?.email ?? null,
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

const employeeUserInclude = {
  user: {
    select: { email: true },
  },
} as const;

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

  if (!(await assertManagerExists(data.managerId, res))) {
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });

  if (existingUser) {
    return res.status(409).json({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account with this email already exists",
      },
    });
  }

  try {
    const { employee, user } = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
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
          createdBy: actorId,
          updatedBy: actorId,
          managerId: data.managerId ?? null,
        },
      });

      const passwordHash = await hashPassword(data.password);

      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "EMPLOYEE",
          employeeId: employee.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      return { employee, user };
    });

    return res.status(201).json({
      message: "Employee and login account created successfully",
      data: {
        employee: toEmployeeResponse({
          ...employee,
          user: { email: user.email },
        }),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : typeof target === "string"
          ? [target]
          : [];

      if (fields.some((field) => field.includes("email"))) {
        return res.status(409).json({
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "An account with this email already exists",
          },
        });
      }

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
      include: employeeUserInclude,
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
    include: employeeUserInclude,
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
      include: employeeUserInclude,
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
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.employee.findUnique({
    where: { id },
    include: employeeUserInclude,
  });

  if (!existing) {
    return res.status(404).json({ message: "Employee not found" });
  }

  // Soft-delete only (existing strategy). Linked User remains; hard-delete
  // would SetNull employeeId via FK.
  const employee = await prisma.employee.update({
    where: { id },
    data: {
      status: "INACTIVE",
      updatedBy: req.user.id,
    },
    include: employeeUserInclude,
  });

  return res.status(200).json({
    message: "Employee deactivated successfully",
    employee: toEmployeeResponse(employee),
  });
};
