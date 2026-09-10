import { describe, expect, it } from "vitest";
import {
  isDirectCircularSupervision,
  isInactiveSupervisorSelection,
  isSelfSupervision,
  isSupervisorRequired,
  SUPERVISOR_MESSAGES,
  supervisorIdFromLegacyManager,
} from "../src/lib/supervisorPolicy";

describe("supervisor policy", () => {
  it("requires a supervisor when other active employees exist", () => {
    expect(isSupervisorRequired(1)).toBe(true);
    expect(isSupervisorRequired(0)).toBe(false);
  });

  it("prevents employees from supervising themselves", () => {
    expect(isSelfSupervision("emp_1", "emp_1")).toBe(true);
    expect(isSelfSupervision("emp_1", "emp_2")).toBe(false);
    expect(SUPERVISOR_MESSAGES.self).toBe("Employees cannot supervise themselves.");
  });

  it("prevents a direct circular supervisor relationship", () => {
    // A supervises B, so B cannot supervise A.
    expect(isDirectCircularSupervision("emp_a", "emp_a")).toBe(true);
    expect(isDirectCircularSupervision("emp_a", "emp_c")).toBe(false);
    expect(isDirectCircularSupervision(undefined, "emp_a")).toBe(false);
  });

  it("blocks inactive supervisors on new records but keeps the historical selection", () => {
    expect(
      isInactiveSupervisorSelection({
        supervisorStatus: "INACTIVE",
        selectedSupervisorId: "sup_old",
        currentSupervisorId: undefined,
      }),
    ).toBe(true);

    expect(
      isInactiveSupervisorSelection({
        supervisorStatus: "INACTIVE",
        selectedSupervisorId: "sup_old",
        currentSupervisorId: "sup_old",
      }),
    ).toBe(false);

    expect(
      isInactiveSupervisorSelection({
        supervisorStatus: "ACTIVE",
        selectedSupervisorId: "sup_new",
        currentSupervisorId: "sup_old",
      }),
    ).toBe(false);
  });

  it("preserves manager relationships when migrating to supervisorId", () => {
    const rows = [
      { id: "a", managerId: "b" },
      { id: "b", managerId: "b" },
      { id: "c", managerId: "a" },
      { id: "d", managerId: null },
    ];

    const migrated = rows.map((row) => ({
      id: row.id,
      supervisorId: supervisorIdFromLegacyManager(row.managerId, row.id),
    }));

    expect(migrated).toEqual([
      { id: "a", supervisorId: "b" },
      { id: "b", supervisorId: null },
      { id: "c", supervisorId: "a" },
      { id: "d", supervisorId: null },
    ]);
  });
});
