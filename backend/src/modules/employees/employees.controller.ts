import type { Request, Response } from "express";
import type {
  CreateEmployeeInput,
  ListEmployeesQuery,
  UpdateEmployeeInput,
} from "../../schemas/employee";
import * as employeeService from "./employees.service";

function actorId(req: Request): string {
  return req.user!.id;
}

export async function create(req: Request, res: Response): Promise<void> {
  const employee = await employeeService.createEmployee(
    req.body as CreateEmployeeInput,
    actorId(req),
  );
  res.status(201).json(employee);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await employeeService.listEmployees(
    req.query as unknown as ListEmployeesQuery,
  );
  res.status(200).json(result);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const employee = await employeeService.getEmployeeById(
    req.params.id as string,
  );
  res.status(200).json(employee);
}

export async function update(req: Request, res: Response): Promise<void> {
  const employee = await employeeService.updateEmployee(
    req.params.id as string,
    req.body as UpdateEmployeeInput,
    actorId(req),
  );
  res.status(200).json(employee);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const result = await employeeService.deactivateEmployee(
    req.params.id as string,
    actorId(req),
  );
  res.status(200).json(result);
}
