import { apiRequest, readCollection, toQueryString } from "./client";
import type {
  AbsenceActionResponse,
  AbsenceDeleteResponse,
  AbsenceListQuery,
  AbsenceListResponse,
  AbsenceResponse,
  CreateAbsenceRequest,
  RejectAbsenceRequest,
  UpdateAbsenceRequest,
} from "@/types/absence.types";

type CreateEnvelope = {
  message: string;
  data: AbsenceResponse;
};

export function listAbsences(query: AbsenceListQuery = {}) {
  return apiRequest<AbsenceListResponse>(
    `/api/v1/absences${toQueryString({
      employeeId: query.employeeId,
      from: query.from,
      to: query.to,
      status: query.status,
      page: query.page,
      limit: query.limit,
    })}`,
  );
}

export function getAbsenceById(id: string) {
  return apiRequest<AbsenceResponse>(`/api/v1/absences/${id}`);
}

export async function listAllAbsences(
  query: Omit<AbsenceListQuery, "page" | "limit"> = {},
): Promise<AbsenceResponse[]> {
  const first = readCollection(await listAbsences({ ...query, page: 1, limit: 100 }));
  const absences = [...first.items];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = readCollection(await listAbsences({ ...query, page, limit: 100 }));
    absences.push(...next.items);
  }

  return absences;
}

export function createAbsence(body: CreateAbsenceRequest) {
  return apiRequest<CreateEnvelope>("/api/v1/absences", {
    method: "POST",
    body: JSON.stringify(body),
  }).then((response) => response.data);
}

export function updateAbsence(id: string, body: UpdateAbsenceRequest) {
  return apiRequest<AbsenceResponse>(`/api/v1/absences/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAbsence(id: string) {
  return apiRequest<AbsenceDeleteResponse>(`/api/v1/absences/${id}`, {
    method: "DELETE",
  });
}

export function approveAbsence(id: string) {
  return apiRequest<AbsenceActionResponse>(`/api/v1/absences/${id}/approve`, {
    method: "PATCH",
  }).then((response) => response.data);
}

export function rejectAbsence(id: string, body: RejectAbsenceRequest) {
  return apiRequest<AbsenceActionResponse>(`/api/v1/absences/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify(body),
  }).then((response) => response.data);
}
