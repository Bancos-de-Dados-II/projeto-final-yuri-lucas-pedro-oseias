import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface VisitaAttributes {
  id: number;
  dataVisita: Date;
  observacoes?: string | null;
  acoesRealizadas?: string | null;
  latitude: number;
  longitude: number;
  localizacao?: any;
  beneficiarioId: number;
  usuarioId: number;
  createdAt?: Date;
}

export interface VisitaCreationAttributes extends Optional<VisitaAttributes, "id" | "observacoes" | "acoesRealizadas" | "localizacao" | "createdAt"> {}

export class Visita extends Model<VisitaAttributes, VisitaCreationAttributes> implements VisitaAttributes {
  public declare id: number;
  public declare dataVisita: Date;
  public declare observacoes: string | null;
  public declare acoesRealizadas: string | null;
  public declare latitude: number;
  public declare longitude: number;
  public declare localizacao: any;
  public declare beneficiarioId: number;
  public declare usuarioId: number;
  public declare readonly createdAt: Date;
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
    localizacao: {
      type: DataTypes.GEOMETRY("POINT", 4326),
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
    tableName: "tb_visita",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
