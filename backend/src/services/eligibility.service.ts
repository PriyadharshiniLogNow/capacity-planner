import type { Employee, EmployeeStatus, Project, ProjectStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  isWithinEmploymentPeriod,
  isWithinProjectPeriod,
  rangesOverlap,
} from "../utils/date";

export const ELIGIBILITY_MESSAGES = {
  employeeNotFound: "Employee not found",
  projectNotFound: "Project not found",
  inactiveAssignment: "Inactive employees cannot receive new assignments.",
  inactiveTimeEntry: "Inactive employees cannot receive new time entries.",
  closedAssignment: "Closed projects cannot receive new assignments.",
  closedTimeEntry: "Closed projects cannot receive new time entries.",
  employeeOutsidePeriod:
    "The date is outside the employee's employment period.",
  projectOutsidePeriod: "The date is outside the project start and end dates.",
} as const;

export type EligibilityPurpose = "assignment" | "planning" | "time_entry";

export type EligibilityFailure = {
  ok: false;
  status: number;
  body: {
    error: {
      code: string;
      message: string;
    };
  };
};

export type EligibilitySuccess = {
  ok: true;
  employee: Employee;
  project: Project;
};

export type EligibilityResult = EligibilitySuccess | EligibilityFailure;

export type EligibilityDb = {
  employee: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<Employee | null>;
  };
  project: {
    findUnique: (args: {
      where: { id: string };
    }) => Promise<Project | null>;
  };
};

export type EligibilityParams = {
  employeeId: string;
  projectId: string;
  purpose: EligibilityPurpose;
  /** Single date (time entries). */
  entryDate?: Date;
  /** Inclusive range (capacity-planning week). */
  rangeStart?: Date;
  rangeEnd?: Date;
};

function failure(status: number, code: string, message: string): EligibilityFailure {
  return {
    ok: false,
    status,
    body: { error: { code, message } },
  };
}

function inactiveMessage(purpose: EligibilityPurpose): string {
  return purpose === "time_entry"
    ? ELIGIBILITY_MESSAGES.inactiveTimeEntry
    : ELIGIBILITY_MESSAGES.inactiveAssignment;
}

function closedMessage(purpose: EligibilityPurpose): string {
  return purpose === "time_entry"
    ? ELIGIBILITY_MESSAGES.closedTimeEntry
    : ELIGIBILITY_MESSAGES.closedAssignment;
}

function datesAreWithinWindows(params: {
  employee: Employee;
  project: Project;
  entryDate?: Date;
  rangeStart?: Date;
  rangeEnd?: Date;
}): { employeeOk: boolean; projectOk: boolean } {
  const { employee, project, entryDate, rangeStart, rangeEnd } = params;

  if (entryDate) {
    return {
      employeeOk: isWithinEmploymentPeriod(employee, entryDate),
      projectOk: isWithinProjectPeriod(project, entryDate),
    };
  }

  if (rangeStart && rangeEnd) {
    const employmentEnd = employee.endDate ?? rangeEnd;
    return {
      employeeOk: rangesOverlap(
        rangeStart,
        rangeEnd,
        employee.startDate,
        employmentEnd,
      ),
      projectOk: rangesOverlap(
        rangeStart,
        rangeEnd,
        project.startDate,
        project.endDate,
      ),
    };
  }

  return { employeeOk: true, projectOk: true };
}

/**
 * Authoritative write-path check for new assignments, capacity plans,
 * and time entries. Reads never use this, so historical rows stay visible.
 */
export async function assertEmployeeProjectEligible(
  params: EligibilityParams,
  db: EligibilityDb = prisma,
): Promise<EligibilityResult> {
  const { employeeId, projectId, purpose, entryDate, rangeStart, rangeEnd } =
    params;

  const [employee, project] = await Promise.all([
    db.employee.findUnique({ where: { id: employeeId } }),
    db.project.findUnique({ where: { id: projectId } }),
  ]);

  if (!employee) {
    return failure(404, "EMPLOYEE_NOT_FOUND", ELIGIBILITY_MESSAGES.employeeNotFound);
  }

  if (!project) {
    return failure(404, "PROJECT_NOT_FOUND", ELIGIBILITY_MESSAGES.projectNotFound);
  }

  if (employee.status !== "ACTIVE") {
    return failure(
      422,
      "EMPLOYEE_INACTIVE",
      inactiveMessage(purpose),
    );
  }

  if (project.status !== "OPEN") {
    return failure(
      422,
      "PROJECT_CLOSED",
      closedMessage(purpose),
    );
  }

  const windows = datesAreWithinWindows({
    employee,
    project,
    entryDate,
    rangeStart,
    rangeEnd,
  });

  if (!windows.employeeOk) {
    return failure(
      422,
      "EMPLOYEE_OUTSIDE_PERIOD",
      ELIGIBILITY_MESSAGES.employeeOutsidePeriod,
    );
  }

  if (!windows.projectOk) {
    return failure(
      422,
      "PROJECT_OUTSIDE_PERIOD",
      ELIGIBILITY_MESSAGES.projectOutsidePeriod,
    );
  }

  return { ok: true, employee, project };
}

/**
 * Historical list/report policy: inactive employees and closed projects
 * remain visible. Write paths must call assertEmployeeProjectEligible instead.
 */
export function isHistoricalRecordVisible(_params?: {
  employeeStatus?: EmployeeStatus;
  projectStatus?: ProjectStatus;
}): boolean {
  return true;
}
