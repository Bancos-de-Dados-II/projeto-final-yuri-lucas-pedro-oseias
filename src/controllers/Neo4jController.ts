import { Request, Response } from "express";
import { neo4jSyncService } from "../services/neo4jSyncService.ts";
import { neo4jQueueService } from "../services/neo4jQueue.ts";

export class Neo4jController {
  // Executa sincronização completa dos nós e relacionamentos do SQL para o Neo4j
  async syncAll(req: Request, res: Response) {
    try {
      const stats = await neo4jSyncService.syncAllNodesFromDatabase();
      return res.json({
        message: "Sincronização completa dos nós (Usuario, Familia, Beneficiario, ProgramaSocial) realizada no Neo4j com sucesso!",
        stats,
        queue: neo4jQueueService.getQueueStats(),
      });
    } catch (error) {
      console.error("Erro ao sincronizar nós no Neo4j:", error);
      return res.status(500).json({ error: "Erro ao sincronizar com o Neo4j." });
    }
  }

  // Retorna métricas dos nós, relacionamentos e estado da fila assíncrona pós-escrita no Neo4j
  async getStats(req: Request, res: Response) {
    try {
      const stats = await neo4jSyncService.getGraphStats();
      const queue = neo4jQueueService.getQueueStats();
      return res.json({
        ...stats,
        queue,
      });
    } catch (error) {
      console.error("Erro ao obter estatísticas do Neo4j:", error);
      return res.status(500).json({ error: "Erro ao consultar o Neo4j." });
    }
  }

  // CONSULTA EM GRAFO 1: Proximidade espacial entre famílias (PROXIMO_DE)
  async getProximidade(req: Request, res: Response) {
    try {
      const raioKm = req.query.raio ? Number(req.query.raio) : 10.0;
      const result = await neo4jSyncService.getProximidadeFamilias(raioKm);
      return res.json(result);
    } catch (error) {
      console.error("Erro ao consultar proximidade de famílias no Neo4j:", error);
      return res.status(500).json({ error: "Erro interno ao executar consulta Cypher no Neo4j." });
    }
  }

  // CONSULTA EM GRAFO 2: Sobreposição de atendimentos (Beneficiários com mais de 1 assistente / usuário)
  async getSobreposicaoAtendimentos(req: Request, res: Response) {
    try {
      const result = await neo4jSyncService.getSobreposicaoAtendimentos();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao consultar sobreposição de atendimentos no Neo4j:", error);
      return res.status(500).json({ error: "Erro interno ao executar consulta Cypher no Neo4j." });
    }
  }

  // CONSULTA EM GRAFO 3: Rede integrada de relacionamentos do grafo
  async getRedeRelacionamentos(req: Request, res: Response) {
    try {
      const result = await neo4jSyncService.getRedeRelacionamentos();
      return res.json(result);
    } catch (error) {
      console.error("Erro ao consultar rede de relacionamentos no Neo4j:", error);
      return res.status(500).json({ error: "Erro interno ao executar consulta Cypher no Neo4j." });
    }
  }
}

export const neo4jController = new Neo4jController();
