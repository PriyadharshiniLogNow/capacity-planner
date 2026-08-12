import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { normalizeEmail } from "../schemas/auth.schema";
import type { AuthUser } from "../types/auth.type";
import { jwtUtils } from "../utils/jwt";

type TokenPayload = JwtPayload & Partial<AuthUser>;

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : undefined;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwtUtils.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as TokenPayload;

    const tokenId =
      (typeof decoded.id === "string" && decoded.id) ||
      (typeof decoded.sub === "string" && decoded.sub) ||
      undefined;

    if (tokenId && decoded.email && decoded.role) {
      req.user = {
        id: tokenId,
        email: decoded.email,
        role: decoded.role,
        employeeId: decoded.employeeId ?? null,
      };
      return next();
    }

    // Tokens that have email/role but omit id (or use a non-standard claim)
    if (typeof decoded.email === "string" && decoded.email.length > 0) {
      const user = await prisma.user.findUnique({
        where: { email: normalizeEmail(decoded.email) },
        select: {
          id: true,
          email: true,
          role: true,
          employeeId: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      };
      return next();
    }

    return res.status(401).json({ message: "Unauthorized" });
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
