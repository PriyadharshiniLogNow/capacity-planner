export type Role = "ADMIN" | "SUPERVISOR" | "EMPLOYEE";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
  employeeId: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthenticatedUser;
};

export type RegisterRequest = {
  email: string;
  password: string;
  role: Role;
};

export type RegisterResponse = {
  message: string;
  user: AuthenticatedUser;
};
