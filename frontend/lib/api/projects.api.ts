import { apiRequest, readCollection, toQueryString } from "./client";
import type {
  ProjectListQuery,
  ProjectListResponse,
  ProjectResponse,
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

export async function listAllProjects(
  query: Omit<ProjectListQuery, "page" | "limit"> = {},
): Promise<ProjectResponse[]> {
  const first = readCollection(await listProjects({ ...query, page: 1, limit: 100 }));
  const projects = [...first.items];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = readCollection(await listProjects({ ...query, page, limit: 100 }));
    projects.push(...next.items);
  }

  return projects;
}
