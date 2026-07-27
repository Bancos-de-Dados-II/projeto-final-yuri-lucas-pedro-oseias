import { Agendamento, AgendamentoCreationAttributes, AgendamentoAttributes, Beneficiario, Usuario } from "../models/index.ts";

export class AgendamentoRepository {
  async findAll(beneficiarioId?: number, usuarioId?: number): Promise<Agendamento[]> {
    const where: any = {};
    if (beneficiarioId) where.beneficiarioId = beneficiarioId;
    if (usuarioId) where.usuarioId = usuarioId;

    return Agendamento.findAll({
      where,
      include: [
        {
          model: Beneficiario,
          as: "beneficiario",
          attributes: ["id", "nome", "cpf"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email", "tipo"],
        },
      ],
      order: [["dataAgendamento", "ASC"], ["hora", "ASC"]],
    });
  }

  async findById(id: number): Promise<Agendamento | null> {
    return Agendamento.findByPk(id, {
      include: [
        {
          model: Beneficiario,
          as: "beneficiario",
          attributes: ["id", "nome", "cpf"],
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "nome", "email", "tipo"],
        },
      ],
    });
  }

  async create(data: AgendamentoCreationAttributes): Promise<Agendamento> {
    const agendamento = await Agendamento.create(data);
    return (await this.findById(agendamento.id))!;
  }

  async update(id: number, data: Partial<AgendamentoAttributes>): Promise<Agendamento | null> {
    const agendamento = await Agendamento.findByPk(id);
    if (!agendamento) return null;
    await agendamento.update(data);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const agendamento = await Agendamento.findByPk(id);
    if (!agendamento) return false;
    await agendamento.destroy();
    return true;
  }

  async findConflito(usuarioId: number, dataAgendamento: string | Date, hora: string): Promise<Agendamento | null> {
    let formattedHora = hora;
    if (hora && hora.split(":").length === 2) {
      formattedHora = `${hora}:00`;
    }
    
    return Agendamento.findOne({
      where: {
        usuarioId,
        dataAgendamento,
        hora: formattedHora,
      },
    });
  }
}

export const agendamentoRepository = new AgendamentoRepository();
