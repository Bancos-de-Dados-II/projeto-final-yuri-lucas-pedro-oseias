import { Request, Response } from "express";
import { userService } from "../services/UserService.ts";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.ts";
import { AppError } from "../utils/AppError.ts";

export class UserController {
  // CREATE - Cadastrar Usuário
  async create(req: Request, res: Response) {
    try {
      const user = await userService.registerUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao cadastrar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao cadastrar o usuário." });
    }
  }

  // READ ALL - Listar Usuários
  async index(req: Request, res: Response) {
    try {
      const usuarios = await userService.listUsers();
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
      const usuario = await userService.getUserById(id);
      return res.json(usuario);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao buscar usuário por ID:", error);
      return res.status(500).json({ error: "Erro interno ao buscar o usuário." });
    }
  }

  // UPDATE - Atualizar Usuário por ID
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = await userService.updateUser(id, req.body);
      return res.json(user);
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao atualizar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao atualizar o usuário." });
    }
  }

  // DELETE - Deletar Usuário por ID
  async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const id = Number(req.params.id);
      const currentUserId = req.user?.id;
      
      await userService.deleteUser(id, currentUserId);
      return res.json({ message: "Usuário excluído com sucesso." });
    } catch (error) {
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("Erro ao deletar usuário:", error);
      return res.status(500).json({ error: "Erro interno ao deletar o usuário." });
    }
  }
}

export const userController = new UserController();
