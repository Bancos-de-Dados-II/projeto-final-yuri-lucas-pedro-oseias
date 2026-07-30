import { Request, Response } from "express";
import { authService } from "../services/AuthService.ts";
import { AppError } from "../utils/AppError.ts";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const result = await authService.authenticate(req.body);
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
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(400).json({ error: "Cabeçalho de autorização ausente." });
      }

      const parts = authHeader.split(" ");
      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(400).json({ error: "Formato de token inválido." });
      }

      const token = parts[1];
      await authService.logout(token);

      return res.json({ message: "Logout realizado com sucesso. Sessão invalidada no Redis." });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      return res.status(500).json({ error: "Erro interno ao realizar logout." });
    }
  }
}

export const authController = new AuthController();
