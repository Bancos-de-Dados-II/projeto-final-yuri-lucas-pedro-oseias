import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface ProgramaSocialAttributes {
  id: number;
  nome: string;
  descricao?: string | null;
  orgaoResponsavel?: string | null;
  dataInicio?: string | Date | null;
  dataFim?: string | Date | null;
  ativo: boolean;
}

export interface ProgramaSocialCreationAttributes extends Optional<ProgramaSocialAttributes, "id" | "descricao" | "orgaoResponsavel" | "dataInicio" | "dataFim" | "ativo"> {}

export class ProgramaSocial extends Model<ProgramaSocialAttributes, ProgramaSocialCreationAttributes> implements ProgramaSocialAttributes {
  public declare id: number;
  public declare nome: string;
  public declare descricao: string | null;
  public declare orgaoResponsavel: string | null;
  public declare dataInicio: string | Date | null;
  public declare dataFim: string | Date | null;
  public declare ativo: boolean;
}

ProgramaSocial.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    orgaoResponsavel: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "orgao_responsavel",
    },
    dataInicio: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "data_inicio",
    },
    dataFim: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "data_fim",
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "tb_programa_social",
    underscored: true,
    timestamps: false,
  }
);
