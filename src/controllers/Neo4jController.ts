import { Request, Response } from "express";
import { neo4jSyncService } from "../services/neo4jSyncService.ts";

export class Neo4jController {
  // Executa sincronização completa dos nós e relacionamentos do SQL para o Neo4j
  async syncAll(req: Request, res: Response) {
    try {
      const stats = await neo4jSyncService.syncAllNodesFromDatabase();
      return res.json({
        message: "Sincronização completa dos nós (Usuario, Familia, Beneficiario, ProgramaSocial) realizada no Neo4j com sucesso!",
        stats,
      });
    } catch (error) {
      console.error("Erro ao sincronizar nós no Neo4j:", error);
      return res.status(500).json({ error: "Erro ao sincronizar com o Neo4j." });
    }
  }

  // Retorna métricas dos nós e relacionamentos no banco em grafo Neo4j
  async getStats(req: Request, res: Response) {
    try {
      const stats = await neo4jSyncService.getGraphStats();
      return res.json(stats);
    } catch (error) {
      console.error("Erro ao obter estatísticas do Neo4j:", error);
      return res.status(500).json({ error: "Erro ao consultar o Neo4j." });
    }
  }
}

export const neo4jController = new Neo4jController();
