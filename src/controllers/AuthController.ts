import { Request, Response } from "express";
import { authService } from "../services/AuthService.ts";
import { AppError } from "../utils/AppError.ts";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 dia
  path: "/",
};

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.authenticate(req.body);

      // Define o token como cookie HttpOnly — inacessível ao JavaScript do frontend
      res.cookie("geopb_token", result.token, COOKIE_OPTIONS);

      // Retorna apenas os dados do usuário (sem o token no body)
      return res.json({ user: result.user });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro na autenticação:", error);
      return res.status(500).json({ error: "Erro interno ao realizar login." });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const token = req.cookies?.geopb_token;
      if (!token) {
        return res.status(400).json({ error: "Token ausente." });
      }

      await authService.logout(token);

      // Remove o cookie do navegador
      res.clearCookie("geopb_token", { ...COOKIE_OPTIONS, maxAge: 0 });

      return res.json({ message: "Logout realizado com sucesso. Sessão invalidada no Redis." });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      return res.status(500).json({ error: "Erro interno ao realizar logout." });
    }
  }

  async me(req: AuthenticatedRequest, res: Response) {
    // req.user é populado pelo authMiddleware após validar o cookie
    return res.json({ user: req.user });
  }
}

export const authController = new AuthController();
