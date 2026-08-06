import { Router } from "express";
import { authController } from "../controllers/AuthController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { validateBody } from "../middlewares/validate.ts";
import { loginSchema } from "../schemas/authSchema.ts";

const authRouter = Router();

// POST /auth/login - Autenticação: emite JWT e define cookie HttpOnly
authRouter.post("/login", validateBody(loginSchema), (req, res) => authController.login(req, res));

// POST /auth/logout - Protegida: invalida a sessão no Redis e limpa o cookie
authRouter.post("/logout", authMiddleware, (req, res) => authController.logout(req, res));

// GET /auth/me - Retorna os dados do usuário autenticado via cookie
authRouter.get("/me", authMiddleware, (req, res) => authController.me(req, res));

export { authRouter };
