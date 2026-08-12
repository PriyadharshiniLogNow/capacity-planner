import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} from "../controllers/employees.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const employeeRoutes = Router();

employeeRoutes.use(authMiddleware);

employeeRoutes.post("/", requireRoles("ADMIN"), createEmployee);
employeeRoutes.get(
  "/",
  requireRoles("ADMIN", "EMPLOYEE", "SUPERVISOR"),
  listEmployees,
);
employeeRoutes.get(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE", "SUPERVISOR"),
  getEmployeeById,
);
employeeRoutes.put("/:id", requireRoles("ADMIN"), updateEmployee);
employeeRoutes.delete("/:id", requireRoles("ADMIN"), deleteEmployee);

export { employeeRoutes };
