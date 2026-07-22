import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface VisitaAttributes {
  id: number;
  dataVisita: Date;
  observacoes?: string | null;
  acoesRealizadas?: string | null;
  latitude: number;
  longitude: number;
  beneficiarioId: number;
  usuarioId: number;
  createdAt?: Date;
}

export interface VisitaCreationAttributes extends Optional<VisitaAttributes, "id" | "observacoes" | "acoesRealizadas" | "createdAt"> {}

export class Visita extends Model<VisitaAttributes, VisitaCreationAttributes> implements VisitaAttributes {
  public id!: number;
  public dataVisita!: Date;
  public observacoes!: string | null;
  public acoesRealizadas!: string | null;
  public latitude!: number;
  public longitude!: number;
  public beneficiarioId!: number;
  public usuarioId!: number;
  public readonly createdAt!: Date;
}

Visita.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dataVisita: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "data_visita",
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    acoesRealizadas: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "acoes_realizadas",
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false,
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
    tableName: "tb_visita",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
