import express from "express";
import { prismaService } from "./services/prisma.ts";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "API GeoPB Comunidades rodando com sucesso!" });
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

