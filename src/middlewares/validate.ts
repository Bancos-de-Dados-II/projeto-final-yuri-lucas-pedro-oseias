import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Erro de validação nos dados fornecidos.",
          details: error.issues.map((err) => ({
            campo: err.path.join("."),
            mensagem: err.message,
          })),
        });
      }
      return res.status(500).json({ error: "Erro interno ao validar dados." });
    }
  };
};
