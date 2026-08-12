import {
  Prisma,
  type Project,
  type ProjectStatus,
  type ProjectType,
} from "@prisma/client";
import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import {
  listProjectsQuerySchema,
  projectBodySchema,
} from "../schemas/project.schema";
import type { ProjectBody } from "../types/project.type";

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

function paramId(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function toProjectResponse(project: Project) {
  return {
    id: project.id,
    projectCode: project.projectCode,
    name: project.name,
    type: project.type,
    customerName: project.customerName,
    projectManagerId: project.projectManagerId,
    startDate: project.startDate,
    endDate: project.endDate,
    billable: project.billable,
    status: project.status,
    createdAt: project.createdAt,
    createdBy: project.createdBy,
    updatedAt: project.updatedAt,
    updatedBy: project.updatedBy,
  };
}

function normalizeCustomerName(data: ProjectBody): string | null {
  if (data.type === "INTERNAL") {
    return data.customerName ?? null;
  }
  return data.customerName as string;
}

async function assertProjectManagerExists(
  projectManagerId: string | null | undefined,
  res: Response,
): Promise<boolean> {
  if (!projectManagerId) {
    return true;
  }

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
        customerName: normalizeCustomerName(data),
        projectManagerId: data.projectManagerId ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        billable: data.billable,
        status: data.status,
        createdBy: req.user.id,
        updatedBy: req.user.id,
      },
    });

    return res.status(201).json(toProjectResponse(project));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "projectCode already exists" });
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
    where.status = status as ProjectStatus;
  }
  if (type) {
    where.type = type as ProjectType;
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
      return res.status(409).json({ message: "projectCode already exists" });
    }
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        projectCode: data.projectCode,
        name: data.name,
        type: data.type,
        customerName: normalizeCustomerName(data),
        projectManagerId: data.projectManagerId ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        billable: data.billable,
        status: data.status,
        updatedBy: req.user.id,
      },
    });

    return res.status(200).json(toProjectResponse(project));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({ message: "projectCode already exists" });
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
  });

  if (!existing) {
    return res.status(404).json({ message: "Project not found" });
  }

  const project = await prisma.project.update({
    where: { id },
    data: {
      status: "CLOSED",
      updatedBy: req.user.id,
    },
  });

  return res.status(200).json({
    message: "Project closed successfully",
    project: toProjectResponse(project),
  });
};
