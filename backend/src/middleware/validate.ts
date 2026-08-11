import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      if (part === "query") {
        // Express 5 query is a getter — assign via Object.defineProperty when needed
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      } else {
        req[part] = parsed;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
