import { Router } from "express";
import {
  createAbsence,
  deleteAbsence,
  getAbsenceById,
  listAbsences,
  updateAbsence,
} from "../controllers/absence.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const absenceRoutes = Router();

absenceRoutes.use(authMiddleware);

// ADMIN = Planner (full manage), SUPERVISOR = Management (read-only),
// EMPLOYEE = own absences only (ownership enforced in controller).
absenceRoutes.post("/", requireRoles("ADMIN", "EMPLOYEE"), createAbsence);
absenceRoutes.get(
  "/",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  listAbsences,
);
absenceRoutes.get(
  "/:id",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  getAbsenceById,
);
absenceRoutes.patch(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE"),
  updateAbsence,
);
absenceRoutes.delete(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE"),
  deleteAbsence,
);

export { absenceRoutes };
