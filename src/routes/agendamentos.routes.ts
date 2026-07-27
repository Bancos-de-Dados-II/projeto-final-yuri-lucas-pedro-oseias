import { Router } from "express";
import { agendamentoController } from "../controllers/AgendamentoController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const agendamentosRouter = Router();

// Proteger rotas com authMiddleware
agendamentosRouter.use(authMiddleware);

agendamentosRouter.get("/", (req, res) => agendamentoController.index(req, res));
agendamentosRouter.get("/:id", (req, res) => agendamentoController.show(req, res));
agendamentosRouter.post("/", (req, res) => agendamentoController.create(req, res));
agendamentosRouter.put("/:id", (req, res) => agendamentoController.update(req, res));
agendamentosRouter.delete("/:id", (req, res) => agendamentoController.delete(req, res));

export { agendamentosRouter };
