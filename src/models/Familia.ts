import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface FamiliaAttributes {
  id: number;
  nomeResponsavel: string;
  endereco: string;
  latitude: number;
  longitude: number;
  localizacao?: any;
  rendaFamiliar?: number | null;
  qtdMembros: number;
  createdAt?: Date;
}

export interface FamiliaCreationAttributes extends Optional<FamiliaAttributes, "id" | "localizacao" | "rendaFamiliar" | "createdAt"> {}

export class Familia extends Model<FamiliaAttributes, FamiliaCreationAttributes> implements FamiliaAttributes {
  public declare id: number;
  public declare nomeResponsavel: string;
  public declare endereco: string;
  public declare latitude: number;
  public declare longitude: number;
  public declare localizacao: any;
  public declare rendaFamiliar: number | null;
  public declare qtdMembros: number;
  public declare readonly createdAt: Date;
}

Familia.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nomeResponsavel: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "nome_responsavel",
    },
    endereco: {
      type: DataTypes.STRING,
      allowNull: false,
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
    rendaFamiliar: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "renda_familiar",
    },
    qtdMembros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "qtd_membros",
    },
  },
  {
    sequelize,
    tableName: "tb_familia",
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);
