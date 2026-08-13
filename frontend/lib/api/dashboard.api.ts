import { apiRequest, toQueryString } from "./client";
import type {
  DashboardApiEnvelope,
  DashboardQuery,
  DashboardResponse,
} from "@/types/dashboard.types";

export async function getDashboard(
  query: DashboardQuery = {},
): Promise<DashboardResponse> {
  const response = await apiRequest<DashboardApiEnvelope>(
    `/api/v1/dashboard${toQueryString(query)}`,
  );
  return response.data;
}
