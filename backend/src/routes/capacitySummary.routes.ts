import { Router } from "express";
import {
  getEmployeeCapacitySummary,
  getEmployeeWeekCapacitySummary,
  getProjectCapacitySummary,
  listCapacitySummaries,
} from "../controllers/capacitySummary.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const capacitySummaryRoutes = Router();

capacitySummaryRoutes.use(authMiddleware);

const readRoles = ["ADMIN", "SUPERVISOR", "EMPLOYEE"] as const;

// Static `/project/:projectId` must be registered before `/:employeeId`.
capacitySummaryRoutes.get(
  "/",
  requireRoles(...readRoles),
  listCapacitySummaries,
);
capacitySummaryRoutes.get(
  "/project/:projectId",
  requireRoles(...readRoles),
  getProjectCapacitySummary,
);
capacitySummaryRoutes.get(
  "/:employeeId/:weekStart",
  requireRoles(...readRoles),
  getEmployeeWeekCapacitySummary,
);
capacitySummaryRoutes.get(
  "/:employeeId",
  requireRoles(...readRoles),
  getEmployeeCapacitySummary,
);

export { capacitySummaryRoutes };
