import { apiRequest, toQueryString } from "./client";
import type {
  ProjectListQuery,
  ProjectListResponse,
  ProjectResponse,
  ProjectWritePayload,
} from "@/types/project.types";

export function listProjects(query: ProjectListQuery = {}) {
  return apiRequest<ProjectListResponse>(
    `/api/projects${toQueryString({
      status: query.status,
      type: query.type,
      billable:
        query.billable === undefined ? undefined : query.billable ? "true" : "false",
      search: query.search,
      page: query.page,
      limit: query.limit,
    })}`,
  );
}

export function getProjectById(id: string) {
  return apiRequest<ProjectResponse>(`/api/projects/${id}`);
}

export function createProject(payload: ProjectWritePayload) {
  return apiRequest<ProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProject(id: string, payload: ProjectWritePayload) {
  return apiRequest<ProjectResponse>(`/api/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function closeProject(id: string) {
  return apiRequest<{ message: string; project: ProjectResponse }>(
    `/api/projects/${id}`,
    { method: "DELETE" },
  );
}

export async function listAllProjects(
  query: Omit<ProjectListQuery, "page" | "limit"> = {},
): Promise<ProjectResponse[]> {
  const first = await listProjects({ ...query, page: 1, limit: 100 });
  const projects = [...first.data];

  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const next = await listProjects({ ...query, page, limit: 100 });
    projects.push(...next.data);
  }

  return projects;
}
