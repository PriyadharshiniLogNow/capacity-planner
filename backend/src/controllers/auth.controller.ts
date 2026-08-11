import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import type {
  AuthUser,
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
} from "../types/auth.type";
import { jwtUtils } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

function toAuthUser(user: AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}

export const register = async (req: Request, res: Response) => {
  const { email, password, role } = req.body as RegisterBody;

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });

  const body: RegisterResponse = {
    message: "User registered successfully",
    user: toAuthUser(user),
  };

  res.status(201).json(body);
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const authUser = toAuthUser(user);
  const token = jwtUtils.sign(authUser, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      "7d") as `${number}${"s" | "m" | "h" | "d"}`,
  });

  const body: LoginResponse = {
    message: "Login successful",
    token,
    user: authUser,
  };

  return res.status(200).json(body);
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return res.status(200).json(req.user);
};
