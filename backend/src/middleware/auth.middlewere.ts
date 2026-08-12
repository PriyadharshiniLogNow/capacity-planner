import { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../types/auth.type";
import { jwtUtils } from "../utils/jwt";

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
    ) as AuthUser;

    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};
