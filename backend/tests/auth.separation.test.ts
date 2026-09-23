import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "../src/utils/password";

describe("authentication remains separate from employee master data", () => {
  it("continues to verify existing user password hashes for login", async () => {
    const existingHash = await hashPassword("employee123");

    await expect(comparePassword("employee123", existingHash)).resolves.toBe(true);
    await expect(comparePassword("wrong-password", existingHash)).resolves.toBe(false);
  });

  it("does not treat a blank or default password as a valid existing login", async () => {
    const existingHash = await hashPassword("employee123");
    await expect(comparePassword("", existingHash)).resolves.toBe(false);
  });
});
