import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta?.target as string[]).join(", ")
        : "field";
      res.status(409).json({
        error: {
          code: "CONFLICT",
          message: `A record with this ${target} already exists`,
        },
      });
      return;
    }
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal server error",
    },
  });
}
