import { listAllEmployees } from "@/lib/api/employees.api";
import type { EmployeeListQuery, EmployeeResponse } from "@/types/employee.types";

export async function listSupervisorUserEmployees(
  query: Omit<EmployeeListQuery, "page" | "limit" | "supervisorUsersOnly"> = {},
): Promise<EmployeeResponse[]> {
  return listAllEmployees({ ...query, supervisorUsersOnly: true });
}
