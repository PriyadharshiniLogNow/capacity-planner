import { Router } from "express";
import {
  copyWeek,
  createCapacityPlan,
  deleteCapacityPlan,
  getCapacityPlanById,
  listCapacityPlans,
  updateCapacityPlan,
} from "../controllers/capacityPlan.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const capacityPlanRoutes = Router();

capacityPlanRoutes.use(authMiddleware);

// ADMIN = Planner (full manage), SUPERVISOR = Management (read-only),
// EMPLOYEE = view own plans only (ownership enforced in controller).
capacityPlanRoutes.post("/", requireRoles("ADMIN"), createCapacityPlan);
capacityPlanRoutes.post("/copy-week", requireRoles("ADMIN"), copyWeek);
capacityPlanRoutes.get(
  "/",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  listCapacityPlans,
);
capacityPlanRoutes.get(
  "/:id",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  getCapacityPlanById,
);
capacityPlanRoutes.patch("/:id", requireRoles("ADMIN"), updateCapacityPlan);
capacityPlanRoutes.delete("/:id", requireRoles("ADMIN"), deleteCapacityPlan);

export { capacityPlanRoutes };
