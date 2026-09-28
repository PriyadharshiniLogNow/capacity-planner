import { describe, expect, it } from "vitest";
import { employeeCountsTowardDefaultCapacityPool } from "../src/lib/capacityPolicy";

describe("capacity policy", () => {
  it("includes only active employees in the default capacity pool", () => {
    expect(employeeCountsTowardDefaultCapacityPool("ACTIVE")).toBe(true);
    expect(employeeCountsTowardDefaultCapacityPool("INACTIVE")).toBe(false);
  });
});
