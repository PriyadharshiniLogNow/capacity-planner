import type { Request, Response } from "express";
import { ZodError } from "zod";
import { prisma } from "../lib/prisma";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import type { LoginResponse, RegisterResponse } from "../types/auth.type";
import { toAuthUser } from "../lib/authUser";
import { jwtUtils } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";

function validationError(res: Response, error: ZodError) {
  return res.status(422).json({
    message: "Validation failed",
    errors: error.flatten(),
  });
}

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { email, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    return res.status(409).json({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "An account with this email already exists",
      },
    });
  }

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
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return validationError(res, parsed.error);
  }

  const { email, password } = parsed.data;

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
  const token = jwtUtils.sign(
    {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
      employeeId: authUser.employeeId,
    },
    process.env.JWT_SECRET as string,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN ??
        "7d") as `${number}${"s" | "m" | "h" | "d"}`,
    },
  );

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
