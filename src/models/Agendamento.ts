import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export enum StatusAgendamento {
  PENDENTE = "pendente",
  CONFIRMADO = "confirmado",
  REALIZADO = "realizado",
  CANCELADO = "cancelado",
}

export interface AgendamentoAttributes {
  id: number;
  dataAgendamento: string | Date;
  hora: string;
  status: StatusAgendamento;
  observacoes?: string | null;
  beneficiarioId: number;
  usuarioId: number;
  createdAt?: Date;
}

export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, "id" | "status" | "observacoes" | "createdAt"> {}

export class Agendamento extends Model<AgendamentoAttributes, AgendamentoCreationAttributes> implements AgendamentoAttributes {
  public id!: number;
  public dataAgendamento!: string | Date;
  public hora!: string;
  public status!: StatusAgendamento;
  public observacoes!: string | null;
  public beneficiarioId!: number;
  public usuarioId!: number;
  public readonly createdAt!: Date;
}

Agendamento.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dataAgendamento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_agendamento",
    },
    hora: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pendente", "confirmado", "realizado", "cancelado"),
      allowNull: false,
      defaultValue: StatusAgendamento.PENDENTE,
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    beneficiarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "beneficiario_id",
      references: {
        model: "tb_beneficiario",
        key: "id",
      },
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "usuario_id",
      references: {
        model: "tb_usuario",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "tb_agendamento",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
