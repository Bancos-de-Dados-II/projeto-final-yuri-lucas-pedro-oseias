import { Request, Response } from "express";
import { beneficiarioService } from "../services/BeneficiarioService.ts";
import { AppError } from "../utils/AppError.ts";

export class BeneficiarioController {
  // CREATE - Cadastrar Beneficiário
  async create(req: Request, res: Response) {
    try {
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      const novoBeneficiario = await beneficiarioService.registerBeneficiario(req.body, usuarioId);
      return res.status(201).json(novoBeneficiario);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
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
      const beneficiarios = await beneficiarioService.listBeneficiarios({
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
      const beneficiario = await beneficiarioService.getBeneficiarioById(id);
      return res.json(beneficiario);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar beneficiário por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o beneficiário." });
    }
  }

  // UPDATE - Atualizar Beneficiário por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      const beneficiarioAtualizado = await beneficiarioService.updateBeneficiario(id, req.body, usuarioId);
      return res.json(beneficiarioAtualizado);
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
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
      const usuarioId = (req as any).user?.id || req.body.usuarioId || 0;
      await beneficiarioService.deleteBeneficiario(id, usuarioId);
      return res.json({ message: "Beneficiário excluído com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar beneficiário:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o beneficiário." });
    }
  }
}

export const beneficiarioController = new BeneficiarioController();
