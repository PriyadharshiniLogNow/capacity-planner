import { Request, Response, NextFunction } from "express";
import type { AuthUser } from "../types/auth.type";
import { jwtUtils } from "../utils/jwt";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const decoded = jwtUtils.verify(
    token,
    process.env.JWT_SECRET as string,
  ) as AuthUser;

  req.user = decoded;
  next();
};
