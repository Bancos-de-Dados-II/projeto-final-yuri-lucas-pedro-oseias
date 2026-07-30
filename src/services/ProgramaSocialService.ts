import { programaSocialRepository } from "../repositories/ProgramaSocialRepository.ts";
import { neo4jQueueService } from "./neo4jQueue.ts";
import { AppError } from "../utils/AppError.ts";
import { ProgramaSocial } from "../models/index.ts";

export class ProgramaSocialService {
  async registerProgramaSocial(data: any): Promise<ProgramaSocial> {
    const { nome, descricao, orgaoResponsavel, dataInicio, dataFim, ativo } = data;

    if (!nome || nome.trim() === "") {
      throw new AppError("O campo 'nome' é obrigatório.");
    }

    const novoPrograma = await programaSocialRepository.create({
      nome: nome.trim(),
      descricao: descricao ? descricao.trim() : null,
      orgaoResponsavel: orgaoResponsavel ? orgaoResponsavel.trim() : null,
      dataInicio: dataInicio || null,
      dataFim: dataFim || null,
      ativo: ativo !== undefined ? Boolean(ativo) : true,
    });

    neo4jQueueService.enqueue("SYNC_PROGRAMA", novoPrograma.toJSON());

    return novoPrograma;
  }

  async listProgramasSociais(search?: string): Promise<ProgramaSocial[]> {
    return programaSocialRepository.findAll(search);
  }

  async getProgramaSocialById(id: number): Promise<ProgramaSocial> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const programa = await programaSocialRepository.findById(id);
    if (!programa) {
      throw new AppError("Programa social não encontrado.", 404);
    }

    return programa;
  }

  async updateProgramaSocial(id: number, data: any): Promise<ProgramaSocial> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const programaExistente = await programaSocialRepository.findById(id);
    if (!programaExistente) {
      throw new AppError("Programa social não encontrado.", 404);
    }

    const { nome, descricao, orgaoResponsavel, dataInicio, dataFim, ativo } = data;

    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome.trim() === "" ? programaExistente.nome : nome.trim();
    if (descricao !== undefined) updateData.descricao = descricao ? descricao.trim() : null;
    if (orgaoResponsavel !== undefined) updateData.orgaoResponsavel = orgaoResponsavel ? orgaoResponsavel.trim() : null;
    if (dataInicio !== undefined) updateData.dataInicio = dataInicio || null;
    if (dataFim !== undefined) updateData.dataFim = dataFim || null;
    if (ativo !== undefined) updateData.ativo = Boolean(ativo);

    const programaAtualizado = await programaSocialRepository.update(id, updateData);
    if (!programaAtualizado) {
      throw new AppError("Erro ao atualizar o programa social.", 500);
    }

    return programaAtualizado;
  }

  async deleteProgramaSocial(id: number): Promise<void> {
    if (isNaN(id)) {
      throw new AppError("ID inválido.");
    }

    const deletado = await programaSocialRepository.delete(id);
    if (!deletado) {
      throw new AppError("Programa social não encontrado.", 404);
    }
  }

  async associateBeneficiary(beneficiarioId: any, programaId: any): Promise<any> {
    if (!beneficiarioId || !programaId) {
      throw new AppError("Os campos 'beneficiarioId' e 'programaId' são obrigatórios.");
    }

    const { Beneficiario, ProgramaSocial, BeneficiarioPrograma } = await import("../models/index.ts");
    const beneficiario = await Beneficiario.findByPk(Number(beneficiarioId));
    if (!beneficiario) {
      throw new AppError("Beneficiário não encontrado.", 404);
    }

    const programa = await ProgramaSocial.findByPk(Number(programaId));
    if (!programa) {
      throw new AppError("Programa social não encontrado.", 404);
    }

    const vinculoExistente = await BeneficiarioPrograma.findOne({
      where: {
        beneficiarioId: Number(beneficiarioId),
        programaId: Number(programaId),
      },
    });

    if (vinculoExistente) {
      throw new AppError("Beneficiário já vinculado a este programa social.");
    }

    const vinculo = await BeneficiarioPrograma.create({
      beneficiarioId: Number(beneficiarioId),
      programaId: Number(programaId),
    });

    neo4jQueueService.enqueue("LINK_BENEFICIARIO_PROGRAMA", {
      beneficiarioId: Number(beneficiarioId),
      programaId: Number(programaId),
    });

    return vinculo;
  }

  async disassociateBeneficiary(beneficiarioId: any, programaId: any): Promise<void> {
    if (!beneficiarioId || !programaId) {
      throw new AppError("Os campos 'beneficiarioId' e 'programaId' são obrigatórios.");
    }

    const { BeneficiarioPrograma } = await import("../models/index.ts");
    const vinculo = await BeneficiarioPrograma.findOne({
      where: {
        beneficiarioId: Number(beneficiarioId),
        programaId: Number(programaId),
      },
    });

    if (!vinculo) {
      throw new AppError("Vínculo não encontrado.", 404);
    }

    await vinculo.destroy();
  }
}

export const programaSocialService = new ProgramaSocialService();
