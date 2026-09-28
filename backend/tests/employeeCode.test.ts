import { describe, expect, it } from "vitest";
import {
  formatEmployeeCode,
  parseEmployeeCodeSequence,
} from "../src/lib/employeeCode";

describe("employeeCode", () => {
  it("formats sequential employee IDs with a fixed prefix and width", () => {
    expect(formatEmployeeCode(1)).toBe("EMP-001");
    expect(formatEmployeeCode(42)).toBe("EMP-042");
    expect(formatEmployeeCode(1000)).toBe("EMP-1000");
  });

  it("parses generated employee IDs case-insensitively", () => {
    expect(parseEmployeeCodeSequence("EMP-001")).toBe(1);
    expect(parseEmployeeCodeSequence("emp-010")).toBe(10);
    expect(parseEmployeeCodeSequence("E001")).toBeNull();
    expect(parseEmployeeCodeSequence("EMP-ABC")).toBeNull();
  });
});
