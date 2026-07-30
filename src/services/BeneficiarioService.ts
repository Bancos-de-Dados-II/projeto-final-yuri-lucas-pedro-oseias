import { beneficiarioRepository } from "../repositories/BeneficiarioRepository.ts";
import { familiaRepository } from "../repositories/FamiliaRepository.ts";
import { beneficiarioLogRepository } from "../repositories/BeneficiarioLogRepository.ts";
import { neo4jQueueService } from "./neo4jQueue.ts";
import { AppError } from "../utils/AppError.ts";
import { Beneficiario } from "../models/index.ts";

export class BeneficiarioService {
  async registerBeneficiario(data: any, usuarioId: number): Promise<Beneficiario> {
    const { nome, cpf, dataNascimento, telefone, fotoUrl, situacaoSocial, familiaId } = data;

    if (!nome || !cpf || !dataNascimento || !familiaId) {
      throw new AppError("Campos 'nome', 'cpf', 'dataNascimento' e 'familiaId' são obrigatórios.");
    }

    const numFamiliaId = Number(familiaId);
    if (isNaN(numFamiliaId)) {
      throw new AppError("ID da Família inválido.");
    }

    const familiaExistente = await familiaRepository.findById(numFamiliaId);
    if (!familiaExistente) {
      throw new AppError("Família vinculada não foi encontrada no sistema.");
    }

    const beneficiarioComCpf = await beneficiarioRepository.findByCpf(cpf);
    if (beneficiarioComCpf) {
      throw new AppError("Já existe um beneficiário cadastrado com este CPF.");
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

    neo4jQueueService.enqueue("SYNC_BENEFICIARIO", novoBeneficiario.toJSON());

    await beneficiarioLogRepository.saveLog({
      beneficiarioId: novoBeneficiario.id,
      usuarioId,
      acao: "CREATE",
      dadosDepois: novoBeneficiario.toJSON(),
    });

    return novoBeneficiario;
  }

  async listBeneficiarios(filters: { search?: string; situacaoSocial?: string }): Promise<Beneficiario[]> {
    return beneficiarioRepository.findAll(filters);
  }

  async getBeneficiarioById(id: number): Promise<Beneficiario> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const beneficiario = await beneficiarioRepository.findById(id);
    if (!beneficiario) {
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    return beneficiario;
  }

  async updateBeneficiario(id: number, data: any, usuarioId: number): Promise<Beneficiario> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const beneficiarioExistente = await beneficiarioRepository.findById(id);
    if (!beneficiarioExistente) {
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    const { nome, cpf, dataNascimento, telefone, fotoUrl, situacaoSocial, familiaId } = data;

    if (cpf && cpf.trim() !== beneficiarioExistente.cpf) {
      const cpfExistente = await beneficiarioRepository.findByCpf(cpf);
      if (cpfExistente && cpfExistente.id !== id) {
        throw new AppError("O CPF informado já está em uso por outro beneficiário.");
      }
    }

    if (familiaId) {
      const numFamiliaId = Number(familiaId);
      if (isNaN(numFamiliaId)) {
        throw new AppError("ID da Família inválido.");
      }
      const familiaExistente = await familiaRepository.findById(numFamiliaId);
      if (!familiaExistente) {
        throw new AppError("Família vinculada não foi encontrada no sistema.");
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
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    await beneficiarioLogRepository.saveLog({
      beneficiarioId: id,
      usuarioId,
      acao: "UPDATE",
      dadosAntes: beneficiarioExistente.toJSON(),
      dadosDepois: beneficiarioAtualizado.toJSON(),
    });

    return beneficiarioAtualizado;
  }

  async deleteBeneficiario(id: number, usuarioId: number): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const beneficiarioExistente = await beneficiarioRepository.findById(id);
    if (!beneficiarioExistente) {
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    const deletado = await beneficiarioRepository.delete(id);
    if (!deletado) {
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    neo4jQueueService.enqueue("DELETE_NODE", { label: "Beneficiario", id });

    await beneficiarioLogRepository.saveLog({
      beneficiarioId: id,
      usuarioId,
      acao: "DELETE",
      dadosAntes: beneficiarioExistente.toJSON(),
    });
  }
}

export const beneficiarioService = new BeneficiarioService();
