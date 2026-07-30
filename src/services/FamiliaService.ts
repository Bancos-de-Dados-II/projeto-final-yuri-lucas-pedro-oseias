import { familiaRepository } from "../repositories/FamiliaRepository.ts";
import { neo4jQueueService } from "./neo4jQueue.ts";
import { AppError } from "../utils/AppError.ts";
import { Familia } from "../models/index.ts";

export class FamiliaService {
  async registerFamilia(data: any): Promise<Familia> {
    const { nomeResponsavel, endereco, latitude, longitude, rendaFamiliar, qtdMembros } = data;

    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
      throw new AppError("Latitude e Longitude são obrigatórias para o georreferenciamento da família.");
    }

    const numLat = Number(latitude);
    const numLng = Number(longitude);

    if (isNaN(numLat) || isNaN(numLng)) {
      throw new AppError("Latitude e Longitude devem ser valores numéricos válidos.");
    }

    if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
      throw new AppError("Latitude deve estar entre -90 e 90, e Longitude entre -180 e 180.");
    }

    const novaFamilia = await familiaRepository.create({
      nomeResponsavel,
      endereco,
      latitude: numLat,
      longitude: numLng,
      rendaFamiliar: rendaFamiliar ? Number(rendaFamiliar) : null,
      qtdMembros: Number(qtdMembros),
    });

    neo4jQueueService.enqueue("SYNC_FAMILIA", novaFamilia.toJSON());

    return novaFamilia;
  }

  async listFamilias(search?: string): Promise<Familia[]> {
    return familiaRepository.findAll(search);
  }

  async getFamiliaById(id: number): Promise<Familia> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const familia = await familiaRepository.findById(id);
    if (!familia) {
      throw new AppError("Família não encontrada.", 404);
    }

    return familia;
  }

  async updateFamilia(id: number, data: any): Promise<Familia> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const familiaExistente = await familiaRepository.findById(id);
    if (!familiaExistente) {
      throw new AppError("Família não encontrada.", 404);
    }

    const { nomeResponsavel, endereco, latitude, longitude, rendaFamiliar, qtdMembros } = data;

    const updateData: any = {};
    if (nomeResponsavel) updateData.nomeResponsavel = nomeResponsavel;
    if (endereco) updateData.endereco = endereco;
    if (rendaFamiliar !== undefined) updateData.rendaFamiliar = rendaFamiliar ? Number(rendaFamiliar) : null;
    if (qtdMembros !== undefined) updateData.qtdMembros = Number(qtdMembros);

    if (latitude !== undefined || longitude !== undefined) {
      const numLat = Number(latitude !== undefined ? latitude : familiaExistente.latitude);
      const numLng = Number(longitude !== undefined ? longitude : familiaExistente.longitude);

      if (isNaN(numLat) || isNaN(numLng)) {
        throw new AppError("Latitude e Longitude devem ser numéricas.");
      }
      if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        throw new AppError("Latitude e Longitude fora dos limites geográficos.");
      }

      updateData.latitude = numLat;
      updateData.longitude = numLng;
    }

    const familiaAtualizada = await familiaRepository.update(id, updateData);
    if (!familiaAtualizada) {
      throw new AppError("Erro ao atualizar a família.", 500);
    }

    neo4jQueueService.enqueue("SYNC_FAMILIA", familiaAtualizada.toJSON());

    return familiaAtualizada;
  }

  async deleteFamilia(id: number): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const deletado = await familiaRepository.delete(id);
    if (!deletado) {
      throw new AppError("Família não encontrada.", 404);
    }

    neo4jQueueService.enqueue("DELETE_NODE", { label: "Familia", id });
  }
}

export const familiaService = new FamiliaService();
