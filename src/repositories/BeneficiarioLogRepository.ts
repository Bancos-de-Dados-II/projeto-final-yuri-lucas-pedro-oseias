import { getMongoDb } from "../database/mongodb.ts";

export interface BeneficiarioLog {
  beneficiarioId: number;
  usuarioId: number;
  timestamp: Date;
  acao: "CREATE" | "UPDATE" | "DELETE";
  dadosAntes?: any;
  dadosDepois?: any;
}

export class BeneficiarioLogRepository {
  private getCollection() {
    return getMongoDb().collection<BeneficiarioLog>("beneficiarios_logs");
  }

  async saveLog(log: Omit<BeneficiarioLog, "timestamp">): Promise<void> {
    try {
      const logDoc: BeneficiarioLog = {
        ...log,
        timestamp: new Date(),
      };
      await this.getCollection().insertOne(logDoc);
      console.log(`Log de alteração do beneficiário #${log.beneficiarioId} (${log.acao}) salvo no MongoDB.`);
    } catch (error) {
      console.error(`Erro ao salvar log no MongoDB para beneficiário #${log.beneficiarioId}:`, error);
    }
  }

  async getLogsByBeneficiarioId(beneficiarioId: number): Promise<BeneficiarioLog[]> {
    try {
      return await this.getCollection().find({ beneficiarioId }).sort({ timestamp: -1 }).toArray();
    } catch (error) {
      console.error(`Erro ao buscar logs do beneficiário #${beneficiarioId}:`, error);
      return [];
    }
  }
}

export const beneficiarioLogRepository = new BeneficiarioLogRepository();
