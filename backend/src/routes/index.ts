import { Router } from "express";
import { absenceRoutes } from "./absence.routes";
import { authRoutes } from "./auth";
import { capacityPlanRoutes } from "./capacityPlan.routes";
import { capacitySummaryRoutes } from "./capacitySummary.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { employeeRoutes } from "./employees";
import { projectRoutes } from "./projects";
import { timeEntryRoutes } from "./timeEntry.routes";

const apiRoutes = Router();

apiRoutes.use("/auth", authRoutes);
apiRoutes.use("/employees", employeeRoutes);
apiRoutes.use("/projects", projectRoutes);
apiRoutes.use("/v1/absences", absenceRoutes);
apiRoutes.use("/v1/time-entries", timeEntryRoutes);
apiRoutes.use("/v1/capacity-plans", capacityPlanRoutes);
apiRoutes.use("/v1/capacity-summary", capacitySummaryRoutes);
apiRoutes.use("/v1/dashboard", dashboardRoutes);

export { apiRoutes };
