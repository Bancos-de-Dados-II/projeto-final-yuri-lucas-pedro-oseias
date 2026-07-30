import { userRepository } from "../repositories/UserRepository.ts";
import { hashPassword } from "../services/security.ts";
import { TipoUsuario, Usuario } from "../models/index.ts";
import { neo4jQueueService } from "../services/neo4jQueue.ts";
import { AppError } from "../utils/AppError.ts";

export class UserService {
  async registerUser(data: any): Promise<any> {
    const { nome, email, senha, tipo, fotoUrl } = data;

    const tipoUsuario = tipo || TipoUsuario.ASSISTENTE_SOCIAL;
    if (!Object.values(TipoUsuario).includes(tipoUsuario)) {
      throw new AppError(`Tipo de usuário inválido. Opções válidas: ${Object.values(TipoUsuario).join(", ")}`);
    }

    const usuarioExistente = await userRepository.findByEmail(email);
    if (usuarioExistente) {
      throw new AppError("Já existe um usuário cadastrado com este e-mail.");
    }

    const senhaHash = await hashPassword(senha);

    const novoUsuario = await userRepository.create({
      nome,
      email,
      senhaHash,
      tipo: tipoUsuario,
      fotoUrl: fotoUrl || null,
    });

    neo4jQueueService.enqueue("SYNC_USUARIO", novoUsuario.toJSON());

    const { senhaHash: _, ...usuarioSemSenha } = novoUsuario.toJSON();
    return usuarioSemSenha;
  }

  async listUsers(): Promise<Usuario[]> {
    return userRepository.findAll();
  }

  async getUserById(id: number): Promise<Usuario> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const usuario = await userRepository.findById(id);
    if (!usuario) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    return usuario;
  }

  async updateUser(id: number, data: any): Promise<any> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const { nome, email, senha, tipo, fotoUrl } = data;

    const usuarioExistente = await userRepository.findById(id);
    if (!usuarioExistente) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    if (email && email !== usuarioExistente.email) {
      const emailEmUso = await userRepository.findByEmail(email);
      if (emailEmUso) {
        throw new AppError("O e-mail informado já está em uso por outro usuário.");
      }
    }

    if (tipo && !Object.values(TipoUsuario).includes(tipo)) {
      throw new AppError(`Tipo de usuário inválido. Opções válidas: ${Object.values(TipoUsuario).join(", ")}`);
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
      throw new AppError("Erro ao atualizar usuário.", 500);
    }

    const { senhaHash: _, ...usuarioSemSenha } = usuarioAtualizado.toJSON();
    return usuarioSemSenha;
  }

  async deleteUser(id: number, currentUserId: number | undefined): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    if (currentUserId === id) {
      throw new AppError("Regra de negócio violada: Não é permitido excluir a sua própria conta enquanto estiver logado.");
    }

    const deletado = await userRepository.delete(id);
    if (!deletado) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    neo4jQueueService.enqueue("DELETE_NODE", { label: "Usuario", id });
  }
}

export const userService = new UserService();
