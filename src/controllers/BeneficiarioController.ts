import { Request, Response } from "express";
import { beneficiarioRepository, cleanCPF } from "../repositories/BeneficiarioRepository.ts";
import { familiaRepository } from "../repositories/FamiliaRepository.ts";
import { beneficiarioLogRepository } from "../repositories/BeneficiarioLogRepository.ts";
import { neo4jQueueService } from "../services/neo4jQueue.ts";

export class BeneficiarioController {
  // CREATE - Cadastrar Beneficiário
  async create(req: Request, res: Response) {
    try {
      const { nome, cpf, dataNascimento, telefone, fotoUrl, situacaoSocial, familiaId } = req.body;

      if (!nome || !cpf || !dataNascimento || !familiaId) {
        return res.status(400).json({
          error: "Campos 'nome', 'cpf', 'dataNascimento' e 'familiaId' são obrigatórios.",
        });
      }

      // Validar se a Família existe
      const numFamiliaId = Number(familiaId);
      if (isNaN(numFamiliaId)) {
        return res.status(400).json({ error: "ID da Família inválido." });
      }

      const familiaExistente = await familiaRepository.findById(numFamiliaId);
      if (!familiaExistente) {
        return res.status(400).json({ error: "Família vinculada não foi encontrada no sistema." });
      }

      // Validação de CPF duplicado
      const beneficiarioComCpf = await beneficiarioRepository.findByCpf(cpf);
      if (beneficiarioComCpf) {
        return res.status(400).json({
          error: "Já existe um beneficiário cadastrado com este CPF.",
        });
      }

      const novoBeneficiario = await beneficiarioRepository.create({
        nome,
        cpf: cpf.trim(),
        dataNascimento,
        telefone: telefone || null,
        fotoUrl: fotoUrl || null,
        situacaoSocial: situacaoSocial || null,
        familiaId: numFamiliaId,
      });

      // Propagação assíncrona pós-escrita para o Neo4j (não-bloqueante)
      neo4jQueueService.enqueue("SYNC_BENEFICIARIO", novoBeneficiario.toJSON());

      // Salva log no MongoDB
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      await beneficiarioLogRepository.saveLog({
        beneficiarioId: novoBeneficiario.id,
        usuarioId,
        acao: "CREATE",
        dadosDepois: novoBeneficiario.toJSON(),
      });

      return res.status(201).json(novoBeneficiario);
    } catch (error: any) {
      console.error("Erro ao cadastrar beneficiário:", error);
      if (error?.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ error: "Já existe um beneficiário cadastrado com este CPF." });
      }
      return res.status(500).json({ error: "Erro interno ao cadastrar o beneficiário." });
    }
  }

  // READ ALL - Listar Beneficiários com busca (nome/CPF) e filtro por situação social
  async index(req: Request, res: Response) {
    try {
      const { search, situacaoSocial } = req.query;

      const beneficiarios = await beneficiarioRepository.findAll({
        search: search ? String(search) : undefined,
        situacaoSocial: situacaoSocial ? String(situacaoSocial) : undefined,
      });

      return res.json(beneficiarios);
    } catch (error) {
      console.error("Erro ao listar beneficiários:", error);
      return res.status(500).json({ error: "Erro interno ao buscar beneficiários." });
    }
  }

  // READ ONE - Obter Beneficiário por ID
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const beneficiario = await beneficiarioRepository.findById(id);
      if (!beneficiario) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      return res.json(beneficiario);
    } catch (error) {
      console.error("Erro ao buscar beneficiário por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o beneficiário." });
    }
  }

  // UPDATE - Atualizar Beneficiário por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const beneficiarioExistente = await beneficiarioRepository.findById(id);
      if (!beneficiarioExistente) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      const { nome, cpf, dataNascimento, telefone, fotoUrl, situacaoSocial, familiaId } = req.body;

      // Se CPF foi alterado, validar duplicidade
      if (cpf && cpf.trim() !== beneficiarioExistente.cpf) {
        const cpfExistente = await beneficiarioRepository.findByCpf(cpf);
        if (cpfExistente && cpfExistente.id !== id) {
          return res.status(400).json({
            error: "O CPF informado já está em uso por outro beneficiário.",
          });
        }
      }

      // Se familiaId foi alterado, validar se a nova família existe
      if (familiaId) {
        const numFamiliaId = Number(familiaId);
        if (isNaN(numFamiliaId)) {
          return res.status(400).json({ error: "ID da Família inválido." });
        }
        const familiaExistente = await familiaRepository.findById(numFamiliaId);
        if (!familiaExistente) {
          return res.status(400).json({ error: "Família vinculada não foi encontrada no sistema." });
        }
      }

      const updateData: any = {};
      if (nome) updateData.nome = nome;
      if (cpf) updateData.cpf = cpf.trim();
      if (dataNascimento) updateData.dataNascimento = dataNascimento;
      if (telefone !== undefined) updateData.telefone = telefone || null;
      if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl || null;
      if (situacaoSocial !== undefined) updateData.situacaoSocial = situacaoSocial || null;
      if (familiaId) updateData.familiaId = Number(familiaId);

      const beneficiarioAtualizado = await beneficiarioRepository.update(id, updateData);
      if (!beneficiarioAtualizado) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      // Salva log no MongoDB
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      await beneficiarioLogRepository.saveLog({
        beneficiarioId: id,
        usuarioId,
        acao: "UPDATE",
        dadosAntes: beneficiarioExistente.toJSON(),
        dadosDepois: beneficiarioAtualizado.toJSON(),
      });

      return res.json(beneficiarioAtualizado);
    } catch (error: any) {
      console.error("Erro ao atualizar beneficiário:", error);
      if (error?.name === "SequelizeUniqueConstraintError") {
        return res.status(400).json({ error: "O CPF informado já está em uso por outro beneficiário." });
      }
      return res.status(500).json({ error: "Erro interno ao atualizar o beneficiário." });
    }
  }

  // DELETE - Deletar Beneficiário por ID
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const beneficiarioExistente = await beneficiarioRepository.findById(id);
      if (!beneficiarioExistente) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      const deletado = await beneficiarioRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Beneficiário não encontrado." });
      }

      // Propagação assíncrona da exclusão no Neo4j
      neo4jQueueService.enqueue("DELETE_NODE", { label: "Beneficiario", id });

      // Salva log no MongoDB
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      await beneficiarioLogRepository.saveLog({
        beneficiarioId: id,
        usuarioId,
        acao: "DELETE",
        dadosAntes: beneficiarioExistente.toJSON(),
      });

      return res.json({ message: "Beneficiário excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar beneficiário:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o beneficiário." });
    }
  }
}

export const beneficiarioController = new BeneficiarioController();
