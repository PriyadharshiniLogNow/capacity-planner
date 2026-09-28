import { describe, expect, it } from "vitest";
import {
  formatProjectCode,
  parseProjectCodeSequence,
} from "../src/lib/projectCode";

describe("projectCode", () => {
  it("formats sequential project IDs with a fixed prefix and width", () => {
    expect(formatProjectCode(1)).toBe("PROJ-001");
    expect(formatProjectCode(42)).toBe("PROJ-042");
    expect(formatProjectCode(1000)).toBe("PROJ-1000");
  });

  it("parses generated project IDs case-insensitively", () => {
    expect(parseProjectCodeSequence("PROJ-001")).toBe(1);
    expect(parseProjectCodeSequence("proj-010")).toBe(10);
    expect(parseProjectCodeSequence("PRJ-100")).toBeNull();
    expect(parseProjectCodeSequence("PROJ-ABC")).toBeNull();
  });
});
