import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export enum TipoUsuario {
  ADMINISTRADOR = "administrador",
  ASSISTENTE_SOCIAL = "assistente_social",
}

export interface UsuarioAttributes {
  id: number;
  nome: string;
  email: string;
  senhaHash: string;
  tipo: TipoUsuario;
  fotoUrl?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, "id" | "fotoUrl" | "createdAt" | "updatedAt"> {}

export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public declare id: number;
  public declare nome: string;
  public declare email: string;
  public declare senhaHash: string;
  public declare tipo: TipoUsuario;
  public declare fotoUrl: string | null;
  public declare readonly createdAt: Date;
  public declare readonly updatedAt: Date;
}

Usuario.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    senhaHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "senha_hash",
    },
    tipo: {
      type: DataTypes.ENUM("administrador", "assistente_social"),
      allowNull: false,
    },
    fotoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "foto_url",
    },
  },
  {
    sequelize,
    tableName: "tb_usuario",
    underscored: true,
    timestamps: true,
  }
);
