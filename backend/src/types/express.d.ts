import type { AuthUser } from "./auth.type";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export {};
