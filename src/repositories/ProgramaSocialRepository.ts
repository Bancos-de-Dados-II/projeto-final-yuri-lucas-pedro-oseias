import { ProgramaSocial, ProgramaSocialCreationAttributes, ProgramaSocialAttributes } from "../models/index.ts";
import { Op } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export class ProgramaSocialRepository {
  async findAll(search?: string): Promise<ProgramaSocial[]> {
    const where: any = {};

    if (search && search.trim() !== "") {
      const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { nome: { [likeOp]: `%${search.trim()}%` } },
        { descricao: { [likeOp]: `%${search.trim()}%` } },
        { orgaoResponsavel: { [likeOp]: `%${search.trim()}%` } },
      ];
    }

    return ProgramaSocial.findAll({
      where,
      order: [["id", "ASC"]],
    });
  }

  async findById(id: number): Promise<ProgramaSocial | null> {
    return ProgramaSocial.findByPk(id);
  }

  async create(data: ProgramaSocialCreationAttributes): Promise<ProgramaSocial> {
    return ProgramaSocial.create(data);
  }

  async update(id: number, data: Partial<ProgramaSocialAttributes>): Promise<ProgramaSocial | null> {
    const programa = await ProgramaSocial.findByPk(id);
    if (!programa) return null;
    await programa.update(data);
    return programa;
  }

  async delete(id: number): Promise<boolean> {
    const programa = await ProgramaSocial.findByPk(id);
    if (!programa) return false;
    await programa.destroy();
    return true;
  }
}

export const programaSocialRepository = new ProgramaSocialRepository();
