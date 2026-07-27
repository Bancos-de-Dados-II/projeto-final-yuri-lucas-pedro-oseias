import { Beneficiario, BeneficiarioCreationAttributes, BeneficiarioAttributes, Familia, ProgramaSocial } from "../models/index.ts";
import { Op } from "sequelize";

export function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

export interface BeneficiarioFilterOptions {
  search?: string;
  situacaoSocial?: string;
}

export class BeneficiarioRepository {
  async findAll(filters?: BeneficiarioFilterOptions): Promise<Beneficiario[]> {
    const where: any = {};

    if (filters?.situacaoSocial && filters.situacaoSocial.trim() !== "" && filters.situacaoSocial !== "Todas") {
      where.situacaoSocial = filters.situacaoSocial.trim();
    }

    if (filters?.search && filters.search.trim() !== "") {
      const q = filters.search.trim();
      const cleaned = cleanCPF(q);
      const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes("postgres");
      const likeOp = isPostgres ? Op.iLike : Op.like;

      const searchConditions: any[] = [
        { nome: { [likeOp]: `%${q}%` } },
        { cpf: { [likeOp]: `%${q}%` } },
      ];

      if (cleaned.length > 0) {
        searchConditions.push({ cpf: { [likeOp]: `%${cleaned}%` } });
      }

      where[Op.or] = searchConditions;
    }

    return Beneficiario.findAll({
      where,
      include: [
        {
          model: Familia,
          as: "familia",
          attributes: ["id", "nomeResponsavel", "endereco", "latitude", "longitude"],
        },
        {
          model: ProgramaSocial,
          as: "programas",
          through: { attributes: ["dataInclusao"] },
        },
      ],
      order: [["id", "DESC"]],
    });
  }

  async findById(id: number): Promise<Beneficiario | null> {
    return Beneficiario.findByPk(id, {
      include: [
        {
          model: Familia,
          as: "familia",
        },
        {
          model: ProgramaSocial,
          as: "programas",
          through: { attributes: ["dataInclusao"] },
        },
      ],
    });
  }

  async findByCpf(cpf: string): Promise<Beneficiario | null> {
    const rawCpf = cpf.trim();
    const numericCpf = cleanCPF(rawCpf);

    // Tenta encontrar por CPF exato ou CPF limpo
    return Beneficiario.findOne({
      where: {
        [Op.or]: [
          { cpf: rawCpf },
          { cpf: numericCpf },
        ],
      },
    });
  }

  async create(data: BeneficiarioCreationAttributes): Promise<Beneficiario> {
    return Beneficiario.create(data);
  }

  async update(id: number, data: Partial<BeneficiarioAttributes>): Promise<Beneficiario | null> {
    const beneficiario = await Beneficiario.findByPk(id);
    if (!beneficiario) return null;

    await beneficiario.update(data);
    return beneficiario;
  }

  async delete(id: number): Promise<boolean> {
    const beneficiario = await Beneficiario.findByPk(id);
    if (!beneficiario) return false;

    await beneficiario.destroy();
    return true;
  }
}

export const beneficiarioRepository = new BeneficiarioRepository();
