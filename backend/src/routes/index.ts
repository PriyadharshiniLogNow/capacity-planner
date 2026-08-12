import { Router } from "express";
import { authRoutes } from "./auth";
import { employeeRoutes } from "./employees";
import { projectRoutes } from "./projects";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/employees", employeeRoutes);
apiRoutes.use("/projects", projectRoutes);

export { apiRoutes };
