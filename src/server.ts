import express from "express";
import cors from "cors";
import { routes } from "./routes/index.ts";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos do frontend
app.use(express.static("frontend"));

app.use(routes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
