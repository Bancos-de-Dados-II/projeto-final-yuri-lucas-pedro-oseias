import { Request, Response } from "express";
import { agendamentoService } from "../services/AgendamentoService.ts";
import { AppError } from "../utils/AppError.ts";

export class AgendamentoController {
  // CREATE
  async create(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      const novoAgendamento = await agendamentoService.registerAgendamento(req.body, usuarioId);
      return res.status(201).json(novoAgendamento);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao criar agendamento:", error);
      return res.status(500).json({ error: "Erro interno ao criar o agendamento." });
    }
  }

  // READ ALL
  async index(req: Request, res: Response) {
    try {
      const { beneficiarioId, usuarioId } = req.query;
      const numBeneficiario = beneficiarioId ? Number(beneficiarioId) : undefined;
      const numUsuario = usuarioId ? Number(usuarioId) : undefined;

      const agendamentos = await agendamentoService.listAgendamentos(numBeneficiario, numUsuario);
      return res.json(agendamentos);
    } catch (error) {
      console.error("Erro ao listar agendamentos:", error);
      return res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
    }
  }

  // READ ONE
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const agendamento = await agendamentoService.getAgendamentoById(id);
      return res.json(agendamento);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar agendamento por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o agendamento." });
    }
  }

  // UPDATE
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const agendamentoAtualizado = await agendamentoService.updateAgendamento(id, req.body);
      return res.json(agendamentoAtualizado);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao atualizar agendamento:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o agendamento." });
    }
  }

  // DELETE
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await agendamentoService.deleteAgendamento(id);
      return res.json({ message: "Agendamento excluído com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar agendamento:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o agendamento." });
    }
  }
}

export const agendamentoController = new AgendamentoController();
