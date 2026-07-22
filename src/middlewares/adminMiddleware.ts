import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware.ts";
import { TipoUsuario } from "../models/index.ts";

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Usuário não autenticado." });
  }

  if (req.user.tipo !== TipoUsuario.ADMINISTRADOR) {
    return res.status(403).json({
      error: "Acesso negado. Apenas usuários com perfil 'administrador' podem realizar esta operação.",
    });
  }

  return next();
}
