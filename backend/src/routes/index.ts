import { Router } from "express";
import { authRoutes } from "./auth";
import { employeesRouter } from "../modules/employees/employees.routes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/v1/employees", employeesRouter);

export { apiRoutes };
