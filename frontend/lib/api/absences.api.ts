import { apiRequest, readCollection, toQueryString } from "./client";
import type {
  AbsenceListQuery,
  AbsenceListResponse,
  AbsenceResponse,
} from "@/types/absence.types";

export function listAbsences(query: AbsenceListQuery = {}) {
  return apiRequest<AbsenceListResponse>(
    `/api/v1/absences${toQueryString({
      employeeId: query.employeeId,
      from: query.from,
      to: query.to,
      page: query.page,
      limit: query.limit,
    })}`,
  );
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
