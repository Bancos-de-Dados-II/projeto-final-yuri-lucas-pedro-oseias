import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface BeneficiarioAttributes {
  id: number;
  nome: string;
  cpf: string;
  dataNascimento: string | Date;
  telefone?: string | null;
  fotoUrl?: string | null;
  situacaoSocial?: string | null;
  familiaId: number;
  createdAt?: Date;
}

export interface BeneficiarioCreationAttributes extends Optional<BeneficiarioAttributes, "id" | "telefone" | "fotoUrl" | "situacaoSocial" | "createdAt"> {}

export class Beneficiario extends Model<BeneficiarioAttributes, BeneficiarioCreationAttributes> implements BeneficiarioAttributes {
  public declare id: number;
  public declare nome: string;
  public declare cpf: string;
  public declare dataNascimento: string | Date;
  public declare telefone: string | null;
  public declare fotoUrl: string | null;
  public declare situacaoSocial: string | null;
  public declare familiaId: number;
  public declare readonly createdAt: Date;
}

Beneficiario.init(
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
    cpf: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    dataNascimento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "data_nascimento",
    },
    telefone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fotoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "foto_url",
    },
    situacaoSocial: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "situacao_social",
    },
    familiaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "familia_id",
      references: {
        model: "tb_familia",
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "tb_beneficiario",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
