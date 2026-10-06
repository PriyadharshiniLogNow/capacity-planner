import type { EmployeeStatus, Role } from "@prisma/client";

export const SUPERVISOR_USER_ROLE: Role = "SUPERVISOR";

/** Job title on the employee record. Distinct from the login role. */
export const SUPERVISOR_JOB_ROLE = "Supervisor";

export const SUPERVISOR_MESSAGES = {
  required: "Supervisor is required.",
  notFound: "Supervisor not found",
  notSupervisorUser: "Only supervisor users can be selected as supervisor.",
  self: "Employees cannot supervise themselves.",
  circular: "This would create a circular supervisor relationship.",
  inactive: "Inactive employees cannot be selected as supervisor.",
} as const;

export function isSupervisorUserRole(role: Role | null | undefined): boolean {
  return role === SUPERVISOR_USER_ROLE;
}

export function isSupervisorJobRole(role: string | null | undefined): boolean {
  return role?.trim().toLowerCase() === SUPERVISOR_JOB_ROLE.toLowerCase();
}

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

export function isSupervisorRequired(
  eligibleActiveCount: number,
  jobRole?: string | null,
): boolean {
  if (isSupervisorJobRole(jobRole)) {
    return false;
  }
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
