import { Request, Response } from "express";
import { visitaService } from "../services/VisitaService.ts";
import { AppError } from "../utils/AppError.ts";

export class VisitaController {
  // CREATE - Registrar Visita
  async create(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      const resultado = await visitaService.registerVisita(req.body, usuarioId);
      return res.status(201).json(resultado);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao registrar visita:", error);
      return res.status(500).json({ error: "Erro interno ao registrar a visita." });
    }
  }

  // READ ALL - Listar Visitas
  async index(req: Request, res: Response) {
    try {
      const { search, beneficiarioId, usuarioId } = req.query;
      const numBeneficiario = beneficiarioId ? Number(beneficiarioId) : undefined;
      const numUsuario = usuarioId ? Number(usuarioId) : undefined;

      const visitas = await visitaService.listVisitas(
        search ? String(search) : undefined,
        numBeneficiario,
        numUsuario
      );

      return res.json(visitas);
    } catch (error) {
      console.error("Erro ao listar visitas:", error);
      return res.status(500).json({ error: "Erro interno ao buscar visitas." });
    }
  }

  // READ ONE - Obter Visita por ID
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const visitaComVariaveis = await visitaService.getVisitaById(id);
      return res.json(visitaComVariaveis);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar visita por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar a visita." });
    }
  }

  // UPDATE - Atualizar Visita por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const visitaAtualizada = await visitaService.updateVisita(id, req.body);
      return res.json(visitaAtualizada);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao atualizar visita:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar a visita." });
    }
  }

  // DELETE - Deletar Visita por ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await visitaService.deleteVisita(id);
      return res.json({ message: "Visita excluída com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar visita:", error);
      return res.status(500).json({ error: "Erro interno ao deletar a visita." });
    }
  }
}

export const visitaController = new VisitaController();
