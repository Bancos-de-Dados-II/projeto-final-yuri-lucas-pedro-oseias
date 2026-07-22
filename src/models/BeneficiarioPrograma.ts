import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/sequelize.ts";

export interface BeneficiarioProgramaAttributes {
  beneficiarioId: number;
  programaId: number;
  dataInclusao?: Date;
}

export interface BeneficiarioProgramaCreationAttributes extends Optional<BeneficiarioProgramaAttributes, "dataInclusao"> {}

export class BeneficiarioPrograma extends Model<BeneficiarioProgramaAttributes, BeneficiarioProgramaCreationAttributes> implements BeneficiarioProgramaAttributes {
  public declare beneficiarioId: number;
  public declare programaId: number;
  public declare readonly dataInclusao: Date;
}

BeneficiarioPrograma.init(
  {
    beneficiarioId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "beneficiario_id",
      references: {
        model: "tb_beneficiario",
        key: "id",
      },
    },
    programaId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      field: "programa_id",
      references: {
        model: "tb_programa_social",
        key: "id",
      },
    },
    dataInclusao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "data_inclusao",
    },
  },
  {
    sequelize,
    tableName: "tb_beneficiario_programa",
    underscored: true,
    timestamps: false,
  }
);
