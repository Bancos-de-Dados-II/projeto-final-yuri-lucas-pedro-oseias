import { Request, Response } from "express";
import { userRepository } from "../repositories/UserRepository.ts";
import { hashPassword } from "../services/security.ts";
import { TipoUsuario } from "../models/index.ts";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";

export class UserController {
  // CREATE - Cadastrar Usuário
  async create(req: Request, res: Response) {
    try {
      const { nome, email, senha, tipo, fotoUrl } = req.body;

      if (!nome || !email || !senha) {
        return res.status(400).json({ error: "Nome, email e senha são obrigatórios." });
      }

      const tipoUsuario = tipo || TipoUsuario.ASSISTENTE_SOCIAL;
      if (!Object.values(TipoUsuario).includes(tipoUsuario)) {
        return res.status(400).json({
          error: `Tipo de usuário inválido. Opções válidas: ${Object.values(TipoUsuario).join(", ")}`,
        });
      }

      const usuarioExistente = await userRepository.findByEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ error: "Já existe um usuário cadastrado com este e-mail." });
      }

      const senhaHash = await hashPassword(senha);

      const novoUsuario = await userRepository.create({
        nome,
        email,
        senhaHash,
        tipo: tipoUsuario,
        fotoUrl: fotoUrl || null,
      });

      const { senhaHash: _, ...usuarioSemSenha } = novoUsuario.toJSON();

      return res.status(201).json(usuarioSemSenha);
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar o usuário." });
    }
  }

  // READ ALL - Listar Usuários
  async index(req: Request, res: Response) {
    try {
      const usuarios = await userRepository.findAll();
      return res.json(usuarios);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ error: "Erro interno ao buscar usuários." });
    }
  }

  // READ ONE - Obter Usuário por ID
  async show(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const usuario = await userRepository.findById(id);
      if (!usuario) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.json(usuario);
    } catch (error) {
      console.error("Erro ao buscar usuário por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o usuário." });
    }
  }

  // UPDATE - Atualizar Usuário por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      const { nome, email, senha, tipo, fotoUrl } = req.body;

      const usuarioExistente = await userRepository.findById(id);
      if (!usuarioExistente) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      if (email && email !== usuarioExistente.email) {
        const emailEmUso = await userRepository.findByEmail(email);
        if (emailEmUso) {
          return res.status(400).json({ error: "O e-mail informado já está em uso por outro usuário." });
        }
      }

      if (tipo && !Object.values(TipoUsuario).includes(tipo)) {
        return res.status(400).json({
          error: `Tipo de usuário inválido. Opções válidas: ${Object.values(TipoUsuario).join(", ")}`,
        });
      }

      const updateData: any = {};
      if (nome) updateData.nome = nome;
      if (email) updateData.email = email;
      if (tipo) updateData.tipo = tipo;
      if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl;

      if (senha) {
        updateData.senhaHash = await hashPassword(senha);
      }

      const usuarioAtualizado = await userRepository.update(id, updateData);

      if (!usuarioAtualizado) {
        return res.status(500).json({ error: "Erro ao atualizar usuário." });
      }

      const { senhaHash: _, ...usuarioSemSenha } = usuarioAtualizado.toJSON();
      return res.json(usuarioSemSenha);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o usuário." });
    }
  }

  // DELETE - Deletar Usuário por ID
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido." });
      }

      // Regra de negócio: Impedir a exclusão do próprio usuário logado
      if (req.user && req.user.id === id) {
        return res.status(400).json({
          error: "Regra de negócio violada: Não é permitido excluir a sua própria conta enquanto estiver logado.",
        });
      }

      const deletado = await userRepository.delete(id);
      if (!deletado) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      return res.json({ message: "Usuário excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o usuário." });
    }
  }
}

export const userController = new UserController();
