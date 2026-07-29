import "dotenv/config";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("A variável de ambiente DATABASE_URL é obrigatória para iniciar o Sequelize (PostgreSQL).");
}

const isProduction = process.env.NODE_ENV === "production";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
  ...(isProduction && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }),
});
