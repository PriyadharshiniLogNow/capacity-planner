import { Prisma } from "@prisma/client";

export function isPrismaUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export function uniqueConstraintTargets(error: Prisma.PrismaClientKnownRequestError): string[] {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  if (typeof target === "string") {
    return [target];
  }
  return [];
}

export function uniqueConstraintIncludes(
  error: Prisma.PrismaClientKnownRequestError,
  field: string,
): boolean {
  return uniqueConstraintTargets(error).some((value) =>
    value.toLowerCase().includes(field.toLowerCase()),
  );
}

export function employeeIdConflictBody() {
  return {
    message: "Employee ID already exists.",
    errors: {
      formErrors: [] as string[],
      fieldErrors: { employeeCode: ["Employee ID already exists."] },
    },
  };
}

export function employeeEmailConflictBody() {
  return {
    message: "Email already exists.",
    errors: {
      formErrors: [] as string[],
      fieldErrors: { email: ["Email already exists."] },
    },
  };
}

export function projectIdConflictBody() {
  return {
    message: "Project ID already exists.",
    errors: {
      formErrors: [] as string[],
      fieldErrors: { projectCode: ["Project ID already exists."] },
    },
  };
}
