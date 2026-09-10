import { apiRequest, toQueryString } from "./client";
import type {
  CreateEmployeePayload,
  EmployeeListQuery,
  EmployeeListResponse,
  EmployeeResponse,
  EmployeeWritePayload,
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

export async function createEmployee(payload: CreateEmployeePayload) {
  const response = await apiRequest<{
    message: string;
    data: { employee: EmployeeResponse };
  }>("/api/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return response.data.employee;
}

export function updateEmployee(id: string, payload: EmployeeWritePayload) {
  return apiRequest<EmployeeResponse>(`/api/employees/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deactivateEmployee(id: string) {
  return apiRequest<{ message: string; employee: EmployeeResponse }>(
    `/api/employees/${id}`,
    { method: "DELETE" },
  );
}

export async function listAllEmployees(
  query: Omit<EmployeeListQuery, "page" | "limit"> = {},
): Promise<EmployeeResponse[]> {
  const first = await listEmployees({ ...query, page: 1, limit: 100 });
  const employees = [...first.data];

  for (let page = 2; page <= first.pagination.totalPages; page += 1) {
    const next = await listEmployees({ ...query, page, limit: 100 });
    employees.push(...next.data);
  }

  return employees;
}
