import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { conflict, notFound, validationError } from "../../lib/errors";
import { parseDateOnly } from "../../utils/date";
import { serializeEmployee } from "./employees.serializer";
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from "../../schemas/employee";

async function assertManagerExists(
  managerId: string | null | undefined,
): Promise<void> {
  if (!managerId) return;
  const manager = await prisma.employee.findUnique({
    where: { id: managerId },
    select: { id: true },
  });
  if (!manager) {
    throw notFound("Manager not found");
  }
}

function toCreateData(
  input: CreateEmployeeInput,
  actorId: string,
): Prisma.EmployeeCreateInput {
  return {
    employeeCode: input.employeeCode,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    department: input.department,
    weeklyHours: input.weeklyHours,
    workingDays: input.workingDays,
    startDate: parseDateOnly(input.startDate),
    endDate: input.endDate ? parseDateOnly(input.endDate) : null,
    status: input.status,
    createdBy: actorId,
    updatedBy: actorId,
    ...(input.managerId
      ? { manager: { connect: { id: input.managerId } } }
      : {}),
  };
}

export async function createEmployee(
  input: CreateEmployeeInput,
  actorId: string,
) {
  await assertManagerExists(input.managerId);

  try {
    const employee = await prisma.employee.create({
      data: toCreateData(input, actorId),
    });
    return serializeEmployee(employee);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("employeeCode already exists");
    }
    throw error;
  }
}

export async function listEmployees(query: ListEmployeesQuery) {
  const { status, department, search, page, limit } = query;
  const where: Prisma.EmployeeWhereInput = {};

  if (status) where.status = status;
  if (department) where.department = department;
  if (search) {
    where.OR = [
      { employeeCode: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    prisma.employee.count({ where }),
    prisma.employee.findMany({
      where,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(serializeEmployee),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    throw notFound("Employee not found");
  }
  return serializeEmployee(employee);
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
  actorId: string,
) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw notFound("Employee not found");
  }

  if (input.managerId) {
    if (input.managerId === id) {
      throw validationError("managerId cannot equal the employee id");
    }
    await assertManagerExists(input.managerId);
  }

  if (input.employeeCode !== existing.employeeCode) {
    const duplicate = await prisma.employee.findUnique({
      where: { employeeCode: input.employeeCode },
      select: { id: true },
    });
    if (duplicate) {
      throw conflict("employeeCode already exists");
    }
  }

  try {
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeCode: input.employeeCode,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        department: input.department,
        weeklyHours: input.weeklyHours,
        workingDays: input.workingDays,
        startDate: parseDateOnly(input.startDate),
        endDate: input.endDate ? parseDateOnly(input.endDate) : null,
        status: input.status,
        updatedBy: actorId,
        managerId: input.managerId ?? null,
      },
    });
    return serializeEmployee(employee);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw conflict("employeeCode already exists");
    }
    throw error;
  }
}

export async function deactivateEmployee(id: string, actorId: string) {
  const existing = await prisma.employee.findUnique({ where: { id } });
  if (!existing) {
    throw notFound("Employee not found");
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: {
      status: "INACTIVE",
      updatedBy: actorId,
    },
  });

  return {
    message: "Employee deactivated successfully",
    employee: serializeEmployee(employee),
  };
}
