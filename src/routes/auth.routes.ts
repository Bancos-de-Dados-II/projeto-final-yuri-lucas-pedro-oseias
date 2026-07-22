import { Router } from "express";
import { authController } from "../controllers/AuthController.ts";

const authRouter = Router();

// POST /auth/login
authRouter.post("/login", (req, res) => authController.login(req, res));

// POST /auth/logout
authRouter.post("/logout", (req, res) => authController.logout(req, res));

export { authRouter };
