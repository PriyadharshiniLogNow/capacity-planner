import { describe, expect, it } from "vitest";
import {
  employeeResponseContainsSecrets,
  toEmployeeResponse,
} from "../src/lib/employeeMapper";
import { toAuthUser } from "../src/lib/authUser";

const employeeRow = {
  id: "emp_1",
  employeeCode: "EMP-1",
  firstName: "Jamie",
  lastName: "Rivera",
  email: "jamie@capacity.local",
  role: "Consultant",
  department: "Delivery",
  supervisorId: "sup_1",
  supervisor: {
    id: "sup_1",
    employeeCode: "EMP-0",
    firstName: "Alex",
    lastName: "Nguyen",
  },
  weeklyHours: 40,
  workingDays: [1, 2, 3, 4, 5],
  startDate: new Date("2026-01-05T00:00:00.000Z"),
  endDate: null,
  status: "ACTIVE" as const,
  createdAt: new Date("2026-01-05T00:00:00.000Z"),
  createdBy: "user_1",
  updatedAt: new Date("2026-01-05T00:00:00.000Z"),
  updatedBy: "user_1",
  password: "plaintext-should-never-leak",
  passwordHash: "$2b$10$not-a-real-hash",
  user: {
    email: "jamie@capacity.local",
    passwordHash: "$2b$10$not-a-real-hash",
  },
};

describe("employee API security", () => {
  it("never returns password or passwordHash on employee payloads", () => {
    const response = toEmployeeResponse(employeeRow);

    expect(response).not.toHaveProperty("password");
    expect(response).not.toHaveProperty("passwordHash");
    expect(response).not.toHaveProperty("user");
    expect(employeeResponseContainsSecrets(response)).toBe(false);
    expect(response.email).toBe("jamie@capacity.local");
    expect(response.supervisorId).toBe("sup_1");
    expect(response.supervisor?.firstName).toBe("Alex");
  });

  it("create envelope does not include a login user or password", () => {
    const envelope = {
      message: "Employee created successfully",
      data: { employee: toEmployeeResponse(employeeRow) },
    };
    expect(envelope.data).not.toHaveProperty("user");
    expect(employeeResponseContainsSecrets(envelope)).toBe(false);
  });
});

describe("auth API security", () => {
  it("never returns password hashes on login/register user payloads", () => {
    const authUser = toAuthUser({
      id: "user_1",
      email: "jamie@capacity.local",
      role: "EMPLOYEE",
      employeeId: "emp_1",
    });

    expect(authUser).toEqual({
      id: "user_1",
      email: "jamie@capacity.local",
      role: "EMPLOYEE",
      employeeId: "emp_1",
    });
    expect(authUser).not.toHaveProperty("password");
    expect(authUser).not.toHaveProperty("passwordHash");
    expect(employeeResponseContainsSecrets(authUser)).toBe(false);
  });
});
