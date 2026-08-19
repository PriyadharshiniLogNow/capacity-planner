import { apiRequest, readCollection, toQueryString } from "./client";
import type {
  EmployeeListQuery,
  EmployeeListResponse,
  EmployeeResponse,
} from "@/types/employee.types";

export function listEmployees(query: EmployeeListQuery = {}) {
  return apiRequest<EmployeeListResponse>(
    `/api/employees${toQueryString({
      status: query.status,
      department: query.department,
      search: query.search,
      page: query.page,
      limit: query.limit,
    })}`,
  );
}

export function getEmployeeById(id: string) {
  return apiRequest<EmployeeResponse>(`/api/employees/${id}`);
}

export async function listAllEmployees(
  query: Omit<EmployeeListQuery, "page" | "limit"> = {},
): Promise<EmployeeResponse[]> {
  const first = readCollection(await listEmployees({ ...query, page: 1, limit: 100 }));
  const employees = [...first.items];

  for (let page = 2; page <= first.totalPages; page += 1) {
    const next = readCollection(await listEmployees({ ...query, page, limit: 100 }));
    employees.push(...next.items);
  }

  return employees;
}
