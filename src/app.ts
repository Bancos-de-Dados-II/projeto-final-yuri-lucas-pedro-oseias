import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import crypto from "crypto";

if (typeof globalThis.crypto === "undefined") {
  Object.defineProperty(globalThis, "crypto", {
    value: crypto.webcrypto,
  });
}

import { routes } from "./routes/index.ts";
import { swaggerSetup } from "./config/swagger.ts";

const app = express();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const uploadsPath = path.resolve("uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

app.use(cors({
  credentials: true,
  origin: true // Permite a origem de onde vier, ou você pode fixar a url do frontend
}));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir uploads e arquivos estáticos do frontend
app.use("/uploads", express.static(uploadsPath));
app.use(express.static(path.resolve("frontend")));

app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Inicializa a rota de documentação do Swagger
swaggerSetup(app);

app.use(routes);

export { app };
