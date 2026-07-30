import { visitaRepository } from "../repositories/VisitaRepository.ts";
import { visitaLogRepository } from "../repositories/VisitaLogRepository.ts";
import { neo4jQueueService } from "./neo4jQueue.ts";
import { AppError } from "../utils/AppError.ts";
import { Visita } from "../models/index.ts";

export class VisitaService {
  async registerVisita(data: any, authUserId: number | undefined): Promise<any> {
    const { dataVisita, observacoes, acoesRealizadas, latitude, longitude, beneficiarioId, dadosVariaveis, anexos } = data;

    if (!beneficiarioId) {
      throw new AppError("O campo 'beneficiarioId' é obrigatório.");
    }

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      throw new AppError("Latitude e Longitude são obrigatórias para o georreferenciamento da visita.");
    }

    const numLat = Number(latitude);
    const numLng = Number(longitude);

    if (isNaN(numLat) || isNaN(numLng)) {
      throw new AppError("Latitude e Longitude devem ser números válidos.");
    }

    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      throw new AppError("Latitude deve estar entre -90 e 90, e Longitude entre -180 e 180.");
    }

    const usuarioId = authUserId || data.usuarioId;
    if (!usuarioId) {
      throw new AppError("Identificação do usuário (usuarioId) é obrigatória.");
    }

    const parsedDataVisita = dataVisita ? new Date(dataVisita) : new Date();

    const novaVisita = await visitaRepository.create({
      dataVisita: parsedDataVisita,
      observacoes: observacoes || null,
      acoesRealizadas: acoesRealizadas || null,
      latitude: numLat,
      longitude: numLng,
      beneficiarioId: Number(beneficiarioId),
      usuarioId: Number(usuarioId),
    });

    neo4jQueueService.enqueue("LINK_VISITA", {
      usuarioId: Number(usuarioId),
      beneficiarioId: Number(beneficiarioId),
    });

    await visitaLogRepository.saveLog({
      visitaId: novaVisita.id,
      beneficiarioId: novaVisita.beneficiarioId,
      usuarioId: novaVisita.usuarioId,
      dataVisita: novaVisita.dataVisita,
      acoesRealizadas: novaVisita.acoesRealizadas,
      observacoes: novaVisita.observacoes,
      latitude: Number(novaVisita.latitude),
      longitude: Number(novaVisita.longitude),
      dadosVariaveis: dadosVariaveis || null,
      anexos: anexos || [],
      acao: "CREATE",
    });

    return {
      ...novaVisita.toJSON(),
      dadosVariaveis: dadosVariaveis || null,
      anexos: anexos || [],
    };
  }

  async listVisitas(search?: string, beneficiarioId?: number, usuarioId?: number): Promise<Visita[]> {
    return visitaRepository.findAll(search, beneficiarioId, usuarioId);
  }

  async getVisitaById(id: number): Promise<any> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const visita = await visitaRepository.findById(id);
    if (!visita) {
      throw new AppError("Visita não encontrada.", 404);
    }

    const log = await visitaLogRepository.getLatestLogByVisitaId(id);

    return {
      ...visita.toJSON(),
      dadosVariaveis: log ? log.dadosVariaveis : null,
      anexos: log ? log.anexos : [],
    };
  }

  async updateVisita(id: number, data: any): Promise<any> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const visitaExistente = await visitaRepository.findById(id);
    if (!visitaExistente) {
      throw new AppError("Visita não encontrada.", 404);
    }

    const { dataVisita, observacoes, acoesRealizadas, latitude, longitude, beneficiarioId, dadosVariaveis, anexos } = data;

    const updateData: any = {};
    if (dataVisita) updateData.dataVisita = new Date(dataVisita);
    if (observacoes !== undefined) updateData.observacoes = observacoes || null;
    if (acoesRealizadas !== undefined) updateData.acoesRealizadas = acoesRealizadas || null;
    if (beneficiarioId !== undefined) updateData.beneficiarioId = Number(beneficiarioId);

    if (latitude !== undefined || longitude !== undefined) {
      const numLat = Number(latitude !== undefined ? latitude : visitaExistente.latitude);
      const numLng = Number(longitude !== undefined ? longitude : visitaExistente.longitude);

      if (isNaN(numLat) || isNaN(numLng)) {
        throw new AppError("Latitude e Longitude devem ser numéricas.");
      }
      if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        throw new AppError("Latitude e Longitude fora dos limites geográficos.");
      }

      updateData.latitude = numLat;
      updateData.longitude = numLng;
    }

    const visitaAtualizada = await visitaRepository.update(id, updateData);
    if (!visitaAtualizada) {
      throw new AppError("Visita não encontrada.", 404);
    }

    const anteriorLog = await visitaLogRepository.getLatestLogByVisitaId(id);
    const logDadosVariaveis = dadosVariaveis !== undefined ? dadosVariaveis : (anteriorLog ? anteriorLog.dadosVariaveis : null);
    const logAnexos = anexos !== undefined ? anexos : (anteriorLog ? anteriorLog.anexos : []);

    await visitaLogRepository.saveLog({
      visitaId: visitaAtualizada.id,
      beneficiarioId: visitaAtualizada.beneficiarioId,
      usuarioId: visitaAtualizada.usuarioId,
      dataVisita: visitaAtualizada.dataVisita,
      acoesRealizadas: visitaAtualizada.acoesRealizadas,
      observacoes: visitaAtualizada.observacoes,
      latitude: Number(visitaAtualizada.latitude),
      longitude: Number(visitaAtualizada.longitude),
      dadosVariaveis: logDadosVariaveis,
      anexos: logAnexos,
      acao: "UPDATE",
    });

    return {
      ...visitaAtualizada.toJSON(),
      dadosVariaveis: logDadosVariaveis,
      anexos: logAnexos,
    };
  }

  async deleteVisita(id: number): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const visitaExistente = await visitaRepository.findById(id);
    if (!visitaExistente) {
      throw new AppError("Visita não encontrada.", 404);
    }

    const deletado = await visitaRepository.delete(id);
    if (!deletado) {
      throw new AppError("Visita não encontrada.", 404);
    }

    await visitaLogRepository.saveLog({
      visitaId: visitaExistente.id,
      beneficiarioId: visitaExistente.beneficiarioId,
      usuarioId: visitaExistente.usuarioId,
      dataVisita: visitaExistente.dataVisita,
      acoesRealizadas: visitaExistente.acoesRealizadas,
      observacoes: visitaExistente.observacoes,
      latitude: Number(visitaExistente.latitude),
      longitude: Number(visitaExistente.longitude),
      acao: "DELETE",
    });
  }
}

export const visitaService = new VisitaService();
