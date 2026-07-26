import { Router } from "express";
import { beneficiarioController } from "../controllers/BeneficiarioController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const beneficiariosRouter = Router();

// Proteger rotas com authMiddleware
beneficiariosRouter.use(authMiddleware);

beneficiariosRouter.get("/", (req, res) => beneficiarioController.index(req, res));
beneficiariosRouter.get("/:id", (req, res) => beneficiarioController.show(req, res));
beneficiariosRouter.post("/", (req, res) => beneficiarioController.create(req, res));
beneficiariosRouter.put("/:id", (req, res) => beneficiarioController.update(req, res));
beneficiariosRouter.delete("/:id", (req, res) => beneficiarioController.delete(req, res));

export { beneficiariosRouter };
