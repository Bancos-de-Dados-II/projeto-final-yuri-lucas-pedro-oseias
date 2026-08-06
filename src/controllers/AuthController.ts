import { Request, Response } from "express";
import { authService } from "../services/AuthService.ts";
import { AppError } from "../utils/AppError.ts";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.authenticate(req.body);
      res.cookie("geopb_token", result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
      });
      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro na autenticação:", error);
      return res.status(500).json({ error: "Erro interno ao realizar login." });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const token = req.cookies?.geopb_token;
      if (!token) {
        return res.status(400).json({ error: "Token ausente ou inválido." });
      }

      await authService.logout(token);
      res.clearCookie("geopb_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      });

      return res.json({ message: "Logout realizado com sucesso. Sessão invalidada no Redis." });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      return res.status(500).json({ error: "Erro interno ao realizar logout." });
    }
  }
}

export const authController = new AuthController();
