import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import type { AuthUser } from "../types/auth.type";
import { jwtUtils } from "../utils/jwt";
import { forbidden, unauthorized } from "../lib/errors";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized("Missing or invalid Authorization header");
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw unauthorized("Missing or invalid Authorization header");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw unauthorized("JWT secret is not configured");
    }

    let decoded: AuthUser;
    try {
      decoded = jwtUtils.verify(token, secret) as AuthUser;
    } catch {
      throw unauthorized("Invalid or expired token");
    }

    if (!decoded?.id || !decoded?.email || !decoded?.role) {
      throw unauthorized("Invalid or expired token");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export function requireRoles(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw unauthorized();
      }
      if (!allowed.includes(req.user.role)) {
        throw forbidden();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
