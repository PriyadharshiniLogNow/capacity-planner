import { apiRequest, readCollection, toQueryString } from "./client";
import type {
  CapacityPlanListQuery,
  CapacityPlanListResponse,
  CapacityPlanResponse,
  CopyWeekInput,
  CopyWeekResponse,
  CreateCapacityPlanInput,
  UpdateCapacityPlanInput,
} from "@/types/capacityPlan.types";

type CreateEnvelope = {
  message: string;
  data: CapacityPlanResponse;
};

type DeleteEnvelope = {
  message: string;
  capacityPlan: CapacityPlanResponse;
};

export function listCapacityPlans(query: CapacityPlanListQuery = {}) {
  return apiRequest<CapacityPlanListResponse>(
    `/api/v1/capacity-plans${toQueryString({
      employeeId: query.employeeId,
      projectId: query.projectId,
      weekStart: query.weekStart,
      page: query.page,
      limit: query.limit,
    })}`,
  );
}

export async function listAllCapacityPlans(
  query: Omit<CapacityPlanListQuery, "page" | "limit"> = {},
): Promise<CapacityPlanListResponse> {
  const first = await listCapacityPlans({ ...query, page: 1, limit: 100 });
  const pageOne = readCollection(first);
  const plans = [...pageOne.items];

  for (let page = 2; page <= pageOne.totalPages; page += 1) {
    const next = readCollection(
      await listCapacityPlans({ ...query, page, limit: 100 }),
    );
    plans.push(...next.items);
  }

  return {
    ...first,
    data: plans,
    pagination: {
      page: 1,
      limit: first.pagination?.limit ?? plans.length,
      total: plans.length,
      totalPages: 1,
    },
  };
}

export function createCapacityPlan(body: CreateCapacityPlanInput) {
  return apiRequest<CreateEnvelope>("/api/v1/capacity-plans", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((response) => response.data);
}

export function updateCapacityPlan(id: string, body: UpdateCapacityPlanInput) {
  return apiRequest<CapacityPlanResponse>(`/api/v1/capacity-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCapacityPlan(id: string) {
  return apiRequest<DeleteEnvelope>(`/api/v1/capacity-plans/${id}`, {
    method: "DELETE",
  });
}

export function copyCapacityWeek(body: CopyWeekInput) {
  return apiRequest<CopyWeekResponse>("/api/v1/capacity-plans/copy-week", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
