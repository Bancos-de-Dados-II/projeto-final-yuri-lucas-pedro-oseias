import { Router } from "express";
import { userController } from "../controllers/UserController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";
import { adminMiddleware } from "../middlewares/adminMiddleware.ts";

const usersRouter = Router();

// Aplica autenticação JWT e autorização EXCLUSIVA de administrador para todas as rotas de usuários
usersRouter.use(authMiddleware, adminMiddleware);

// POST /users - Criar Usuário
usersRouter.post("/", (req, res) => userController.create(req, res));

// GET /users - Listar Todos os Usuários
usersRouter.get("/", (req, res) => userController.index(req, res));

// GET /users/:id - Detalhes do Usuário por ID
usersRouter.get("/:id", (req, res) => userController.show(req, res));

// PUT /users/:id - Atualizar Usuário por ID
usersRouter.put("/:id", (req, res) => userController.update(req, res));

// DELETE /users/:id - Excluir Usuário por ID
usersRouter.delete("/:id", (req, res) => userController.delete(req, res));

export { usersRouter };
