import type { EmployeeStatus } from "@prisma/client";

/**
 * Default capacity pools (dashboard / summary without an employee filter)
 * include only active employees. Inactive employees stay visible when
 * specifically requested so historical reports still work.
 */
export function employeeCountsTowardDefaultCapacityPool(
  status: EmployeeStatus,
): boolean {
  return status === "ACTIVE";
}
