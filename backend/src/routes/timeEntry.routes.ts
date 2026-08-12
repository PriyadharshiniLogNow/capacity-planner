import { Router } from "express";
import {
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntryById,
  listTimeEntries,
  updateTimeEntry,
} from "../controllers/timeEntry.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const timeEntryRoutes = Router();

timeEntryRoutes.use(authMiddleware);

// ADMIN = Planner (full manage), SUPERVISOR = Management (read-only),
// EMPLOYEE = own time entries only (ownership enforced in controller).
timeEntryRoutes.post("/", requireRoles("ADMIN", "EMPLOYEE"), createTimeEntry);
timeEntryRoutes.get(
  "/",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  listTimeEntries,
);
timeEntryRoutes.get(
  "/:id",
  requireRoles("ADMIN", "SUPERVISOR", "EMPLOYEE"),
  getTimeEntryById,
);
timeEntryRoutes.patch(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE"),
  updateTimeEntry,
);
timeEntryRoutes.delete(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE"),
  deleteTimeEntry,
);

export { timeEntryRoutes };
