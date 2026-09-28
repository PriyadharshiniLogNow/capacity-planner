import type { Employee, Project } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  ELIGIBILITY_MESSAGES,
  assertEmployeeProjectEligible,
  isHistoricalRecordVisible,
} from "../src/services/eligibility.service";

function makeEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "emp_1",
    employeeCode: "EMP-1",
    firstName: "Jamie",
    lastName: "Rivera",
    role: "Consultant",
    department: "Delivery",
    email: "jamie@capacity.local",
    supervisorId: "mgr_1",
    weeklyHours: 40,
    workingDays: [1, 2, 3, 4, 5],
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: null,
    status: "ACTIVE",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: "user_1",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedBy: "user_1",
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "prj_1",
    projectCode: "PRJ-1",
    name: "Internal Tools",
    type: "INTERNAL",
    customerName: "Log Now",
    projectManagerId: "emp_1",
    startDate: new Date("2026-01-01T00:00:00.000Z"),
    endDate: new Date("2026-12-31T00:00:00.000Z"),
    billable: false,
    status: "OPEN",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: "user_1",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedBy: "user_1",
    ...overrides,
  };
}

function mockDb(employee: Employee | null, project: Project | null) {
  return {
    employee: {
      findUnique: vi.fn().mockResolvedValue(employee),
    },
    project: {
      findUnique: vi.fn().mockResolvedValue(project),
    },
  };
}

describe("assertEmployeeProjectEligible", () => {
  it("rejects a new assignment for an inactive employee", async () => {
    const result = await assertEmployeeProjectEligible(
      {
        employeeId: "emp_1",
        projectId: "prj_1",
        purpose: "assignment",
        rangeStart: new Date("2026-08-10T00:00:00.000Z"),
        rangeEnd: new Date("2026-08-16T00:00:00.000Z"),
      },
      mockDb(makeEmployee({ status: "INACTIVE" }), makeProject()),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.status).toBe(422);
    expect(result.body.error.message).toBe(
      ELIGIBILITY_MESSAGES.inactiveAssignment,
    );
  });

  it("rejects a new time entry for an inactive employee", async () => {
    const result = await assertEmployeeProjectEligible(
      {
        employeeId: "emp_1",
        projectId: "prj_1",
        purpose: "time_entry",
        entryDate: new Date("2026-08-11T00:00:00.000Z"),
      },
      mockDb(makeEmployee({ status: "INACTIVE" }), makeProject()),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.body.error.message).toBe(
      ELIGIBILITY_MESSAGES.inactiveTimeEntry,
    );
  });

  it("rejects a new assignment for a closed project", async () => {
    const result = await assertEmployeeProjectEligible(
      {
        employeeId: "emp_1",
        projectId: "prj_1",
        purpose: "planning",
        rangeStart: new Date("2026-08-10T00:00:00.000Z"),
        rangeEnd: new Date("2026-08-16T00:00:00.000Z"),
      },
      mockDb(makeEmployee(), makeProject({ status: "CLOSED" })),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.body.error.message).toBe(
      ELIGIBILITY_MESSAGES.closedAssignment,
    );
  });

  it("rejects a new time entry for a closed project", async () => {
    const result = await assertEmployeeProjectEligible(
      {
        employeeId: "emp_1",
        projectId: "prj_1",
        purpose: "time_entry",
        entryDate: new Date("2026-08-11T00:00:00.000Z"),
      },
      mockDb(makeEmployee(), makeProject({ status: "CLOSED" })),
    );

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.body.error.message).toBe(ELIGIBILITY_MESSAGES.closedTimeEntry);
  });

  it("allows a new time entry when employee and project are active", async () => {
    const result = await assertEmployeeProjectEligible(
      {
        employeeId: "emp_1",
        projectId: "prj_1",
        purpose: "time_entry",
        entryDate: new Date("2026-08-11T00:00:00.000Z"),
      },
      mockDb(makeEmployee(), makeProject()),
    );

    expect(result.ok).toBe(true);
  });
});

describe("historical visibility", () => {
  it("keeps historical entries visible after an employee becomes inactive", () => {
    expect(
      isHistoricalRecordVisible({ employeeStatus: "INACTIVE" }),
    ).toBe(true);
  });

  it("keeps historical entries visible after a project is closed", () => {
    expect(isHistoricalRecordVisible({ projectStatus: "CLOSED" })).toBe(true);
  });
});
