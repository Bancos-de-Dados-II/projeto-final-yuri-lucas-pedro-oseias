import { Visita, VisitaCreationAttributes, VisitaAttributes, Beneficiario, Usuario } from "../models/index.ts";
import { sequelize } from "../database/sequelize.ts";
import { Op } from "sequelize";

export class VisitaRepository {
  async findAll(search?: string, beneficiarioId?: number, usuarioId?: number): Promise<Visita[]> {
    const where: any = {};

    if (beneficiarioId) {
      where.beneficiarioId = beneficiarioId;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    if (search && search.trim() !== "") {
      const likeOp = sequelize.getDialect() === "postgres" ? Op.iLike : Op.like;
      where[Op.or] = [
        { observacoes: { [likeOp]: `%${search.trim()}%` } },
        { acoesRealizadas: { [likeOp]: `%${search.trim()}%` } },
      ];
    }

    return Visita.findAll({
      where,
      include: [
        {
          model: Beneficiario,
          as: "beneficiario",
          attributes: ["id", "nome", "cpf", "fotoUrl"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email", "tipo"],
        },
      ],
      order: [["dataVisita", "DESC"]],
    });
  }

  async findById(id: number): Promise<Visita | null> {
    return Visita.findByPk(id, {
      include: [
        {
          model: Beneficiario,
          as: "beneficiario",
          attributes: ["id", "nome", "cpf", "fotoUrl"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email", "tipo"],
        },
      ],
    });
  }

  async create(data: VisitaCreationAttributes): Promise<Visita> {
    const lat = Number(data.latitude);
    const lng = Number(data.longitude);

    const visitaData: any = {
      ...data,
      latitude: lat,
      longitude: lng,
    };

    if (sequelize.getDialect() === "postgres" && !isNaN(lat) && !isNaN(lng)) {
      visitaData.localizacao = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    const visita = await Visita.create(visitaData);
    return (await this.findById(visita.id))!;
  }

  async update(id: number, data: Partial<VisitaAttributes>): Promise<Visita | null> {
    const visita = await Visita.findByPk(id);
    if (!visita) return null;

    const updateData: any = { ...data };
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const lat = Number(data.latitude !== undefined ? data.latitude : visita.latitude);
      const lng = Number(data.longitude !== undefined ? data.longitude : visita.longitude);
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

    await visita.update(updateData);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const visita = await Visita.findByPk(id);
    if (!visita) return false;

    await visita.destroy();
    return true;
  }
}

export const visitaRepository = new VisitaRepository();
