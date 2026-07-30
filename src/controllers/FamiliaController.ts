import { Request, Response } from "express";
import { familiaService } from "../services/FamiliaService.ts";
import { AppError } from "../utils/AppError.ts";

export class FamiliaController {
  // CREATE - Cadastrar Família
  async create(req: Request, res: Response) {
    try {
      const novaFamilia = await familiaService.registerFamilia(req.body);
      return res.status(201).json(novaFamilia);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao cadastrar família:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar a família." });
    }
  }

  // READ ALL - Listar Famílias
  async index(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const familias = await familiaService.listFamilias(search ? String(search) : undefined);
      return res.json(familias);
    } catch (error) {
      console.error("Erro ao listar famílias:", error);
      return res.status(500).json({ error: "Erro interno ao buscar famílias." });
    }
  }

  // READ ONE - Obter Família por ID
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const familia = await familiaService.getFamiliaById(id);
      return res.json(familia);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar família por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar a família." });
    }
  }

  // UPDATE - Atualizar Família por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const familiaAtualizada = await familiaService.updateFamilia(id, req.body);
      return res.json(familiaAtualizada);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao atualizar família:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar a família." });
    }
  }

  // DELETE - Deletar Família por ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await familiaService.deleteFamilia(id);
      return res.json({ message: "Família excluída com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar família:", error);
      return res.status(500).json({ error: "Erro interno ao deletar a família." });
    }
  }
}

export const familiaController = new FamiliaController();
