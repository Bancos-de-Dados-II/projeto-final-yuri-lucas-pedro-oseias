import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: crypto.webcrypto,
  });
}
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
app.use(express.static(path.resolve("frontend")));

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

app.use(routes);

import { connectMongo } from "./database/mongodb.ts";

const PORT = process.env.PORT || 3333;

// Inicializa conexões com bancos secundários
connectMongo()
  .then(() => console.log("MongoDB inicializado no startup"))
  .catch((err) => console.error("Falha ao inicializar MongoDB no startup:", err));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
