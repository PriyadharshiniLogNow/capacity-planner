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

projectRoutes.post("/", requireRoles("ADMIN"), createProject);
projectRoutes.get(
  "/",
  requireRoles("ADMIN", "EMPLOYEE", "SUPERVISOR"),
  listProjects,
);
projectRoutes.get(
  "/:id",
  requireRoles("ADMIN", "EMPLOYEE", "SUPERVISOR"),
  getProjectById,
);
projectRoutes.put("/:id", requireRoles("ADMIN"), updateProject);
projectRoutes.delete("/:id", requireRoles("ADMIN"), deleteProject);

export { projectRoutes };
