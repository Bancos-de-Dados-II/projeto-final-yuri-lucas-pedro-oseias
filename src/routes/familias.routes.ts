import { Router } from "express";
import { familiaController } from "../controllers/FamiliaController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const familiasRouter = Router();

// Proteger rotas com authMiddleware
familiasRouter.use(authMiddleware);

familiasRouter.get("/", (req, res) => familiaController.index(req, res));
familiasRouter.get("/:id", (req, res) => familiaController.show(req, res));
familiasRouter.post("/", (req, res) => familiaController.create(req, res));
familiasRouter.put("/:id", (req, res) => familiaController.update(req, res));
familiasRouter.delete("/:id", (req, res) => familiaController.delete(req, res));

export { familiasRouter };
