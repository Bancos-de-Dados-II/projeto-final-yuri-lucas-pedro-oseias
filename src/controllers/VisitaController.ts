import { Request, Response } from "express";
import { visitaRepository } from "../repositories/VisitaRepository.ts";

export class VisitaController {
  // CREATE - Registrar Visita (data, observacoes, acoesRealizadas, lat/long, beneficiarioId)
  async create(req: Request, res: Response) {
    try {
      const { dataVisita, observacoes, acoesRealizadas, latitude, longitude, beneficiarioId } = req.body;

      if (!beneficiarioId) {
        return res.status(400).json({ error: "O campo 'beneficiarioId' é obrigatório." });
      }

      if (
        latitude === undefined ||
        latitude === null ||
        latitude === "" ||
        longitude === undefined ||
        longitude === null ||
        longitude === ""
      ) {
        return res.status(400).json({
          error: "Latitude e Longitude são obrigatórias para o georreferenciamento da visita.",
        });
      }

      const numLat = Number(latitude);
      const numLng = Number(longitude);

      if (isNaN(numLat) || isNaN(numLng)) {
        return res.status(400).json({
          error: "Latitude e Longitude devem ser números válidos.",
        });
      }

      if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({
          error: "Latitude deve estar entre -90 e 90, e Longitude entre -180 e 180.",
        });
      }

      // Obtém o usuarioId do token autenticado ou da requisição
      const usuarioId = (req as any).user?.id || req.body.usuarioId;
      if (!usuarioId) {
        return res.status(400).json({ error: "Identificação do usuário (usuarioId) é obrigatória." });
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

      return res.status(201).json(novaVisita);
    } catch (error) {
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

      const visitas = await visitaRepository.findAll(
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
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const visita = await visitaRepository.findById(id);
      if (!visita) {
        return res.status(404).json({ error: "Visita não encontrada." });
      }

      return res.json(visita);
    } catch (error) {
      console.error("Erro ao buscar visita por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar a visita." });
    }
  }

  // UPDATE - Atualizar Visita por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const visitaExistente = await visitaRepository.findById(id);
      if (!visitaExistente) {
        return res.status(404).json({ error: "Visita não encontrada." });
      }

      const { dataVisita, observacoes, acoesRealizadas, latitude, longitude, beneficiarioId } = req.body;

      const updateData: any = {};
      if (dataVisita) updateData.dataVisita = new Date(dataVisita);
      if (observacoes !== undefined) updateData.observacoes = observacoes || null;
      if (acoesRealizadas !== undefined) updateData.acoesRealizadas = acoesRealizadas || null;
      if (beneficiarioId !== undefined) updateData.beneficiarioId = Number(beneficiarioId);

      if (latitude !== undefined || longitude !== undefined) {
        const numLat = Number(latitude !== undefined ? latitude : visitaExistente.latitude);
        const numLng = Number(longitude !== undefined ? longitude : visitaExistente.longitude);

        if (isNaN(numLat) || isNaN(numLng)) {
          return res.status(400).json({ error: "Latitude e Longitude devem ser numéricas." });
        }
        if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
          return res.status(400).json({ error: "Latitude e Longitude fora dos limites geográficos." });
        }

        updateData.latitude = numLat;
        updateData.longitude = numLng;
      }

      const visitaAtualizada = await visitaRepository.update(id, updateData);
      return res.json(visitaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar visita:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar a visita." });
    }
  }

  // DELETE - Deletar Visita por ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const deletado = await visitaRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Visita não encontrada." });
      }

      return res.json({ message: "Visita excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar visita:", error);
      return res.status(500).json({ error: "Erro interno ao deletar a visita." });
    }
  }
}

export const visitaController = new VisitaController();
