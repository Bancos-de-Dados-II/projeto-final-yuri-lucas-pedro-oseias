import { Familia, FamiliaCreationAttributes, FamiliaAttributes, Beneficiario } from "../models/index.ts";
import { sequelize } from "../database/sequelize.ts";
import { Op } from "sequelize";

export class FamiliaRepository {
  async findAll(search?: string): Promise<Familia[]> {
    const where: any = {};
    if (search && search.trim() !== "") {
      where[Op.or] = [
        { nomeResponsavel: { [Op.iLike]: `%${search.trim()}%` } },
        { endereco: { [Op.iLike]: `%${search.trim()}%` } },
      ];
    }

    return Familia.findAll({
      where,
      include: [
        {
          model: Beneficiario,
          as: "beneficiarios",
          attributes: ["id", "nome", "cpf", "fotoUrl", "situacaoSocial"],
        },
      ],
      order: [["id", "DESC"]],
    });
  }

  async findById(id: number): Promise<Familia | null> {
    return Familia.findByPk(id, {
      include: [
        {
          model: Beneficiario,
          as: "beneficiarios",
        },
      ],
    });
  }

  async create(data: FamiliaCreationAttributes): Promise<Familia> {
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);

    const familiaData: any = {
      ...data,
      latitude: lat,
      longitude: lng,
    };

    if (sequelize.getDialect() === "postgres" && !isNaN(lat) && !isNaN(lng)) {
      familiaData.localizacao = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    return Familia.create(familiaData);
  }

  async update(id: number, data: Partial<FamiliaAttributes>): Promise<Familia | null> {
    const familia = await Familia.findByPk(id);
    if (!familia) return null;

    const updateData: any = { ...data };
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const lat = Number(data.latitude !== undefined ? data.latitude : familia.latitude);
      const lng = Number(data.longitude !== undefined ? data.longitude : familia.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        updateData.latitude = lat;
        updateData.longitude = lng;
        if (sequelize.getDialect() === "postgres") {
          updateData.localizacao = {
            type: "Point",
            coordinates: [lng, lat],
          };
        }
      }
    }

    await familia.update(updateData);
    return familia;
  }

  async delete(id: number): Promise<boolean> {
    const transaction = await sequelize.transaction();
    try {
      const familia = await Familia.findByPk(id, {
        include: [{ model: Beneficiario, as: "beneficiarios" }],
        transaction,
      });
      if (!familia) {
        await transaction.rollback();
        return false;
      }

      // Deleção lógica (Soft Delete) em cascata de todos os beneficiários da família
      if (familia.beneficiarios && familia.beneficiarios.length > 0) {
        for (const beneficiario of familia.beneficiarios) {
          await beneficiario.destroy({ transaction });
        }
      }

      // Deleção lógica da família
      await familia.destroy({ transaction });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const familiaRepository = new FamiliaRepository();
