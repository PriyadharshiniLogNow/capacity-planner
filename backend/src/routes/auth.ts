import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middlewere";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", authMiddleware, me);

export { authRoutes };