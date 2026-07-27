import { Router } from "express";
import { neo4jController } from "../controllers/Neo4jController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const neo4jRouter = Router();

// Endpoint para disparar sincronização de todos os nós (Beneficiario, Familia, ProgramaSocial, Usuario) no Neo4j
neo4jRouter.post("/sync", authMiddleware, (req, res) => neo4jController.syncAll(req, res));

// Endpoint para consultar contagens de nós e relacionamentos no Neo4j
neo4jRouter.get("/stats", authMiddleware, (req, res) => neo4jController.getStats(req, res));

export { neo4jRouter };
