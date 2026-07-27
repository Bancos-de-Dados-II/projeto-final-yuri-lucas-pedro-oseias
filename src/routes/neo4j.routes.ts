import { Router } from "express";
import { neo4jController } from "../controllers/Neo4jController.ts";
import { authMiddleware } from "../middlewares/authMiddleware.ts";

const neo4jRouter = Router();

// Endpoint para disparar sincronização de todos os nós (Beneficiario, Familia, ProgramaSocial, Usuario) no Neo4j
neo4jRouter.post("/sync", authMiddleware, (req, res) => neo4jController.syncAll(req, res));

// Endpoint para consultar contagens de nós e relacionamentos no Neo4j
neo4jRouter.get("/stats", authMiddleware, (req, res) => neo4jController.getStats(req, res));

// Rotas de consultas Cypher no grafo Neo4j:
// 1. Proximidade espacial entre famílias (PROXIMO_DE)
neo4jRouter.get("/consultas/proximidade", authMiddleware, (req, res) => neo4jController.getProximidade(req, res));

// 2. Sobreposição de atendimentos aos beneficiários por múltiplos usuários/assistentes (FOI_ATENDIDO_POR)
neo4jRouter.get("/consultas/sobreposicao-atendimentos", authMiddleware, (req, res) => neo4jController.getSobreposicaoAtendimentos(req, res));

// 3. Rede integrada de relacionamentos do grafo
neo4jRouter.get("/consultas/rede-relacionamentos", authMiddleware, (req, res) => neo4jController.getRedeRelacionamentos(req, res));

export { neo4jRouter };
