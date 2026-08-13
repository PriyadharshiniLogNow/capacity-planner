import { apiRequest, toQueryString } from "./client";
import type {
  CapacitySummaryListEnvelope,
  CapacitySummaryQuery,
  EmployeeCapacitySummary,
} from "@/types/capacitySummary.types";

export async function listCapacitySummaries(
  query: CapacitySummaryQuery,
): Promise<EmployeeCapacitySummary[]> {
  const response = await apiRequest<CapacitySummaryListEnvelope>(
    `/api/v1/capacity-summary${toQueryString(query)}`,
  );
  return response.data;
}
