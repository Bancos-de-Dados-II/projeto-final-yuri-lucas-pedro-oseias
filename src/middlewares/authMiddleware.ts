import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../services/security.ts";
import { sessionService } from "../services/sessionService.ts";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Lê o token do cookie HttpOnly — nunca do header Authorization
  const token = req.cookies?.geopb_token;

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação não fornecido." });
  }

  try {
    const decoded = verifyToken(token);

    // Valida no Redis se a sessão do token continua ativa
    const sessionActive = await sessionService.isSessionActive(token);
    if (!sessionActive) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}
