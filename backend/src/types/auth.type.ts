import type { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export type RegisterBody = {
  email: string;
  password: string;
  role: Role;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};
