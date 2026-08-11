import { Router } from "express";
import { authRoutes } from "./auth";
import { projectRoutes } from "./projects";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/v1/projects", projectRoutes);

export { apiRoutes };
