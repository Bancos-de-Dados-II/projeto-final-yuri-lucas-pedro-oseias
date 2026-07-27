import { Request, Response } from "express";
import { familiaRepository } from "../repositories/FamiliaRepository.ts";
import { neo4jQueueService } from "../services/neo4jQueue.ts";

export class FamiliaController {
  // CREATE - Cadastrar Família (lat/long obrigatórios)
  async create(req: Request, res: Response) {
    try {
      const { nomeResponsavel, endereco, latitude, longitude, rendaFamiliar, qtdMembros } = req.body;

      if (!nomeResponsavel || !endereco || qtdMembros === undefined || qtdMembros === null) {
        return res.status(400).json({
          error: "Campos 'nomeResponsavel', 'endereco' e 'qtdMembros' são obrigatórios.",
        });
      }

      // Validação estrita de latitude e longitude obrigatórias
      if (
        latitude === undefined ||
        latitude === null ||
        latitude === "" ||
        longitude === undefined ||
        longitude === null ||
        longitude === ""
      ) {
        return res.status(400).json({
          error: "Latitude e Longitude são obrigatórias para o georreferenciamento da família.",
        });
      }

      const numLat = Number(latitude);
      const numLng = Number(longitude);

      if (isNaN(numLat) || isNaN(numLng)) {
        return res.status(400).json({
          error: "Latitude e Longitude devem ser valores numéricos válidos.",
        });
      }

      if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({
          error: "Latitude deve estar entre -90 e 90, e Longitude entre -180 e 180.",
        });
      }

      const novaFamilia = await familiaRepository.create({
        nomeResponsavel,
        endereco,
        latitude: numLat,
        longitude: numLng,
        rendaFamiliar: rendaFamiliar ? Number(rendaFamiliar) : null,
        qtdMembros: Number(qtdMembros),
      });

      // Propagação assíncrona pós-escrita para o Neo4j (não-bloqueante)
      neo4jQueueService.enqueue("SYNC_FAMILIA", novaFamilia.toJSON());

      return res.status(201).json(novaFamilia);
    } catch (error) {
      console.error("Erro ao cadastrar família:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar a família." });
    }
  }

  // READ ALL - Listar Famílias
  async index(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const familias = await familiaRepository.findAll(search ? String(search) : undefined);
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
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const familia = await familiaRepository.findById(id);
      if (!familia) {
        return res.status(404).json({ error: "Família não encontrada." });
      }

      return res.json(familia);
    } catch (error) {
      console.error("Erro ao buscar família por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar a família." });
    }
  }

  // UPDATE - Atualizar Família por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const familiaExistente = await familiaRepository.findById(id);
      if (!familiaExistente) {
        return res.status(404).json({ error: "Família não encontrada." });
      }

      const { nomeResponsavel, endereco, latitude, longitude, rendaFamiliar, qtdMembros } = req.body;

      const updateData: any = {};
      if (nomeResponsavel) updateData.nomeResponsavel = nomeResponsavel;
      if (endereco) updateData.endereco = endereco;
      if (rendaFamiliar !== undefined) updateData.rendaFamiliar = rendaFamiliar ? Number(rendaFamiliar) : null;
      if (qtdMembros !== undefined) updateData.qtdMembros = Number(qtdMembros);

      if (latitude !== undefined || longitude !== undefined) {
        const numLat = Number(latitude !== undefined ? latitude : familiaExistente.latitude);
        const numLng = Number(longitude !== undefined ? longitude : familiaExistente.longitude);

        if (isNaN(numLat) || isNaN(numLng)) {
          return res.status(400).json({ error: "Latitude e Longitude devem ser numéricas." });
        }
        if (numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
          return res.status(400).json({ error: "Latitude e Longitude fora dos limites geográficos." });
        }

        updateData.latitude = numLat;
        updateData.longitude = numLng;
      }

      const familiaAtualizada = await familiaRepository.update(id, updateData);
      if (familiaAtualizada) {
        neo4jQueueService.enqueue("SYNC_FAMILIA", familiaAtualizada.toJSON());
      }
      return res.json(familiaAtualizada);
    } catch (error) {
      console.error("Erro ao atualizar família:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar a família." });
    }
  }

  // DELETE - Deletar Família por ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const deletado = await familiaRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Família não encontrada." });
      }

      neo4jQueueService.enqueue("DELETE_NODE", { label: "Familia", id });

      return res.json({ message: "Família excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar família:", error);
      return res.status(500).json({ error: "Erro interno ao deletar a família." });
    }
  }
}

export const familiaController = new FamiliaController();
