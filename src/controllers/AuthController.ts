import { Request, Response } from "express";
import { userRepository } from "../repositories/UserRepository.ts";
import { comparePassword, generateToken } from "../services/security.ts";
import { sessionService } from "../services/sessionService.ts";

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = req.body;

      if (!email || !senha) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      }

      const usuario = await userRepository.findByEmail(email);
      if (!usuario) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      const senhaValida = await comparePassword(senha, usuario.senhaHash);
      if (!senhaValida) {
        return res.status(401).json({ error: "E-mail ou senha incorretos." });
      }

      const token = generateToken({
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
      });

      // Salva a sessão no Redis com TTL de 24h (86400s)
      await sessionService.createSession(token, {
        userId: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        createdAt: new Date().toISOString(),
      }, 86400);

      const { senhaHash: _, ...usuarioSemSenha } = usuario.toJSON();

      return res.json({
        user: usuarioSemSenha,
        token,
      });
    } catch (error) {
      console.error("Erro na autenticação:", error);
      return res.status(500).json({ error: "Erro interno ao realizar login." });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const parts = authHeader.split(" ");
        if (parts.length === 2 && parts[0] === "Bearer") {
          const token = parts[1];
          await sessionService.destroySession(token);
        }
      }

      return res.json({ message: "Logout realizado com sucesso." });
    } catch (error) {
      console.error("Erro ao realizar logout:", error);
      return res.status(500).json({ error: "Erro interno ao realizar logout." });
    }
  }
}

export const authController = new AuthController();
