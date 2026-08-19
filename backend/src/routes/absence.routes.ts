import { Router } from "express";
import {
  approveAbsence,
  createAbsence,
  deleteAbsence,
  getAbsenceById,
  listAbsences,
  rejectAbsence,
  updateAbsence,
} from "../controllers/absence.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const absenceRoutes = Router();

absenceRoutes.use(authMiddleware);

// ADMIN = Planner (full manage), SUPERVISOR = Management (approve/reject + read),
// EMPLOYEE = own absences only (ownership enforced in controller).
absenceRoutes.post("/", requireRoles("ADMIN", "EMPLOYEE"), createAbsence);
absenceRoutes.get(
  "/",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  listAbsences,
);
absenceRoutes.patch(
  "/:id/approve",
  requireRoles("ADMIN", "SUPERVISOR"),
  approveAbsence,
);
absenceRoutes.patch(
  "/:id/reject",
  requireRoles("ADMIN", "SUPERVISOR"),
  rejectAbsence,
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
