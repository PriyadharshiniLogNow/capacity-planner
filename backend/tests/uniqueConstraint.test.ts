import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  employeeEmailConflictBody,
  employeeIdConflictBody,
  isPrismaUniqueConstraintError,
  projectIdConflictBody,
  uniqueConstraintIncludes,
} from "../src/lib/uniqueConstraint";

describe("unique constraint helpers", () => {
  it("rejects duplicate Employee ID with a field-level message", () => {
    const body = employeeIdConflictBody();
    expect(body.message).toBe("Employee ID already exists.");
    expect(body.errors.fieldErrors.employeeCode).toEqual([
      "Employee ID already exists.",
    ]);
  });

  it("rejects duplicate Email with a field-level message", () => {
    const body = employeeEmailConflictBody();
    expect(body.message).toBe("Email already exists.");
    expect(body.errors.fieldErrors.email).toEqual(["Email already exists."]);
  });

  it("rejects duplicate Project ID with a field-level message", () => {
    const body = projectIdConflictBody();
    expect(body.message).toBe("Project ID already exists.");
    expect(body.errors.fieldErrors.projectCode).toEqual([
      "Project ID already exists.",
    ]);
  });

  it("detects Prisma unique-constraint race errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique", {
      code: "P2002",
      clientVersion: "test",
      meta: { target: ["employeeCode"] },
    });

    expect(isPrismaUniqueConstraintError(error)).toBe(true);
    expect(uniqueConstraintIncludes(error, "employeeCode")).toBe(true);
  });
});
