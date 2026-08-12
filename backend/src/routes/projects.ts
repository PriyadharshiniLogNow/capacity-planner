import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from "../controllers/projects.controller";
import { authMiddleware } from "../middleware/auth.middlewere";
import { requireRoles } from "../middleware/requireRoles";

const projectRoutes = Router();

projectRoutes.use(authMiddleware);

projectRoutes.post("/", requireRoles("PLANNER"), createProject);
projectRoutes.get(
  "/",
  requireRoles("PLANNER", "EMPLOYEE", "MANAGEMENT"),
  listProjects,
);
projectRoutes.get(
  "/:id",
  requireRoles("PLANNER", "EMPLOYEE", "MANAGEMENT"),
  getProjectById,
);
projectRoutes.put("/:id", requireRoles("PLANNER"), updateProject);
projectRoutes.delete("/:id", requireRoles("PLANNER"), deleteProject);

export { projectRoutes };
