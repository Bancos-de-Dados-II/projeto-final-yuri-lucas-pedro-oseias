import { Sequelize } from "sequelize";
import fs from "fs";
import path from "path";

const databaseUrl = process.env.DATABASE_URL;

export const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: "postgres",
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize({
      dialect: "sqlite",
      storage: path.resolve("database.sqlite"),
      logging: false,
    });


