import { agendamentoRepository } from "../repositories/AgendamentoRepository.ts";
import { StatusAgendamento } from "../models/Agendamento.ts";
import { AppError } from "../utils/AppError.ts";
import { Agendamento } from "../models/index.ts";

const VALID_TRANSITIONS: Record<StatusAgendamento, StatusAgendamento[]> = {
  [StatusAgendamento.PENDENTE]: [StatusAgendamento.CONFIRMADO, StatusAgendamento.CANCELADO],
  [StatusAgendamento.CONFIRMADO]: [StatusAgendamento.REALIZADO, StatusAgendamento.CANCELADO],
  [StatusAgendamento.REALIZADO]: [],
  [StatusAgendamento.CANCELADO]: [],
};

export class AgendamentoService {
  async registerAgendamento(data: any, authUserId: number | undefined): Promise<Agendamento> {
    const { dataAgendamento, hora, status, observacoes, beneficiarioId, usuarioId } = data;

    if (!dataAgendamento || !hora || !beneficiarioId) {
      throw new AppError("Os campos 'dataAgendamento', 'hora' e 'beneficiarioId' são obrigatórios.");
    }

    const resolvedUsuarioId = authUserId || usuarioId;
    if (!resolvedUsuarioId) {
      throw new AppError("Identificação do usuário (usuarioId) é obrigatória.");
    }

    let validStatus = StatusAgendamento.PENDENTE;
    if (status) {
      if (!Object.values(StatusAgendamento).includes(status as StatusAgendamento)) {
        throw new AppError("Status inválido. Escolha entre: pendente, confirmado, realizado, cancelado.");
      }
      validStatus = status as StatusAgendamento;
    }

    const conflito = await agendamentoRepository.findConflito(Number(resolvedUsuarioId), dataAgendamento, hora);
    if (conflito) {
      throw new AppError("Este assistente social já possui um agendamento neste dia e horário.");
    }

    const novoAgendamento = await agendamentoRepository.create({
      dataAgendamento,
      hora,
      status: validStatus,
      observacoes: observacoes || null,
      beneficiarioId: Number(beneficiarioId),
      usuarioId: Number(resolvedUsuarioId),
    });

    return novoAgendamento;
  }

  async listAgendamentos(beneficiarioId?: number, usuarioId?: number): Promise<Agendamento[]> {
    return agendamentoRepository.findAll(beneficiarioId, usuarioId);
  }

  async getAgendamentoById(id: number): Promise<Agendamento> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const agendamento = await agendamentoRepository.findById(id);
    if (!agendamento) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    return agendamento;
  }

  async updateAgendamento(id: number, data: any): Promise<Agendamento> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const agendamentoExistente = await agendamentoRepository.findById(id);
    if (!agendamentoExistente) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    const { dataAgendamento, hora, status, observacoes, beneficiarioId } = data;

    const updateData: any = {};
    if (dataAgendamento !== undefined) updateData.dataAgendamento = dataAgendamento;
    if (hora !== undefined) updateData.hora = hora;
    if (observacoes !== undefined) updateData.observacoes = observacoes || null;
    if (beneficiarioId !== undefined) updateData.beneficiarioId = Number(beneficiarioId);

    if (status !== undefined) {
      if (!Object.values(StatusAgendamento).includes(status as StatusAgendamento)) {
        throw new AppError("Status inválido. Escolha entre: pendente, confirmado, realizado, cancelado.");
      }

      const statusAtual = agendamentoExistente.status;
      const statusNovo = status as StatusAgendamento;

      if (statusAtual !== statusNovo) {
        const transicoesValidas = VALID_TRANSITIONS[statusAtual];
        if (!transicoesValidas.includes(statusNovo)) {
          throw new AppError(`Transição de status inválida de '${statusAtual}' para '${statusNovo}'. Transições permitidas: ${transicoesValidas.join(", ") || "nenhuma (estado terminal)"}.`);
        }
      }

      updateData.status = statusNovo;
    }

    const newDataAgendamento = dataAgendamento !== undefined ? dataAgendamento : agendamentoExistente.dataAgendamento;
    const newHora = hora !== undefined ? hora : agendamentoExistente.hora;

    if (dataAgendamento !== undefined || hora !== undefined) {
      const conflito = await agendamentoRepository.findConflito(agendamentoExistente.usuarioId, newDataAgendamento, newHora);
      if (conflito && conflito.id !== id) {
        throw new AppError("Este assistente social já possui um agendamento neste dia e horário.");
      }
    }

    const agendamentoAtualizado = await agendamentoRepository.update(id, updateData);
    if (!agendamentoAtualizado) {
      throw new AppError("Agendamento não encontrado.", 404);
    }

    return agendamentoAtualizado;
  }

  async deleteAgendamento(id: number): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const deletado = await agendamentoRepository.delete(id);
    if (!deletado) {
      throw new AppError("Agendamento não encontrado.", 404);
    }
  }
}

export const agendamentoService = new AgendamentoService();
