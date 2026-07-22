import { Router } from "express";
import { userController } from "../controllers/UserController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const usersRouter = Router();

// POST /users - Cadastrar um novo usuário
usersRouter.post("/", (req, res) => userController.create(req, res));

// GET /users - Listar usuários (Rota Protegida por Token JWT)
usersRouter.get("/", authMiddleware, (req, res) => userController.index(req, res));

export { usersRouter };
