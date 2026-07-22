import { Request, Response } from "express";
import { userRepository } from "../repositories/UserRepository.ts";
import { hashPassword } from "../services/security.ts";
import { TipoUsuario } from "../models/index.ts";

export class UserController {
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

  async index(req: Request, res: Response) {
    try {
      const usuarios = await userRepository.findAll();
      return res.json(usuarios);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ error: "Erro interno ao buscar usuários." });
    }
  }
}

export const userController = new UserController();
