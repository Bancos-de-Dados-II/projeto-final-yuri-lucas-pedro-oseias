import { getMongoDb } from "../database/mongodb.ts";

export interface VisitaLog {
  visitaId: number;
  beneficiarioId: number;
  usuarioId: number;
  dataVisita: Date;
  acoesRealizadas?: string | null;
  observacoes?: string | null;
  latitude: number;
  longitude: number;
  dadosVariaveis?: any; // Dados variáveis dinâmicos
  anexos?: Array<{
    url: string;
    filename: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
  }>;
  timestamp: Date;
  acao: "CREATE" | "UPDATE" | "DELETE";
}

export class VisitaLogRepository {
  private getCollection() {
    return getMongoDb().collection<VisitaLog>("visitas_logs");
  }

  async saveLog(log: Omit<VisitaLog, "timestamp">): Promise<void> {
    try {
      const logDoc: VisitaLog = {
        ...log,
        timestamp: new Date(),
      };
      await this.getCollection().insertOne(logDoc);
      console.log(`Log de visita #${log.visitaId} (${log.acao}) salvo no MongoDB.`);
    } catch (error) {
      console.error(`Erro ao salvar log no MongoDB para visita #${log.visitaId}:`, error);
    }
  }

  async getLogsByVisitaId(visitaId: number): Promise<VisitaLog[]> {
    try {
      return await this.getCollection().find({ visitaId }).sort({ timestamp: -1 }).toArray();
    } catch (error) {
      console.error(`Erro ao buscar logs da visita #${visitaId}:`, error);
      return [];
    }
  }

  async getLatestLogByVisitaId(visitaId: number): Promise<VisitaLog | null> {
    try {
      const logs = await this.getCollection().find({ visitaId }).sort({ timestamp: -1 }).limit(1).toArray();
      return logs.length > 0 ? logs[0] : null;
    } catch (error) {
      console.error(`Erro ao buscar último log da visita #${visitaId}:`, error);
      return null;
    }
  }
}

export const visitaLogRepository = new VisitaLogRepository();
