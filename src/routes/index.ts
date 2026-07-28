import { Router } from "express";
import { usersRouter } from "./users.routes.ts";
import { authRouter } from "./auth.routes.ts";
import { familiasRouter } from "./familias.routes.ts";
import { beneficiariosRouter } from "./beneficiarios.routes.ts";
import { uploadRouter } from "./upload.routes.ts";
import { visitasRouter } from "./visitas.routes.ts";
import { programasRouter } from "./programas.routes.ts";
import { agendamentosRouter } from "./agendamentos.routes.ts";
import { mapaRouter } from "./mapa.routes.ts";
import { neo4jRouter } from "./neo4j.routes.ts";
import { relatoriosRouter } from "./relatorios.routes.ts";

const routes = Router();

routes.use("/users", usersRouter);
routes.use("/auth", authRouter);
routes.use("/familias", familiasRouter);
routes.use("/beneficiarios", beneficiariosRouter);
routes.use("/upload", uploadRouter);
routes.use("/visitas", visitasRouter);
routes.use("/programas-sociais", programasRouter);
routes.use("/agendamentos", agendamentosRouter);
routes.use("/mapa", mapaRouter);
routes.use("/neo4j", neo4jRouter);
routes.use("/relatorios", relatoriosRouter);

// Endpoint de Health Check para os serviços de Cloud (Render / Railway / Docker)
routes.get("/health", (req, res) => {
  return res.json({
    status: "ok",
    service: "GeoPB Comunidades API",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "production",
  });
});

export { routes };