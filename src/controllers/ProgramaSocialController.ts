import { Request, Response } from "express";
import { programaSocialService } from "../services/ProgramaSocialService.ts";
import { AppError } from "../utils/AppError.ts";

export class ProgramaSocialController {
  // CREATE
  async create(req: Request, res: Response) {
    try {
      const novoPrograma = await programaSocialService.registerProgramaSocial(req.body);
      return res.status(201).json(novoPrograma);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao criar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar o programa social." });
    }
  }

  // READ ALL
  async index(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const programas = await programaSocialService.listProgramasSociais(search ? String(search) : undefined);
      return res.json(programas);
    } catch (error) {
      console.error("Erro ao listar programas sociais:", error);
      return res.status(500).json({ error: "Erro interno ao buscar programas sociais." });
    }
  }

  // READ ONE
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const programa = await programaSocialService.getProgramaSocialById(id);
      return res.json(programa);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar programa social por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o programa social." });
    }
  }

  // UPDATE
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const programaAtualizado = await programaSocialService.updateProgramaSocial(id, req.body);
      return res.json(programaAtualizado);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao atualizar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o programa social." });
    }
  }

  // DELETE
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await programaSocialService.deleteProgramaSocial(id);
      return res.json({ message: "Programa social excluído com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o programa social." });
    }
  }

  // ASSOCIATE BENEFICIARY TO PROGRAM
  async associateBeneficiary(req: Request, res: Response) {
    try {
      const { beneficiarioId, programaId } = req.body;
      const vinculo = await programaSocialService.associateBeneficiary(beneficiarioId, programaId);
      return res.status(201).json(vinculo);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao associar beneficiário ao programa:", error);
      return res.status(500).json({ error: "Erro interno ao criar vínculo." });
    }
  }

  // DISASSOCIATE BENEFICIARY FROM PROGRAM
  async disassociateBeneficiary(req: Request, res: Response) {
    try {
      const { beneficiarioId, programaId } = req.body;
      await programaSocialService.disassociateBeneficiary(beneficiarioId, programaId);
      return res.json({ message: "Beneficiário desassociado do programa com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao desassociar beneficiário do programa:", error);
      return res.status(500).json({ error: "Erro interno ao remover vínculo." });
    }
  }
}

export const programaSocialController = new ProgramaSocialController();
