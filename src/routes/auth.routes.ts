import { Router } from "express";
import { authController } from "../controllers/AuthController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const authRouter = Router();

// POST /auth/login - Autenticação e emissão do JWT (registra a sessão no Redis com TTL)
authRouter.post("/login", (req, res) => authController.login(req, res));

// POST /auth/logout - Protegida: invalida a sessão e expulsa o token do Redis
authRouter.post("/logout", authMiddleware, (req, res) => authController.logout(req, res));

export { authRouter };
