import { Router } from "express";
import { programaSocialController } from "../controllers/ProgramaSocialController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const programasRouter = Router();

// Proteger rotas com authMiddleware
programasRouter.use(authMiddleware);

programasRouter.get("/", (req, res) => programaSocialController.index(req, res));
programasRouter.get("/:id", (req, res) => programaSocialController.show(req, res));
programasRouter.post("/", (req, res) => programaSocialController.create(req, res));
programasRouter.put("/:id", (req, res) => programaSocialController.update(req, res));
programasRouter.delete("/:id", (req, res) => programaSocialController.delete(req, res));
programasRouter.post("/associar", (req, res) => programaSocialController.associateBeneficiary(req, res));
programasRouter.post("/desassociar", (req, res) => programaSocialController.disassociateBeneficiary(req, res));

export { programasRouter };
