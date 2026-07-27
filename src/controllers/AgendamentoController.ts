import { Request, Response } from "express";
import { agendamentoRepository } from "../repositories/AgendamentoRepository.ts";
import { StatusAgendamento } from "../models/Agendamento.ts";

const VALID_TRANSITIONS: Record<StatusAgendamento, StatusAgendamento[]> = {
  [StatusAgendamento.PENDENTE]: [StatusAgendamento.CONFIRMADO, StatusAgendamento.CANCELADO],
  [StatusAgendamento.CONFIRMADO]: [StatusAgendamento.REALIZADO, StatusAgendamento.CANCELADO],
  [StatusAgendamento.REALIZADO]: [],
  [StatusAgendamento.CANCELADO]: [],
};

export class AgendamentoController {
  // CREATE
  async create(req: Request, res: Response) {
    try {
      const { dataAgendamento, hora, status, observacoes, beneficiarioId } = req.body;

      if (!dataAgendamento || !hora || !beneficiarioId) {
        return res.status(400).json({ error: "Os campos 'dataAgendamento', 'hora' e 'beneficiarioId' são obrigatórios." });
      }

      // Obtém o usuarioId do token autenticado
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      if (!usuarioId) {
        return res.status(400).json({ error: "Identificação do usuário (usuarioId) é obrigatória." });
      }

      // Validação de Status
      let validStatus = StatusAgendamento.PENDENTE;
      if (status) {
        if (!Object.values(StatusAgendamento).includes(status as StatusAgendamento)) {
          return res.status(400).json({ error: "Status inválido. Escolha entre: pendente, confirmado, realizado, cancelado." });
        }
        validStatus = status as StatusAgendamento;
      }

      // Impedir agendamento no mesmo dia e horário para o mesmo assistente
      const conflito = await agendamentoRepository.findConflito(Number(usuarioId), dataAgendamento, hora);
      if (conflito) {
        return res.status(400).json({ error: "Este assistente social já possui um agendamento neste dia e horário." });
      }

      const novoAgendamento = await agendamentoRepository.create({
        dataAgendamento,
        hora,
        status: validStatus,
        observacoes: observacoes || null,
        beneficiarioId: Number(beneficiarioId),
        usuarioId: Number(usuarioId),
      });

      return res.status(201).json(novoAgendamento);
    } catch (error) {
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

      const agendamentos = await agendamentoRepository.findAll(numBeneficiario, numUsuario);
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
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const agendamento = await agendamentoRepository.findById(id);
      if (!agendamento) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }

      return res.json(agendamento);
    } catch (error) {
      console.error("Erro ao buscar agendamento por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o agendamento." });
    }
  }

  // UPDATE
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const agendamentoExistente = await agendamentoRepository.findById(id);
      if (!agendamentoExistente) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }

      const { dataAgendamento, hora, status, observacoes, beneficiarioId } = req.body;

      const updateData: any = {};
      if (dataAgendamento !== undefined) updateData.dataAgendamento = dataAgendamento;
      if (hora !== undefined) updateData.hora = hora;
      if (observacoes !== undefined) updateData.observacoes = observacoes || null;
      if (beneficiarioId !== undefined) updateData.beneficiarioId = Number(beneficiarioId);

      if (status !== undefined) {
        if (!Object.values(StatusAgendamento).includes(status as StatusAgendamento)) {
          return res.status(400).json({ error: "Status inválido. Escolha entre: pendente, confirmado, realizado, cancelado." });
        }

        const statusAtual = agendamentoExistente.status;
        const statusNovo = status as StatusAgendamento;

        if (statusAtual !== statusNovo) {
          const transicoesValidas = VALID_TRANSITIONS[statusAtual];
          if (!transicoesValidas.includes(statusNovo)) {
            return res.status(400).json({
              error: `Transição de status inválida de '${statusAtual}' para '${statusNovo}'. Transições permitidas: ${transicoesValidas.join(", ") || "nenhuma (estado terminal)"}.`,
            });
          }
        }

        updateData.status = statusNovo;
      }

      // Impedir conflito se a data ou a hora mudarem para o mesmo assistente
      const newDataAgendamento = dataAgendamento !== undefined ? dataAgendamento : agendamentoExistente.dataAgendamento;
      const newHora = hora !== undefined ? hora : agendamentoExistente.hora;

      if (dataAgendamento !== undefined || hora !== undefined) {
        const conflito = await agendamentoRepository.findConflito(agendamentoExistente.usuarioId, newDataAgendamento, newHora);
        if (conflito && conflito.id !== id) {
          return res.status(400).json({ error: "Este assistente social já possui um agendamento neste dia e horário." });
        }
      }

      const agendamentoAtualizado = await agendamentoRepository.update(id, updateData);
      return res.json(agendamentoAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar agendamento:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar the agendamento." });
    }
  }

  // DELETE
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const deletado = await agendamentoRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Agendamento não encontrado." });
      }

      return res.json({ message: "Agendamento excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar agendamento:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o agendamento." });
    }
  }
}

export const agendamentoController = new AgendamentoController();
