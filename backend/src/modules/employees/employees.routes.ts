import { Router } from "express";
import { Role } from "@prisma/client";
import { authenticate, requireRoles } from "../../middleware/auth";
import { validate } from "../../middleware/validate";
import {
  createEmployeeSchema,
  employeeIdParamSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "../../schemas/employee";
import * as employeesController from "./employees.controller";

export const employeesRouter = Router();

const readRoles = [Role.PLANNER, Role.EMPLOYEE, Role.MANAGEMENT] as const;
const writeRoles = [Role.PLANNER] as const;

employeesRouter.use(authenticate);

employeesRouter.get(
  "/",
  requireRoles(...readRoles),
  validate(listEmployeesQuerySchema, "query"),
  employeesController.list,
);

employeesRouter.post(
  "/",
  requireRoles(...writeRoles),
  validate(createEmployeeSchema),
  employeesController.create,
);

employeesRouter.get(
  "/:id",
  requireRoles(...readRoles),
  validate(employeeIdParamSchema, "params"),
  employeesController.getById,
);

employeesRouter.put(
  "/:id",
  requireRoles(...writeRoles),
  validate(employeeIdParamSchema, "params"),
  validate(updateEmployeeSchema),
  employeesController.update,
);

employeesRouter.delete(
  "/:id",
  requireRoles(...writeRoles),
  validate(employeeIdParamSchema, "params"),
  employeesController.remove,
);
