import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { routes } from "./routes/index.ts";

const app = express();

const uploadsPath = path.resolve("uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir uploads e arquivos estáticos do frontend
app.use("/uploads", express.static(uploadsPath));
app.use(express.static("frontend"));

app.use(routes);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
