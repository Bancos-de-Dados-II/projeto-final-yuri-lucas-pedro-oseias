import { Router } from "express";
import { visitaController } from "../controllers/VisitaController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const visitasRouter = Router();

// Proteger rotas com authMiddleware
visitasRouter.use(authMiddleware);

visitasRouter.get("/", (req, res) => visitaController.index(req, res));
visitasRouter.get("/:id", (req, res) => visitaController.show(req, res));
visitasRouter.post("/", (req, res) => visitaController.create(req, res));
visitasRouter.put("/:id", (req, res) => visitaController.update(req, res));
visitasRouter.delete("/:id", (req, res) => visitaController.delete(req, res));

export { visitasRouter };
