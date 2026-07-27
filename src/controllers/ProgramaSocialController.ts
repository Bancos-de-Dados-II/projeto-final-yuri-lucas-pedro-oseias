import { Request, Response } from "express";
import { programaSocialRepository } from "../repositories/ProgramaSocialRepository.ts";
import { neo4jQueueService } from "../services/neo4jQueue.ts";

export class ProgramaSocialController {
  // CREATE
  async create(req: Request, res: Response) {
    try {
      const { nome, descricao, orgaoResponsavel, dataInicio, dataFim, ativo } = req.body;

      if (!nome || nome.trim() === "") {
        return res.status(400).json({ error: "O campo 'nome' é obrigatório." });
      }

      const novoPrograma = await programaSocialRepository.create({
        nome: nome.trim(),
        descricao: descricao ? descricao.trim() : null,
        orgaoResponsavel: orgaoResponsavel ? orgaoResponsavel.trim() : null,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        ativo: ativo !== undefined ? Boolean(ativo) : true,
      });

      // Propagação assíncrona pós-escrita para o Neo4j (não-bloqueante)
      neo4jQueueService.enqueue("SYNC_PROGRAMA", novoPrograma.toJSON());

      return res.status(201).json(novoPrograma);
    } catch (error) {
      console.error("Erro ao criar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar o programa social." });
    }
  }

  // READ ALL
  async index(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const programas = await programaSocialRepository.findAll(search ? String(search) : undefined);
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
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const programa = await programaSocialRepository.findById(id);
      if (!programa) {
        return res.status(404).json({ error: "Programa social não encontrado." });
      }

      return res.json(programa);
    } catch (error) {
      console.error("Erro ao buscar programa social por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o programa social." });
    }
  }

  // UPDATE
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const programaExistente = await programaSocialRepository.findById(id);
      if (!programaExistente) {
        return res.status(404).json({ error: "Programa social não encontrado." });
      }

      const { nome, descricao, orgaoResponsavel, dataInicio, dataFim, ativo } = req.body;

      const updateData: any = {};
      if (nome !== undefined) updateData.nome = nome.trim() === "" ? programaExistente.nome : nome.trim();
      if (descricao !== undefined) updateData.descricao = descricao ? descricao.trim() : null;
      if (orgaoResponsavel !== undefined) updateData.orgaoResponsavel = orgaoResponsavel ? orgaoResponsavel.trim() : null;
      if (dataInicio !== undefined) updateData.dataInicio = dataInicio || null;
      if (dataFim !== undefined) updateData.dataFim = dataFim || null;
      if (ativo !== undefined) updateData.ativo = Boolean(ativo);

      const programaAtualizado = await programaSocialRepository.update(id, updateData);
      return res.json(programaAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o programa social." });
    }
  }

  // DELETE
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const deletado = await programaSocialRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Programa social não encontrado." });
      }

      return res.json({ message: "Programa social excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar programa social:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o programa social." });
    }
  }
  // ASSOCIATE BENEFICIARY TO PROGRAM
  async associateBeneficiary(req: Request, res: Response) {
    try {
      const { beneficiarioId, programaId } = req.body;

      if (!beneficiarioId || !programaId) {
        return res.status(400).json({ error: "Os campos 'beneficiarioId' e 'programaId' são obrigatórios." });
      }

      const { Beneficiario, ProgramaSocial, BeneficiarioPrograma } = await import("../models/index.ts");
      const beneficiario = await Beneficiario.findByPk(Number(beneficiarioId));
      if (!beneficiario) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      const programa = await ProgramaSocial.findByPk(Number(programaId));
      if (!programa) {
        return res.status(404).json({ error: "Programa social não encontrado." });
      }

      const vinculoExistente = await BeneficiarioPrograma.findOne({
        where: {
          beneficiarioId: Number(beneficiarioId),
          programaId: Number(programaId),
        },
      });

      if (vinculoExistente) {
        return res.status(400).json({ error: "Beneficiário já vinculado a este programa social." });
      }

      const vinculo = await BeneficiarioPrograma.create({
        beneficiarioId: Number(beneficiarioId),
        programaId: Number(programaId),
      });

      // Propagação assíncrona da aresta (Beneficiario)-[:PARTICIPA_DE]->(ProgramaSocial) no Neo4j
      neo4jQueueService.enqueue("LINK_BENEFICIARIO_PROGRAMA", {
        beneficiarioId: Number(beneficiarioId),
        programaId: Number(programaId),
      });

      return res.status(201).json(vinculo);
    } catch (error) {
      console.error("Erro ao associar beneficiário ao programa:", error);
      return res.status(500).json({ error: "Erro interno ao criar vínculo." });
    }
  }

  // DISASSOCIATE BENEFICIARY FROM PROGRAM
  async disassociateBeneficiary(req: Request, res: Response) {
    try {
      const { beneficiarioId, programaId } = req.body;

      if (!beneficiarioId || !programaId) {
        return res.status(400).json({ error: "Os campos 'beneficiarioId' e 'programaId' são obrigatórios." });
      }

      const { BeneficiarioPrograma } = await import("../models/index.ts");
      const vinculo = await BeneficiarioPrograma.findOne({
        where: {
          beneficiarioId: Number(beneficiarioId),
          programaId: Number(programaId),
        },
      });

      if (!vinculo) {
        return res.status(404).json({ error: "Vínculo não encontrado." });
      }

      await vinculo.destroy();

      return res.json({ message: "Beneficiário desassociado do programa com sucesso." });
    } catch (error) {
      console.error("Erro ao desassociar beneficiário do programa:", error);
      return res.status(500).json({ error: "Erro interno ao remover vínculo." });
    }
  }
}

export const programaSocialController = new ProgramaSocialController();
