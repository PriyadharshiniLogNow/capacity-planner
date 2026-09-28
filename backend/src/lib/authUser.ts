import type { AuthUser } from "../types/auth.type";

export function toAuthUser(user: {
  id: string;
  email: string;
  role: AuthUser["role"];
  employeeId: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
  };
}
