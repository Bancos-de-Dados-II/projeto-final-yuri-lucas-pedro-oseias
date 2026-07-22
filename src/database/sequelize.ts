import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/app";

export const sequelize = new Sequelize(databaseUrl, {
  dialect: "postgres",
  logging: false,
});
