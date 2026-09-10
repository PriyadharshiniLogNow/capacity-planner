import type { EmployeeStatus } from "@prisma/client";

export const SUPERVISOR_MESSAGES = {
  required: "Supervisor is required.",
  notFound: "Supervisor not found",
  self: "Employees cannot supervise themselves.",
  circular: "This would create a circular supervisor relationship.",
  inactive: "Inactive employees cannot be selected as supervisor.",
} as const;

export function isSelfSupervision(
  employeeId: string | null | undefined,
  supervisorId: string,
): boolean {
  return Boolean(employeeId) && employeeId === supervisorId;
}

export function isDirectCircularSupervision(
  employeeId: string | null | undefined,
  supervisorSupervisorId: string | null | undefined,
): boolean {
  return Boolean(employeeId) && supervisorSupervisorId === employeeId;
}

export function isInactiveSupervisorSelection(params: {
  supervisorStatus: EmployeeStatus;
  selectedSupervisorId: string;
  currentSupervisorId?: string | null;
}): boolean {
  if (params.supervisorStatus === "ACTIVE") {
    return false;
  }
  return params.selectedSupervisorId !== params.currentSupervisorId;
}

export function isSupervisorRequired(eligibleActiveCount: number): boolean {
  return eligibleActiveCount > 0;
}

/** Migration rule: keep manager links, clear self-supervision. */
export function supervisorIdFromLegacyManager(
  managerId: string | null,
  employeeId: string,
): string | null {
  if (!managerId || managerId === employeeId) {
    return null;
  }
  return managerId;
}
