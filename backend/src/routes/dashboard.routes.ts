import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const dashboardRoutes = Router();

dashboardRoutes.use(authMiddleware);

dashboardRoutes.get(
  "/",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  getDashboard,
);

export { dashboardRoutes };
