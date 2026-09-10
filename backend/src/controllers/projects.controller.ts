import { Prisma, type Project } from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import {
  isPrismaUniqueConstraintError,
  projectIdConflictBody,
} from "../lib/uniqueConstraint";
import { prisma } from "../lib/prisma";
import {
  listProjectsQuerySchema,
  projectBodySchema,
} from "../schemas/project.schema";
import { formatDateOnly, parseDateOnly } from "../utils/date";

type ProjectManagerSummary = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

type ProjectWithManager = Project & {
  projectManager?: ProjectManagerSummary | null;
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

function toProjectResponse(project: ProjectWithManager) {
  return {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    type: project.type,
    customerName: project.customerName,
    projectManagerId: project.projectManagerId,
    projectManager: project.projectManager
      ? {
          id: project.projectManager.id,
          employeeCode: project.projectManager.employeeCode,
          firstName: project.projectManager.firstName,
          lastName: project.projectManager.lastName,
        }
      : null,
    startDate: formatDateOnly(project.startDate),
    endDate: formatDateOnly(project.endDate),
    billable: project.billable,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    createdBy: project.createdBy,
    updatedAt: project.updatedAt.toISOString(),
    updatedBy: project.updatedBy,
  };
}

const projectInclude = {
  projectManager: {
    select: {
      id: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

async function assertProjectManagerExists(
  projectManagerId: string,
  res: Response,
): Promise<boolean> {
  const employee = await prisma.employee.findUnique({
    where: { id: projectManagerId },
    select: { id: true },
  });

  if (!employee) {
    res.status(404).json({ message: "Project manager not found" });
    return false;
  }

  return true;
}

function duplicateProjectId(res: Response) {
  return res.status(409).json(projectIdConflictBody());
}

export const createProject = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const parsed = projectBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;

  if (!(await assertProjectManagerExists(data.projectManagerId, res))) {
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        projectCode: data.projectCode,
        name: data.name,
        type: data.type,
        customerName: data.customerName,
        projectManagerId: data.projectManagerId,
        startDate: parseDateOnly(data.startDate),
        endDate: parseDateOnly(data.endDate),
        billable: data.billable,
        status: data.status,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
      include: projectInclude,
    });

    return res.status(201).json(toProjectResponse(project));
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return duplicateProjectId(res);
    }
    throw error;
  }
};

export const listProjects = async (req: Request, res: Response) => {
  const parsed = listProjectsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { status, type, billable, search, page, limit } = parsed.data;
  const where: Prisma.ProjectWhereInput = {};

  if (status) {
    where.status = status;
  }
  if (type) {
    where.type = type;
  }
  if (billable !== undefined) {
    where.billable = billable;
  }
  if (search) {
    where.OR = [
      { projectCode: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, projects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: projectInclude,
    }),
  ]);

  return res.status(200).json({
    data: projects.map(toProjectResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
};

export const getProjectById = async (req: Request, res: Response) => {
  const id = paramId(req.params.id);

  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  return res.status(200).json(toProjectResponse(project));
};

export const updateProject = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.project.findUnique({
    where: { id },
  });

  if (!existing) {
    return res.status(404).json({ message: "Project not found" });
  }

  const parsed = projectBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const data = parsed.data;

  if (!(await assertProjectManagerExists(data.projectManagerId, res))) {
    return;
  }

  if (data.projectCode !== existing.projectCode) {
    const conflict = await prisma.project.findUnique({
      where: { projectCode: data.projectCode },
      select: { id: true },
    });
    if (conflict) {
      return duplicateProjectId(res);
    }
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        projectCode: data.projectCode,
        name: data.name,
        type: data.type,
        customerName: data.customerName,
        projectManagerId: data.projectManagerId,
        startDate: parseDateOnly(data.startDate),
        endDate: parseDateOnly(data.endDate),
        billable: data.billable,
        status: data.status,
        updatedBy: req.user.id,
      },
      include: projectInclude,
    });

    return res.status(200).json(toProjectResponse(project));
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      return duplicateProjectId(res);
    }
    throw error;
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = paramId(req.params.id);

  const existing = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });

  if (!existing) {
    return res.status(404).json({ message: "Project not found" });
  }

  // Soft-close only. Historical assignments and time entries are kept.
  const project = await prisma.project.update({
    where: { id },
    data: {
      status: "CLOSED",
      updatedBy: req.user.id,
    },
    include: projectInclude,
  });

  return res.status(200).json({
    message: "Project closed successfully",
    project: toProjectResponse(project),
  });
};
