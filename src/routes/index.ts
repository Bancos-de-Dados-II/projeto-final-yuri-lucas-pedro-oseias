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

export { routes };